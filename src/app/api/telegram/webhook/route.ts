import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isWebhookSecretValid,
  parseTelegramAmountCents,
} from "@/lib/telegram";

export const runtime = "nodejs";

const conversationLifetimeMs = 30 * 60 * 1000;

type TelegramMessage = {
  chatId: number;
  chatType: string;
  text: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getPrivateTextMessage(value: unknown): TelegramMessage | null {
  const update = record(value);
  const message = record(update?.message);
  const chat = record(message?.chat);

  if (
    typeof chat?.id !== "number"
    || !Number.isSafeInteger(chat.id)
    || typeof chat.type !== "string"
    || typeof message?.text !== "string"
  ) {
    return null;
  }

  return { chatId: chat.id, chatType: chat.type, text: message.text.trim() };
}

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  return token;
}

function getSiteUrl() {
  const value = process.env.FINLEAF_SITE_URL;
  if (!value) throw new Error("FINLEAF_SITE_URL is not configured.");

  const siteUrl = new URL(value);
  if (
    siteUrl.protocol !== "https:"
    && siteUrl.hostname !== "localhost"
    && siteUrl.hostname !== "127.0.0.1"
  ) {
    throw new Error("FINLEAF_SITE_URL must use HTTPS.");
  }

  return siteUrl;
}

async function sendMessage(chatId: number, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${getBotToken()}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram Bot API returned HTTP ${response.status}.`);
  }

  const result: unknown = await response.json();
  if (record(result)?.ok !== true) {
    throw new Error("Telegram Bot API rejected the message.");
  }
}

function commandName(text: string) {
  return text.split(/\s+/, 1)[0].toLowerCase().replace(/@\w+$/, "");
}

function nextConversationExpiry() {
  return new Date(Date.now() + conversationLifetimeMs).toISOString();
}

async function handleStart(
  admin: ReturnType<typeof createAdminClient>,
  chatId: number,
) {
  const { data: link, error: linkError } = await admin
    .from("telegram_links")
    .select("chat_id")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (linkError) throw new Error("Could not check the Telegram account link.");
  if (link) {
    await sendMessage(
      chatId,
      "A sua conta Finleaf já está associada. Envie /gasto para registar uma despesa ou /desassociar para desligar a conta.",
    );
    return;
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: expiredTokensError } = await admin
    .from("telegram_link_tokens")
    .delete()
    .lt("expires_at", new Date().toISOString());
  if (expiredTokensError) throw new Error("Could not clean up expired Telegram links.");

  const { error: cleanupError } = await admin
    .from("telegram_link_tokens")
    .delete()
    .eq("chat_id", chatId);
  if (cleanupError) throw new Error("Could not replace the pending Telegram link.");

  const { error: insertError } = await admin
    .from("telegram_link_tokens")
    .insert({
      token_hash: tokenHash,
      chat_id: chatId,
      expires_at: expiresAt,
    });
  if (insertError) throw new Error("Could not create a Telegram link.");

  const linkUrl = new URL("/telegram/connect", getSiteUrl());
  linkUrl.searchParams.set("token", token);
  await sendMessage(
    chatId,
    `Abra este link para iniciar sessão no Finleaf e associar a sua conta. Expira em 15 minutos:\n${linkUrl.toString()}`,
  );
}

async function handleExpenseFlow(
  admin: ReturnType<typeof createAdminClient>,
  chatId: number,
  text: string,
) {
  const command = commandName(text);

  if (command === "/start") {
    await handleStart(admin, chatId);
    return;
  }

  if (command === "/desassociar") {
    const { error: tokenError } = await admin
      .from("telegram_link_tokens")
      .delete()
      .eq("chat_id", chatId);
    if (tokenError) throw new Error("Could not revoke pending Telegram links.");

    const { error } = await admin
      .from("telegram_links")
      .delete()
      .eq("chat_id", chatId);
    if (error) throw new Error("Could not unlink the Telegram account.");
    await sendMessage(chatId, "A conta Telegram foi desligada do Finleaf.");
    return;
  }

  if (command === "/cancelar") {
    const { error } = await admin
      .from("telegram_conversations")
      .delete()
      .eq("chat_id", chatId);
    if (error) throw new Error("Could not cancel the Telegram conversation.");
    await sendMessage(chatId, "Registo cancelado.");
    return;
  }

  if (command === "/gasto") {
    const { data: link, error: linkError } = await admin
      .from("telegram_links")
      .select("chat_id")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (linkError) throw new Error("Could not check the Telegram account link.");
    if (!link) {
      await sendMessage(chatId, "Antes de registar despesas, envie /start e associe a sua conta Finleaf.");
      return;
    }

    const { error } = await admin.from("telegram_conversations").upsert({
      chat_id: chatId,
      step: "description",
      description: null,
      amount_cents: null,
      expires_at: nextConversationExpiry(),
    });
    if (error) throw new Error("Could not start the Telegram expense flow.");
    await sendMessage(chatId, "Qual é o nome ou descrição do gasto? Envie /cancelar para desistir.");
    return;
  }

  const { data: conversation, error: conversationError } = await admin
    .from("telegram_conversations")
    .select("step, description, amount_cents, expires_at")
    .eq("chat_id", chatId)
    .maybeSingle();

  if (conversationError) throw new Error("Could not load the Telegram conversation.");
  if (!conversation) {
    await sendMessage(chatId, "Para registar um gasto, envie /gasto.");
    return;
  }

  if (Date.parse(conversation.expires_at) <= Date.now()) {
    const { error } = await admin
      .from("telegram_conversations")
      .delete()
      .eq("chat_id", chatId);
    if (error) throw new Error("Could not expire the Telegram conversation.");
    await sendMessage(chatId, "Este registo expirou. Envie /gasto para começar novamente.");
    return;
  }

  if (conversation.step === "description") {
    if (!text || text.length > 160) {
      await sendMessage(chatId, "Indique uma descrição entre 1 e 160 caracteres.");
      return;
    }

    const { error } = await admin.from("telegram_conversations").upsert({
      chat_id: chatId,
      step: "amount",
      description: text,
      amount_cents: null,
      expires_at: nextConversationExpiry(),
    });
    if (error) throw new Error("Could not store the Telegram expense description.");
    await sendMessage(chatId, "Qual foi o valor em euros? Exemplo: 12,50.");
    return;
  }

  if (conversation.step === "amount") {
    const amountCents = parseTelegramAmountCents(text);
    if (amountCents === null) {
      await sendMessage(chatId, "Indique um valor válido, maior que zero. Exemplo: 12,50.");
      return;
    }

    const { error } = await admin.from("telegram_conversations").upsert({
      chat_id: chatId,
      step: "category",
      description: conversation.description,
      amount_cents: amountCents,
      expires_at: nextConversationExpiry(),
    });
    if (error) throw new Error("Could not store the Telegram expense amount.");
    await sendMessage(chatId, "Indique uma categoria ou escreva «saltar» para deixar sem categoria.");
    return;
  }

  const { data: link, error: linkError } = await admin
    .from("telegram_links")
    .select("user_id")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (linkError) throw new Error("Could not load the linked Finleaf account.");
  if (!link) {
    await sendMessage(chatId, "A sua conta já não está associada. Envie /start para ligar novamente.");
    return;
  }

  const { data: financeState, error: financeError } = await admin
    .from("user_finance_state")
    .select("data")
    .eq("user_id", link.user_id)
    .maybeSingle();
  if (financeError) throw new Error("Could not load the Finleaf categories.");

  const financeData = record(financeState?.data);
  const categories = Array.isArray(financeData?.categories)
    ? financeData.categories
      .map((category) => record(category)?.name)
      .filter((name): name is string => typeof name === "string")
    : [];
  const normalizedText = text.trim().toLocaleLowerCase("pt-PT");
  const skipCategory = ["", "-", "saltar", "nenhuma", "sem categoria"].includes(
    normalizedText,
  );
  const category = skipCategory
    ? null
    : categories.find(
      (name) => name.toLocaleLowerCase("pt-PT") === normalizedText,
    ) ?? null;

  if (!skipCategory && !category) {
    const choices = categories.length > 0
      ? ` Categorias: ${categories.slice(0, 20).join(", ")}${categories.length > 20 ? ", …" : ""}.`
      : "";
    await sendMessage(
      chatId,
      `Não encontrei essa categoria.${choices} Escreva o nome de uma categoria existente ou «saltar».`,
    );
    return;
  }

  const amountCents = Number(conversation.amount_cents);
  if (
    typeof conversation.description !== "string"
    || !Number.isSafeInteger(amountCents)
    || amountCents <= 0
  ) {
    throw new Error("The Telegram expense conversation contains invalid data.");
  }

  const { data: expenseDate, error: expenseError } = await admin.rpc(
    "add_telegram_expense",
    {
      p_chat_id: chatId,
      p_description: conversation.description,
      p_amount_cents: amountCents,
      p_category: category,
    },
  );
  if (expenseError) throw new Error("Could not save the Telegram expense.");

  const { error: deleteError } = await admin
    .from("telegram_conversations")
    .delete()
    .eq("chat_id", chatId);
  if (deleteError) throw new Error("Could not finish the Telegram expense flow.");

  const date = typeof expenseDate === "string" ? ` (${expenseDate})` : "";
  const amount = new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
  await sendMessage(
    chatId,
    `Gasto registado: ${conversation.description} — ${amount}${date}.`,
  );
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    return Response.json(
      { error: "Telegram webhook is not configured." },
      { status: 503 },
    );
  }

  if (!isWebhookSecretValid(
    request.headers.get("x-telegram-bot-api-secret-token"),
    expectedSecret,
  )) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64 * 1024) {
    return Response.json({ error: "Payload too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 64 * 1024) {
      return Response.json({ error: "Payload too large." }, { status: 413 });
    }
    payload = JSON.parse(body);
  } catch {
    return Response.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const message = getPrivateTextMessage(payload);
  if (!message || message.chatType !== "private") {
    return Response.json({ ok: true });
  }

  try {
    await handleExpenseFlow(createAdminClient(), message.chatId, message.text);
    return Response.json({ ok: true });
  } catch (error) {
    console.error(
      "Telegram webhook processing failed.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return Response.json({ error: "Unable to process Telegram update." }, { status: 500 });
  }
}

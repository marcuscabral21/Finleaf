"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidTimeZone } from "@/lib/telegram";

export type TelegramConnectState = {
  error?: string;
  message?: string;
};

export async function connectTelegramAccount(
  _previousState: TelegramConnectState,
  formData: FormData,
): Promise<TelegramConnectState> {
  const token = String(formData.get("token") ?? "");
  const timeZone = String(formData.get("timezone") ?? "");

  if (!/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    return { error: "Este link de associação é inválido ou já expirou." };
  }

  if (!isValidTimeZone(timeZone)) {
    return {
      error: "Não foi possível determinar o fuso horário deste dispositivo.",
    };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();

  if (authError && authError.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão.", {
      cause: authError,
    });
  }

  if (!data.user) {
    const next = new URLSearchParams({
      next: `/telegram/connect?token=${encodeURIComponent(token)}`,
    });
    redirect(`/login?${next.toString()}`);
  }

  const { error } = await supabase.rpc("claim_telegram_link", {
    p_token: token,
    p_timezone: timeZone,
  });

  if (error) {
    if (error.message.includes("TELEGRAM_LINK_EXPIRED")) {
      return { error: "Este link de associação expirou. Envie /start ao bot para receber outro." };
    }
    if (error.message.includes("TELEGRAM_CHAT_ALREADY_LINKED")) {
      return { error: "Esta conta Telegram já está associada a outra conta Finleaf." };
    }
    console.error("Não foi possível associar a conta Telegram.", error);
    return { error: "Não foi possível associar a conta Telegram. Tente novamente." };
  }

  return {
    message: "Conta associada. Volte ao Telegram e envie /gasto para começar.",
  };
}

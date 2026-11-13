import { redirect } from "next/navigation";
import { AuthCard } from "@/app/auth/auth-card";
import { createClient } from "@/lib/supabase/server";
import { isDeletedUserSessionError } from "@/lib/supabase/session";
import { TelegramConnectForm } from "./connect-form";

export default async function TelegramConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token || !/^[A-Za-z0-9_-]{32,128}$/.test(token)) {
    return (
      <AuthCard
        title="Link inválido"
        description="Este link de associação do Telegram é inválido ou expirou."
      >
        <p>Envie /start ao bot para receber um link novo.</p>
      </AuthCard>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (isDeletedUserSessionError(error)) redirect("/auth/clear-session");
  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }

  if (!data.user) {
    const next = new URLSearchParams({
      next: `/telegram/connect?token=${encodeURIComponent(token)}`,
    });
    redirect(`/login?${next.toString()}`);
  }

  return (
    <AuthCard
      title="Associar Telegram"
      description="Confirme a associação para registar despesas pelo bot."
    >
      <TelegramConnectForm token={token} />
    </AuthCard>
  );
}

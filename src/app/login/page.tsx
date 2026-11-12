import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "../auth/auth-card";
import { LoginForm } from "../auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }
  if (data.user) redirect("/");

  const { message } = await searchParams;

  return (
    <AuthCard
      title="Bem-vindo de volta"
      description="Entre na sua conta para acompanhar as suas finanças."
    >
      <LoginForm
        message={
          message === "confirm-email"
            ? "Conta criada. Confirme o email antes de iniciar sessão."
            : message === "auth-callback"
              ? "Não foi possível confirmar o email. Peça um novo link de confirmação."
              : undefined
        }
      />
    </AuthCard>
  );
}

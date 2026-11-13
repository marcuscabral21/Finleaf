import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "../auth/auth-card";
import { LoginForm } from "../auth/auth-form";
import { isDeletedUserSessionError } from "@/lib/supabase/session";
import { getSafeInternalPath } from "@/lib/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (isDeletedUserSessionError(error)) redirect("/auth/clear-session");

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }
  const { message, next } = await searchParams;
  const nextPath = getSafeInternalPath(next);
  if (data.user) redirect(nextPath);

  return (
    <AuthCard
      title="Bem-vindo de volta"
      description="Entre na sua conta para acompanhar as suas finanças."
    >
      <LoginForm
        nextPath={nextPath === "/" ? undefined : nextPath}
        message={
          message === "confirm-email"
            ? "Conta criada. Confirme o email antes de iniciar sessão."
            : message === "auth-callback"
              ? "Não foi possível confirmar o email. Peça um novo link de confirmação."
              : message === "session-expired"
                ? "A sessão guardada pertencia a uma conta que já não existe. Inicie sessão novamente."
              : undefined
        }
      />
    </AuthCard>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "../auth/auth-card";
import { RegisterForm } from "../auth/auth-form";

export default async function RegisterPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }
  if (data.user) redirect("/");

  return (
    <AuthCard
      title="Crie a sua conta"
      description="Comece a organizar os seus rendimentos, despesas e poupanças."
    >
      <RegisterForm />
    </AuthCard>
  );
}

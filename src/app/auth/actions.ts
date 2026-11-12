"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
};

export async function signIn(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Indique o email e a palavra-passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Não foi possível iniciar sessão. Verifique os seus dados." };
  }

  redirect("/");
}

export async function signUp(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const displayName = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!displayName || displayName.length > 80) {
    return { error: "Indique um nome com, no máximo, 80 caracteres." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Indique um endereço de email válido." };
  }

  if (password.length < 8) {
    return { error: "A palavra-passe deve ter pelo menos 8 caracteres." };
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    return { error: "Não foi possível determinar o endereço de confirmação da conta." };
  }

  let emailRedirectTo: string;
  try {
    const callbackUrl = new URL("/auth/callback", origin);
    if (
      callbackUrl.protocol !== "https:" &&
      callbackUrl.hostname !== "localhost" &&
      callbackUrl.hostname !== "127.0.0.1"
    ) {
      return { error: "O endereço de confirmação da conta não é seguro." };
    }
    emailRedirectTo = callbackUrl.toString();
  } catch {
    return { error: "O endereço de confirmação da conta é inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo,
    },
  });

  if (error) {
    return { error: "Não foi possível criar a conta. Verifique os dados e tente novamente." };
  }

  if (data.session) {
    redirect("/");
  }

  return {
    message: "Conta criada. Verifique o seu email para confirmar o registo.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error("Não foi possível terminar a sessão.", { cause: error });
  }

  redirect("/login");
}

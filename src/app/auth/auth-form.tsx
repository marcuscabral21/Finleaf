"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = {};

export function LoginForm({
  message,
  nextPath,
}: {
  message?: string;
  nextPath?: string;
}) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="auth-form">
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      {message && <p className="auth-message" role="status">{message}</p>}
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        Palavra-passe
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "A entrar..." : "Entrar"}
      </button>
      <p className="auth-switch">
        Ainda não tem conta? <Link href="/register">Criar conta</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="auth-form">
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.message && <p className="auth-message" role="status">{state.message}</p>}
      <label>
        Nome
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label>
        Palavra-passe
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="auth-hint">Pelo menos 8 caracteres.</span>
      </label>
      <button className="auth-submit" type="submit" disabled={pending}>
        {pending ? "A criar conta..." : "Criar conta"}
      </button>
      <p className="auth-switch">
        Já tem conta? <Link href="/login">Iniciar sessão</Link>
      </p>
    </form>
  );
}

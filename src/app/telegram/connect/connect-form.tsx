"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  connectTelegramAccount,
  type TelegramConnectState,
} from "./actions";

const initialState: TelegramConnectState = {};

export function TelegramConnectForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    connectTelegramAccount,
    initialState,
  );
  const timeZoneInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timeZoneInput.current) {
      timeZoneInput.current.value =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    }
  }, []);

  return (
    <form action={action} className="auth-form">
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      {state.message && <p className="auth-message" role="status">{state.message}</p>}
      {!state.message && (
        <>
          <p>
            Esta ação associa o Telegram à conta Finleaf onde iniciou sessão.
            A data dos próximos gastos usará o fuso horário deste navegador.
          </p>
          <input type="hidden" name="token" value={token} />
          <input ref={timeZoneInput} type="hidden" name="timezone" value="" />
          <button
            className="auth-submit"
            type="submit"
            disabled={pending}
          >
            {pending ? "A associar..." : "Associar Telegram"}
          </button>
        </>
      )}
    </form>
  );
}

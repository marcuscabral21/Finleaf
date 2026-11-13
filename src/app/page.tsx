import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { createClient } from "@/lib/supabase/server";
import { isDeletedUserSessionError } from "@/lib/supabase/session";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (isDeletedUserSessionError(error)) redirect("/auth/clear-session");

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }

  if (!data.user) redirect("/login");

  const { data: financeState, error: financeStateError } = await supabase
    .from("user_finance_state")
    .select("data, revision")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (financeStateError || !financeState) {
    if (financeStateError) {
      console.error("Não foi possível carregar os dados financeiros.", financeStateError);
    }
    return (
      <main className="app">
        <section className="panel database-error">
          <h1>Base de dados ainda não configurada</h1>
          <p>
            Não foi possível carregar os dados financeiros. Confirme se a
            migração
            {" "}supabase/migrations/20261113000000_add_user_finance_state.sql
            {" "}foi aplicada no Supabase e volte a carregar esta página.
          </p>
        </section>
      </main>
    );
  }

  const now = new Date();
  return (
    <DashboardClient
      userEmail={data.user.email ?? "Utilizador"}
      todayDate={now.toISOString().slice(0, 10)}
      initialFinanceData={financeState.data}
      initialRevision={Number(financeState.revision)}
    />
  );
}

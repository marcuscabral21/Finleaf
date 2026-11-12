import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Não foi possível verificar a sessão do Supabase.", {
      cause: error,
    });
  }

  if (!data.user) redirect("/login");

  const now = new Date();
  return (
    <DashboardClient
      userEmail={data.user.email ?? "Utilizador"}
      userId={data.user.id}
      todayDate={now.toISOString().slice(0, 10)}
      currentTimestamp={now.getTime()}
    />
  );
}

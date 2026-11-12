import Link from "next/link";
import { FinleafLogo } from "@/components/finleaf-logo";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          <FinleafLogo appearance="light" size="large" />
        </Link>
        <p className="auth-eyebrow">FINANÇAS PESSOAIS</p>
        <h1>{title}</h1>
        <p className="auth-description">{description}</p>
        {children}
      </section>
    </main>
  );
}

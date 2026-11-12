import type { Metadata } from "next";
import "./globals.css";
import "./auth.css";
import "./redesign.css";

export const metadata: Metadata = {
  title: "Finleaf | Controlo de gastos",
  description: "Finleaf - sua aplicação financeira",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}

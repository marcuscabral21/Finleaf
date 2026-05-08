import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from '@/components/FinanceProvider';
import { LanguageProvider } from '@/components/LanguageProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finleaf - Finanças pessoais",
  description: "Finleaf ajuda você a acompanhar gastos, metas e economia com um painel simples e moderno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <FinanceProvider>{children}</FinanceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

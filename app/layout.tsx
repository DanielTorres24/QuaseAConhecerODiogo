import type { Metadata } from "next";
import { Quicksand, Dancing_Script } from "next/font/google";
import "./globals.css";

// Quicksand: arredondada e suave, aproxima-se do lettering do convite.
const bodyFont = Quicksand({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Dancing Script: a manuscrita do "Diogo" / "Baby Shower" no convite.
const scriptFont = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Antes de Conhecermos o Diogo…",
  description: "Questionário de palpites de baby shower para o Diogo.",
};

export const viewport = {
  themeColor: "#f5fafe",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className={`${bodyFont.variable} ${scriptFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Outfit, Fraunces } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevisRapide IA — Devis artisans en 2 minutes",
  description:
    "SaaS français pour artisans : dictée, catalogue, IA, devis HT/TVA/TTC, PDF et envoi.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DevisRapide IA",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f5c5c" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1416" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <ThemeProvider>
          <PwaRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

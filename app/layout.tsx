import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevUp",
  description: "Diagnostico e plano de estudos para desenvolvedores em crescimento."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}

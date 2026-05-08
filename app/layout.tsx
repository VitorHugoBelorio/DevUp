import type { Metadata } from "next";
import { BinaryBackground } from "@/components/BinaryBackground";
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
        <BinaryBackground />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/providers/QueryProvider";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/utils/constants";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-[#F8F9FA] text-[#0A0A0A]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

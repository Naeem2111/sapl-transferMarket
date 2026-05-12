import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "SAPL has moved",
  description: "The SAPL transfer market has moved to the new SAPL platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

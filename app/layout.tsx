import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BindBench — AI binding-affinity screening",
  description:
    "Rank and prioritize small-molecule candidates by predicted binding affinity. Powered by Boltz-2 on Amazon Aurora PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}

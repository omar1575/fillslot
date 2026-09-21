import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Fillslot — leftover hours and tickets in Maastricht",
    template: "%s · Fillslot",
  },
  description:
    "Venues list leftover hours and tickets at a discount. You pay in the app. They keep empty slots from going stale.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${roboto.variable} h-full`}>
      <body className={`${roboto.className} flex min-h-full flex-col text-[var(--ink)]`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

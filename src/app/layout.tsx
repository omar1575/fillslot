import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Figtree, IBM_Plex_Mono, Syne } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const ibm = IBM_Plex_Mono({
  variable: "--font-ibm",
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <html
      lang="en"
      className={`${syne.variable} ${figtree.variable} ${ibm.variable} h-full`}
    >
      <body className="flex min-h-full flex-col text-[var(--ink)]">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

import fs from "node:fs/promises";
import path from "node:path";
import { Resend } from "resend";
import { isResendConfigured } from "@/lib/env";

export type DevMail = {
  to: string;
  url: string;
  sentAt: string;
};

function mailboxPath() {
  return path.join(process.cwd(), "data", "dev-mailbox.json");
}

export async function sendMagicLink(to: string, url: string) {
  if (isResendConfigured()) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Fillslot <noreply@fillslot.app>",
      to,
      subject: "Your Fillslot sign-in link",
      html: `<p>Book leftover court time with this link:</p><p><a href="${url}">${url}</a></p><p>This link expires soon.</p>`,
    });
    return;
  }

  const mail: DevMail = { to, url, sentAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(mailboxPath()), { recursive: true });
  let mailbox: DevMail[] = [];
  try {
    mailbox = JSON.parse(await fs.readFile(mailboxPath(), "utf8")) as DevMail[];
  } catch {
    mailbox = [];
  }
  mailbox.unshift(mail);
  await fs.writeFile(mailboxPath(), JSON.stringify(mailbox.slice(0, 20), null, 2));
  console.log(`Fillslot magic link for ${to}: ${url}`);
}

export async function readDevMailbox(): Promise<DevMail[]> {
  try {
    return JSON.parse(await fs.readFile(mailboxPath(), "utf8")) as DevMail[];
  } catch {
    return [];
  }
}

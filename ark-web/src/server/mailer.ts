import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export type MailAttachment = { filename: string; content: Buffer | string; contentType?: string; cid?: string };
export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: MailAttachment[] };

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const e = env();
  if (!e.SMTP_HOST) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transporter;
}

/**
 * Sends an email. Never throws: failures are logged so a mail outage can't break
 * a registration or form submission (the record is already saved in the DB).
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.info(`[mail:dev] To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return true;
  }
  try {
    await t.sendMail({ from: env().MAIL_FROM, ...mail });
    return true;
  } catch (e) {
    console.error(`[mail] failed to send "${mail.subject}" to ${mail.to}`, e);
    return false;
  }
}

export function officeEmail() {
  return env().OFFICE_NOTIFY_EMAIL || null;
}

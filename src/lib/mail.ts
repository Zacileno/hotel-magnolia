import { Resend } from "resend";

// The one place where the site sends e-mail (contact form + package order form).
// The sending service is not decided yet (hotel's own mailbox via SMTP vs. Resend) — when it is,
// only this file and the environment variables change.
//
// Environment variables (Vercel → Settings → Environment Variables, never in code):
//   RESEND_API_KEY  API key of the sending service
//   CONTACT_TO      recipient(s), comma separated
//   CONTACT_FROM    sender address, e.g. "Hotel Magnolia <web@hotelmagnolia.cz>"

export type MailResult = "sent" | "not-configured" | "failed";

export const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export async function sendMail(opts: { subject: string; html: string; replyTo?: string }): Promise<MailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!apiKey || !to || !from) {
    console.error("E-mail sending is not configured (RESEND_API_KEY / CONTACT_TO / CONTACT_FROM).");
    return "not-configured";
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("Mail error:", error);
      return "failed";
    }
    return "sent";
  } catch (e) {
    console.error("Mail exception:", e);
    return "failed";
  }
}

// simple per-instance rate limit: max 5 submissions per IP in 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const hits = new Map<string, number[]>();
export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimited } from "@/lib/mail";

// TEMPORARY delivery check (2026-11-18) — removed again right after use.
// Sends one message through exactly the same setup as the forms (RESEND_API_KEY, CONTACT_FROM, verified domain),
// but only to Resend's test inbox delivered@resend.dev, so nobody receives anything.

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const configured = { key: !!apiKey, from: !!from, to: !!process.env.CONTACT_TO };
  if (!apiKey || !from) return NextResponse.json({ configured, sent: false }, { status: 500 });
  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to: "delivered@resend.dev",
    subject: "Hotel Magnolia – kontrola odesílání formulářů",
    html: "<p>Kontrola nastavení odesílání z webu hotelmagnolia.cz (testovací adresa Resend).</p>",
  });
  return NextResponse.json({ configured, sent: !error, id: data?.id ?? null, error: error?.name ?? null });
}

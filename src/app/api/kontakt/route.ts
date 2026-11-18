import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

// "Vaše dotazy" form (the old Contact Form 7 form) → e-mail to the hotel reception.
// Configuration (Vercel → Settings → Environment Variables, never in code):
//   RESEND_API_KEY  Resend API key
//   CONTACT_TO      where enquiries go (e.g. the reception address)
//   CONTACT_FROM    verified sender in Resend, e.g. "Hotel Magnolia <web@domain>"

type Body = {
  name?: unknown;
  email?: unknown;
  tel?: unknown;
  message?: unknown;
  quizQuestion?: unknown;
  quizAnswer?: unknown;
  consents?: unknown;
  website?: unknown;
  page?: unknown;
  lang?: unknown;
};

// the quiz questions used by the old form and their accepted answers
const QUIZ: Record<string, string[]> = {
  "vypočtěte jedna+dva?": ["3", "tři", "tri"],
  "vypočtěte pět+pět?": ["10", "deset"],
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

// simple per-instance rate limit: max 5 messages per IP in 15 minutes
const WINDOW_MS = 15 * 60 * 1000;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}

const bad = (field: string, error: string) => NextResponse.json({ field, error }, { status: 400 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }

  // honeypot: bots fill the hidden field — pretend success
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const name = str(body.name, 200);
  const email = str(body.email, 200);
  const tel = str(body.tel, 40);
  const message = str(body.message, 5000);
  const quizQuestion = str(body.quizQuestion, 100).toLowerCase();
  const quizAnswer = str(body.quizAnswer, 20).toLowerCase();
  const page = str(body.page, 300);
  const consents = Array.isArray(body.consents) ? body.consents.map(Boolean) : [];

  if (!name) return bad("your-name", "required");
  if (!email) return bad("your-email", "required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("your-email", "email");
  if (!tel) return bad("tel", "required");
  if (!/^[+0-9 ()\-./]{6,25}$/.test(tel)) return bad("tel", "tel");
  const answers = QUIZ[quizQuestion];
  if (!answers || !answers.includes(quizAnswer)) return bad("quiz-424", "quiz");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM;
  if (!apiKey || !to || !from) {
    console.error("Contact form is not configured (RESEND_API_KEY / CONTACT_TO / CONTACT_FROM).");
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const yes = (i: number) => (consents[i] ? "ano" : "ne");
  const html = `
    <h2>Nový dotaz z webu hotelmagnolia.cz</h2>
    <p><strong>Jméno:</strong> ${escapeHtml(name)}<br>
    <strong>E-mail:</strong> ${escapeHtml(email)}<br>
    <strong>Telefon:</strong> ${escapeHtml(tel)}</p>
    <p><strong>Zpráva:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>") || "—"}</p>
    <p style="color:#666;font-size:12px">Souhlas se zpracováním osobních údajů: ${yes(0)} ·
    Souhlas s obchodními podmínkami: ${yes(1)}<br>Odesláno ze stránky: ${escapeHtml(page)}</p>`;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: to.split(",").map((s) => s.trim()),
      replyTo: email,
      subject: `Hotel Magnolia – dotaz z webu: ${name}`,
      html,
    });
    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "send" }, { status: 502 });
    }
  } catch (e) {
    console.error("Resend exception:", e);
    return NextResponse.json({ error: "send" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse, type NextRequest } from "next/server";
import { QUIZ_ANSWERS } from "@/lib/forms";
import { escapeHtml, rateLimited, sendMail } from "@/lib/mail";

// "Vaše dotazy" form (the old Contact Form 7 form) → e-mail to the hotel. Sending: src/lib/mail.ts

type Body = Record<string, unknown>;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bad = (field: string, error: string) => NextResponse.json({ field, error }, { status: 400 });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });

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
  const answers = QUIZ_ANSWERS[quizQuestion];
  if (!answers || !answers.includes(quizAnswer)) return bad("quiz-424", "quiz");

  const yes = (i: number) => (consents[i] ? "ano" : "ne");
  const html = `
    <h2>Nový dotaz z webu hotelmagnolia.cz</h2>
    <p><strong>Jméno:</strong> ${escapeHtml(name)}<br>
    <strong>E-mail:</strong> ${escapeHtml(email)}<br>
    <strong>Telefon:</strong> ${escapeHtml(tel)}</p>
    <p><strong>Zpráva:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>") || "—"}</p>
    <p style="color:#666;font-size:12px">Souhlas se zpracováním osobních údajů: ${yes(0)} ·
    Souhlas s obchodními podmínkami: ${yes(1)}<br>Odesláno ze stránky: ${escapeHtml(page)}</p>`;

  const result = await sendMail({ subject: `Hotel Magnolia – dotaz z webu: ${name}`, html, replyTo: email });
  if (result !== "sent") return NextResponse.json({ error: result }, { status: result === "not-configured" ? 500 : 502 });
  return NextResponse.json({ ok: true });
}

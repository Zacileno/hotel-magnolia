import { NextResponse, type NextRequest } from "next/server";
import { escapeHtml, rateLimited, sendMail } from "@/lib/mail";

// Package order form ("CHCI REZERVOVAT" on the wellness-package pages) → e-mail to the hotel.
// The old site posted the form to the page itself (WordPress plugin); here it goes to this API.

type Body = Record<string, unknown>;

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bad = (field: string, error: string) => NextResponse.json({ field, error }, { status: 400 });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+0-9 ()\-./]{6,25}$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate" }, { status: 429 });

  let b: Body;
  try {
    b = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  if (str(b.website)) return NextResponse.json({ ok: true }); // honeypot

  const company = str(b.vybervolbu) === "2";
  const v = (k: string, max?: number) => str(b[k], max);

  // required fields — the ones marked with * on the form
  const required = company
    ? ["firma", "ic", "email2", "jmeno2", "adresa2", "mobil2"]
    : ["jmeno", "email", "mobil", "adresa"];
  for (const f of required) if (!v(f)) return bad(f, "required");
  const email = company ? v("email2") : v("email");
  const phone = company ? v("mobil2") : v("mobil");
  if (!EMAIL.test(email)) return bad(company ? "email2" : "email", "email");
  if (!PHONE.test(phone)) return bad(company ? "mobil2" : "mobil", "tel");
  if (company && !/^\d{6,10}$/.test(v("ic").replace(/\s/g, ""))) return bad("ic", "ic");
  if (!["10", "deset"].includes(v("ochrana", 20).toLowerCase())) return bad("ochrana", "quiz");
  if (!b.souhlas || !b.souhlas2) return bad(!b.souhlas ? "souhlas" : "souhlas2", "consent");

  const row = (label: string, value: string) =>
    `<tr><td style="padding:2px 12px 2px 0;color:#666">${label}</td><td>${escapeHtml(value) || "—"}</td></tr>`;
  const html = `
    <h2>Objednávka pobytu z webu hotelmagnolia.cz</h2>
    <table>
      ${row("Pobyt", v("balicek"))}
      ${row("Cena na webu", v("cena"))}
      ${row("Stránka", v("page"))}
      ${row("Datum příjezdu", v("prijezd"))}
      ${row("Datum odjezdu", v("odjezd"))}
      ${row("Počet osob", v("osob", 5))}
      ${row("Platební metoda", v("metoda"))}
      ${row("Dodání poukazu", v("dodani_voucheru"))}
      ${row("Objednává", company ? "Firma" : "Soukromá osoba")}
      ${
        company
          ? row("Firma", v("firma")) + row("IČ", v("ic")) + row("DIČ", v("dic")) + row("Kontaktní osoba", v("jmeno2")) +
            row("E-mail", v("email2")) + row("Telefon", v("mobil2")) + row("Adresa", v("adresa2", 1000)) +
            row("Poznámka", v("poznamka2", 3000))
          : row("Jméno", v("jmeno")) + row("E-mail", v("email")) + row("Telefon", v("mobil")) +
            row("Adresa", v("adresa", 1000)) + row("Poznámka", v("poznamka", 3000))
      }
    </table>
    <p style="color:#666;font-size:12px">Souhlas s obchodními podmínkami: ano · Souhlas se zpracováním osobních údajů: ano</p>`;

  const name = company ? v("firma") : v("jmeno");
  const result = await sendMail({ subject: `Hotel Magnolia – objednávka pobytu: ${v("balicek")} (${name})`, html, replyTo: email });
  if (result !== "sent") return NextResponse.json({ error: result }, { status: result === "not-configured" ? 500 : 502 });
  return NextResponse.json({ ok: true });
}

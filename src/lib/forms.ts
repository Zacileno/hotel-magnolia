// The question form on the English and German pages was in Czech on the original site too.
// Lenka 2026-11-24: translate it. Done while rendering, the stored page content stays as it is.
// The quiz is checked on the server (src/app/api/kontakt/route.ts) by the question the visitor saw,
// so every translated question must be listed in QUIZ_ANSWERS.
import type { Lang } from "@/lib/content";

/** quiz question (lower case) → accepted answers */
export const QUIZ_ANSWERS: Record<string, string[]> = {
  "vypočtěte jedna+dva?": ["3", "tři", "tri"],
  "vypočtěte pět+pět?": ["10", "deset"],
  "what is one + two?": ["3", "three"],
  "what is five + five?": ["10", "ten"],
  "wie viel ist eins + zwei?": ["3", "drei"],
  "wie viel ist fünf + fünf?": ["10", "zehn"],
};

type FormTexts = {
  htmlLang: string;
  title: string;
  name: string;
  email: string;
  phone: string;
  quiz12: string;
  quiz55: string;
  message: string;
  privacy: string;
  terms: string;
  here: string;
  send: string;
  privacyHref: string;
  termsHref: string;
};

const TEXTS: Record<Exclude<Lang, "cs">, FormTexts> = {
  en: {
    htmlLang: "en",
    title: "Your questions",
    name: "Your name",
    email: "Your e-mail",
    phone: "Your phone number",
    quiz12: "What is one + two?",
    quiz55: "What is five + five?",
    message: "Your message",
    privacy: "I agree to the processing of personal data, more information",
    terms: "I agree to the terms and conditions, more information",
    here: "here",
    send: "Send",
    privacyHref: "/en/information-on-data-protection/",
    termsHref: "/en/general-terms/",
  },
  de: {
    htmlLang: "de",
    title: "Ihre Fragen",
    name: "Ihr Name",
    email: "Ihre E-Mail-Adresse",
    phone: "Ihre Telefonnummer",
    quiz12: "Wie viel ist eins + zwei?",
    quiz55: "Wie viel ist fünf + fünf?",
    message: "Ihre Nachricht",
    privacy: "Ich stimme der Verarbeitung personenbezogener Daten zu, weitere Informationen",
    terms: "Ich stimme den Allgemeinen Geschäftsbedingungen zu, weitere Informationen",
    here: "hier",
    send: "Senden",
    privacyHref: "/de/informationen-zum-datenschutz/",
    termsHref: "/vop/", // there is no German version of the terms
  },
};

export function translateForms(html: string, lang: Lang): string {
  if (lang === "cs") return html;
  const t = TEXTS[lang];
  return html
    .replace(/(<h2[^>]*>)\s*Vaše(?:\s|&nbsp;)dotazy/g, `$1${t.title}`)
    .replace(/<div role="form" class="wpcf7"[\s\S]*?<\/form>/g, (form) =>
      form
        .replace('lang="cs-CZ"', `lang="${t.htmlLang}"`)
        .replace("Vaše jméno", t.name)
        .replace("Váš e-mail", t.email)
        .replace("Váš telefon", t.phone)
        .replace("Vypočtěte jedna+dva?", t.quiz12)
        .replace("Vypočtěte pět+pět?", t.quiz55)
        .replace("Vaše zpráva", t.message)
        .replace(
          /Souhlasím se(?:\s|&nbsp;)zpracováním osobních údajů, více informací\s*<a href="[^"]*"([^>]*)>zde<\/a>/,
          `${t.privacy} <a href="${t.privacyHref}"$1>${t.here}</a>`
        )
        .replace(
          /Souhlasím s(?:\s|&nbsp;)obchodními podmínkami, více informací\s*<a href="[^"]*"([^>]*)>zde<\/a>/,
          `${t.terms} <a href="${t.termsHref}"$1>${t.here}</a>`
        )
        .replace('value="Odeslat"', `value="${t.send}"`)
    );
}

// References page (Lenka 2026-11-24): the review slider keeps its look, but every review is there only once.
// The original Booking slider (Trustindex) had 10 reviews from 2021, most of them the same two words, and its script
// cloned the cards. It is replaced while rendering by our own slider (arrows: reviewSlider in SiteScripts.tsx):
// Booking reviews supplied by Lenka, the two guest quotes from the homepage and one original review of each score 8+.
// The stored page content stays as it is. To add a review, add it to REVIEWS.
import type { Lang } from "@/lib/content";

type Review = {
  name: string;
  color: string; // avatar circle
  title?: string;
  text?: string;
  level?: 0 | 1 | 2; // Booking word rating of reviews without text (LEVELS)
  score?: number;
  date?: string;
  booking: boolean;
};

// Booking reviews of 2026: the part "what the guest liked", copied from the screenshots; Renata's is shortened (…)
const REVIEWS: Review[] = [
  {
    name: "Simona",
    color: "#2f6b1f",
    booking: true,
    score: 9,
    title: "Fantastické",
    date: "2026-09-29",
    text: "Hotel je v&nbsp;samém centru města. Dostupnost výborná. Pokoj čistý, voňavý. Kvituji také tmavé závěsy na zatažení. Nic nás nerušilo. Pohodlné postele.",
  },
  {
    name: "Renata",
    color: "#2f5f9e",
    booking: true,
    score: 9,
    title: "Fantastické",
    date: "2026-09-14",
    text: "…Lokalita hotelu je parádní, přímo na náměstí, takže kousek od zámku či zastávky na autobus, taktéž na vlak je to kousek. Za mě úplně nejvíc skvělé matrace - spala jsem jak miminko…",
  },
  { name: "Jana K.", color: "#b04f8f", booking: false, text: "Úžasný a&nbsp;milý personál, krásné prostředí, byly jsme moc spokojeni." },
  {
    name: "Monika",
    color: "#3bb2e6",
    booking: true,
    score: 9,
    title: "Fantastické",
    date: "2026-10-20",
    text: "Hotel v&nbsp;centru města, velký pokoj, čistota, k&nbsp;dispozici káva, čaj, voda.",
  },
  {
    name: "Lenka",
    color: "#2f5f9e",
    booking: true,
    score: 9,
    title: "Doporučuji",
    date: "2026-10-27",
    text: "Vyhovující, splněny všechny požadavky které jsme v&nbsp;naši skupině chtěli",
  },
  {
    name: "Zuzana",
    color: "#f0965a",
    booking: false,
    text: "Krasný hotel přívětivý personál, vyšlo i&nbsp;počasí a&nbsp;pobyt jsme si užili, když bude možnost rádi se vrátíme.",
  },
  { name: "Paul", color: "#b04f8f", booking: true, level: 2, score: 10, date: "2021-08-15" },
  { name: "Zeman", color: "#f0965a", booking: true, level: 1, score: 9, date: "2021-08-21" },
  { name: "Mirko", color: "#3bb2e6", booking: true, level: 0, score: 8, date: "2021-08-23" },
];

const LEVELS: Record<Lang, [string, string, string]> = {
  cs: ["Velmi dobré", "Fantastické", "Výjimečné"],
  en: ["Very good", "Superb", "Exceptional"],
  de: ["Sehr gut", "Hervorragend", "Außergewöhnlich"],
};
const LOCALES: Record<Lang, string> = { cs: "cs-CZ", en: "en-GB", de: "de-DE" };
const ARROWS: Record<Lang, [string, string]> = {
  cs: ["Předchozí recenze", "Další recenze"],
  en: ["Previous reviews", "Next reviews"],
  de: ["Vorherige Bewertungen", "Nächste Bewertungen"],
};

function card(r: Review, lang: Lang): string {
  const score = r.score ? `<span class="hm-rev-score">${r.score.toLocaleString(LOCALES[lang], { minimumFractionDigits: r.score < 10 ? 1 : 0 })}</span>` : '<span class="hm-rev-mark" aria-hidden="true">“</span>';
  const logo = r.booking ? '<span class="hm-rev-logo" title="Booking.com">B<i>.</i></span>' : "";
  const text = r.text ?? (r.level === undefined ? "" : LEVELS[lang][r.level]);
  const title = r.title ? `<strong class="hm-rev-title">${r.title}</strong>` : "";
  const date = r.date ? new Date(r.date + "T12:00:00Z").toLocaleDateString(LOCALES[lang]) : r.booking ? "Booking.com" : "";
  return (
    `<div class="hm-rev-item"><div class="hm-rev-card"><div class="hm-rev-top">${score}${logo}</div>${title}<p>${text}</p></div>` +
    `<div class="hm-rev-who"><span class="hm-rev-avatar" style="background:${r.color}">${r.name[0]}</span>` +
    `<span><strong>${r.name}</strong>${date ? `<small>${date}</small>` : ""}</span></div></div>`
  );
}

const CHEVRON = (path: string) =>
  `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;

export function guestReviews(html: string, lang: Lang): string {
  const [prev, next] = ARROWS[lang];
  const slider =
    `<div class="hm-reviews"><button type="button" class="hm-rev-arrow hm-rev-prev" aria-label="${prev}">${CHEVRON("M15 5l-7 7 7 7")}</button>` +
    `<div class="hm-rev-track" tabindex="0">${REVIEWS.map((r) => card(r, lang)).join("")}</div>` +
    `<button type="button" class="hm-rev-arrow hm-rev-next" aria-label="${next}">${CHEVRON("M9 5l7 7-7 7")}</button></div>`;
  return html.replace(/<div class="ti-widget [\s\S]*?(?=<\/div>\s*<\/main>)/, () => slider);
}

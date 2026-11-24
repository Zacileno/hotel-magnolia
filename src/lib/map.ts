// Contact pages: the original Google map was tied to the hotel's Google business profile, so Google
// showed a card with the star rating in its corner. On Lenka's request (2026-11-23) the map now points
// to the hotel's ADDRESS instead: same map, same place and size, the corner card shows only the address
// (no rating). Map labels in the page language (the original was English everywhere).
import type { Lang } from "@/lib/content";

const ADDRESS = "Karlovo náměstí 20, 41301 Roudnice nad Labem";
const ORIGINAL_EMBED = /https:\/\/www\.google\.com\/maps\/embed\?pb=[^"]*0x114b4fcc699e50df[^"]*/g;

export function addressMap(html: string, lang: Lang): string {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS)}&amp;z=16&amp;hl=${lang}&amp;output=embed`;
  // contact card: street on the first line, postcode + town on the second (as in the footer)
  return html.replace(ORIGINAL_EMBED, src).replaceAll(`class="adresa">${ADDRESS}`, `class="adresa">${ADDRESS.replace(", ", ",<br>")}`);
}

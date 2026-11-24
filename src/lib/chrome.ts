// Header and footer shared by all pages (Lenka 2026-11-24):
// - the e-mail link in the header carried leftover HTML in its address → plain e-mail address
// - the footer and the reservation button were in Czech (with links to Czech pages) on the English and German pages
// Done while rendering, the stored page content stays as it is.
import type { Lang } from "@/lib/content";

const EMAIL = "recepce@hotelmagnolia.cz";

type Texts = { about: string; links: Record<string, [href: string, label: string]>; payments: string; linksTitle: string; reservation: [href: string, label: string] };

const TEXTS: Record<Exclude<Lang, "cs">, Texts> = {
  en: {
    about:
      "is located in the picturesque town of Roudnice nad Labem with an 800-year tradition. The hotel itself was built around the 14th century.",
    links: {
      "/restaurace/": ["/en/restaurant/", "Restaurant"],
      "/svatby/": ["/en/weddings/", "Weddings"],
      "/konference/": ["/en/conference/", "Conference"],
      "/fotogalerie/": ["/en/photogallery/", "Photogallery"],
      "/informace-o-ochrane-osobnich-udaju/": ["/en/information-on-data-protection/", "information on data protection"],
      "/vop/": ["/en/general-terms/", "general terms and conditions"],
      "/cookies/": ["/en/cookies-2/", "cookies"],
    },
    payments: "Payments and awards",
    linksTitle: "Links",
    reservation: ["/en/accommodation-reservation/", "RESERVATION"],
  },
  de: {
    about:
      "befindet sich in der malerischen Stadt Roudnice nad Labem mit einer 800-jährigen Tradition. Das Hotel selbst wurde etwa im 14. Jahrhundert erbaut.",
    links: {
      "/restaurace/": ["/de/restaurant-2/", "Restaurant"],
      "/svatby/": ["/de/hochzeiten/", "Hochzeiten"],
      "/konference/": ["/de/konferenz/", "Konferenz"],
      "/fotogalerie/": ["/de/fotogalerie-2/", "Fotogalerie"],
      "/informace-o-ochrane-osobnich-udaju/": ["/de/informationen-zum-datenschutz/", "Informationen zum Datenschutz"],
      "/vop/": ["/vop/", "Allgemeine Geschäftsbedingungen"], // there is no German version of the terms
      "/cookies/": ["/de/cookies-3/", "Cookies"],
    },
    payments: "Zahlungen und Auszeichnungen",
    linksTitle: "Links",
    reservation: ["/de/reservierung-einer-unterkunft/", "RESERVIERUNG"],
  },
};

export function headerFooter(html: string, lang: Lang): string {
  // only the header link has this class on an <a>; its href runs over several lines up to the closing quote
  const fixed = html.replace(/<a class="email" href="mailto:[^"]*">/g, `<a class="email" href="mailto:${EMAIL}">`);
  if (lang === "cs") return fixed;

  const t = TEXTS[lang];
  const withButton = fixed.replace(/(<a style="color: #ffffff;" href=")\/rezervace\/(">)REZERVACE(<\/a>)/g, (_m, a: string, b: string, c: string) => a + t.reservation[0] + b + t.reservation[1] + c);
  const start = withButton.indexOf('id="widget-area"');
  if (start < 0) return withButton;
  const footer = withButton
    .slice(start)
    .replace(/(<strong>Hotel Magnolia<\/strong>(?:&nbsp;|\s))se(?:&nbsp;|\s)nachází[\s\S]*?(?=<\/p>)/, (_m, name: string) => name + t.about)
    .replace(/<h3 class="widget-title">Platby(?:&nbsp;|\s)a(?:&nbsp;|\s)ocenění<\/h3>/, `<h3 class="widget-title">${t.payments}</h3>`)
    .replace(/<h3 class="widget-title">Odkazy<\/h3>/, `<h3 class="widget-title">${t.linksTitle}</h3>`)
    .replace(/<li><a href="([^"]+)">[^<]*<\/a><\/li>/g, (item, href: string) => {
      const link = t.links[href];
      return link ? `<li><a href="${link[0]}">${link[1]}</a></li>` : item;
    });
  return withButton.slice(0, start) + footer;
}

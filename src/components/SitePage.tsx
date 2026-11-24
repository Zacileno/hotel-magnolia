import { preload } from "react-dom";
import { HERO_SIZES, heroSrcSet, optimizeHero } from "@/lib/hero";
import { addressMap } from "@/lib/map";
import { translateForms, unifyFormTitles } from "@/lib/forms";
import { cardLists, galleryLayout } from "@/lib/gallery";
import { articleLayout } from "@/lib/articles";
import { guestReviews } from "@/lib/reviews";
import type { PageData } from "@/lib/content";
import SiteScripts from "@/components/SiteScripts";

/** One page of the site: the original page markup (cleaned) + the behaviour of the old theme */
export default function SitePage({ page }: { page: PageData }) {
  // smaller photo versions for phones + early download of the top slider photo (PageSpeed / LCP)
  const { html, hero } = optimizeHero(cardLists(galleryLayout(translateForms(unifyFormTitles(addressMap(articleLayout(guestReviews(page.html, page.lang), page.bodyClass), page.lang), page.lang), page.lang))));
  if (hero) preload(hero, { as: "image", imageSrcSet: heroSrcSet(hero), imageSizes: HERO_SIZES, fetchPriority: "high" });
  return (
    <>
      {page.jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.jsonLd }} />
      )}
      {/* the original <body> classes drive parts of the theme CSS (e.g. ".home .content-area") */}
      <div className={page.bodyClass} dangerouslySetInnerHTML={{ __html: html }} />
      {page.plazaro && (
        // Plazaro reservation embed: like on the original page, a plain script right after the iframe.
        // It must run before DOMContentLoaded (it hooks that event to resize the iframe), so no next/script.
        // eslint-disable-next-line @next/next/no-sync-scripts
        <script src={`https://res.plazaro.com/online-reservation.js?lang=${page.plazaro}`} />
      )}
      <SiteScripts lang={page.lang} />
    </>
  );
}

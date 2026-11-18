import Script from "next/script";
import type { PageData } from "@/lib/content";
import SiteScripts from "@/components/SiteScripts";

/** One page of the site: the original page markup (cleaned) + the behaviour of the old theme */
export default function SitePage({ page }: { page: PageData }) {
  return (
    <>
      {page.jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: page.jsonLd }} />
      )}
      {page.trustindex && (
        // review widget styles, only on the References pages (as on the original site)
        // eslint-disable-next-line @next/next/no-css-tags
        <link rel="stylesheet" href="/wp-content/uploads/trustindex-booking-widget.css" precedence="default" />
      )}
      {/* the original <body> classes drive parts of the theme CSS (e.g. ".home .content-area") */}
      <div className={page.bodyClass} dangerouslySetInnerHTML={{ __html: page.html }} />
      <SiteScripts lang={page.lang} />
      {page.plazaro && (
        <Script src={`https://res.plazaro.com/online-reservation.js?lang=${page.plazaro}`} strategy="afterInteractive" />
      )}
      {page.trustindex && <Script src="https://cdn.trustindex.io/loader.js" strategy="afterInteractive" />}
    </>
  );
}

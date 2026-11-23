import Script from "next/script";
import type { ReactNode } from "react";
import "@/app/globals.css";
import siteCss from "@/generated/site-css.json";

const GTM_ID = "GTM-WLVZG7V";

// The 13 original WordPress stylesheets (same files, same order) joined into one cacheable file by
// scripts/bundle-css.mjs, which runs before every dev/build — one request instead of 13 (PageSpeed).
const SITE_CSS = siteCss.href;

// small inline styles the original pages carried in <head>
const INLINE_CSS = `
.top_top {height:0px; width:0px; position:absolute; top:-11111px;}
.metaslider .caption-wrap {display:none!important;}
@media only screen and (max-width: 767px) { .hide-arrows-smartphone .flex-direction-nav, .hide-navigation-smartphone .flex-control-paging, .hide-navigation-smartphone .flex-control-nav, .hide-navigation-smartphone .filmstrip, .hide-caption-smartphone .caption-wrap, .hide-slideshow-smartphone, .metaslider-hidden-content.hide-smartphone{ display: none!important; }}@media only screen and (min-width : 768px) and (max-width: 1023px) { .hide-arrows-tablet .flex-direction-nav, .hide-navigation-tablet .flex-control-paging, .hide-navigation-tablet .flex-control-nav, .hide-navigation-tablet .filmstrip, .hide-caption-tablet .caption-wrap, .hide-slideshow-tablet, .metaslider-hidden-content.hide-tablet{ display: none!important; }}@media only screen and (min-width : 1024px) and (max-width: 1439px) { .hide-arrows-laptop .flex-direction-nav, .hide-navigation-laptop .flex-control-paging, .hide-navigation-laptop .flex-control-nav, .hide-navigation-laptop .filmstrip, .hide-caption-laptop .caption-wrap, .hide-slideshow-laptop, .metaslider-hidden-content.hide-laptop{ display: none!important; }}@media only screen and (min-width : 1440px) { .hide-arrows-desktop .flex-direction-nav, .hide-navigation-desktop .flex-control-paging, .hide-navigation-desktop .flex-control-nav, .hide-navigation-desktop .filmstrip, .hide-caption-desktop .caption-wrap, .hide-slideshow-desktop, .metaslider-hidden-content.hide-desktop{ display: none!important; }}
`;

/** <html> + <head> shared by all three languages (each language has its own root layout) */
export default function SiteDocument({ lang, children }: { lang: string; children: ReactNode }) {
  return (
    <html lang={lang} className="no-js">
      {/* eslint-disable-next-line @next/next/no-head-element -- App Router root layout */}
      <head>
        <link rel="stylesheet" href={SITE_CSS} />
        <style dangerouslySetInnerHTML={{ __html: INLINE_CSS }} />
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
        </Script>
      </head>
      <body>
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}

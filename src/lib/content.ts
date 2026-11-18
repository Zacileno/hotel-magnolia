import type { Metadata } from "next";
import index from "@/content/index.json";

export type Lang = "cs" | "en" | "de";

export type PageEntry = { path: string; name: string; lang: string };

export type PageData = {
  path: string;
  lang: Lang;
  bodyClass: string;
  title: string;
  description?: string;
  robots?: string;
  canonical?: string;
  alternates: Record<string, string>;
  og: Record<string, string>;
  twitter: Record<string, string>;
  jsonLd?: string;
  plazaro: string | null;
  trustindex: boolean;
  html: string;
};

export const SITE_URL = "https://hotelmagnolia.cz";

const pages = index as PageEntry[];

/** "/en/home/" → ["en", "home"]; "/" → [] */
function segments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

/** static params for the catch-all route of one language */
export function staticParams(lang: Lang): { slug: string[] }[] {
  return pages
    .filter((p) => p.lang === lang)
    .map((p) => ({ slug: lang === "cs" ? segments(p.path) : segments(p.path).slice(1) }));
}

export async function getPage(lang: Lang, slug: string[] = []): Promise<PageData | null> {
  const path = "/" + [...(lang === "cs" ? [] : [lang]), ...slug.map(decodeURIComponent)].map((s) => s + "/").join("");
  const entry = pages.find((p) => p.path === path && p.lang === lang);
  if (!entry) return null;
  const mod = (await import(`@/content/pages/${entry.name}.json`)) as { default: PageData };
  return mod.default;
}

function robots(value?: string): Metadata["robots"] {
  if (!value) return undefined;
  const v = value.toLowerCase();
  return {
    index: !v.includes("noindex"),
    follow: !v.includes("nofollow"),
    "max-image-preview": v.includes("max-image-preview:large") ? "large" : undefined,
    "max-snippet": v.includes("max-snippet:-1") ? -1 : undefined,
    "max-video-preview": v.includes("max-video-preview:-1") ? -1 : undefined,
  };
}

/** the same head tags as the original page (title, description, canonical, hreflang, OG, Twitter) */
export function pageMetadata(page: PageData): Metadata {
  const og = page.og;
  const ogType = og["og:type"] === "article" ? "article" : "website";
  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: page.title },
    description: page.description,
    robots: robots(page.robots),
    alternates: {
      canonical: page.canonical,
      languages: Object.keys(page.alternates).length ? page.alternates : undefined,
    },
    openGraph: {
      type: ogType,
      locale: og["og:locale"],
      alternateLocale: og["og:locale:alternate"]?.split(",").filter(Boolean),
      title: og["og:title"],
      description: og["og:description"],
      url: og["og:url"],
      siteName: og["og:site_name"],
      images: og["og:image"] ? [{ url: og["og:image"].replace(/^https?:\/\/hotelmagnolia\.cz/, "") }] : undefined,
      ...(ogType === "article" && og["article:modified_time"] ? { modifiedTime: og["article:modified_time"] } : {}),
      ...(ogType === "article" && og["article:published_time"] ? { publishedTime: og["article:published_time"] } : {}),
    },
    twitter: { card: page.twitter["twitter:card"] === "summary_large_image" ? "summary_large_image" : "summary" },
    icons: {
      icon: [
        { url: "/wp-content/uploads/2021/07/cropped-favicon-02-32x32.png", sizes: "32x32" },
        { url: "/wp-content/uploads/2021/07/cropped-favicon-02-192x192.png", sizes: "192x192" },
      ],
      apple: "/wp-content/uploads/2021/07/cropped-favicon-02-180x180.png",
    },
  };
}

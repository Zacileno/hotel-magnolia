// The big slider photo at the top of the pages is what PageSpeed measures as LCP (Largest Contentful
// Paint). The original markup only offers the 1920 px JPG, so phones downloaded ~360 KiB for a 412 px
// wide picture. Here the <img> tags of that photo get a `srcset` with smaller WebP versions
// (made by scripts/optimize-hero.mjs) — the browser picks the size it needs; the original JPG stays
// as `src` (fallback). The first one also gets fetchpriority="high" so it is downloaded first.

const HERO_IMAGES = [
  "/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x750.jpg",
  "/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x450.jpg",
];
const WIDTHS = [480, 768, 1024, 1440, 1920];
// the slider is always as wide as the window
export const HERO_SIZES = "100vw";

export function heroSrcSet(src: string): string {
  const base = src.replace(/\.jpe?g$/i, "");
  return WIDTHS.map((w) => `${base}-${w}w.webp ${w}w`).join(", ");
}

/** Adds srcset/sizes (+ fetchpriority on the first one) to the slider photo; returns the photo for preloading */
export function optimizeHero(html: string): { html: string; hero: string | null } {
  let hero: string | null = null;
  const out = html.replace(/<img\b[^>]*>/g, (tag) => {
    const src = /\ssrc="([^"]+)"/.exec(tag)?.[1];
    if (!src || !HERO_IMAGES.includes(src) || !tag.includes("msDefaultImage") || tag.includes("srcset=")) return tag;
    const extra = ` srcset="${heroSrcSet(src)}" sizes="${HERO_SIZES}"` + (hero ? "" : ' fetchpriority="high"');
    hero ??= src;
    return tag.replace(/<img\b/, `<img${extra}`);
  });
  return { html: out, hero };
}

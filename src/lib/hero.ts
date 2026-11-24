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
// Redesign 2026-11-24 (Lenka): the menu bar lies over the photo, and the low 1920×450 crop on the subpages
// hid the castle behind it → subpages use the taller crop of the same photo (with the whole sky).
const LOW_CROP = "/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x450.jpg";
const TALL_CROP = "/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x750.jpg";

// as wide as the window; on desktop the photo is at least 520 px tall (polish.css), i.e. at least 1331 px wide
export const HERO_SIZES = "(min-width: 1026px) max(100vw, 1331px), 100vw";

export function heroSrcSet(src: string): string {
  const base = src.replace(/\.jpe?g$/i, "");
  return WIDTHS.map((w) => `${base}-${w}w.webp ${w}w`).join(", ");
}

/** Adds srcset/sizes (+ fetchpriority on the first one) to the slider photo; returns the photo for preloading */
export function optimizeHero(html: string): { html: string; hero: string | null } {
  let hero: string | null = null;
  const out = html.replace(/<img\b[^>]*>/g, (tag) => {
    const original = /\ssrc="([^"]+)"/.exec(tag)?.[1];
    // slider photos only (class "slider-NNNN"; about half of the pages lack the extra "msDefaultImage" class)
    if (!original || !HERO_IMAGES.includes(original) || !/class="slider-\d+/.test(tag) || tag.includes("srcset=")) return tag;
    const src = original === LOW_CROP ? TALL_CROP : original;
    const extra = ` srcset="${heroSrcSet(src)}" sizes="${HERO_SIZES}"` + (hero ? "" : ' fetchpriority="high"');
    hero ??= src;
    const sized = tag.replace(`src="${original}"`, `src="${src}"`).replace('height="450"', 'height="750"');
    // some of the smaller files are rounded to whole pixels (480×188 instead of 480×187.5), which made the photo
    // up to 1 px taller → keep the exact proportions of the original (same fix as on main, e251015)
    const ratio = / width="(\d+)"/.exec(sized)?.[1] + " / " + / height="(\d+)"/.exec(sized)?.[1];
    return sized.replace(/<img\b/, `<img${extra} style="aspect-ratio: ${ratio}"`);
  });
  return { html: out, hero };
}

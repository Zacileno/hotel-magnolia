// Creates smaller WebP versions of the slider (hero) photos at the top of the pages, so phones
// don't have to download the full 1920 px JPG (PageSpeed / Core Web Vitals – LCP).
// The original JPG stays as the fallback `src`; the page offers the WebP files via `srcset`
// (see src/lib/hero.ts). Output: <name>-<width>w.webp next to the original. Run: node scripts/optimize-hero.mjs
import sharp from "sharp";
import { existsSync } from "node:fs";
import path from "node:path";

export const HERO_IMAGES = [
  "public/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x750.jpg",
  "public/wp-content/uploads/2021/06/ANK5417f_resize-2-1920x450.jpg",
];
export const HERO_WIDTHS = [480, 768, 1024, 1440, 1920];

for (const file of HERO_IMAGES) {
  const base = file.replace(/\.jpe?g$/i, "");
  for (const w of HERO_WIDTHS) {
    const out = `${base}-${w}w.webp`;
    if (existsSync(out)) continue;
    const info = await sharp(file).resize({ width: w }).webp({ quality: 78 }).toFile(out);
    console.log(`${path.basename(out)}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KiB`);
  }
}

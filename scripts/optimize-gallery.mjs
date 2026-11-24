// Smaller WebP versions (640 px wide) of the photos in the mosaic galleries (src/lib/gallery.ts), so the small
// tiles do not download the full 1024 px photo. Output: <name>-640w.webp next to the original.
// Run after adding photos to a gallery: node scripts/optimize-gallery.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PAGES = "src/content/pages";
const photos = new Set();
for (const file of readdirSync(PAGES)) {
  const { html } = JSON.parse(readFileSync(path.join(PAGES, file), "utf8"));
  for (const gallery of html.matchAll(/class="simonet_galerie">([\s\S]*?)<\/div><\/div>/g))
    for (const link of gallery[1].matchAll(/href="([^"]+\.(?:jpe?g|png))"/gi)) photos.add(link[1]);
}
let made = 0;
let before = 0;
let after = 0;
for (const url of photos) {
  const source = path.join("public", url);
  const out = source.replace(/\.(jpe?g|png)$/i, "-640w.webp");
  if (!existsSync(out)) {
    await sharp(source).rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
    made++;
  }
  before += statSync(source).size;
  after += statSync(out).size;
}
console.log(`${photos.size} photos, ${made} new files, ${Math.round(before / 1024)} KiB → ${Math.round(after / 1024)} KiB`);

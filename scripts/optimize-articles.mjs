// Bigger versions of the article thumbnails for src/lib/articles.ts: finds the photo the 300×200 thumbnail was made
// from and saves it as WebP, 1000 px wide at most (<name>-article.webp next to it). The list of photos goes to
// src/lib/article-photos.json. Run after adding an article: node scripts/optimize-articles.mjs
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PAGES = "src/content/pages";
const list = {};
for (const file of readdirSync(PAGES)) {
  const { html, bodyClass } = JSON.parse(readFileSync(path.join(PAGES, file), "utf8"));
  if (!bodyClass.includes("single-post")) continue;
  const thumb = /class="entry-img">\s*<img[^>]*\ssrc="([^"]+)"/.exec(html)?.[1];
  if (!thumb) continue;
  const full = thumb.replace(/-\d+x\d+(?=\.\w+$)/, "");
  const source = [full.replace(/(\.\w+)$/, "-scaled$1"), full].find((s) => existsSync(path.join("public", s)));
  if (!source) continue;
  const src = full.replace(/\.\w+$/, "-article.webp");
  const { width, height } = await sharp(path.join("public", source))
    .rotate()
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join("public", src));
  list[thumb] = { src, width, height };
}
writeFileSync("src/lib/article-photos.json", JSON.stringify(list, null, 2) + "\n");
console.log(list);

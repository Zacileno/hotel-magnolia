// Joins the original WordPress stylesheets (same files, same order) into ONE file, so the browser
// makes one request instead of 13 before it can draw the page (PageSpeed: render-blocking requests).
// The CSS itself is copied byte for byte; only relative url(...) paths are rewritten to absolute ones,
// because the joined file lives in a different folder. The file name carries a content hash, so it can
// be cached by browsers "forever" (see headers in next.config.ts).
// Runs automatically before `npm run dev` / `npm run build` (predev / prebuild in package.json).
// Output (not in git): public/css/site.<hash>.css + src/generated/site-css.json
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

// Same stylesheets, same order as the original WordPress theme
export const STYLESHEETS = [
  "/wp-includes/css/dist/block-library/style.css",
  "/wp-content/plugins/contact-form-7/includes/css/styles.css",
  "/wp-content/plugins/wp-datepicker/css/front-styles.css",
  "/wp-content/plugins/wp-datepicker/css/jquery-ui.css",
  "/wp-content/themes/simonet/style.css",
  "/wp-content/plugins/easy-fancybox/fancybox/1.5.4/jquery.fancybox.min.css",
  "/wp-content/plugins/team-members/inc/css/tmm_style.css",
  "/wp-content/plugins/nastaveni/css/style.css",
  "/wp-content/plugins/ml-slider/assets/sliders/flexslider/flexslider.css",
  "/wp-content/plugins/ml-slider/assets/metaslider/public.css",
  "/wp-content/plugins/upravy/css/style.css",
  "/wp-content/plugins/reference2/css/style.css",
  "/wp-content/plugins/kontakty/css/style.css",
];

const ROOT = process.cwd();

/** url(images/a.png) in /wp-content/themes/simonet/style.css → url(/wp-content/themes/simonet/images/a.png) */
function absolutizeUrls(css, fileUrl) {
  const dir = path.posix.dirname(fileUrl);
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, quote, ref) => {
    const r = ref.trim();
    if (/^(data:|https?:|\/\/|\/|#)/i.test(r)) return match;
    return `url(${quote}${path.posix.normalize(path.posix.join(dir, r))}${quote})`;
  });
}

const parts = STYLESHEETS.map((href) => {
  // a leading @charset "UTF-8" is dropped here and written once at the top of the joined file
  const css = readFileSync(path.join(ROOT, "public", href), "utf8").replace(/^﻿?@charset\s+"utf-8";\s*/i, "");
  // these rules only work at the very top of a file, so they would break in the middle of a joined file
  if (/@(import|charset|namespace)\b/i.test(css)) throw new Error(`${href} contains @import/@charset/@namespace – handle it before joining`);
  return `/* ${href} */\n${absolutizeUrls(css, href)}\n`;
});
const bundle = `@charset "UTF-8";\n` + parts.join("");
const hash = createHash("sha256").update(bundle).digest("hex").slice(0, 10);

const outDir = path.join(ROOT, "public", "css");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
const fileName = `site.${hash}.css`;
writeFileSync(path.join(outDir, fileName), bundle);

const genDir = path.join(ROOT, "src", "generated");
mkdirSync(genDir, { recursive: true });
writeFileSync(path.join(genDir, "site-css.json"), JSON.stringify({ href: `/css/${fileName}` }, null, 2) + "\n");

console.log(`bundle-css: ${STYLESHEETS.length} files → /css/${fileName} (${Math.round(bundle.length / 1024)} KiB)`);

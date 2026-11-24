// Joins the original WordPress stylesheets (same files, same order) into ONE file, so the browser
// makes one request instead of 13 before it can draw the page (PageSpeed: render-blocking requests).
// The CSS rules are copied byte for byte; only relative url(...) paths are rewritten to absolute ones,
// because the joined file lives in a different folder, and rules that can never apply on this site are
// left out (see pruneUnused). The file name carries a content hash, so it can
// be cached by browsers "forever" (see headers in next.config.ts).
// Runs automatically before `npm run dev` / `npm run build` (predev / prebuild in package.json).
// Output (not in git): public/css/site.<hash>.css + src/generated/site-css.json
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

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

/**
 * Removes rules that can never apply on this site (PageSpeed: "reduce unused CSS"; less CSS to download
 * and to match = the page is drawn sooner). Most of the 290 KiB come from WordPress plugins (e.g. all
 * Gutenberg blocks) the pages never use.
 *
 * Very conservative on purpose — the look must stay exactly the same:
 * - "known words" = every word that appears anywhere in the page content (src/content) or in our own
 *   code (src/**, which also adds classes at runtime, e.g. Fancybox, Contact Form 7 states);
 * - a selector is dead only if it requires a class (".name") that is not a known word; classes inside
 *   :not()/:is()/… and [attr] parts are ignored, selectors with escapes are always kept;
 * - a rule is removed only if ALL its selectors are dead — a rule is never edited, so the remaining
 *   rules (incl. their order and browser hacks) are byte-for-byte the original ones;
 * - @font-face, @keyframes and everything that is not a style rule stays; @media blocks that end up
 *   empty are removed; comments are removed.
 * Set BUNDLE_CSS_FULL=1 to build the full, unpruned bundle (used to compare both versions).
 */
function pruneUnused(css) {
  const words = new Set();
  const collect = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (/\.(json|ts|tsx|css|mjs|js)$/.test(entry.name) && entry.name !== "site-css.json") {
        for (const w of readFileSync(full, "utf8").split(/[^A-Za-z0-9_-]+/)) if (w) words.add(w);
      }
    }
  };
  collect(path.join(ROOT, "src"));

  const isDead = (selector) => {
    if (selector.includes("\\")) return false;
    let s = selector.replace(/\[[^\]]*\]/g, "");
    let prev;
    do {
      prev = s;
      s = s.replace(/:[a-zA-Z-]+\([^()]*\)/g, "");
    } while (s !== prev);
    const classes = [...s.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
    return classes.some((c) => !words.has(c));
  };

  const root = postcss.parse(css);
  let removed = 0;
  root.walkComments((c) => c.remove());
  root.walkRules((rule) => {
    if (rule.parent?.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
    if (rule.selectors.every(isDead)) {
      rule.remove();
      removed++;
    }
  });
  root.walkAtRules((at) => {
    if (/^(media|supports)$/i.test(at.name) && at.nodes && at.nodes.length === 0) at.remove();
  });
  console.log(`bundle-css: removed ${removed} rules that can never apply`);
  return root.toString();
}

const parts = STYLESHEETS.map((href) => {
  // a leading @charset "UTF-8" is dropped here and written once at the top of the joined file
  const css = readFileSync(path.join(ROOT, "public", href), "utf8").replace(/^﻿?@charset\s+"utf-8";\s*/i, "");
  // these rules only work at the very top of a file, so they would break in the middle of a joined file
  if (/@(import|charset|namespace)\b/i.test(css)) throw new Error(`${href} contains @import/@charset/@namespace – handle it before joining`);
  return `/* ${href} */\n${absolutizeUrls(css, href)}\n`;
});
const joined = `@charset "UTF-8";\n` + parts.join("");
// our own polish on top of the original theme (redesign 2026-11) – always last, never pruned
const polish = `/* src/styles/polish.css */\n${readFileSync(path.join(ROOT, "src", "styles", "polish.css"), "utf8")}\n`;
const bundle = (process.env.BUNDLE_CSS_FULL === "1" ? joined : pruneUnused(joined)) + polish;
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

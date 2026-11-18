// Downloads every image / stylesheet / font the site needs from the original server into
// public/ at the same path (e.g. /wp-content/uploads/2021/06/x.jpg). Each file is checked:
// only real images, CSS and fonts are accepted, and CSS is scanned for further url(...) files.
//
// Input: scripts/assets.txt (written by extract-content.mjs) + the stylesheets listed below.
// Usage: node scripts/fetch-assets.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");
const ORIGIN = "https://hotelmagnolia.cz";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";

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
  "/wp-content/uploads/trustindex-booking-widget.css",
];

const SPAM = /(casino|cialis|viagra|mothercare|klevu|gambl|\bbet\b)/i;
const queue = [
  ...STYLESHEETS,
  ...readFileSync(join(ROOT, "scripts/assets.txt"), "utf8").split(/\r?\n/).filter(Boolean),
];
const seen = new Set();
const failed = [];
let ok = 0;

function accept(path, type, buf) {
  const head = buf.subarray(0, 12);
  const isPng = head[0] === 0x89 && head[1] === 0x50;
  const isJpg = head[0] === 0xff && head[1] === 0xd8;
  const isGif = head.toString("ascii", 0, 3) === "GIF";
  const isWebp = head.toString("ascii", 8, 12) === "WEBP";
  const ext = posix.extname(path).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico"].includes(ext)) return isPng || isJpg || isGif || isWebp || ext === ".ico";
  if (ext === ".svg") return /<svg[\s>]/i.test(buf.toString("utf8")) && !/<script/i.test(buf.toString("utf8"));
  if (ext === ".css") return !SPAM.test(buf.toString("utf8")) && !/<html/i.test(buf.toString("utf8"));
  if ([".woff", ".woff2", ".ttf", ".eot"].includes(ext)) return !/text\/html/i.test(type);
  return false;
}

while (queue.length) {
  const path = queue.shift().split(/[?#]/)[0];
  if (seen.has(path)) continue;
  seen.add(path);
  const dest = join(PUBLIC, decodeURIComponent(path));
  if (existsSync(dest)) {
    ok++;
    continue;
  }
  let res;
  try {
    res = await fetch(ORIGIN + path, { headers: { "User-Agent": UA } });
  } catch (e) {
    failed.push(`${path} (${e.message})`);
    continue;
  }
  if (!res.ok) {
    failed.push(`${path} (HTTP ${res.status})`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (!accept(path, res.headers.get("content-type") || "", buf)) {
    failed.push(`${path} (rejected: not a valid ${posix.extname(path)} file)`);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  ok++;
  if (path.endsWith(".css")) {
    for (const m of buf.toString("utf8").matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
      const u = m[2].trim();
      if (u.startsWith("data:") || /^https?:/i.test(u)) continue;
      queue.push(u.startsWith("/") ? u : posix.normalize(posix.join(posix.dirname(path), u)));
    }
  }
}
console.log(`${ok} files ok`);
if (failed.length) console.log("FAILED:\n" + failed.join("\n"));

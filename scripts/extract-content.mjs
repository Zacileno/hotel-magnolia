// Extracts clean page content from the downloaded copies of the original WordPress site.
//
// Sources (not in git, re-create them with the fetch scripts — see README):
//   _original/pages-archive/*.html  clean Wayback Machine copies (preferred; the live site
//                                   serves a hijacked foreign e-shop on most main pages)
//   _original/pages/*.html          live copies, used only when clean (pages missing in the archive)
//
// Output (committed):
//   src/content/pages/<name>.json   one file per page: head meta + cleaned body HTML
//   src/content/index.json          list of all pages (path, file, lang)
//   scripts/assets.txt              every /wp-content/... file the pages reference
//
// Usage: node scripts/extract-content.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { fixHtml } from "./typography.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_ARCHIVE = join(ROOT, "_original/pages-archive");
const SRC_LIVE = join(ROOT, "_original/pages");
const OUT = join(ROOT, "src/content/pages");

// Note: the wellness-package pages, /pokoje/, /album/ and the "Hotel Ferdinand" gallery come from
// another hotel's site (Hotel Ferdinand, Mariánské Lázně). By the owner's decision (2026-11-18)
// they are migrated as they are on the original site.

// The real articles of the hotel (everything else in the WP post list is injected spam).
const LEGIT_POSTS = [
  "svatby-2023",
  "hora-rip-skvely-tip-na-celodenni-vylet",
  "hazmburk-nedobytny-goticky-hrad",
  "kokorinsko-a-machuv-kraj-tipy-na-vylety",
  "terezin-vylet-ze-ktereho-mrazi-po-zadech",
  "ceske-stredohori",
  "ploskovice-kouzelny-zamek-a-zahrady",
  "zubrnice-narodni-muzeum-v-prirode",
  "melnik-jeho-zamek-a-soutok-labe-s-vltavou",
  "cykliste",
  "hotel-v-provozu",
];
// Listing pages (tag, category, author, month archive) all render the same "latest posts"
// list in this theme. On the hacked site that list is full of spam, so every listing page
// takes its body from this verified-clean archived listing.
const LISTING = /^(tag__|category__|author__|\d{4}__\d{2}$)/;
const CLEAN_LISTING = "category__novinky";

// Only these external hosts may be linked or loaded. Anything else is removed and reported.
const ALLOWED_HOSTS = new Set([
  "res.plazaro.com", // reservation engine
  "cdn.trustindex.io", // review widget
  "cf.bstatic.com", // Booking.com reviewer avatars in the review widget
  "www.kayak.com",
  "content.r9cdn.net", // KAYAK award badge
  "simonet.cz", // original web author credit in the footer
  "www.google.com",
  "maps.google.com",
  "lh3.googleusercontent.com",
  "lh5.googleusercontent.com",
  "www.zamek-ploskovice.cz",
  "www.stredohori.cz",
  "www.navylet.cz",
  "www.krabcice.cz",
  "www.hrad-hazmburk.cz",
  "www.melnik.info",
  "www.terezin.cz",
  "www.nmvp.cz",
]);
// Hotel's former wedding site — the domain no longer exists (and expired domains are often
// bought by spammers), so the link is dropped and only its text is kept.
const UNLINK_HOSTS = new Set(["svatbyroudnice.cz"]);

// Final safety net: the build of a page fails if its visible text or attributes contain these.
const SPAM_WORDS =
  /(casino|kasyn|kasino|cassino|\bbet(s|ting)?\b|bookmaker|sportsbook|jackpot|\bslots?\b|free ?spins?|bonus|gambl|poker|roulette|blackjack|igaming|cialis|viagra|tadalafil|pharmacy|lékárn|카지노|カジノ|赌|博彩|sòng bạc|cá cược|คาสิโน|كازينو)/i;

// Injected spam (hidden casino / pharmacy links). Anything matching is removed.
const SPAM_HOST = /(casino|kasyn|bet\b|bet\.|kinbet|spinrol|gambl|candy|chicken|westace|glory|blue-bet|cialis|viagra|dh-entova|mothercare|anelink|godrive)/i;
const HIDDEN_STYLE = /(font-size:\s*0|text-indent:\s*-\d|left:\s*\d{4,}px|clip-path:\s*inset\(50%\)|width:\s*0;\s*height:\s*0|height:\s*1px;\s*width:\s*1px)/i;

const assets = new Set();

function pathFromName(name) {
  if (name === "home") return "/";
  return "/" + name.replace(/__/g, "/") + "/";
}

function localUrl(url) {
  if (!url) return url;
  let u = url.trim();
  u = u.replace(/^(https?:)?\/\/(www\.)?hotelmagnolia\.cz/i, "");
  u = u.replace(/^(https?:)?\/\/(www\.)?hotelferdinand\.cz(?=\/wp-content\/)/i, "");
  if (u === "") u = "/";
  if (u.startsWith("/wp-content/") || u.startsWith("/wp-includes/")) {
    assets.add(u.split(/[?#]/)[0]);
    u = u.split("?")[0];
  }
  return u;
}

function fixHref(href) {
  if (!href) return href;
  const h = href.trim();
  if (/^(#|mailto:|tel:|javascript:)/i.test(h)) return h;
  if (/^(https?:)?\/\//i.test(h)) return withSlash(localUrl(h));
  if (h.startsWith("/")) return withSlash(localUrl(h));
  // bare relative slug, e.g. href='svatby-2023' in the news list → absolute path
  return "/" + h.replace(/\/?$/, "/");
}

// "/reference" → "/reference/" (all pages use a trailing slash), files and anchors untouched
function withSlash(u) {
  if (!u.startsWith("/") || u.startsWith("/wp-")) return u;
  const [p, rest = ""] = u.split(/(?=[?#])/);
  if (p.endsWith("/") || /\.[a-z0-9]{2,5}$/i.test(p)) return u;
  return p + "/" + rest;
}

function cleanBody($) {
  const page = $("body");
  const removedScripts = [];
  const flags = { plazaro: null, trustindex: false };

  page.find("script").each((_, el) => {
    const src = $(el).attr("src") || "";
    const code = $(el).html() || "";
    const m = src.match(/res\.plazaro\.com\/online-reservation\.js\?lang=(\w+)/);
    if (m) flags.plazaro = m[1];
    else removedScripts.push(src || code.trim().slice(0, 60).replace(/\s+/g, " "));
    $(el).remove();
  });
  page.find("noscript").remove();
  page.find(".fl-builder-content-inner, .top_top").remove();
  page.find("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const style = $(el).attr("style") || "";
    if (SPAM_HOST.test(href) || (HIDDEN_STYLE.test(style) && /^https?:/i.test(href) && !/hotelmagnolia/i.test(href))) {
      $(el).remove();
    }
  });
  if (page.find(".ti-widget").length) flags.trustindex = true;

  page.find("[href]").each((_, el) => $(el).attr("href", fixHref($(el).attr("href"))));
  page.find("[src]").each((_, el) => $(el).attr("src", localUrl($(el).attr("src"))));
  page.find("[srcset]").each((_, el) => {
    const v = $(el)
      .attr("srcset")
      .split(",")
      .map((p) => {
        const [u, w] = p.trim().split(/\s+/);
        return [localUrl(u), w].filter(Boolean).join(" ");
      })
      .join(", ");
    $(el).attr("srcset", v);
  });
  page.find("[style*='url(']").each((_, el) => {
    const s = $(el).attr("style").replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, q, u) => `url(${q}${localUrl(u)}${q})`);
    $(el).attr("style", s);
  });
  // WordPress form endpoints → handled by our own form handler on the client
  page.find("form.wpcf7-form").each((_, el) => $(el).attr("action", ""));

  // Listing pages: keep only the hotel's real articles, categories and months.
  page.find(".homenewsin").each((_, el) => {
    const href = $(el).find("a").first().attr("href") || "";
    const slug = href.replace(/^\/|\/$/g, "");
    if (!LEGIT_POSTS.includes(slug)) $(el).remove();
  });
  page.find("li.cat-item").each((_, el) => {
    const href = $(el).find("a").attr("href") || "";
    if (!/^\/category\/(novinky|tipy-na-vylety-v-roudnici-a-okoli)\/$/.test(href)) $(el).remove();
  });
  page.find(".widget_archive li").each((_, el) => {
    const href = $(el).find("a").attr("href") || "";
    if (!/^\/(2021\/0[467]|2023\/01)\/$/.test(href)) $(el).remove();
  });
  // "previous / next" links under a post or gallery: only to real articles / the hotel's galleries
  page.find(".nav-next, .nav-previous").each((_, el) => {
    const slug = ($(el).find("a").attr("href") || "").replace(/^\/|\/$/g, "");
    const gallery = /^(galerie\/[a-z0-9-]+|album(\/[a-z0-9-]+)?)$/.test(slug);
    if (!LEGIT_POSTS.includes(slug) && !gallery) $(el).remove();
  });

  // Whitelist of external hosts: remove everything else.
  const blocked = [];
  page.find("[href], [src]").each((_, el) => {
    for (const attr of ["href", "src"]) {
      const v = $(el).attr(attr);
      if (!v || !/^(https?:)?\/\//i.test(v)) continue;
      const host = new URL(v, "https://x").host;
      if (ALLOWED_HOSTS.has(host)) continue;
      if (el.tagName === "a" && UNLINK_HOSTS.has(host)) {
        // legitimate text, dead domain: keep the words, drop the link
        blocked.push(`unlinked a ${attr}=${v}`);
        $(el).replaceWith($(el).html());
      } else {
        blocked.push(`removed ${el.tagName} ${attr}=${v}`);
        $(el).remove();
      }
      break;
    }
  });

  let html = page.html() || "";
  html = html.replace(/<!--(?!\s*R-CONTENT)[\s\S]*?-->/g, "");
  return { html, removedScripts, flags, blocked };
}

function head($) {
  const meta = (sel) => $(sel).attr("content") || undefined;
  const robots = $('meta[name="robots"]').last().attr("content");
  const og = {};
  $('meta[property^="og:"], meta[property^="article:"]').each((_, el) => {
    const prop = $(el).attr("property");
    if (prop === "og:locale:alternate") og[prop] = [og[prop], $(el).attr("content")].filter(Boolean).join(",");
    else og[prop] = $(el).attr("content");
  });
  // favicons and the share image are needed too
  $('link[rel="icon"], link[rel="apple-touch-icon"]').each((_, el) => localUrl($(el).attr("href")));
  const twitter = {};
  $('meta[name^="twitter:"]').each((_, el) => {
    twitter[$(el).attr("name")] = $(el).attr("content");
  });
  const alternates = {};
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    alternates[$(el).attr("hreflang")] = localUrl($(el).attr("href"));
  });
  const jsonLd = $('script[type="application/ld+json"]').first().html() || undefined;
  if (og["og:image"]) localUrl(og["og:image"]);
  // The hacker overwrote some share descriptions (e.g. homepage: casino text / "SEO Super Tool").
  // Before the hack the homepage had none, so a suspicious one is dropped.
  for (const k of ["og:description"]) {
    if (og[k] && (SPAM_WORDS.test(og[k]) || /seo super tool/i.test(og[k]))) delete og[k];
  }
  return {
    title: $("title").first().text().trim(),
    description: meta('meta[name="description"]'),
    // meta keywords are left out: the theme hard-codes another hotel's keywords
    // ("wellness hotel mariánské lázně"), and search engines ignore them anyway
    robots,
    canonical: $('link[rel="canonical"]').attr("href") || undefined,
    alternates,
    og,
    twitter,
    jsonLd: jsonLd && !SPAM_HOST.test(jsonLd) ? jsonLd.trim() : undefined,
  };
}

const archiveFiles = new Set(readdirSync(SRC_ARCHIVE).filter((f) => f.endsWith(".html")));
const liveFiles = existsSync(SRC_LIVE) ? readdirSync(SRC_LIVE).filter((f) => f.endsWith(".html")) : [];
const names = [...new Set([...archiveFiles, ...liveFiles])].map((f) => f.replace(/\.html$/, "")).sort();

const CS_PAYMENTS_WIDGET = cheerio
  .load(readFileSync(join(SRC_LIVE, "home.html"), "utf8"), { decodeEntities: false })
  .html("#black-studio-tinymce-8");
if (!CS_PAYMENTS_WIDGET || !/kayak/i.test(CS_PAYMENTS_WIDGET)) throw new Error("live footer widget not found");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const index = [];
const pages = [];
const report = [];

for (const name of names) {
  // newest clean copy wins: the live page when it is not hijacked, otherwise the archive
  const isClean = (html) => html.includes('id="masthead"') && !/mothercare|klevu/i.test(html);
  const candidates = [join(SRC_LIVE, name + ".html"), join(SRC_ARCHIVE, name + ".html")].filter(existsSync);
  let file = null;
  let raw = "";
  for (const c of candidates) {
    const html = readFileSync(c, "utf8");
    if (isClean(html)) {
      file = c;
      raw = html;
      break;
    }
  }
  if (!file) {
    report.push(`MISSING clean ${name}`);
    continue;
  }
  const $ = cheerio.load(raw, { decodeEntities: false });
  const lang = ($("html").attr("lang") || "cs-CZ").slice(0, 2);
  const bodyClass = $("body").attr("class") || "";
  const meta = head($);
  // listing pages: body from the verified-clean listing, head (title etc.) from the page itself
  const body$ = LISTING.test(name)
    ? cheerio.load(readFileSync(join(SRC_ARCHIVE, CLEAN_LISTING + ".html"), "utf8"), { decodeEntities: false })
    : $;
  // footer "Platby a ocenění" (KAYAK award) — the current live site shows it in all languages
  body$("#black-studio-tinymce-8").replaceWith(CS_PAYMENTS_WIDGET);
  const { html, removedScripts, flags, blocked } = cleanBody(body$);
  const path = pathFromName(name);
  // non-breaking spaces (Czech typography), see scripts/typography.mjs
  pages.push({ name, data: { path, lang, bodyClass, ...meta, ...flags, html: fixHtml(html, lang) } });
  index.push({ path, name, lang });
  report.push(
    `OK ${lang} ${path}  (${file.includes("archive") ? "archive" : "live"}${LISTING.test(name) ? ", clean listing" : ""}; removed scripts: ${removedScripts.length})`
  );
  for (const b of blocked) report.push(`   BLOCKED ${b}`);
}

// ---- /category/novinky/page/2/ — not archived; it held the 11th (oldest) article ----
{
  const first = pages.find((p) => p.name === CLEAN_LISTING);
  const $l = cheerio.load(first.data.html, { decodeEntities: false }, false);
  const items = $l(".homenewsin");
  const tpl = items.filter((_, el) => $l(el).find("a").first().attr("href") === "/cykliste/").first();
  const item = tpl.clone();
  item.find("a").attr("href", "/hotel-v-provozu/");
  item.find("h3.title_homenews").contents().first().replaceWith("Hotel opět v provozu");
  item.find("img").attr("src", "/wp-content/uploads/2021/06/ANK5450f_resize-788x200.jpg").removeAttr("srcset").removeAttr("sizes");
  assets.add("/wp-content/uploads/2021/06/ANK5450f_resize-788x200.jpg");
  item.find(".content_home_news").html(
    "<div class='date_homenews'>8.4.2021</div> Po vynucené covidové pauze vás opět s radostí přivítáme v prostorách našeho hotelu v Roudnici nad Labem. Od 1.7. se vracíme... <div class=\"clear\"></div>"
  );
  item.removeClass("treti");
  items.first().before(item);
  items.remove();
  $l(".nav-links").html(
    '<a class="prev page-numbers" href="/category/novinky/">Předchozí stránka</a><a class="page-numbers" href="/category/novinky/"><span class="meta-nav screen-reader-text">Stránka: </span>1</a><span aria-current="page" class="page-numbers current"><span class="meta-nav screen-reader-text">Stránka: </span>2</span>'
  );
  const path = "/category/novinky/page/2/";
  pages.push({
    name: "category__novinky__page__2",
    data: {
      ...first.data,
      path,
      title: first.data.title.replace(" - Hotel Magnolia", " - Stránka 2 z 2 - Hotel Magnolia"),
      canonical: "https://hotelmagnolia.cz" + path,
      og: { ...first.data.og, "og:url": "https://hotelmagnolia.cz" + path },
      jsonLd: undefined,
      html: fixHtml($l.html(), "cs"),
    },
  });
  index.push({ path, name: "category__novinky__page__2", lang: "cs" });
  report.push(`OK cs ${path}  (built from the clean listing)`);
}

// ---- safety checks: nothing is written unless every page passes ----
const known = new Set(index.map((p) => p.path));
const problems = [];
for (const { name, data } of pages) {
  const whole = JSON.stringify(data);
  const hit = whole.match(SPAM_WORDS);
  if (hit) problems.push(`SPAM WORD "${hit[0]}" in ${name}: …${whole.slice(Math.max(0, hit.index - 80), hit.index + 40)}…`);
  const $p = cheerio.load(data.html, { decodeEntities: false }, false);
  $p("a[href^='/']").each((_, el) => {
    const href = $p(el).attr("href").split("#")[0];
    if (href.startsWith("/wp-content/") || href.startsWith("/wp-includes/")) return;
    if (!known.has(href)) report.push(`   UNKNOWN LINK ${href} in ${name}`);
  });
}
if (problems.length) {
  console.log(report.join("\n"));
  console.error("\nSTOPPED — possible spam found, nothing written:\n" + problems.join("\n"));
  process.exit(1);
}
for (const { name, data } of pages) {
  writeFileSync(join(OUT, name + ".json"), JSON.stringify(data, null, 1));
}

writeFileSync(join(ROOT, "src/content/index.json"), JSON.stringify(index, null, 1));
writeFileSync(join(ROOT, "scripts/assets.txt"), [...assets].sort().join("\n") + "\n");
console.log(report.join("\n"));
console.log(`\n${index.length} pages, ${assets.size} assets`);

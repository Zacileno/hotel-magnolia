// Non-breaking spaces (Czech typography rules) in the visible text of every page.
// Only text nodes are changed — never tags, attributes, scripts, styles or form fields.
// Safe to run repeatedly (a non-breaking space stays a non-breaking space).
//
// Usage: node scripts/typography.mjs        (rewrites src/content/pages/*.json in place)
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const NBSP = " ";
const SPACE = "[ \\t\\n\\r\\u00A0]+"; // ordinary whitespace incl. an existing nbsp
const BEFORE = "(?<=^|[\\s\\u00A0(„\"“‚'>/])"; // start of a word

// rules for every language
const COMMON = [
  // 1 890 / +420 770 631 077 — digits separated by a space
  [new RegExp(`(\\d)${SPACE}(?=\\d)`, "g"), `$1${NBSP}`],
  // 8. 4. 2021, 1. července — ordinal/date dot followed by a number or a word
  [new RegExp(`${BEFORE}(\\d{1,2}\\.)${SPACE}(?=[\\d\\p{L}])`, "gu"), `$1${NBSP}`],
  // 38 pokojů, 1 890 Kč, 30 %, 160 osob — a count (max. 3 digits, so not a year) + its unit/noun;
  // not before a one-letter word ("… 20 a …")
  [new RegExp(`(?<!\\d{3})(\\d)${SPACE}(?=[\\p{L}%€°]{2}|[%€°])`, "gu"), `$1${NBSP}`],
  // a dash never starts a line: "Hora Říp – skvělý tip"
  [new RegExp(`${SPACE}(?=[–—])`, "g"), NBSP],
];

// Czech: one-letter prepositions / conjunctions and common abbreviations
const CS = [
  [new RegExp(`${BEFORE}([ksvzouaiKSVZOUAI])${SPACE}`, "g"), `$1${NBSP}`],
  [new RegExp(`${BEFORE}(č|tel|ul|nám|tzv|např|cca|max|min|resp|s\\.${NBSP}?r|p|s|r)\\.${SPACE}(?=[\\p{L}\\d+])`, "gu"), `$1.${NBSP}`],
];

export function fixTypography(text, lang) {
  let out = text;
  const rules = lang === "cs" ? [...CS, ...COMMON] : COMMON;
  // run twice: rules can overlap ("a v Praze", "s. r. o.")
  for (let i = 0; i < 2; i++) for (const [re, rep] of rules) out = out.replace(re, rep);
  return out;
}

const SKIP = new Set(["script", "style", "textarea", "code", "pre", "noscript", "option"]);

export function fixHtml(html, lang) {
  const $ = cheerio.load(html, { decodeEntities: false }, false);
  const walk = (node) => {
    for (const child of node.children || []) {
      if (child.type === "text") child.data = fixTypography(child.data, lang);
      else if (child.type === "tag" && !SKIP.has(child.name)) walk(child);
    }
  };
  walk($.root()[0]);
  return $.html();
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = fileURLToPath(new URL("../src/content/pages/", import.meta.url));
  let changed = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    const file = join(dir, f);
    const data = JSON.parse(readFileSync(file, "utf8"));
    const html = fixHtml(data.html, data.lang);
    if (html !== data.html) {
      data.html = html;
      writeFileSync(file, JSON.stringify(data, null, 1));
      changed++;
    }
  }
  console.log(`typography: ${changed} pages updated`);
}

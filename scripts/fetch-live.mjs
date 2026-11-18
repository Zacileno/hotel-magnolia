// Downloads the legitimate (non-spam) pages of hotelmagnolia.cz into _original/pages
// Usage: node crawl.mjs <outDir> <urlListFile>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [outDir, listFile] = process.argv.slice(2);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
mkdirSync(outDir, { recursive: true });
const urls = readFileSync(listFile, "utf8").split(/\r?\n/).filter(Boolean);
for (const path of urls) {
  const url = "https://hotelmagnolia.cz" + path;
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "manual" });
  const name = (path.replace(/^\/|\/$/g, "").replace(/\//g, "__") || "home") + ".html";
  if (res.status >= 300 && res.status < 400) {
    console.log(res.status, path, "->", res.headers.get("location"));
    continue;
  }
  const html = await res.text();
  writeFileSync(join(outDir, name), html);
  console.log(res.status, path, html.length);
}

// For each path, download the newest clean Wayback Machine snapshot (raw, "id_").
// Clean = contains the hotel theme (id="masthead") and none of the injected store markup.
// Usage: node wayback.mjs <outDir> <urlListFile>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const [outDir, listFile] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const paths = readFileSync(listFile, "utf8").split(/\r?\n/).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.text();
      if (res.status === 404) return null;
    } catch {}
    await sleep(3000 * (i + 1));
  }
  return null;
}

const report = [];
for (const path of paths) {
  const name = (path.replace(/^\/|\/$/g, "").replace(/\//g, "__") || "home") + ".html";
  const cdx = await get(
    `https://web.archive.org/cdx/search/cdx?url=hotelmagnolia.cz${path}&output=json&fl=timestamp&filter=statuscode:200&from=2023`
  );
  const stamps = cdx ? JSON.parse(cdx).slice(1).map((r) => r[0]).reverse() : [];
  let saved = null;
  for (const ts of stamps.slice(0, 6)) {
    const html = await get(`https://web.archive.org/web/${ts}id_/https://hotelmagnolia.cz${path}`);
    if (html && html.includes('id="masthead"') && !/mothercare|klevu/i.test(html)) {
      writeFileSync(join(outDir, name), html);
      saved = ts;
      break;
    }
    await sleep(800);
  }
  const line = `${saved ? "OK  " + saved : "MISSING       "} ${path} (${stamps.length} snapshots)`;
  console.log(line);
  report.push(line);
  await sleep(800);
}
writeFileSync(join(outDir, "_report.txt"), report.join("\n") + "\n");

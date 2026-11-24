// Redesign 2026-11 (Lenka): photo galleries (original "simonet gallery" plugin markup) and short lists.

/* ---------- galleries ---------- */
// All galleries (up to MOSAIC_MAX photos) become a "mosaic": big and small photos mixed, always filling
// a clean rectangle (4 columns on desktop). Each photo gets a size class, chosen so the rows close:
//   blocks of 5 photos = one big 2×2 photo + four small ones (big photo alternates left / right),
//   the rest fills the last row: 4 → four small, 3 → wide + 2 small, 2 → two wide, 1 → full width
//   (and if only 1 is left after a block, that block uses big + wide + 2 small so the rest is 2 wide).
// No photo is ever left out: 35 photos (Fotogalerie) = exactly 7 blocks of 5.
// The 269 px thumbnails would be blurry → the photo the thumbnail links to (1024 px) for the big tiles and its
// 640 px WebP version (scripts/optimize-gallery.mjs) for the small ones; the browser picks, photos load lazily.
const MOSAIC_MAX = 100;

const TILE_SIZES: Record<string, string> = {
  "hm-small": "(max-width: 767px) 50vw, 310px",
  "hm-full": "(max-width: 1280px) 100vw, 1230px",
};
const WIDE_SIZES = "(max-width: 767px) 100vw, 620px";

function mosaicClasses(n: number): string[] {
  const out: string[] = [];
  let left = n;
  let block = 0;
  while (left >= 5) {
    const rest = left - 5;
    const big = block % 2 === 0 ? "hm-big" : "hm-big hm-right";
    if (rest === 1) {
      // big + wide + 2 small (4 photos) so that 2 photos are left for the last row
      out.push(big, "hm-wide", "hm-small", "hm-small");
      left -= 4;
    } else {
      out.push(big, "hm-small", "hm-small", "hm-small", "hm-small");
      left -= 5;
    }
    block++;
  }
  const lastRow: Record<number, string[]> = {
    0: [],
    1: ["hm-full"],
    2: ["hm-wide", "hm-wide"],
    3: ["hm-wide", "hm-small", "hm-small"],
    4: ["hm-small", "hm-small", "hm-small", "hm-small"],
  };
  return out.concat(lastRow[left]);
}

export function galleryLayout(html: string): string {
  return html.replace(
    /<div id="(\d+)" class="simonet_galerie">([\s\S]*?)<\/div><\/div>/g,
    (block: string, id: string, inner: string) => {
      const count = inner.match(/class="imgbox /g)?.length ?? 0;
      if (count === 0 || count > MOSAIC_MAX) return block;
      const classes = mosaicClasses(count);
      let i = 0;
      let photo = 0;
      const mosaic = inner
        .replace(/class="imgbox ([^"]*)"/g, (_m: string, rest: string) => `class="imgbox ${rest} ${classes[i++] ?? "hm-small"}"`)
        .replace(
          /<a href="([^"]+)"([^>]*)><img src="[^"]+"/g,
          (_m: string, href: string, rest: string) => {
            const sizes = TILE_SIZES[classes[photo++] ?? "hm-small"] ?? WIDE_SIZES;
            const small = href.replace(/\.(jpe?g|png)$/i, "-640w.webp");
            return `<a href="${href}"${rest}><img loading="lazy" srcset="${small} 640w, ${href} 1024w" sizes="${sizes}" src="${href}"`;
          }
        );
      return `<div id="${id}" class="simonet_galerie hm-mosaic">${mosaic}</div></div>`;
    }
  );
}

/* ---------- short lists → cards ---------- */
// Bullet lists with short items (e.g. "Pódium", "Šatna", "snídaně formou švédských stolů") are shown
// as small cards side by side (class "hm-cards"). Lists with long sentences (terms, privacy) stay lists.
const CARD_MAX_CHARS = 70;

export function cardLists(html: string): string {
  return html.replace(/<ul>([\s\S]*?)<\/ul>/g, (list: string, inner: string) => {
    const items = [...inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").trim());
    if (items.length < 2 || items.some((t) => t.length === 0 || t.length > CARD_MAX_CHARS)) return list;
    // a phrase held together by non-breaking spaces ("20 min. částečnou") does not fit half a phone screen
    const long = items.some((t) => t.replace(/&nbsp;|\u00a0/g, "_").split(/\s+/).some((chunk) => chunk.length > 13));
    return `<ul class="hm-cards${long ? " hm-cards-long" : ""}">${inner}</ul>`;
  });
}

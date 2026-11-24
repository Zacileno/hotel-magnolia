// Articles (news, trip tips): photo on the left, title + date + text on the right (Lenka 2026-11-24).
// The original markup had a 300 px thumbnail, then the title and the text below it, all over the full width.
// Done while rendering, the stored page content stays as it is. A photo inside the text (trip tips) moves to the
// left column under the main photo; the question form stays below both columns, full width.
// The thumbnail is replaced by the bigger photo it was made from (WebP by scripts/optimize-articles.mjs).
import articlePhotos from "@/lib/article-photos.json";

const PHOTOS: Record<string, { src: string; width: number; height: number } | undefined> = articlePhotos;
const PHOTO_SIZES = "(max-width: 900px) 100vw, 500px";

// inner wrapper of a post: thumbnail header, title, date, text … end of the article
const ARTICLE =
  /<header class="entry-header">\s*<header class="entry-img">\s*(<img[^>]*>)\s*<\/header>\s*<\/header>\s*<\/div>\s*(<h1 class="entry-title">[\s\S]*?<\/h1>)\s*<div class="date_news">([\s\S]*?)<\/div>([\s\S]*?)(?=<\/div>\s*<\/div>\s*<div class="clear">)/;

function bigPhoto(img: string): string {
  const src = /\ssrc="([^"]+)"/.exec(img)?.[1] ?? "";
  const photo = PHOTOS[src];
  if (!photo) return img;
  const alt = /\salt="([^"]*)"/.exec(img)?.[1] ?? "";
  return `<img width="${photo.width}" height="${photo.height}" src="${photo.src}" alt="${alt}" decoding="async">`;
}

export function articleLayout(html: string, bodyClass: string): string {
  if (!bodyClass.split(/\s+/).includes("single-post")) return html;
  return html.replace(ARTICLE, (_m, thumb: string, title: string, date: string, rest: string) => {
    const formAt = rest.search(/<div role="form" class="wpcf7"/);
    let text = formAt < 0 ? rest : rest.slice(0, formAt);
    const form = formAt < 0 ? "" : rest.slice(formAt);
    let second = "";
    text = text
      .replace(/<p>\s*(<img[^>]*>)\s*<\/p>/, (_p, img: string) => {
        second = `<div class="hm-article-photo hm-article-second">${img
          .replace(/ class="[^"]*"/, "")
          .replace(/ sizes="[^"]*"/, ` sizes="${PHOTO_SIZES}"`)
          .replace("<img", '<img loading="lazy"')}</div>`;
        return "";
      })
      .replace(/<p>(?:\s|&nbsp;)*<\/p>/g, "");
    const day = date.replace(/\|/g, "").trim();
    return (
      `</div><div class="hm-article"><div class="hm-article-photo">${bigPhoto(thumb)}</div>` +
      `<div class="hm-article-text">${title}<div class="hm-article-date">${day}</div>${text}</div>${second}</div>${form}`
    );
  });
}

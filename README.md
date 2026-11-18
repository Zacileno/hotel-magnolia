# Hotel Magnolia – web

1:1 rebuild of the original WordPress site **hotelmagnolia.cz** (Hotel Magnolia, Roudnice nad Labem)
in Next.js, hosted on Vercel. The old WordPress site was hacked (casino/pharmacy spam, hijacked pages),
so the content was taken from clean copies and every page was cleaned of spam.

- Repo: https://github.com/Zacileno/hotel-magnolia (branch `main` → Vercel auto-deploy)
- Languages: Czech (`/…`), English (`/en/…`), German (`/de/…`) — same addresses as the old site
- No CMS: content lives in the repo (`src/content/`)
- Detailed project log and decisions: [`project-status.md`](project-status.md)

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all pages are static)
```

## How it is built

| Part | Where |
|---|---|
| Page content (cleaned original HTML + head meta) | `src/content/pages/*.json`, list in `src/content/index.json` |
| Routes: one catch-all per language, each with its own root layout (`<html lang>`) | `src/app/(cs)`, `src/app/(en)/en`, `src/app/(de)/de` |
| `<head>`: original theme stylesheets, GTM `GTM-WLVZG7V` | `src/components/SiteDocument.tsx` |
| Page body + reservation (Plazaro) and reviews (Trustindex) widgets | `src/components/SitePage.tsx` |
| Theme behaviour (sticky menu, mobile menu, references slider, photo lightbox, contact form) | `src/components/SiteScripts.tsx` |
| Forms → e-mail (contact form, package order form); sending in one place | `src/app/api/kontakt`, `src/app/api/objednavka`, `src/lib/mail.ts` |
| Images, theme CSS, fonts (same paths as on the old site) | `public/wp-content/…`, `public/wp-includes/…` |
| Redirects (`/album/`, `/en/`, `/de/`, `/obchodni-podminky/`) | `next.config.ts` |

## Environment variables (Vercel → Settings → Environment Variables)

| Name | Purpose |
|---|---|
| `RESEND_API_KEY` | key of the e-mail sending service (provider not decided yet, see project-status.md) |
| `CONTACT_TO` | recipient(s) of form enquiries, comma separated |
| `CONTACT_FROM` | sender address, e.g. `Hotel Magnolia <web@hotelmagnolia.cz>` |

Never commit these values; `.env*` files are git-ignored.

## Editing content

Texts are in `src/content/pages/<page>.json` in the `html` field (original markup). Edit the text there,
keep the HTML structure and classes so the original styles still apply.

## Re-creating the content from the old site (only if ever needed)

The original pages are not in git (they contain the hacker's spam). To rebuild `src/content` from scratch:

```bash
# 1. clean copies from the Wayback Machine (the live site serves hijacked pages)
node scripts/fetch-wayback.mjs _original/pages-archive scripts/original-urls.txt
# 2. live copies (used only where clean; the script skips hijacked ones at extraction)
node scripts/fetch-live.mjs _original/pages scripts/original-urls.txt
# 3. extract + clean (whitelist of links, spam-word check — stops if anything suspicious is found)
node scripts/extract-content.mjs
# 4. download images / CSS / fonts into public/ (each file is validated)
node scripts/fetch-assets.mjs
```

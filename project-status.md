# Hotel Magnolia – stav projektu

> Dokumentace a paměť projektu. **Aktualizovat po každém větším bloku práce.**
> Při novém kontextovém okně: přečti nejdřív sekce „Aktuální stav" a „Další krok".

## 1. Zadání (Lenka, 2026-11-18)

- Převést stávající web https://hotelmagnolia.cz/ **1:1** na Vercel (Next.js). Web je napadený, proto vznikne nový čistý.
- Absolutně **žádný spam** nesmí být zkopírován.
- **Bez administrace** (CMS neřešit).
- **Všechny jazyky** (CZ, EN, DE), **všechny aktuality**, „úplně vše naprosto identické".
- **Stránky Hotelu Ferdinand** (wellness pobyty) převést také – „tak jak je teď v originálu".
- Rezervace musí fungovat naprosto stejně.
- Převzít měření (GTM / GA).
- Vercel založit stejně jako u ostatních projektů (účet Zacíleno), repo https://github.com/Zacileno/hotel-magnolia.
- Vše průběžně pushovat na GitHub; nezabírat místo na Lenčině počítači (vše potřebné musí být v repozitáři).
- **Z Pokladameee nic nepřenášet** (ani klíče, ani nastavení).
- Po skončení projektu smazat lokální složku, nechat jen tento soubor.

## 2. Aktuální stav

- Web je **ostrý na https://hotelmagnolia.cz/** (od 2026-11-18; `www` a `http` trvale přesměrovávají na
  `https://hotelmagnolia.cz/…`, certifikát Let's Encrypt spravuje Vercel). Vercel projekt `hotel-magnolia`, tým
  „pristupy-2441's projects", auto-deploy z GitHubu `Zacileno/hotel-magnolia`, větev `main`.
  Záložní adresa: https://hotel-magnolia.vercel.app.
- 104 stránek (79 CZ vč. 26 stránek Ferdinanda, 13 EN, 12 DE) + API `/api/kontakt` a `/api/objednavka`. Build, lint,
  typecheck OK.
- **Porovnání s originálem (2026-11-18, všech 103 stránek)** – měření polohy a velikosti všech prvků obsahu a patičky
  (šířka 1536 px, pevné mezery pro měření převedeny na běžné) proti nejnovějším čistým kopiím originálu:
  - **53 stránek totožných na pixel** (vč. všech 26 stránek Ferdinanda),
  - ostatní liší jen záměrně / vysvětlitelně: patička „Platby a ocenění" s KAYAK (archivní kopie ho neměly),
    úvodní stránka o 20 px kratší (odstraněný řádek skrytých spamových odkazů), odstraněné spamové / mrtvé odkazy
    (Svatby, Svatby 2023), Trustindex a Plazaro se na skutečném webu samy přepočítají (ve srovnávací kopii vypnuté skripty),
    přehledy štítků/autorů/měsíců mají nadpis „Články" širší (šablona zužuje jen rubriky), odchylky < 1 px
    (zaokrouhlení metrik písma).
- **Formuláře** („Vaše dotazy" i objednávka pobytu Ferdinanda): kontrola polí funguje (v prohlížeči i na serveru),
  odesílání přes Resend **nastaveno** (doména ověřená, klíč i adresy ve Vercelu, nové nasazení 2026-11-18).
  Na recepci se zkušební zpráva **neposílala** (přání Lenky). **Odesílání ověřeno 2026-11-18** jinak: dočasná
  funkce `/api/mail-check` (commit 97bed99, odstraněna v 16a997c) poslala přes stejné nastavení (klíč, odesílatel
  `web@hotelmagnolia.cz`, ověřená doména) e-mail na testovací adresu Resendu `delivered@resend.dev` → v Resendu
  **Sent + Delivered**. Formulářová API po odstranění funkce dál odpovídají správně.
- Zbývá (Lenka): smazat starý nepoužitý klíč „hotel-magnolia" v Resendu; (volitelně) poslat jeden dotaz z formuláře
; Search Console (sitemapa); rozhodnout o vypnutí starého WordPressu na hostingu Active24.

## 3. Další krok

1. **Odesílání formulářů přes Resend** (rozhodnutí Lenky 2026-11-18). Kód: `src/lib/mail.ts`.
   - ✅ Resend: doména `hotelmagnolia.cz` přidána v týmu **zacileno** (přihlášení přes GitHub Zacíleno), region
     Irsko (eu-west-1), sledování otevření/kliknutí vypnuté, hlavní doména (ne poddoména).
   - ✅ Vercel env: `CONTACT_TO = recepce@hotelmagnolia.cz`, `CONTACT_FROM = Hotel Magnolia <web@hotelmagnolia.cz>`.
   - ✅ **DNS** – 2026-11-18 vloženo (Claude, se svolením Lenky) v administraci **Active24**
     (https://admin.active24.cz, účet Vyhlídka Prosek s.r.o. → hotelmagnolia.cz → DNS → DNS nastavení),
     poznámka u záznamů „Resend - formulare webu"; původních 18 záznamů beze změny. Resend: doména **Verified**.
     Pozn.: Active24 a Websupport jsou jedna firma; doména, hosting WordPressu i e-maily jsou v tomto účtu.

     | Typ | Název | Hodnota |
     |---|---|---|
     | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCb0MwxoEvaTV7MbmbX8wRfTHj1A8OF2Qg+wTXpcVddzdvvDJDgDebbphkpgWCc8qZfqquUoMNKY3skOs0AoBUsJHEcE16N8ynDaqHUHO4gbLgPFWRlTkzcKQea/ZmJN4NNwzrRWfncKZIcn97bwS2RLwgy4MKYFASaQhLPG0AC7QIDAQAB` |
     | CNAME | `rsend` | `rsend-euw1.forge.rmta.net` |
     | CNAME | `send` | `send.forge.rmta.net` |
     | TXT | `_dmarc` | `v=DMARC1; p=none;` (doporučeno) |

     (Doména má wildcard `*.hotelmagnolia.cz` – nové záznamy platí jen pro tato jména. „Enable receiving" v Resendu
     **nezapínat** – měnilo by příjem pošty.)
   - ✅ Resend: doména ověřena (Verified).
   - ✅ **API klíč** „hotel-magnolia-web" (Resend, Sending access, jen doména `hotelmagnolia.cz`) vložila Lenka
     do Vercelu jako `RESEND_API_KEY` (Secret, Production). Starý nepoužitý klíč „hotel-magnolia" (hodnota se
     nezkopírovala) je potřeba v Resendu smazat – Lenka.
   - ✅ Nové nasazení po vložení klíče (2026-11-18). Test neprovedený (viz Aktuální stav).
2. ✅ **Přepnutí domény** na Vercel – 2026-11-18 provedla Claude na pokyn Lenky („tak to teda rovnou dej na ostrou
   doménu").
   - Záloha DNS **před** i **po** přepnutí: `backup/` (ověřeno kontrolním součtem proti exportu z Active24),
     návod na návrat v `backup/README.md`.
   - Vercel → Domains: `hotelmagnolia.cz` (hlavní, Production), `www.hotelmagnolia.cz` → 308 na `hotelmagnolia.cz`.
   - Active24 DNS: `@` A `37.9.175.164` → `216.150.1.1` + nový A `216.150.16.1`; smazány `@` AAAA a `www` A/AAAA
     (starý hosting); nový `www` CNAME `61ff461723cc4600.vercel-dns-016.com`. Ostatní záznamy (MX, mailin, SPF,
     DKIM Active24/Ecomail/Resend, send/rsend, _dmarc, wildcard `*`) beze změny.
   - Ověřeno: Vercel „Valid Configuration", HTTPS (Let's Encrypt, do 16. 2. 2027, obnovuje Vercel), www/http
     přesměrování, GTM ve stránce, pošta (MX, SPF, server recepce) beze změny. Veřejné DNS cache mohly ještě
     do hodiny ukazovat starý web (TTL 3600).
   - Starý WordPress zůstává netknutý na hostingu Active24 (služba `hotelmagnolia_cz`), jen na něj doména
     neukazuje. Doporučení: vypnout/smazat (napadený) – rozhodne Lenka/majitel.
3. Konec projektu (2026-11-18, Lenka): lokální složka `Desktop\Claude\Hotel Magnolia` smazána, zůstal jen tento
   soubor. Pro další práci: `git clone https://github.com/Zacileno/hotel-magnolia.git` + `npm ci`.

## 4. Jak byl obsah získán

- Živý web při stažení vrací na hlavních stránkách (ceník, kontakt, rezervace, EN/DE…) **podvržený cizí e-shop**
  (útočník). Čisté kopie proto z **Wayback Machine** (nejnovější čistá verze každé stránky, většinou 2026-04 až 2026-07).
- Kde je živá stránka čistá (úvodní, část EN/DE stránek, štítky, Ferdinand…), má přednost (je novější).
- Znovu vytvořit: viz README (`scripts/fetch-wayback.mjs`, `fetch-live.mjs`, `extract-content.mjs`, `fetch-assets.mjs`).
- `scripts/extract-content.mjs` – pravidla čištění:
  - odkazy jen na stránky hotelu a na **whitelist** cizích webů (Plazaro, Trustindex, Kayak, turistické cíle z článků…),
    vše ostatní se odstraní a vypíše,
  - přehledy článků (štítky, rubriky, autoři, měsíce) berou tělo z ověřeně čisté archivní kopie `/category/novinky/`
    a nechají jen 11 skutečných článků,
  - závěrečná kontrola slov (casino, bet, slot, bonus, cialis, … i v korejštině, japonštině, thajštině, arabštině,
    vietnamštině) – při nálezu skript **nic neuloží**.
- Kontrola nasazeného webu: žádné spamové slovo, cizí weby jen z whitelistu.

## 5. Rozhodnutí

- 2026-11-18: Stack Next.js 16 (App Router, TS strict), bez Tailwindu (měnil by základní styly), originální CSS šablony
  „simonet" + pluginů v `public/wp-content/` na stejných cestách → vzhled 1:1.
- Písma Open Sans + Spinnaker: místo Google Fonts self-hosted (`@fontsource`) – stejná písma, bez přenosu dat Googlu (GDPR).
- Adresy stránek identické s WP (koncové lomítko, `trailingSlash: true`).
- Rezervace: stejný widget **Plazaro** (`hotelId=knsru4`), skript vložený přímo za iframe (musí běžet před
  DOMContentLoaded, jinak se iframe nezvětší). Reference: stejný widget **Trustindex** (recenze Booking).
- Měření: GTM `GTM-WLVZG7V` (GA běží přes GTM).
- Formulář „Vaše dotazy" (původně Contact Form 7): stejné HTML a třídy, odeslání přes `/api/kontakt`,
  validace i na serveru, honeypot, limit 5 zpráv / 15 min / IP. Kontrolní příklad („jedna+dva" / „pět+pět") ověřuje server.
- Objednávka pobytu (stránky Ferdinanda): tlačítko „CHCI REZERVOVAT" rozbalí formulář, přepínač Soukromá osoba / Firma
  (jako simonet.js); odeslání přes `/api/objednavka` (originál posílal formulář na stejnou stránku do WP pluginu);
  chyby v rámečku `.error_item` šablony. Výběr termínu je na originále prázdný (bez balíčků s kalendářem) → stejně.
- Stránky **Hotelu Ferdinand** (wellness pobyty, galerie Hotel Ferdinand, `/pokoje/`, `/album/2017/`): původně
  navrženo nepřevádět (jiný hotel, nikde neodkazované), 2026-11-18 Lenka: převést 1:1 → převedeno. `/album/` přesměrovává
  na `/` jako originál.
- Odstraněné / nepřevzaté (spam):
  - skryté odkazy na kasina mezi hlavičkou a obsahem (na originále dělaly řádek navíc → nový web je o 20 px kratší),
  - skrytý text o Cialisu ve slideru úvodní stránky,
  - spamový popis pro sdílení úvodní stránky (og:description – „Casino…", „SEO Super Tool"); před napadením žádný nebyl,
  - zkušební článek útočníka `test123123`, spamové rubriky (Blog, Games, Nezařazené) a měsíční archivy 2025–2026,
  - meta keywords (šablona v nich měla „wellness hotel mariánské lázně"; vyhledávače je ignorují).
- Odkaz na `svatbyroudnice.cz` (stránka Svatby): doména už neexistuje → slovo „svatbu" zůstává, odkaz odstraněn.
- Rozbitý odkaz `/obchodni-podminky/` (EN/DE a pobytové stránky, nefungoval ani na originále) → přesměrování na `/vop/`.
- Patička „Platby a ocenění" s odznakem KAYAK podle aktuálního živého webu ve všech jazycích.
- `/category/novinky/page/2/` (není v archivu) poskládána ze stejné šablony s 11. článkem „Hotel opět v provozu".

## 5b. Úpravy nad rámec 1:1 (na pokyn Lenky)

- 2026-11-18 **Pevné mezery** („můžeš na tom webu opravit pevné mezery?"): `scripts/typography.mjs`
  (volá ho i `extract-content.mjs`) – jen viditelný text: CZ jednopísmenné předložky/spojky (v, k, s, z, o, u, a, i),
  zkratky (č., tel., s. r. o.); všechny jazyky: číslo + jednotka (max. 3 číslice, ne letopočty), částka + měna
  („6390 Kč"), mezery v číslech a telefonech, data (8. 4. 2021), mezera před pomlčkou.
  Ověřeno: kromě mezer se v HTML nic nezměnilo.
- 2026-11-18 **Optimalizace pro telefony** („Optimalizuj pro telefony") – `src/app/globals.css`, jen do 1025 px:
  přichycené menu má červený podklad (ikonka ☰ dřív visela bez pozadí přes obsah), mobilní menu ukazuje
  podpoložky Fotogalerie/Ceník a vlajky CZ/EN/DE (dřív jen po najetí myší → na mobilu nedostupné),
  formulářová pole 16 px (iPhone nepřibližuje), dlouhé adresy v textu se zalamují.
  Kontrola 32 stránek ve 390 px: nic nepřetéká do strany.
- 2026-11-23 **Rychlost / Core Web Vitals** („Web neprochází core web vitals“). PageSpeed (mobil, laboratorně):
  LCP 4,7 s, výkon 83. Pozn.: horní část PageSpeedu = data skutečných návštěvníků za 28 dní, do ~poloviny
  prosince v nich je ještě starý WordPress (TTFB 1,4 s; nový web ~0,3 s).
  - Úvodní foto slideru (LCP): `scripts/optimize-hero.mjs` vyrobí WebP verze 480–1920 px (soubory `*-NNNw.webp`
    vedle originálu, v gitu); `src/lib/hero.ts` doplní při vykreslení `srcset`/`sizes`, první fotce
    `fetchpriority="high"` + preload. Originální JPG zůstává jako `src`.
  - 13 původních CSS souborů spojeno do jednoho `scripts/bundle-css.mjs` (stejné soubory, stejné pořadí,
    obsah beze změny, jen relativní `url()` převedeny na absolutní) → `/css/site.<hash>.css`. Generuje se
    automaticky před `npm run dev` / `npm run build` (není v gitu).
  - Cache hlavičky v `next.config.ts`: `/css/` 1 rok immutable, `/wp-content/uploads/` 1 rok, šablona/pluginy 30 dní.
  - Ověřeno: 10 stránek × 1536 px a 390 px – poloha, velikost a styly všech prvků totožné s ostrou verzí.
  - Výsledek po nasazení: výkon 83 → 90, LCP 4,7 → 3,5 s.
  - 2. kolo (2026-11-23): `bundle-css.mjs` vynechá pravidla, která na webu nikdy nemůžou platit (vyžadují třídu,
    která se nevyskytuje v obsahu ani v kódu `src/`; pravidlo se odstraní jen celé, nikdy se neupravuje) →
    291 KiB → 66 KiB (gzip 50 → 14 KiB). `BUNDLE_CSS_FULL=1` vytvoří plnou verzi pro srovnání.
    Ověřeno: všech 104 stránek × 1536/390 px, všechny vypočtené styly (vč. ::before/::after) a polohy
    57 518 prvků totožné s plnou verzí; navíc otevřené mobilní menu, chyby formulářů, lightbox. Kontrolní
    test s úmyslnou změnou stylu rozdíl zachytil.
- 2026-11-23 **Mapa na kontaktech bez hodnocení** (Lenka: „V kontaktech je mapka google, kde jde vidět blbé
  hodnocení“, zvolila variantu „mapa podle adresy“): `src/lib/map.ts` při vykreslení nahradí původní mapu
  navázanou na firemní profil (Google v rohu ukazoval 3,9 ★) mapou podle adresy Karlovo náměstí 20 – stejné
  místo i velikost, v rohu jen adresa. Popisky mapy v jazyce stránky (CZ/EN/DE). Obsah v `src/content` beze změny.
  - 2026-11-24 oprava: menší WebP verze úvodní fotky mělo jen 56 ze 104 stránek (podmínka na třídu `msDefaultImage`), zbylých 48
    (Svatby, Ceník, Kontakt, EN/DE úvod…) stahovalo celý JPG. Opraveno v `src/lib/hero.ts` + pevný poměr stran (`aspect-ratio`).
    Porovnáno s ostrým webem: 48 stránek × 5 displejů, rozložení stejné (max. 0,1 px). Fotka na mobilu 254 → 68 KiB (DPR 2).
  - Zvažováno a NEprovedeno (změnilo by vzhled): optimalizace loga SVG (odlišné pixely), WebP pro ostatní
    fotky (jiná komprese). Pozn.: největší zbývající zátěž je měření (GTM, GA, Meta pixel ~ 550 KiB JS).

- 2026-11-23/24 **Redesign celého webu** (Lenka: „celý web, střídmě, elegantní hotelový styl“; 2026-11-24 „naprosto všechny změny na ostrý web“).
  - Vzhled: vše v `src/styles/polish.css` (připojí `bundle-css.mjs` na konec stylů), písma Cormorant Garamond + Manrope (`@fontsource`).
    Obsah v `src/content` zůstává původní, úpravy se dělají při vykreslení (`SitePage.tsx`).
  - Hlavička: poloprůhledná lišta, při posouvání skoro plná, rezervace jako tlačítko; podstránky mají vyšší fotku (`hero.ts`).
  - Nadpisy jednotně: 52/38, 36/28, 26/22 px (počítač/mobil). Krátké výčty = kartičky, galerie do 16 fotek = mozaika (`gallery.ts`).
  - Kontakt jedna karta, formuláře v kartě; EN/DE formuláře přeložené (`forms.ts`, vč. kontrolní otázky na serveru).
  - Texty změněné v obsahu: Restaurace bez „(aktuálně 2021)“ (CZ/EN/DE), pořadí fotek Konference (CZ), Ubytování → odkaz „konferenční sál“ na /konference/.
  - Plazaro: `theme=light` NEPOUŽÍVAT (načte se bez stylů), vnitřek formuláře nejde upravit.
  - Zbývá: patička a odkazy v EN/DE česky, chybný mailto v hlavičce, „Kapacita“ na Konferenci jako seznam.

- 2026-11-24 Reference na úvodu vedle sebe (bez slideru), Fotogalerie jako mozaika (všech 35 fotek, `scripts/optimize-gallery.mjs`).
  Formuláře mají jediný nadpis „Kontaktujte nás“ / „Contact us“ / „Kontaktieren Sie uns“ v kartě (`forms.ts` → `unifyFormTitles`).
  Kontrola telefonu: 104 stránek × 320–1024 px, opravy na konci `polish.css` (hlavička na tabletech, kartičky, Novinky, objednávka).
  Prohozené odkazy u souhlasů v objednávce pobytů opraveny; souhlas s podmínkami je stále předem zaškrtnutý.
- 2026-11-24 **Články** (11 stránek typu `single-post`): fotka vlevo, nadpis + datum + text vpravo (`src/lib/articles.ts`), větší fotky
  `*-article.webp` (`scripts/optimize-articles.mjs` → `src/lib/article-photos.json`).
- 2026-11-24 **Reference** (CZ/EN/DE): vlastní posuvník s korálovými šipkami místo Trustindexu (opakoval recenze, jeho skript a styly se už
  nenačítají), recenze v `src/lib/reviews.ts`: 4 z Bookingu 2026 (screenshoty od Lenky, jen část „co se líbilo“, Renata zkrácená), 2 z úvodu,
  po jedné původní s 10/9/8. Nepoužívat 9,3 jako známku hosta (je to lokalita hotelu).

## 6. Log práce

- 2026-11-18: Analýza originálu, zjištěn hack (cloaking, spam). Stažení čistých kopií (Wayback + živé), extrakce
  a čištění obsahu, stažení obrázků/CSS (ověřeny), stavba webu, porovnání s originálem. Vercel projekt + nasazení.
  Pevné mezery, mobilní úpravy. Převod stránek Ferdinanda + objednávkový formulář. Kompletní porovnání 103 stránek.
- Tip: Chrome má pro „localhost" uložené oddálení 33 % → lokální web otevírat přes http://127.0.0.1:3000.

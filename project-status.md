# Hotel Magnolia – stav projektu

> Dokumentace a paměť projektu. **Aktualizovat po každém větším bloku práce.**
> Při novém kontextovém okně: přečti nejdřív sekce „Aktuální stav" a „Další krok".

## 1. Zadání (Lenka, 2026-11-18)

- Převést stávající web https://hotelmagnolia.cz/ **1:1** na Vercel (Next.js). Web je napadený, proto vznikne nový čistý.
- Absolutně **žádný spam** nesmí být zkopírován.
- **Bez administrace** (CMS neřešit).
- **Všechny jazyky** (CZ, EN, DE), **všechny aktuality**, „úplně vše naprosto identické".
- Rezervace musí fungovat naprosto stejně.
- Převzít měření (GTM / GA).
- Vercel založit stejně jako u ostatních projektů (účet Zacíleno), repo https://github.com/Zacileno/hotel-magnolia.
- Vše průběžně pushovat na GitHub; nezabírat místo na Lenčině počítači (vše potřebné musí být v repozitáři).

## 2. Aktuální stav

- Web postavený: 78 stránek (53 CZ, 13 EN, 12 DE) + API formuláře. Build OK, lint + typecheck OK.
- **Porovnání s originálem (2026-11-18)** – měřením polohy a velikosti všech prvků obsahu a patičky (šířka 1536 px)
  proti čistým kopiím originálu:
  - 23 stránek totožných na pixel, 21 totožných až po patičku (rozdíl = aktuální blok „Platby a ocenění" s KAYAK),
  - úvodní stránka o 20 px kratší = odstraněný řádek skrytých spamových odkazů pod hlavičkou,
  - Reference: widget Trustindex si po načtení sám nastaví počet sloupců (na živém webu stejně),
  - přehledy článků: skrytý nadpis „Navigace pro příspěvky" je skrytý (styl block-library, jako na současném webu),
  - DE stránky: odchylky < 1 px (zaokrouhlení metrik písma).
  - Pomůcka: srovnávací server (archiv vs. nový web v iframech) – není v repu, viz log 2026-11-18.
- **Čeká se** na: Vercel projekt, nastavení odesílání formuláře (Resend), rozhodnutí o stránkách Hotelu Ferdinand.

## 3. Další krok

1. ~~Porovnání všech stránek s originálem~~ ✅
2. Založit projekt na Vercelu (účet Zacíleno), napojit na GitHub.
3. Formulář: Lenka dodá / schválí příjemce (předpoklad `recepce@hotelmagnolia.cz`) a odesílací doménu v Resendu.
4. Přepnutí domény hotelmagnolia.cz na Vercel – až po schválení Lenkou.

## 4. Jak byl obsah získán

- Živý web při stažení vrací na hlavních stránkách (ceník, kontakt, rezervace, EN/DE…) **podvržený cizí e-shop**
  (útočník). Čisté kopie proto z **Wayback Machine** (nejnovější čistá verze každé stránky, většinou 2026-04 až 2026-07).
- Kde je živá stránka čistá (úvodní, část EN/DE stránek, štítky…), má přednost (je novější).
- `scripts/extract-content.mjs` – pravidla čištění:
  - odkazy jen na stránky hotelu a na **whitelist** cizích webů (Plazaro, Trustindex, Kayak, turistické cíle z článků…),
    vše ostatní se odstraní a vypíše,
  - přehledy článků (štítky, rubriky, autoři, měsíce) berou tělo z ověřeně čisté archivní kopie `/category/novinky/`
    a nechají jen 11 skutečných článků,
  - závěrečná kontrola slov (casino, bet, slot, bonus, cialis, … i v korejštině, japonštině, thajštině, arabštině,
    vietnamštině) – při nálezu skript **nic neuloží**.

## 5. Rozhodnutí

- 2026-11-18: Stack Next.js 16 (App Router, TS strict), bez Tailwindu (měnil by základní styly), originální CSS šablony
  „simonet" + pluginů v `public/wp-content/` na stejných cestách → vzhled 1:1.
- Písma Open Sans + Spinnaker: místo Google Fonts self-hosted (`@fontsource`) – stejná písma, bez přenosu dat Googlu (GDPR).
- Adresy stránek identické s WP (koncové lomítko, `trailingSlash: true`).
- Rezervace: stejný widget **Plazaro** (`hotelId=knsru4`), reference: stejný widget **Trustindex** (recenze Booking).
- Měření: GTM `GTM-WLVZG7V` (GA běží přes GTM).
- Formulář „Vaše dotazy" (původně Contact Form 7): stejné HTML a třídy, odeslání přes `/api/kontakt` (Resend),
  validace i na serveru, honeypot, limit 5 zpráv / 15 min / IP. Kontrolní příklad („jedna+dva" / „pět+pět") ověřuje server.
- Odstraněné / nepřevzaté (spam nebo cizí obsah):
  - skryté odkazy na kasina mezi hlavičkou a obsahem (na originále dělaly řádek navíc → nový web je o 20 px kratší),
  - skrytý text o Cialisu ve slideru úvodní stránky,
  - spamový popis pro sdílení úvodní stránky (og:description – „Casino…", „SEO Super Tool"); před napadením žádný nebyl,
  - zkušební článek útočníka `test123123`, spamové rubriky (Blog, Games, Nezařazené) a měsíční archivy 2025–2026,
  - meta keywords (šablona v nich měla „wellness hotel mariánské lázně" – jiný hotel),
  - ~24 stránek wellness pobytů + galerie „Hotel Ferdinand" + `/pokoje/`, `/album/` = pozůstatky **Hotelu Ferdinand
    (Mariánské Lázně)**, nikde neodkazované → přesměrovány na `/` (návrh Lence, čeká na potvrzení).
- Odkaz na `svatbyroudnice.cz` (stránka Svatby): doména už neexistuje → slovo „svatbu" zůstává, odkaz odstraněn.
- Rozbitý odkaz `/obchodni-podminky/` (EN/DE stránky, nefungoval ani na originále) → přesměrování na `/vop/`.
- Patička „Platby a ocenění" s odznakem KAYAK podle aktuálního živého webu ve všech jazycích (archivní kopie ho ještě neměly).
- `/category/novinky/page/2/` (není v archivu) poskládána ze stejné šablony s 11. článkem „Hotel opět v provozu".

## 6. Log práce

- 2026-11-18: Analýza originálu, zjištěn hack (cloaking, spam). Stažení čistých kopií (Wayback + živé), extrakce
  a čištění obsahu, stažení obrázků/CSS (249 souborů, ověřeny), stavba webu, porovnání úvodní stránky. Push na GitHub.

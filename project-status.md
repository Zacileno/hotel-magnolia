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

- Web běží na **https://hotel-magnolia.vercel.app** (Vercel projekt `hotel-magnolia`, tým „pristupy-2441's projects",
  auto-deploy z GitHubu `Zacileno/hotel-magnolia`, větev `main`). Doména hotelmagnolia.cz **zatím nepřepnuta**.
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
  Zkušební zpráva **neposlána** – na přání Lenky („neposílej zkušební zprávu"); první ověření = první skutečný dotaz
  (případně Lenka pošle po přepnutí domény jeden dotaz sama).
- **Zbývá jen přepnutí domény** hotelmagnolia.cz na Vercel – dělá Lenka (postup v bodě 3.2).

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
2. **Přepnutí domény** hotelmagnolia.cz na Vercel – **dělá Lenka** („nech jen to samotné nasazení na doménu").
   1. Vercel → projekt `hotel-magnolia` → Settings → **Domains** → Add `hotelmagnolia.cz` (Vercel nabídne i `www`
      s přesměrováním – zvolit hlavní `hotelmagnolia.cz`, `www` → přesměrovat na ni).
   2. Vercel ukáže, jaké záznamy nastavit (obvykle **A** pro `hotelmagnolia.cz` a **CNAME** pro `www`) – použít
      **přesně hodnoty z Vercelu**.
   3. Active24 (admin.active24.cz → hotelmagnolia.cz → DNS → DNS nastavení):
      - `hotelmagnolia.cz` **A** `37.9.175.164` → změnit na hodnotu z Vercelu,
      - `hotelmagnolia.cz` **AAAA** `2a00:4b40:aaaa:2005::7` → **smazat** (jinak by část návštěvníků přes IPv6
        dál chodila na starý napadený web),
      - `www.hotelmagnolia.cz` **A** a **AAAA** → smazat a místo nich **CNAME** dle Vercelu,
      - Active24 má u domény zapnuté „Active24 Web" (automaticky spravuje A/AAAA/CNAME) – může být potřeba ho vypnout,
        aby záznamy nepřepsal zpět.
      - **Neměnit**: MX, `mailin1/mailin2`, SPF a všechny TXT (DKIM Active24, Ecomail, Resend), `send`/`rsend`
        CNAME, `_dmarc` – na nich závisí pošta, newslettery a formuláře.
   4. Počkat (minuty až hodiny), ve Vercelu u domény „Valid Configuration" + certifikát HTTPS.
   5. Po přepnutí: odeslat jeden dotaz z formuláře (ověření doručení na recepci), Search Console (sitemapa),
      kontrola GTM. Starý napadený WordPress na hostingu Active24 zvážit vypnout/smazat (už nebude potřeba).
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

## 6. Log práce

- 2026-11-18: Analýza originálu, zjištěn hack (cloaking, spam). Stažení čistých kopií (Wayback + živé), extrakce
  a čištění obsahu, stažení obrázků/CSS (ověřeny), stavba webu, porovnání s originálem. Vercel projekt + nasazení.
  Pevné mezery, mobilní úpravy. Převod stránek Ferdinanda + objednávkový formulář. Kompletní porovnání 103 stránek.
- Tip: Chrome má pro „localhost" uložené oddálení 33 % → lokální web otevírat přes http://127.0.0.1:3000.

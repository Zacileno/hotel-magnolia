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
- **Formulář** („Vaše dotazy" i objednávka pobytu Ferdinanda): kontrola polí funguje (v prohlížeči i na serveru),
  **odesílání e-mailů zatím není nastavené** – Lenka: „Formulář vyřešíme ještě".

## 3. Další krok

1. **Odesílání formulářů** – rozhodnout způsob (návrh: poštovní schránka hotelu u Websupportu přes SMTP, nebo vlastní
   Resend účet hotelu s ověřením domény v DNS u Websupportu). Kód: vše v `src/lib/mail.ts` (teď napsáno pro Resend,
   při volbě SMTP se mění jen tento soubor + proměnné prostředí). Příjemce: předpoklad `recepce@hotelmagnolia.cz`.
   Přístupové údaje zadává do Vercelu Lenka (ne Claude).
2. **Přepnutí domény** hotelmagnolia.cz na Vercel – až po schválení Lenkou. DNS domény je u **Websupportu**
   (NS `ns1/ns2.websupport.cz`, `ns3.websupport.eu`); pošta hotelu tamtéž (MX `mailin1/2.hotelmagnolia.cz`,
   SPF `spf.active24.com` + `_spf.m1.websupport.sk`) – při přepnutí měnit jen záznamy webu (A/CNAME), **ne MX/SPF**.
3. Po přepnutí: Search Console (sitemapa), kontrola GTM.
4. Konec projektu: smazat lokální složku `Desktop\Claude\Hotel Magnolia` kromě tohoto souboru.

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

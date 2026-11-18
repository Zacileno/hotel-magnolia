# Zálohy

## `dns-hotelmagnolia.cz-2026-11-18-before-switch.zone`

Export DNS zóny domény **hotelmagnolia.cz** z administrace Active24 (DNS → Export BIND souboru), pořízený
**2026-11-18 těsně před přepnutím domény** ze starého WordPressu na nový web (Vercel).
Obsah ověřen kontrolním součtem proti exportu v administraci.

V tomto stavu doména ukazuje web na starý hosting Active24 (`37.9.175.164` / `2a00:4b40:aaaa:2005::7`)
a obsahuje už záznamy pro Resend (formuláře nového webu).

### Návrat do původního stavu (kdyby bylo potřeba)

Active24 → hotelmagnolia.cz → DNS → **Import BIND souboru** → vložit obsah tohoto souboru.
Nebo ručně vrátit jen záznamy webu:

| Název | Typ | Hodnota |
|---|---|---|
| `hotelmagnolia.cz` | A | `37.9.175.164` |
| `hotelmagnolia.cz` | AAAA | `2a00:4b40:aaaa:2005::7` |
| `www.hotelmagnolia.cz` | A | `37.9.175.164` |
| `www.hotelmagnolia.cz` | AAAA | `2a00:4b40:aaaa:2005::7` |

(a smazat záznamy přidané pro Vercel).

## Starý WordPress

Přepnutím domény se starý web **nesmaže** – zůstává na hostingu Active24 (služba `hotelmagnolia_cz`).
Jeho soubory a databáze se do repozitáře záměrně neukládají: web je napadený a obsahuje kód útočníka.
Vyčištěný obsah všech stránek je v `src/content/`, skripty pro opětovné stažení z archivu v `scripts/`.

## `dns-hotelmagnolia.cz-2026-11-18-after-switch.zone`

Stav DNS **po přepnutí** domény na Vercel (2026-11-18), ověřeno kontrolním součtem proti exportu z Active24:
`hotelmagnolia.cz` A `216.150.1.1` + `216.150.16.1`, `www` CNAME `61ff461723cc4600.vercel-dns-016.com`,
odstraněny AAAA/A starého hostingu pro `hotelmagnolia.cz` a `www`. Ostatní záznamy beze změny.

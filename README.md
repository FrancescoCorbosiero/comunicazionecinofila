# Comunicazione Cinofila — sito di Andrea Bellettati

Sito vetrina/lead-gen di **Andrea Bellettati**, consulente in comportamento e
nutrizione per cani e gatti (partner Reico Italia). Costruito con **Astro**
(TypeScript), static-first, mobile-first.

> Il design system e le specifiche complete sono in
> [`design_handoff_sito_andrea/`](./design_handoff_sito_andrea) (handoff +
> prototipi di riferimento). `brand.css` è riusato invariato come design system.

## Comandi

> **Richiede Node ≥ 22.12** (Astro 6). Con `nvm`: `nvm install 22 && nvm use 22`
> (il repo include `.nvmrc`). Verifica con `node -v`.

```bash
npm install        # installa le dipendenze
npm run dev        # sviluppo su http://localhost:4321
npm run build      # build statica in dist/
npm run preview    # anteprima della build
npm run check      # type-check (astro check)
```

## Struttura

```
src/
  config.ts              # ⭐ contatti reali + CAL_LINK (sorgente unica)
  lib/seo.ts             # default SEO + JSON-LD (Person/LocalBusiness/breadcrumb)
  lib/dates.ts           # formattazione date (fuso Europe/Rome)
  layouts/Base.astro     # <head>: meta/OG/Twitter, JSON-LD, ClientRouter, speculation rules
  components/            # Header, Footer, CallModal, CoverImage, card/row, icone
  scripts/site.ts        # nav, reveal, step-form→WhatsApp, modale call, parallax
  scripts/catalog.ts     # filtro/ordinamento/ricerca del catalogo
  pages/                 # index, approccio, servizi, catalogo, eventi, articoli, contatti, 404
    articoli/[slug].astro  eventi/[slug].astro   # dettagli da Content Collection
  content/articoli/*.md  content/eventi/*.md      # contenuti (Markdown)
  data/catalogo.json     # prodotti del catalogo (editabili in un solo file)
  content.config.ts      # schema delle Content Collections
  styles/                # brand.css (invariato), site.css (base), content/catalog/effects.css
  assets/                # foto ottimizzate da astro:assets (webp responsive)
public/assets/           # favicon + immagini per OG e cover delle collection
```

## Aggiungere un articolo

Crea `src/content/articoli/mio-articolo.md` (il nome file = slug):

```md
---
title: "Titolo dell'articolo"
date: 2026-06-01
category: "Alimentazione"
excerpt: "Riassunto breve mostrato nelle card."
cover: "/assets/feed-etichette.jpg"   # opzionale (senza, mostra un placeholder)
coverAlt: "Descrizione immagine"        # opzionale
featured: false                          # true = in evidenza in cima all'indice
status: "published"                      # oppure "coming-soon" (card “Presto disponibile”)
# externalUrl: "https://instagram.com/..."  # se presente, linka qui invece del dettaglio
---

Corpo dell'articolo in **Markdown**.
```

## Aggiungere un evento

Crea `src/content/eventi/mio-evento.md`:

```md
---
title: "Nome evento"
excerpt: "Descrizione mostrata in lista e in pagina."
subtitle: "Riga in grassetto sotto al titolo"   # opzionale
date: 2026-09-20T21:00:00+02:00                  # oppure usa whenLabel
whenLabel: "Su richiesta"                          # alternativa alla data
cover: "/assets/feed-etichette.jpg"
featured: false
status: "upcoming"   # upcoming | on-request | coming-soon | past
statusLabel: "Prossimo · posti limitati"
free: true
duration: "~60 min"
locationLabel: "Online · Webinar Live"
collab: "Team Branco · con Virginia Dallara"
tags: ["Carne fresca", "Grain free"]
reserveWaText: 'Ciao Andrea! Vorrei riservare il mio posto a "Nome evento".'
# externalUrl / internalUrl: per le righe d'agenda che rimandano altrove
---

Programma dell'evento in Markdown.
```

## Aggiungere un prodotto al catalogo

Modifica `src/data/catalogo.json` (un array): ogni prodotto ha un `id` univoco.

```json
{
  "id": "umido-cane-manzo-verdure",
  "name": "Umido Cane · Manzo & Verdure",
  "animal": "cane",                 // cane | gatto
  "type": "umido",                  // umido | secco | snack | integratore
  "lifeStage": "adulto",            // cucciolo | adulto | senior | tutti
  "line": "Carne fresca",
  "description": "Pasto completo…",
  "features": ["Carne fresca", "Grain free"],
  "image": "/assets/foto.jpg",      // opzionale (senza → placeholder)
  "badge": "Best seller"             // opzionale
}
```

I filtri (animale, tipo, età, caratteristiche) si generano da soli dai dati.
Nessun prezzo: ogni card invita a **richiedere un preventivo** via WhatsApp.

## Performance & SEO (già attive)

- **View Transitions** tra le pagine (Astro `ClientRouter`) + **prefetch** dei link
  interni e **Speculation Rules** per navigazione più rapida.
- **Immagini ottimizzate** con `astro:assets` (webp responsive) per le foto pesanti.
- **Parallax** accessibile su hero e cover (off con `prefers-reduced-motion`).
- **JSON-LD** Person/LocalBusiness ovunque, Article/Event/ItemList/Breadcrumb dove
  pertinente; `sitemap.xml`, `robots.txt`, header di cache (`netlify.toml`, `_headers`).
- Verifica Search Console e handle social: compila i campi in `src/lib/seo.ts`.

## Integrazione cal.com ("Prenota una call")

Oggi i pulsanti **Prenota una call** aprono un modale-placeholder con selezione
slot che conferma via WhatsApp. Per attivare cal.com:

1. Imposta `CAL_LINK` in [`src/config.ts`](./src/config.ts)
   (es. `'andrea-bellettati/call-conoscitiva'`).
2. In `src/components/CallModal.astro` sostituisci il corpo `.booking-cal` con
   l'embed ufficiale (`@calcom/embed-react` `<Cal calLink={CAL_LINK} />`).

I trigger `[data-open-call]` sono già presenti su Home, Servizi e Contatti.

## Contatti

Tutti cablati da [`src/config.ts`](./src/config.ts): WhatsApp +39 347 678 0938,
andrebellettati@gmail.com, Instagram @comunicazionecinofila.

## Deploy

Build statica: funziona su **Netlify / Vercel / Cloudflare Pages** senza
configurazione (build `npm run build`, output `dist/`).

**Prima del deploy:** imposta il dominio reale in
[`astro.config.mjs`](./astro.config.mjs) (`site`), in `src/config.ts` (`SITE`) e
in [`public/robots.txt`](./public/robots.txt) — serve a sitemap, canonical e OG.

## Da completare

- **Dominio** definitivo (placeholder attuale: `www.comunicazionecinofila.it`).
- **Foto reali** al posto dei `.placeholder` (team/formazione, ciotola, gatto) e foto prodotto del catalogo.
- **Testi articoli** on-site (le bozze sono marcate nel Markdown).
- **Prodotti catalogo**: i dati in `src/data/catalogo.json` sono esempi indicativi, da allineare alla gamma Reico reale.
- **Link cal.com** (`CAL_LINK` in `src/config.ts`) + immagine OG dedicata 1200×630.

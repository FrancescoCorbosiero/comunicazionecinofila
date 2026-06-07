# Comunicazione Cinofila — sito di Andrea Bellettati

Sito vetrina/lead-gen di **Andrea Bellettati**, consulente in comportamento e
nutrizione per cani e gatti (partner Reico Italia). Costruito con **Astro**
(TypeScript), static-first, mobile-first.

> Il design system e le specifiche complete sono in
> [`design_handoff_sito_andrea/`](./design_handoff_sito_andrea) (handoff +
> prototipi di riferimento). `brand.css` è riusato invariato come design system.

## Comandi

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
  layouts/Base.astro     # <head>: meta, OG/Twitter, JSON-LD, font, canonical
  components/            # Header, Footer, CallModal, card/row, icone
  scripts/site.ts        # nav mobile, reveal, step-form→WhatsApp, modale call…
  pages/                 # index, approccio, servizi, eventi, articoli, contatti
    articoli/[slug].astro  eventi/[slug].astro   # dettagli da Content Collection
  content/articoli/*.md  content/eventi/*.md      # contenuti (Markdown)
  content.config.ts      # schema delle Content Collections
  styles/                # brand.css (invariato), site.css (base), content.css
public/assets/           # immagini + favicon (ritratto)
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
- **Foto reali** al posto dei `.placeholder` (team/formazione, ciotola, gatto).
- **Testi articoli** on-site (le bozze sono marcate nel Markdown).
- Eventuale ottimizzazione immagini (es. `andrea-1.jpg` è pesante).

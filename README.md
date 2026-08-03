# Comunicazione Cinofila — sito di Andrea Bellettati

Sito vetrina/lead-gen di **Andrea Bellettati**, consulente in comportamento e
nutrizione per cani e gatti. Due pubblici, un'unica identità: i proprietari
(imbuto "Consulenza gratuita") e i futuri collaboratori del Team
**TeamNutrizione** (imbuto "Lavora con noi"). Costruito con **Astro**
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
npm run assets     # rigenera favicon + comprime le foto di public/assets
```

## Struttura

```
src/
  config.ts              # ⭐ contatti reali + CAL_LINK (sorgente unica)
  lib/seo.ts             # default SEO + JSON-LD (Person/LocalBusiness/breadcrumb)
  lib/dates.ts           # formattazione date (fuso Europe/Rome)
  layouts/Base.astro     # <head>: meta/OG/Twitter, JSON-LD, ClientRouter, speculation rules
  components/            # Header, Footer, CallModal, CoverImage, card/row, icone
  scripts/site.ts        # nav, reveal, step-form→WhatsApp, form→Netlify, ricerca blog, modale, parallax
  scripts/catalog.ts     # filtro/ordinamento/ricerca del catalogo (archiviato)
  pages/                 # index, approccio, chi-sono, consulenza-gratuita, lavora-con-noi,
                         # servizi, eventi, articoli (Blog), 404
    articoli/[slug].astro  eventi/[slug].astro   # dettagli da Content Collection
  content/articoli/*.md  content/eventi/*.md      # contenuti (Markdown)
  data/catalogo.json     # prodotti del catalogo (editabili in un solo file)
  _archive/catalogo.astro # pagina Catalogo archiviata: fuori dal build, riattivabile
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

> **Nota:** la pagina Catalogo è **archiviata** (non buildata). Per riattivarla,
> riporta `src/_archive/catalogo.astro` in `src/pages/` e ripristina le voci di
> navigazione in header/footer. Dati, script e stili sono rimasti intatti.

## Form: invio configurabile (Netlify Forms oggi, AWS SES quando vuoi)

Entrambi i questionari passano da **un solo punto di uscita**
(`submitForm()` in `src/scripts/site.ts`), con endpoint configurabile via
`FORM_ENDPOINT` in `src/config.ts`:

- **`/lavora-con-noi`** (`candidatura-team`): invio reale via fetch, stato
  "Invio in corso…", conferma inline. Se la rete fallisce compare un fallback
  con **email precompilata** — la candidatura non si perde mai.
- **`/consulenza-gratuita`** (`consulenza-gratuita`): il flusso resta
  **WhatsApp-first** (il pulsante apre WhatsApp col messaggio pronto, come
  sempre), ma ogni questionario completato viene **anche salvato in
  background**. Se la persona chiude WhatsApp senza premere invio, il
  contatto non va perso.

**Oggi (default, `FORM_ENDPOINT = ''`)** → [Netlify Forms](https://docs.netlify.com/manage/forms/setup/):
zero backend, al primo deploy Netlify registra i form da solo (attributo
`data-netlify` nell'HTML statico) e in **Site → Forms** si attivano le
notifiche email. Anti-spam: honeypot `bot-field` già configurato.

**Domani (AWS SES)** → scrivi una function che riceve il POST
`application/x-www-form-urlencoded` e inoltra via SES (`SendEmail`), poi
metti il suo URL in `FORM_ENDPOINT` (es. `/.netlify/functions/invia-form` o
un endpoint API Gateway). Il payload include `form-name`
(`candidatura-team` / `consulenza-gratuita`) per distinguere i due form e
il campo honeypot `bot-field` da scartare se valorizzato. Il client non
cambia; a quel punto puoi rimuovere gli attributi `data-netlify` dai form.

In `astro dev`/`preview` l'endpoint non esiste: il form di candidatura
mostra il fallback, ed è il comportamento atteso.

## Performance & SEO (già attive)

- **Font self-hosted** (Fonts API di Astro, provider locale): i `.woff2` subset
  latin vivono in `src/assets/fonts/` e vengono serviti da `/_astro` con cache
  immutabile. Zero richieste a Google Fonts dal browser (privacy/GDPR), build
  deterministica, fallback con metriche adattate contro il layout shift.
  Preload solo dei font above-the-fold (Anton + Inter 400).
- **View Transitions** tra le pagine (Astro `ClientRouter`) + **prefetch** dei link
  interni e **Speculation Rules** per navigazione più rapida. Le cover degli
  articoli fanno **morph** dalla card alla pagina di dettaglio.
- **Immagini ottimizzate** con `astro:assets` (webp responsive) per le foto pesanti;
  le foto di `public/assets` (OG e cover) restano sotto ~350 kB via `npm run assets`
  — sopra quella soglia WhatsApp può scartare l'anteprima del link.
- **Ricerca live nel blog** + filtri per categoria sincronizzati nell'URL
  (`/articoli?cat=…&q=…`): i filtri sono condivisibili.
- **Favicon reali** (ICO+PNG+apple-touch) e `site.webmanifest`, generati da
  `scripts/optimize-assets.mjs`.
- **Stampa**: le pagine articolo hanno uno stile print dedicato (via il guscio
  interattivo, testo nero su bianco, URL dei link esterni in chiaro).
- **Parallax** accessibile su hero e cover (off con `prefers-reduced-motion`).
- **JSON-LD** WebSite/Person/LocalBusiness ovunque, Article (con wordCount e
  tempo di lettura)/Event/ItemList/Breadcrumb dove pertinente; `sitemap.xml`,
  `robots.txt`, header di cache (`netlify.toml`, `_headers`).
- Verifica Search Console e handle social: compila i campi in `src/lib/seo.ts`.

## Integrazione cal.com ("Richiedi la tua consulenza gratuita")

Oggi i pulsanti **Richiedi la tua consulenza gratuita** aprono un
modale-placeholder con selezione slot che conferma via WhatsApp. Per attivare
cal.com:

1. Imposta `CAL_LINK` in [`src/config.ts`](./src/config.ts)
   (es. `'andrea-bellettati/call-conoscitiva'`).
2. In `src/components/CallModal.astro` sostituisci il corpo `.booking-cal` con
   l'embed ufficiale (`@calcom/embed-react` `<Cal calLink={CAL_LINK} />`).

I trigger `[data-open-call]` sono già presenti su Home, Servizi e
Consulenza gratuita.

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

- **Dominio** definitivo (placeholder attuale: `www.andreabellettati.it` — vedi i TODO in `src/config.ts`, `astro.config.mjs`, `public/robots.txt`).
- **Foto reali**: i nomi da usare sono già decisi e auto-rilevati — vedi
  [`public/assets/README.md`](./public/assets/README.md) (cover articoli/eventi,
  foto team/formazione, `og-home.jpg` 1200×630). Basta caricare il file.
- **Testi articoli/blog** on-site (12 stub `coming-soon` + bozze marcate nel Markdown).
- **Form**: dopo il primo deploy, attivare le notifiche email in Site → Forms
  (i form si registrano da soli). Quando arriva **AWS SES**: function che
  inoltra via email + URL in `FORM_ENDPOINT` (`src/config.ts`).
- **Sezioni future in `/servizi`** (solo TODO nel codice): dieta casalinga/BARF con referral alla biologa Stefania Bartoloni; servizi in affiliazione.
- **Link cal.com** (`CAL_LINK` in `src/config.ts`) + immagine OG dedicata 1200×630.
- **Catalogo archiviato**: se tornerà, aggiornare i dati in `src/data/catalogo.json` alla gamma reale.

# Comunicazione Cinofila — sito di Andrea Bellettati

Sito vetrina/lead-gen di **Andrea Bellettati**, consulente in comportamento e
nutrizione per cani e gatti. Due pubblici, un'unica identità: i proprietari
(imbuto "Consulenza gratuita") e i futuri collaboratori del Team
**TeamNutrizione** (imbuto "Lavora con noi"). Costruito con **Astro**
(TypeScript), static-first, mobile-first.

> Il design di partenza è in [`design_handoff_sito_andrea/`](./design_handoff_sito_andrea)
> (handoff + prototipi di riferimento). Da lì il sito è passato al **Brand
> System v3 "Branco"** (`src/styles/brand.css`): stessi colori del logo e del
> feed, ma via il crema caldo, le micro-etichette in monospace e i titoli
> poster tutti maiuscoli — al loro posto Bricolage Grotesque in minuscolo,
> sticker, bordi d'inchiostro, ombre piene e le foto vere dei cani scontornate.

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
python scripts/make-stickers.py   # rigenera gli sticker fustellati (vedi sotto)
```

## Struttura

```
src/
  config.ts              # ⭐ contatti reali, numeri (STATS), CAL_LINK, endpoint dei form
  lib/seo.ts             # default SEO + JSON-LD (Person/LocalBusiness/breadcrumb)
  lib/dates.ts           # formattazione date (fuso Europe/Rome)
  layouts/Base.astro     # <head>: meta/OG/Twitter, JSON-LD, ClientRouter, speculation rules
  components/            # Header, Footer, CallModal, CoverImage, Sticker, Ticker, card/row, icone
  scripts/site.ts        # nav, step-form→WhatsApp, form→/api/form (SES), ricerca blog, modale
  scripts/motion.ts      # ⭐ animazioni GSAP + Lenis (API ad attributi: vedi l'intestazione del file)
  scripts/catalog.ts     # filtro/ordinamento/ricerca del catalogo (archiviato)
  pages/                 # index, approccio, chi-sono, consulenza-gratuita, lavora-con-noi,
                         # servizi, eventi, articoli (Blog), 404
    articoli/[slug].astro  eventi/[slug].astro   # dettagli da Content Collection
  content/articoli/*.md  content/eventi/*.md      # contenuti (Markdown)
  data/catalogo.json     # prodotti del catalogo (editabili in un solo file)
  _archive/catalogo.astro # pagina Catalogo archiviata: fuori dal build, riattivabile
  _archive/home-v3.*      # la home precedente (hero con zoom, indice, biglietto…): blocchi da riusare
  content.config.ts      # schema delle Content Collections
  styles/                # brand.css (design system v3), site.css (base), content/catalog/effects.css,
                         # motion.css (intro above-the-fold + stati degli effetti),
                         # sections.css (le sezioni delle landing: hero, stories, stack…)
  assets/stickers/       # foto scontornate col bordo bianco (scripts/make-stickers.py)
  assets/                # foto ottimizzate da astro:assets (webp responsive)
public/assets/           # favicon + immagini per OG e cover delle collection
server/                  # server Docker: sito statico + /api/form → AWS SES
netlify/functions/       # la stessa logica SES come Netlify Function
Dockerfile, docker-compose.yml, .env.example   # deploy con Caddy (label)
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

## Form: WhatsApp + email via AWS SES

Entrambi i questionari passano da **un solo punto di uscita**
(`submitForm()` in `src/scripts/site.ts`); la destinazione si decide **al
build** con la variabile `PUBLIC_FORM_ENDPOINT` (vedi `src/config.ts`):

| `PUBLIC_FORM_ENDPOINT` | Dove finiscono i dati |
|---|---|
| `/api/form` (default nell'immagine Docker) | server Node del container → **email via AWS SES** |
| `/.netlify/functions/invia-form` | Netlify Function → **email via AWS SES** |
| vuota | Netlify Forms (dashboard Netlify) |

**WhatsApp resta com'è.** Il questionario della consulenza apre WhatsApp con
il messaggio già pronto *e* in background manda la copia via email: se la
persona chiude WhatsApp senza inviare, il contatto arriva comunque. La
candidatura "Lavora con noi" arriva via email (Reply-To = l'email del
candidato); se l'invio fallisce compare l'email precompilata come piano B.
Ogni email ad Andrea contiene il bottone **"Rispondi su WhatsApp"** con il
numero di chi ha scritto.

La logica sta tutta in `server/form-handler.mjs` (validazione, honeypot
`bot-field`, email testo + HTML, invio con `@aws-sdk/client-sesv2`), usata sia
da `server/index.mjs` (Docker) sia da `netlify/functions/invia-form.mjs`.

### Configurare AWS SES (una volta)

1. **SES → Identities → Create identity → Domain**: verifica
   `andreabellettati.it` aggiungendo i record DKIM al DNS. Aggiungi anche
   SPF (`v=spf1 include:amazonses.com ~all`) e un record DMARC.
2. **Esci dalla sandbox** (SES → Account dashboard → Request production
   access): in sandbox puoi scrivere solo a indirizzi verificati.
3. **IAM → utente dedicato** con questa sola policy, e crea le sue chiavi:
   ```json
   { "Version": "2012-10-17", "Statement": [{ "Effect": "Allow",
     "Action": "ses:SendEmail", "Resource": "*" }] }
   ```
4. Copia `.env.example` in `.env` e compila `AWS_REGION`, le chiavi,
   `SES_FROM` (un indirizzo del dominio verificato) e `SES_TO`.
   Con `SES_DRY_RUN=true` le email vengono solo stampate nei log.

Le chiavi stanno **solo** nel `.env` del server (o nelle variabili di
Netlify): mai nel repo. Senza configurazione l'endpoint risponde 503 e i
form mostrano i loro fallback (WhatsApp / email precompilata).

## Deploy con Docker + Caddy

L'immagine (`Dockerfile`) builda il sito con `PUBLIC_FORM_ENDPOINT=/api/form`
e lo serve con un server Node minimale (`server/index.mjs`: file statici con
le stesse regole di cache e sicurezza di Netlify, `POST /api/form`,
`GET /healthz` per l'healthcheck). HTTPS, compressione e dominio li gestisce
**Caddy** tramite label ([caddy-docker-proxy](https://github.com/lucaslorentz/caddy-docker-proxy)).

```bash
docker network create caddy          # una volta, se Caddy non l'ha già
cp .env.example .env                 # dominio + credenziali SES
docker compose up -d --build
```

`docker-compose.yml` collega il container alla rete esterna `caddy` e
dichiara le label: `SITE_DOMAIN` → reverse proxy sulla porta 3000 (zstd/gzip,
HSTS), `SITE_DOMAIN_ALT` → redirect permanente al dominio principale.
Per provarlo senza Docker: `npm run build` con
`PUBLIC_FORM_ENDPOINT=/api/form`, poi `npm run serve` (legge `.env`).

## Performance & SEO (già attive)

- **Font self-hosted** (Fonts API di Astro, provider locale): i `.woff2` subset
  latin vivono in `src/assets/fonts/` e vengono serviti da `/_astro` con cache
  immutabile. Zero richieste a Google Fonts dal browser (privacy/GDPR), build
  deterministica, fallback con metriche adattate contro il layout shift.
  Tre famiglie: **Bricolage Grotesque** (variabile: titoli e testo, l'unica
  in preload), **Anton** (nastri e numeri) e **Caveat** (note scritte a mano).
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
- **Animazioni GSAP** (`src/scripts/motion.ts`), stessa architettura del sito
  Alpacode ma con un tono più giocoso, da social. Scroll morbido (Lenis) e
  **sezioni raccontate dallo scroll**: in home (v4, pensata per la
  conversione) l'hero è una "ciotola" vista dall'alto con l'offerta che gira
  sull'anello, "come funziona" è un binario percorso da una zampina, le storie
  vere sono un carosello con il prima/dopo da trascinare e una chat che si
  scrive da sola, le FAQ si aprono morbide e Andrea spunta dal fondo della
  CTA; in Consulenza il "come funziona" è una serie di stories che si
  sfogliano scrollando (dentro lo schermo del telefono) e il monitoraggio è
  un binario che si riempie; in
  Lavora con noi "una rete di venditori" viene barrata a mano e diventa "un
  Team", i principi sono card che si impilano, i profili sono sticker che
  cadono e, toccati, preselezionano l'ambito nel modulo; in Approccio ogni
  principio riceve il suo timbro "Non negoziabile" e le tre fonti del metodo
  sono cerchi che convergono (Venn) mentre la sezione resta ferma; in Chi
  sono l'hero è un biglietto da visita (ritratto ad arco, sigillo del Team che
  gira, firma che si scrive), le polaroid si aprono a ventaglio e le impronte
  percorrono il sentiero delle tappe al passo con lo scroll. In più: titoli a
  righe/parole/lettere, frasi che si accendono parola per parola, nastri che
  seguono lo scroll, scia di zampe dietro al mouse, tilt 3D, evidenziatore,
  coriandoli di zampe/cuori/ossa all'invio dei form, wordmark del footer che
  sale. Tutto via attributi (`data-reveal`, `data-stack`, `data-stories`,
  `data-strike`, `data-venn`, `data-trail`, `data-fan`…: elenco completo in
  testa a `motion.ts`). Senza JavaScript
  ogni sezione mostra il suo stato finale; con `prefers-reduced-motion` è
  tutto fermo.
- **JSON-LD** WebSite/Person/LocalBusiness ovunque, Article (con wordCount e
  tempo di lettura)/Event/ItemList/Breadcrumb dove pertinente; `sitemap.xml`,
  `robots.txt`, header di cache (`netlify.toml`, `_headers`).
- Verifica Search Console e handle social: compila i campi in `src/lib/seo.ts`.

## Sticker dei cani (foto scontornate)

Gli sticker in `src/assets/stickers/` sono le foto vere di Andrea e dei suoi
cani, scontornate e con il bordo bianco fustellato. Si rigenerano con:

```bash
pip install "rembg[cpu]" scipy
python scripts/make-stickers.py
```

Lo script scontorna le foto originali del design handoff
(`design_handoff_sito_andrea/reference/assets/`) con il modello BiRefNet,
pulisce la maschera e aggiunge il bordo. Per cambiare uno sticker basta
sostituire la foto sorgente con lo stesso nome e rilanciarlo. Nelle pagine si
usano con `<Sticker src={...} width={240} rotate={-4} />`.

## Integrazione cal.com ("Richiedi la tua consulenza gratuita")

Oggi i pulsanti **Richiedi la tua consulenza gratuita** aprono un
modale-placeholder con selezione slot che conferma via WhatsApp. Per attivare
cal.com:

1. Imposta `CAL_LINK` in [`src/config.ts`](./src/config.ts)
   (es. `'andrea-bellettati/call-conoscitiva'`).
2. In `src/components/CallModal.astro` sostituisci il corpo `.booking-cal` con
   l'embed ufficiale (`@calcom/embed-react` `<Cal calLink={CAL_LINK} />`).

I trigger `[data-open-call]` sono già presenti su Servizi e Consulenza
gratuita (dentro il questionario). In home le CTA portano dritte al
questionario, con WhatsApp come alternativa.

## Contatti

Tutti cablati da [`src/config.ts`](./src/config.ts): WhatsApp +39 347 678 0938,
andrebellettati@gmail.com, Instagram @comunicazionecinofila.

## Deploy

Consigliato: **Docker + Caddy** (sezione sopra), con i form via AWS SES.
In alternativa la build statica gira anche su **Netlify / Vercel /
Cloudflare Pages** (build `npm run build`, output `dist/`); su Netlify i
form possono usare la function SES o Netlify Forms.

**Prima del deploy:** imposta il dominio reale in
[`astro.config.mjs`](./astro.config.mjs) (`site`), in `src/config.ts` (`SITE`) e
in [`public/robots.txt`](./public/robots.txt) — serve a sitemap, canonical e OG.

## Da completare

- **Dominio** definitivo (placeholder attuale: `www.andreabellettati.it` — vedi i TODO in `src/config.ts`, `astro.config.mjs`, `public/robots.txt`).
- **Foto reali**: i nomi da usare sono già decisi e auto-rilevati — vedi
  [`public/assets/README.md`](./public/assets/README.md) (cover articoli/eventi,
  foto team/formazione, `og-home.jpg` 1200×630). Basta caricare il file.
- **Testi articoli/blog** on-site (12 stub `coming-soon` + bozze marcate nel Markdown).
- **AWS SES**: verificare il dominio, uscire dalla sandbox, creare l'utente
  IAM e compilare `.env` (vedi "Form: WhatsApp + email via AWS SES").
- **Sezioni future in `/servizi`** (solo TODO nel codice): dieta casalinga/BARF con referral alla biologa Stefania Bartoloni; servizi in affiliazione.
- **Link cal.com** (`CAL_LINK` in `src/config.ts`) + immagine OG dedicata 1200×630.
- **Catalogo archiviato**: se tornerà, aggiornare i dati in `src/data/catalogo.json` alla gamma reale.

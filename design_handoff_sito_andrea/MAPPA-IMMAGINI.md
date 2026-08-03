# Mappa delle immagini del sito

Le immagini hanno **nomi di ruolo** (dicono *dove va* la foto, non cosa
raffigura): per cambiare una foto basta caricare un file con lo stesso nome.
La guida operativa, con formati consigliati e l'elenco completo dei nomi, è
[`public/assets/README.md`](../public/assets/README.md).

## Dove compare ogni immagine

### `logo.jpg` — Logo / marchio
- Logo nell'header — `src/components/SiteHeader.astro`
- Logo nel footer — `src/components/SiteFooter.astro`
- Ritratto grande nell'hero della home — `src/pages/index.astro`
- Immagine social (OG) di riserva di tutto il sito — `src/lib/seo.ts`
- Sorgente delle **favicon derivate** (`favicon.ico`, `favicon-16/32.png`,
  `apple-touch-icon.png`, `icon-192/512.png`), rigenerate con `npm run assets`

### `hero.jpg` — Foto simbolo
- Sfondo dell'hero della home + blocco "L'approccio" — `src/pages/index.astro`
- Pagina Approccio + sua immagine social — `src/pages/approccio.astro`

### `chi-sono.jpg` — Foto bio
- Bio nella pagina Chi sono — `src/pages/chi-sono.astro`
- Blocco "Consulenza 1:1" nella pagina Servizi — `src/pages/servizi.astro`
- Riserva del teaser Eventi in home (se l'evento non ha cover) — `src/pages/index.astro`

### `consulenza.jpg`
- Pagina Consulenza gratuita + sua immagine social — `src/pages/consulenza-gratuita.astro`
- Seconda foto e immagine social di Chi sono — `src/pages/chi-sono.astro`

### `alimentazione.jpg`
- Blocco "Alimentazione Naturale" nella pagina Servizi + immagine social — `src/pages/servizi.astro`

### `team-formazione.jpg` *(opzionale, auto-rilevata)*
- Blocco "Opportunità Lavorative" nella pagina Servizi; finché manca si vede
  il placeholder

### `og-home.jpg` *(opzionale, auto-rilevata)*
- Anteprima social predefinita (1200×630) al posto del logo — `src/lib/seo.ts`

### Cover di articoli ed eventi *(auto-rilevate)*
- Convenzione: `articolo-<nome-file-md>.jpg` / `evento-<nome-file-md>.jpg`
  in `public/assets/`. Carichi il file → card, pagina di dettaglio, `og:image`
  e JSON-LD lo usano da soli (`src/lib/images.ts`). Un `cover:` esplicito nel
  frontmatter, se presente, vince sulla convenzione.

## Come funziona il caricamento

- **Stesso nome = zero modifiche.** Tutte le foto si sostituiscono
  ricaricando un file con lo stesso nome. `hero`, `chi-sono`, `consulenza` e
  `alimentazione` esistono in **doppia copia** (`src/assets/` per i layout
  ottimizzati + `public/assets/` per social/cover): vanno sostituite in
  entrambe le cartelle.
- **Le foto opzionali** (team, og-home, cover) si attivano da sole appena il
  file esiste: nessuna modifica a template o frontmatter.
- Dopo ogni caricamento: `npm run assets` (compressione + favicon), commit,
  deploy.

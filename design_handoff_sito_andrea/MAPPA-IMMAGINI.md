# Mappa delle immagini del sito

Questo documento mappa **tutte le immagini attualmente usate**, dove compaiono, e
propone un **nome unico e descrittivo** per ciascuna. Serve per poter rinominare i
file e ricaricarli in modo ordinato.

> ⚠️ **Leggi prima la sezione "Si caricano da sole?" in fondo.** Il rename NON è
> automatico solo cambiando il nome del file: ogni immagine è "agganciata" nel
> codice o nei contenuti. Automatico è solo **sovrascrivere un file mantenendo lo
> stesso nome**.

---

## 1. Immagini uniche attuali (6 file)

| # | File attuale | Cosa raffigura | Dove è salvato oggi |
|---|---|---|---|
| 1 | `logo-original.jpg` | Ritratto Andrea + bassotto (logo/marchio) | solo `public/assets/` (~4 KB) |
| 2 | `andrea-1.jpg` | Andrea con il cane lungo un fiume di montagna | `src/assets/` **e** `public/assets/` |
| 3 | `andrea-2.jpg` | Selfie invernale, guancia a guancia con il cane | `src/assets/` **e** `public/assets/` |
| 4 | `andrea-3.jpg` | I due cani con i maglioni a quadri sul letto | `src/assets/` **e** `public/assets/` |
| 5 | `feed-etichette.jpg` | Locandina evento "Etichette a 4 Zampe" | `src/assets/` **e** `public/assets/` |
| 6 | `feed-antistaminico.jpg` | Cover articolo "Antistaminico naturale" | `src/assets/` **e** `public/assets/` |

> Nota: le foto esistono in **doppia copia** (`src/assets/` + `public/assets/`)
> perché il sito le usa in due modi diversi (vedi sezione tecnica). Se rinomini/
> sostituisci una foto, va aggiornata **in entrambe le cartelle**.

---

## 2. Dove compare ogni immagine (mappa d'uso)

### `logo-original.jpg` — Logo / marchio
- Logo nell'header — `src/components/SiteHeader.astro`
- Logo nel footer — `src/components/SiteFooter.astro`
- Ritratto grande nell'hero della home — `src/pages/index.astro`
- Favicon + icona Apple — `src/layouts/Base.astro`
- Immagine social (OG) predefinita di tutto il sito — `src/lib/seo.ts`

### `andrea-1.jpg` — Andrea + cane al fiume
- Sfondo dell'hero della home — `src/pages/index.astro`
- Foto del blocco "L'approccio" in home — `src/pages/index.astro`
- Hero della pagina Approccio + sua immagine social — `src/pages/approccio.astro`

### `andrea-2.jpg` — Selfie invernale
- Fallback del teaser Eventi in home (se l'evento non ha cover) — `src/pages/index.astro`
- Blocco "Consulenza 1:1" nella pagina Servizi — `src/pages/servizi.astro`
- Bio nella pagina Chi sono — `src/pages/chi-sono.astro`

### `andrea-3.jpg` — I due cani coi maglioni
- Pagina Chi sono + sua immagine social — `src/pages/chi-sono.astro`
- Pagina Consulenza gratuita — `src/pages/consulenza-gratuita.astro`

### `feed-etichette.jpg` — Locandina "Etichette a 4 Zampe"
- Blocco "Alimentazione" nella pagina Servizi — `src/pages/servizi.astro`
- Cover dell'evento — `src/content/eventi/etichette-a-4-zampe.md` (campo `cover:`)
- Cover dell'articolo — `src/content/articoli/leggere-le-etichette.md` (campo `cover:`)
- Immagine social della pagina Eventi + fallback dettaglio evento

### `feed-antistaminico.jpg` — Cover "Antistaminico naturale"
- Cover dell'articolo — `src/content/articoli/antistaminico-naturale-per-cani.md` (campo `cover:`)
- Immagine social della pagina Articoli + fallback dettaglio articolo

---

## 3. Mappa dei nomi proposti

Nomi unici, descrittivi, tutto minuscolo con trattini (nessuno spazio, nessun
accento). Suggeriti così che dal nome si capisca subito il contenuto.

| Nome attuale | ➜ Nome proposto | Descrizione |
|---|---|---|
| `logo-original.jpg` | `logo-andrea.jpg` | Logo / ritratto con il bassotto |
| `andrea-1.jpg` | `andrea-cane-fiume.jpg` | Andrea con il cane al fiume |
| `andrea-2.jpg` | `andrea-selfie-inverno.jpg` | Selfie invernale con il cane |
| `andrea-3.jpg` | `andrea-due-cani-maglioni.jpg` | I due cani con i maglioni |
| `feed-etichette.jpg` | `evento-etichette-4-zampe.jpg` | Locandina evento "Etichette a 4 Zampe" |
| `feed-antistaminico.jpg` | `articolo-antistaminico.jpg` | Cover articolo "Antistaminico naturale" |

*(Puoi tenere `.jpg` oppure passare a `.webp` per file più leggeri — in quel caso
vanno aggiornati anche i riferimenti, come per il rename.)*

---

## 4. (Opzionale) Cover per ogni articolo/evento

Molti articoli oggi **non hanno una foto** e mostrano un placeholder "FOTO".
Se vuoi dare a ciascuno una cover, la convenzione più semplice è nominare il file
**come lo slug** dell'articolo e metterlo in `public/assets/`, poi aggiungere il
campo `cover:` nel relativo file `.md`.

Esempi (articoli senza cover oggi):

| Articolo (slug) | Nome cover suggerito | Campo da aggiungere nel `.md` |
|---|---|---|
| `muco-nelle-feci-del-cane` | `muco-nelle-feci-del-cane.jpg` | `cover: "/assets/muco-nelle-feci-del-cane.jpg"` |
| `feci-molli-nel-cane` | `feci-molli-nel-cane.jpg` | `cover: "/assets/feci-molli-nel-cane.jpg"` |
| `cane-si-lecca-le-zampe` | `cane-si-lecca-le-zampe.jpg` | `cover: "/assets/cane-si-lecca-le-zampe.jpg"` |
| `rotazione-delle-proteine` | `rotazione-delle-proteine.jpg` | `cover: "/assets/rotazione-delle-proteine.jpg"` |
| `umido-o-crocchette` | `umido-o-crocchette.jpg` | `cover: "/assets/umido-o-crocchette.jpg"` |
| … *(stesso schema per gli altri)* | `<slug>.jpg` | `cover: "/assets/<slug>.jpg"` |

Consiglio: aggiungi anche `coverAlt: "..."` con una breve descrizione (utile per
accessibilità e SEO).

---

## 5. "Si caricano da sole?" — la parte importante

**Risposta breve:** *cambiare solo il nome del file NON basta.* Nel progetto ogni
immagine è collegata in un punto preciso; non c'è un meccanismo che "trova le foto
dalla cartella in base al nome".

Ci sono due modi in cui le immagini sono agganciate:

1. **Foto ottimizzate (`src/assets/`)** → richiamate con un `import` per nome esatto
   nel codice `.astro`. Se rinomini il file **senza** aggiornare l'`import`, il
   build si rompe.
2. **File statici (`public/assets/`)** → serviti così come sono all'indirizzo
   `/assets/<nome>`. Sono richiamati:
   - da **stringhe fisse nel codice** (logo, favicon, immagini social) → il rename
     richiede una modifica al codice;
   - dal campo **`cover:`** nei contenuti `.md` → questo è **dato**, non codice:
     se carichi `public/assets/foo.jpg` e scrivi `cover: "/assets/foo.jpg"`, si
     carica **senza toccare il codice** (ma il nome deve comunque essere scritto
     nel campo `cover:`, non viene dedotto dallo slug in automatico).

### Cosa è davvero "automatico"
- ✅ **Sostituire un file tenendo lo STESSO nome** (es. ricaricare un
  `andrea-1.jpg` di qualità migliore) → funziona subito, zero modifiche.
- ✅ **Aggiungere una cover a un articolo/evento**: carichi il file in
  `public/assets/` e imposti `cover:` nel `.md` → si carica da solo.
- ❌ **Dare un NOME NUOVO a una foto già in uso** (es. `andrea-1` ➜
  `andrea-cane-fiume`) → NON è automatico: va aggiornato il riferimento nel codice
  una volta. Dopo quella modifica, ricaricare file con il nuovo nome diventa
  automatico.

### Come rendere automatici i nomi della sezione 3
Serve fare **una volta** il "cablaggio": rinominare i file nel repo e aggiornare
tutti i riferimenti (import, stringhe del logo/social, campi `cover:`). Fatto
quello, potrai ri-esportare e caricare le immagini con quei nomi e si
caricheranno da sole.

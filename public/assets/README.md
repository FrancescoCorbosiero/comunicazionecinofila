# Foto del sito — carica il file col nome giusto e via

Ogni foto ha un nome che dice **dove va**, non cosa raffigura: per cambiarla
basta caricare qui un file con lo stesso nome. Estensione a scelta tra
**jpg** (consigliata), jpeg, png, webp. Dopo il caricamento: `npm run assets`
(comprime le foto e, se hai cambiato il logo, rigenera le favicon), poi
commit e deploy.

## Foto delle pagine

| File | Dove compare | Formato consigliato |
|---|---|---|
| `logo.jpg` | Logo tondo in header e footer, ritratto nell'hero, favicon | quadrata, ≥ 512px, soggetto centrato |
| `hero.jpg` | Sfondo dell'hero in home, blocco "L'approccio" in home, pagina Approccio | ≥ 1440px, deve reggere testo chiaro sopra (viene scurita) |
| `chi-sono.jpg` | Pagina Chi sono, blocco "Consulenza 1:1" in Servizi | verticale 4:5, ≥ 1200px |
| `consulenza.jpg` | Pagina Consulenza gratuita, seconda foto di Chi sono | verticale 4:5, ≥ 1200px |
| `alimentazione.jpg` | Blocco "Alimentazione Naturale" in Servizi | 4:3 o quadrata, ≥ 1200px |
| `team-formazione.jpg` | Blocco "Opportunità Lavorative" in Servizi *(oggi placeholder: appare appena la carichi)* | 4:3 o quadrata, ≥ 1200px |
| `og-home.jpg` | Anteprima social del sito (WhatsApp, Instagram…) *(oggi si usa il logo: appare appena la carichi)* | orizzontale **1200×630** |

> `hero`, `chi-sono`, `consulenza` e `alimentazione` esistono **anche in
> `src/assets/`** con lo stesso nome: sostituiscile in **entrambe** le
> cartelle (una è la versione ottimizzata dei layout, l'altra serve per le
> anteprime social).

## Cover di articoli ed eventi

Regola unica: `articolo-<nome-file-md>.jpg` e `evento-<nome-file-md>.jpg`.
Carichi il file e la cover appare da sola su card, pagina e anteprima social
— niente da toccare nei contenuti. Formato: quadrata o 16:10, ≥ 1080px.

Già presenti (per cambiarle, stesso nome):

- `articolo-antistaminico-naturale-per-cani.jpg`
- `articolo-leggere-le-etichette.jpg`
- `evento-etichette-a-4-zampe.jpg`

Da caricare (nome già deciso, basta il file):

- `articolo-alimentazione-e-comportamento.jpg`
- `articolo-cambio-alimentare-graduale.jpg`
- `articolo-cane-si-lecca-le-zampe.jpg`
- `articolo-cerume-orecchie-cane-alimentazione.jpg`
- `articolo-cibo-e-comportamento.jpg`
- `articolo-feci-molli-nel-cane.jpg`
- `articolo-grain-free-moda-o-necessita.jpg`
- `articolo-il-cane-mangia-meno-con-il-caldo.jpg`
- `articolo-il-cane-mangia-solo-se-aggiungo-qualcosa.jpg`
- `articolo-il-gatto-beve-poco.jpg`
- `articolo-muco-nelle-feci-del-cane.jpg`
- `articolo-rotazione-delle-proteine.jpg`
- `articolo-umido-o-crocchette.jpg`
- `articolo-wurstel-al-cane-inappetenza.jpg`
- `evento-antistaminico-naturale-sessione.jpg`
- `evento-ciotola-del-gatto.jpg`

## Note

- I file `favicon-*.png`, `icon-*.png` e `apple-touch-icon.png` sono
  **generati** dal logo con `npm run assets`: non modificarli a mano.
- Cache del browser: 30 giorni. Dopo una sostituzione a parità di nome, chi
  ha già visitato il sito può vedere la versione vecchia per un po' (le
  copie in `src/assets/` hanno URL con hash e si aggiornano subito).

⚠️ Tutto ciò che è in questa cartella è **pubblico** e finisce nelle
anteprime social: niente foto di clienti o dei loro animali senza consenso.

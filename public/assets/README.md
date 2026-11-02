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
| `hero.jpg` | Polaroid del blocco "L'approccio" in home, anteprima social della home e di Approccio, ventaglio di Chi sono | ≥ 1440px |
| `chi-sono.jpg` | Foto ad arco del blocco "Chi sono" in home, hero di Chi sono (finché non carichi `ritratto.jpg`), blocco "Consulenza 1:1" in Servizi | verticale 4:5, ≥ 1200px |
| `consulenza.jpg` | Pagina Consulenza gratuita, polaroid "a casa" in home, ventaglio di Chi sono | verticale 4:5, ≥ 1200px |
| `alimentazione.jpg` | Blocco "Alimentazione Naturale" in Servizi | 4:3 o quadrata, ≥ 1200px |
| `team-formazione.jpg` | Blocco "Opportunità Lavorative" in Servizi *(oggi placeholder: appare appena la carichi)* | 4:3 o quadrata, ≥ 1200px |
| `og-lavora-con-noi.jpg` | Anteprima social di "Lavora con noi" (lo striscione TeamNutrizione su fondo 1200×630) | orizzontale **1200×630** |
| `og-home.jpg` | Anteprima social del sito (WhatsApp, Instagram…) *(oggi si usa il logo: appare appena la carichi)* | orizzontale **1200×630** |

> La **cover di "Lavora con noi"** (lo striscione TeamNutrizione) vive solo
> in `src/assets/lavora-con-noi.jpg`: orizzontale ~3:1, ≥ 1600px di
> larghezza. Se la cambi, rigenera anche `og-lavora-con-noi.jpg`.
>
> `hero`, `chi-sono`, `consulenza` e `alimentazione` esistono **anche in
> `src/assets/`** con lo stesso nome: sostituiscile in **entrambe** le
> cartelle (una è la versione ottimizzata dei layout, l'altra serve per le
> anteprime social).

## Foto nuove (solo in `src/assets/`, appaiono da sole)

Queste vanno caricate **in `src/assets/`** (non qui): sono foto dei layout,
ottimizzate al build. Finché mancano, al loro posto c'è un segnaposto o una
foto di ripiego — niente si rompe.

| File (`src/assets/`) | Dove compare | Formato consigliato |
|---|---|---|
| `home-hero.jpg` | **Hero della home**: la foto di Andrea dentro il disco (senza, si usa `chi-sono.jpg`) | quadrata o 4:5, ≥ 1000px, volto ben visibile |
| `home-chi-sono.jpg` | Home, blocco "Ciao, sono Andrea": la foto ad arco | verticale 4:5, ≥ 1000px |
| `home-ciotola.jpg` | Home, polaroid "l'ora della pappa" accanto alla foto ad arco | verticale 4:5, ≥ 600px |
| `home-approccio.jpg` | Home, polaroid "si parte!" nel blocco "L'approccio" | verticale 4:5, ≥ 600px |
| `ritratto.jpg` | Hero di **Chi sono**: la foto "professionale" ad arco (senza, si usa `chi-sono.jpg`) | verticale 4:5, ≥ 1200px, volto ben illuminato |
| `storia-zoe-prima.jpg` | Home, "Cani veri, ciotole vere": Zoe all'inizio (prima/dopo da trascinare) | verticale 4:5 o quadrata, ≥ 1000px |
| `storia-zoe-dopo.jpg` | Home, stessa card: Zoe dopo un mese — **stessa inquadratura** della "prima" | come sopra |
| `storia-pelle.jpg` | Home, card "La pelle racconta" (pastore australiano, 6 mesi) | verticale 4:5 o quadrata, ≥ 1000px |

> Oggi questi file contengono le foto prese dall'artifact di riferimento,
> piccole (~430px): sostituiscile con gli originali ad alta risoluzione,
> stesso nome.
>
> Le storie dei clienti mostrano animali veri: carica solo foto per cui hai
> il consenso della famiglia.

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

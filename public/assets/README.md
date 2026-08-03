# Foto del sito — metti qui i file, ai nomi pensa il codice

Estensione a scelta tra **jpg** (consigliata), jpeg, png, webp. Dopo aver
caricato: `npm run assets` (comprime le foto e, se hai cambiato il logo,
rigenera le favicon), poi commit e deploy.

## 1. Foto già presenti — per sostituirle usa lo stesso nome

| File | Dove compare | Formato consigliato |
|---|---|---|
| `logo-andrea.jpg` | Logo in header e footer, ritratto nell'hero, anteprima social di riserva, sorgente delle favicon | quadrata, ≥ 512px, viso/soggetto centrato |
| `andrea-cane-fiume.jpg` | Sfondo dell'hero in home, blocco "L'approccio", pagina Approccio | ≥ 1440px, soggetto leggibile anche scurito (sopra ci va testo chiaro) |
| `andrea-selfie-inverno.jpg` | Teaser eventi in home (riserva), Servizi "Consulenza 1:1", Chi sono | verticale 4:5, ≥ 1200px |
| `andrea-due-cani-maglioni.jpg` | Chi sono, Consulenza gratuita | verticale 4:5, ≥ 1200px |
| `evento-etichette-4-zampe.jpg` | Servizi "Alimentazione", cover dell'evento e dell'articolo sulle etichette | quadrata, ≥ 1080px |
| `articolo-antistaminico.jpg` | Cover dell'articolo antistaminico, anteprima social del blog | quadrata, ≥ 1080px |

> Queste foto (tranne il logo) esistono **anche in `src/assets/`** con lo
> stesso nome: sostituiscile **in entrambe le cartelle**, così si aggiornano
> sia le versioni ottimizzate dei layout sia cover e anteprime social.

## 2. Foto nuove — si attivano da sole appena le carichi

Nessuna modifica a template o frontmatter: al build successivo la pagina usa
il file al posto del placeholder.

| File | Dove compare | Formato consigliato |
|---|---|---|
| `og-home.jpg` | Anteprima social predefinita del sito (WhatsApp, Instagram…) al posto del logo | orizzontale **1200×630** |
| `team-formazione.jpg` | Servizi → blocco "Opportunità Lavorative" | 4:3 o quadrata, ≥ 1200px |
| `articolo-<slug>.jpg` | Cover di un articolo: card nel blog, pagina, anteprima social | quadrata o 16:10, ≥ 1080px |
| `evento-<slug>.jpg` | Cover di un evento: pagina Eventi, dettaglio, anteprima social | quadrata, ≥ 1080px |

Articoli oggi senza cover (nome file già deciso, basta caricare):

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

Eventi oggi senza cover:

- `evento-antistaminico-naturale-sessione.jpg`
- `evento-ciotola-del-gatto.jpg`

Per i contenuti futuri vale la stessa regola: `articolo-<nome-file-md>.jpg` /
`evento-<nome-file-md>.jpg`. Un eventuale `cover:` esplicito nel frontmatter
vince sulla convenzione.

## Note

- I file `favicon-*.png`, `icon-*.png` e `apple-touch-icon.png` sono
  **generati** dal logo con `npm run assets`: non modificarli a mano.
- Le foto qui dentro sono servite con cache del browser di 30 giorni: dopo
  una sostituzione a parità di nome, chi ha già visitato il sito può vedere
  la versione vecchia per un po'. Le copie in `src/assets/` invece hanno URL
  con hash e si aggiornano subito per tutti.

⚠️ Tutto ciò che è in questa cartella è **pubblico** e finisce nelle
anteprime social: niente foto di clienti o dei loro animali senza consenso.

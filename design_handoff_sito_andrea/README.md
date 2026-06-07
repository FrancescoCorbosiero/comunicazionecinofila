# Handoff — Sito Andrea Bellettati · Comunicazione Cinofila

Pacchetto per ricostruire il sito in un codebase reale. **Self-sufficient**: uno
sviluppatore che non era presente alla progettazione può implementarlo partendo
solo da questo README + i file in `reference/`.

---

## 1. Overview

Sito vetrina/lead-gen di **Andrea Bellettati**, consulente in *comportamento e
nutrizione per cani e gatti* (partner Reico Italia). Doppio pubblico:

- **Famiglie** con un animale → obiettivo: compilare il questionario / scrivere su
  WhatsApp per una **consulenza gratuita** (45').
- **Aspiranti professionisti** → obiettivo: **prenotare una call** conoscitiva
  (widget calendario, es. cal.com).

6 pagine statiche, mobile-first, italiano: `index` (Home), `approccio`,
`servizi`, `eventi`, `articoli`, `contatti`.

---

## 2. I file di questo bundle sono REFERENCE, non codice di produzione

I file in `reference/` sono **prototipi HTML/CSS/JS vanilla** che mostrano look &
behavior definitivi. Il compito **non** è copiarli e deployarli così come sono, ma
**ricostruirli nell'ambiente target** con i suoi pattern (componenti, routing,
content collections…). Sono stati scritti puliti apposta per essere traducibili
quasi 1:1.

`brand.css` è invece **da tenere**: è il design-system in CSS custom properties,
si riusa identico (o si mappa su Tailwind se preferito).

---

## 3. Fidelity: **HIGH-FIDELITY**

Colori, tipografia, spaziature, copy e interazioni sono finali. Ricostruire la UI
pixel-perfect usando i token qui sotto. Le immagini "team/formazione", "ciotola",
"gatto" sono **placeholder** (`.placeholder`): vanno sostituite con foto reali.

---

## 4. Stack consigliato

**Astro** (raccomandato) — content site static-first, zero-JS di default, SEO/OG
nativi, "islands" solo per i pochi pezzi interattivi.

```
src/
  layouts/Base.astro          # <head> (meta/OG/favicon/fonts), Header, Footer, slot
  components/
    SiteHeader.astro
    SiteFooter.astro
    LeafIcon.astro            # SVG foglia (unico ornamento)
    CallModal.astro|.tsx      # island: modale "Prenota una call" (cal.com)
    StepForm.astro|.tsx       # island: questionario a 3 step → WhatsApp
    TweaksPanel.tsx           # island opzionale: toggle stile/accento/texture
  pages/
    index.astro  approccio.astro  servizi.astro  eventi.astro  contatti.astro
    articoli/index.astro  articoli/[slug].astro   # Content Collection (Markdown)
    eventi/[slug].astro                            # idem se gli eventi crescono
  styles/ brand.css  site.css                      # invariati
  content/ articoli/*.md  eventi/*.md
public/ assets/*.jpg  favicon
```

- **Articoli/Eventi** → **Content Collections (Markdown)**: Andrea aggiunge
  contenuti senza toccare codice. Niente CMS pesante (eventualmente Sanity/Storyblok
  in futuro).
- **Form → WhatsApp**: deep-link `wa.me`, nessun backend. Per salvare i lead:
  Formspree/Resend o una API route.
- **cal.com**: sostituire il modale-placeholder con l'embed ufficiale
  (`@calcom/embed-react` o script vanilla). Vedi §8.
- **Hosting**: Netlify / Vercel / Cloudflare Pages. **Analytics**: Plausible/Umami.
- *Alternativa*: Next.js (App Router) solo se servono feature dinamiche serie
  (area riservata, gestione lead, e-commerce). Oggi sovradimensionato.

---

## 5. Design tokens (da `reference/brand.css`)

**Palette**
| Token | Hex | Uso |
|---|---|---|
| `--bg-cream` | `#ece4d2` | sfondo pagina (carta riciclata) |
| `--bg-paper` | `#f5efe1` | superfici chiare / card |
| `--bg-deep` | `#2a3120` | header masthead, footer, sezioni scure |
| `--sage` | `#7c9474` | **verde primario** (hero, blocchi) |
| `--sage-soft` | `#a4b59c` | salvia chiara |
| `--sage-mist` | `#d5dcc4` | pannelli/placeholder |
| `--olive-deep` | `#3f4a2e` | headline scure / badge |
| `--olive-darkest` | `#1f2515` | testo su pesca |
| `--peach` | `#f4a98a` | **accento** CTA/hover/occhielli su verde |
| `--peach-deep` | `#d97a55` | hover/active scuro, link |
| `--ochre` | `#c9a96a` | dettagli (uso parco) |
| `--ink` `#1a1c14` · `--ink-soft` `#3d4533` · `--ink-mute` `#6a7163` | | inchiostri body |
| `--cream-ink` | `#efe8d8` | testo su fondi verdi |

**Tipografia** (Google Fonts: Anton, Inter, Caveat, Playfair Display, Cormorant Garamond, JetBrains Mono)
- `--display: 'Anton'` — poster, **UPPERCASE**, `letter-spacing:.005em`, line-height ~1.0. Titoli.
- `--sans: 'Inter'` — body.
- `--script: 'Caveat'` — accento manoscritto, **solo parole singole** (es. "live").
- Playfair Display — variante serif **opzionale** (toggle Tweaks "Elegante").
- Scala display (clamp, responsive): `display-xl` 42→96px · `display-lg` 34→64px · `display-md` 26→40px. Eyebrow 11px / 600 / `letter-spacing:.22em` / uppercase.

**Raggi** `--r-1:2 · --r-2:6 · --r-3:12 · --r-pill:999`. **Spaziatura sezioni**: `clamp(56px,9vw,120px)` (`.section`), `clamp(40px,6vw,72px)` (`.section-tight`). **Container** max 1200px (narrow 860), padding 22px.

**Texture**: `.paper-bg` = grana a punti + trama incrociata leggerissima su cream; `.paper-bg-deep` = punti tenui su verde notte. `.placeholder` = hatch salvia + label monospace per immagini mancanti.

---

## 6. Pagine

> Pattern comune: **Header** sticky verde-notte (filetto pesca 3px in cima) +
> **Footer** verde-notte. Heading di sezione = blocco `eyebrow` + `display-*` +
> `lead`. Alternanza fondi: cream → sage → deep.

### Home (`index.html`)
- **Hero** *centrata, full-height* su `--sage`: ritratto circolare (ring pesca, 96–130px), eyebrow pesca, titolo Anton "IL BENESSERE PARTE DALLA CIOTOLA" (CIOTOLA in pesca), lead, **due CTA di pari peso**: `Consulenza gratuita` (→ contatti) e `Prenota una call` (apre modale, §8). Nota "Primo confronto gratuito · cane e gatto".
- **Strip 3 servizi** (cream): card Alimentazione / Consulenza 1:1 / Opportunità → ancore su `servizi`.
- **Teaser approccio** (sage): foto `andrea-1.jpg` + testo + link.
- **Proof strip** (deep, 4 celle): `2021` / `45'` / icona zampa+`Cane & Gatto` / `Reico`.
- **CTA finale** (deep): `Consulenza gratuita` + `Prenota una call`.

### Approccio (`approccio.html`)
Hero split testo+`andrea-1.jpg` ("NON VENDO CROCCHETTE. COSTRUISCO EQUILIBRIO." – seconda frase in pesca) · Manifesto 3 principi (deep) · Bio "vivo con un bassotto" (`andrea-2.jpg`) + blockquote · Pull-quote ayurvedica (sage) · **Timeline** *(date placeholder, da confermare con Andrea: ancorate al 2021)* · CTA.

### Servizi (`servizi.html`)
Intro · 3 blocchi `svc-block` alternati (media + body con pill, lista "cosa include", CTA): **Alimentazione** (`feed-etichette.jpg`), **Consulenza 1:1** (`andrea-2.jpg`), **Opportunità** (placeholder → CTA `data-open-call`). **Nessun prezzo** (solo preventivo/consulenza gratuita). "Come funziona" 3 step (deep) · CTA.

### Eventi (`eventi.html`)
Evento in evidenza reale: **"Etichette a 4 Zampe"** — webinar live gratuito, *Mercoledì 11 Febbraio 21:00*, temi Carne fresca · Grain free · Additivi, in collab. Team Branco (Virginia Dallara), immagine `feed-etichette.jpg`, CTA "Riserva il posto" → WhatsApp precompilato. Agenda secondaria (replay/in arrivo) · CTA.

### Articoli (`articoli.html`)
Indice onesto: articolo in evidenza **"Antistaminico naturale per cani"** (`feed-antistaminico.jpg`) → link Instagram; griglia 3 card (1 reale "leggere le etichette", 2 "in arrivo"). I contenuti reali vanno in Content Collection Markdown.

### Contatti (`contatti.html`)
**Selettore di percorso** (2 card): *Ho un cane/gatto* vs *Voglio farne un lavoro* (deep-link `?p=pro`, default `famiglia`).
- **Famiglia** → **questionario a 3 step** (§7) che apre WhatsApp precompilato + fallback email; include **opzione "Prenota una call"** (apre modale) allo step finale e nella schermata di conferma.
- **Pro** → card booking verde con selezione slot (§8) + CTA WhatsApp/contatto.
- **Canali**: WhatsApp, email, Instagram, telefono (icone SVG) + ritratto `andrea-3.jpg`.

---

## 7. Componenti & interazioni (logica in `reference/site.js`)

**Header/nav** — sticky, blur. Mobile (`max-width:860px`): hamburger → pannello a tendina verde-notte; link chiudono il menu. Link attivo evidenziato.

**Reveal on scroll** — `[data-reveal]` (+ `data-delay="1|2|3"`): nascosti→visibili via IntersectionObserver. **Importante**: lo stato nascosto è gated dietro `html.js` e disattivato per `prefers-reduced-motion`; gli elementi above-the-fold si rivelano subito (niente flash/blank, niente contenuti invisibili senza JS).

**Form a step (questionario esteso)** — `[data-stepform]`, 3 pannelli + dots di avanzamento. Validazione per-step (required, email, tel ≥6 cifre) con messaggi inline. Submit → costruisce un messaggio testuale (Nome, Sono, Animale, Telefono, Situazione) e apre `https://wa.me/<num>?text=…`; mostra schermata di successo con pulsanti WhatsApp/email manuali + "Prenota una call". Campi: `nome`(req), `animale`(req, textarea), `telefono`(req, tel), `messaggio`(opz), `profilo`(hidden).

**Selettore percorso** — `[data-path]` mostra/nasconde `[data-path-target]`; rispetta `?p=pro`.

**Booking / call** — vedi §8.

**Tweaks panel** (opzionale, "Make tweakable") — pannello vanilla che rispetta il protocollo host (`__activate_edit_mode` / `__edit_mode_set_keys` / …) e persiste in `localStorage` (`ab_tweaks_v1`). Controlli: **Stile titoli** Poster(Anton)/Elegante(Playfair) → `html[data-titlestyle]`; **Accento** pesca/corallo/ocra → `--peach`/`--peach-deep`; **Texture carta** on/off → `html[data-paper]`. *In Astro può diventare una island React o essere omesso in produzione.*

**Contatti reali (cablati ovunque)**: WhatsApp `+39 347 678 0938` (`wa.me/393476780938`) · email `andrebellettati@gmail.com` · IG `@comunicazionecinofila`.

---

## 8. Prenotazione call (cal.com) — punto di integrazione

Oggi è un **placeholder funzionale**: un **modale condiviso** (iniettato da `site.js`,
aperto da qualsiasi `[data-open-call]`) con selezione slot d'esempio che conferma via
WhatsApp. In `site.js` c'è la costante:

```js
var CAL_LINK = ''; // ⟵ inserire qui il link cal.com (es. 'andrea-bellettati/call')
```

**Da fare in produzione**: sostituire il corpo del modale con l'**embed cal.com**
(`@calcom/embed-react` `<Cal calLink={CAL_LINK} />` oppure popup via
`data-cal-link`). I trigger `[data-open-call]` esistono già su: hero Home, CTA
finale Home, blocco/CTA Opportunità su Servizi, step finale + successo del
questionario su Contatti. Mantenere **pari peso** call vs WhatsApp (richiesta
esplicita del cliente).

---

## 9. State management (minimo)

- Step form: `currentStep` (0–2), validità per campo.
- Path selector: `path` ('famiglia'|'pro') ← anche da query `?p=`.
- Call modal: `open`, `selectedSlot`.
- Tweaks: `{ titlestyle, accent, paper }` in localStorage.
- Nav mobile: `open`.
Nessun data-fetching obbligatorio (tutto client-side + deep-link).

---

## 10. Assets (in `reference/assets/`)

| File | Contenuto | Uso |
|---|---|---|
| `logo-original.jpg` | Ritratto Andrea + bassotto (la palette è campionata da qui) | **Logo/portrait mark**, favicon, OG |
| `andrea-1.jpg` | Andrea + cane al fiume (outdoor) | Hero Approccio, teaser |
| `andrea-2.jpg` | Selfie intimo con cane (inverno) | Bio, Consulenza |
| `andrea-3.jpg` | I due cani coi maglioni | Contatti |
| `feed-etichette.jpg` | Locandina "Etichette a 4 Zampe" | Eventi, Alimentazione, Articoli |
| `feed-antistaminico.jpg` | Cover "Antistaminico naturale" | Articolo in evidenza |

Placeholder da rimpiazzare con foto reali: team/formazione (Servizi · Opportunità),
ciotola, gatto (Articoli). Il **logo è un ritratto**, non un mark grafico. Unico
ornamento = **foglia line-art SVG** (mai ramoscelli affollati).

---

## 11. SEO / accessibilità

Ogni pagina: `<title>`, meta description, Open Graph (title/description/image),
favicon = ritratto, `theme-color: #7c9474`, `lang="it"`. Hit-target ≥44px, focus
states su form e bottoni, `prefers-reduced-motion` rispettato, label/aria sui
controlli. Aggiungere `sitemap.xml`, `robots.txt`, JSON-LD `LocalBusiness/Person`
in fase di build.

---

## 12. File di riferimento

```
reference/
  index.html  approccio.html  servizi.html  eventi.html  articoli.html  contatti.html
  brand.css   # design tokens — DA RIUSARE
  site.css    # layout system (header, hero, card, form, modale, footer, responsive)
  site.js     # nav, reveal, step-form→WhatsApp, call modal, path selector, tweaks
  assets/     # immagini
```

---

## 13. Prompt pronto per Claude Code

> Sto costruendo il sito di **Andrea Bellettati — Comunicazione Cinofila**, consulente
> in comportamento e nutrizione per cani e gatti (partner Reico). In `reference/` trovi
> i **prototipi HTML/CSS/JS** (design hi-fi, da NON deployare as-is) e questo README con
> tutti i token, le pagine e i comportamenti.
>
> **Obiettivo**: ricrearli in un nuovo progetto **Astro** (TypeScript), static-first,
> mobile-first, SEO/OG curati. Riusa `brand.css` invariato come design-system.
>
> **Requisiti**
> - Layout `Base.astro` (head con meta/OG/favicon/Google Fonts: Anton, Inter, Caveat,
>   Playfair Display, JetBrains Mono) + `SiteHeader`/`SiteFooter` riusabili.
> - 6 route: Home, Approccio, Servizi, Eventi, Articoli, Contatti — fedeli ai prototipi.
> - **Articoli** ed **Eventi** come **Content Collections** Markdown (frontmatter:
>   titolo, data, cover, categoria, excerpt) + pagine indice e dettaglio.
> - Islands per: **CallModal** (placeholder slot → cal.com via costante `CAL_LINK`,
>   embed `@calcom/embed-react`), **StepForm** (3 step, validazione, submit → deep-link
>   `wa.me/393476780938` con messaggio precompilato + fallback `mailto`), **menu mobile**,
>   **path selector** (`?p=pro`). Tweaks panel opzionale.
> - Mantieni **pari peso** tra CTA "Consulenza gratuita" (→ WhatsApp/form) e
>   "Prenota una call" (→ cal.com), su Home (hero + CTA finale), Servizi e Contatti.
> - Contatti reali: WhatsApp +39 347 678 0938, andrebellettati@gmail.com,
>   IG @comunicazionecinofila.
> - Reveal-on-scroll accessibile (gated dietro `.js`, off in reduced-motion, no blank
>   above-the-fold). Hit-target ≥44px, focus states, `lang="it"`.
> - Deploy-ready per Netlify/Vercel; aggiungi sitemap, robots, JSON-LD Person/LocalBusiness.
>
> Parti dal layout + header/footer, poi Home, poi le altre pagine. Segui i token e i
> comportamenti descritti nel README; usa i `.placeholder` dove le foto reali mancano.

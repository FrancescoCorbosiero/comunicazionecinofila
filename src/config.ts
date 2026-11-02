/**
 * Configurazione centrale del sito — sorgente unica di verità per
 * contatti, link e integrazioni. Importabile sia lato server (.astro)
 * sia lato client (scripts), così non si duplicano valori in giro.
 */

/** Dominio di produzione — aggiorna qui e in astro.config.mjs. */
export const SITE = 'https://andreabellettati.it';

/** Brand */
export const SITE_NAME = 'Andrea Bellettati · Comunicazione Cinofila';
export const SITE_TAGLINE = 'Comportamento & Nutrizione · Cane e Gatto';

/** Contatti reali (cablati ovunque) */
export const WA_NUMBER = '393476780938';
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;
export const EMAIL = 'andrebellettati@gmail.com';
export const PHONE = '+393476780938';
export const PHONE_DISPLAY = '+39 347 678 0938';
export const IG_HANDLE = '@comunicazionecinofila';
export const IG_URL = 'https://www.instagram.com/comunicazionecinofila';

/**
 * Carattere dei titoli (il testo resta sempre in Bricolage). Cambia questa
 * riga e rifai il build:
 *  · 'serif-bold' — Playfair Display pieno: serif marcato, alto contrasto
 *  · 'impact'     — Anton maiuscolo: condensato e pesante, da manifesto
 *  · 'serif'      — Fraunces: serif editoriale più leggero
 *  · 'grotesk'    — Bricolage Grotesque: il carattere di prima
 */
export const TYPE_STYLE: 'serif-bold' | 'impact' | 'serif' | 'grotesk' = 'serif-bold';

/**
 * Numeri di fiducia mostrati in home ("Chi sono") e nella pagina Chi sono.
 * Aggiornali qui: valgono ovunque. Contenuti e follower vengono dal profilo
 * Instagram — da ritoccare ogni tanto, un numero vecchio non fa danni ma
 * uno gonfiato sì.
 */
export const STATS = {
  /** Anno di ingresso nel Team. */
  teamSince: 2021,
  /** Contenuti pubblicati (post Instagram). */
  posts: 385,
  /** Persone che seguono il profilo. */
  followers: 4760,
};

/** Numero all'italiana con il punto delle migliaia anche a 4 cifre (4.760). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(n);
}

/**
 * cal.com — UNICA costante per l'integrazione del calendario.
 * Finché è vuota, i pulsanti "Richiedi la tua consulenza gratuita" aprono il modale-placeholder
 * (selezione slot → conferma via WhatsApp).
 * In produzione: incolla qui es. 'andrea-bellettati/call-conoscitiva'
 * e attiva l'embed @calcom/embed-react in src/components/CallModal.astro.
 */
export const CAL_LINK = '';

/**
 * Endpoint di invio dei form (candidatura "Lavora con noi" + copia del
 * questionario consulenza — il questionario resta comunque WhatsApp-first).
 *
 * Si decide AL BUILD con la variabile d'ambiente PUBLIC_FORM_ENDPOINT:
 *  · vuota (default)                      → Netlify Forms (POST alla pagina)
 *  · '/api/form'                          → server Docker + AWS SES (Dockerfile la imposta già)
 *  · '/.netlify/functions/invia-form'     → Netlify Function + AWS SES
 * Il payload è sempre lo stesso: application/x-www-form-urlencoded con
 * `form-name`. La logica SES è in server/form-handler.mjs.
 */
export const FORM_ENDPOINT: string = import.meta.env.PUBLIC_FORM_ENDPOINT ?? '';

/** Helper: costruisce un deep-link WhatsApp con testo precompilato. */
export function waLink(text: string): string {
  return `${WA_LINK}?text=${encodeURIComponent(text)}`;
}

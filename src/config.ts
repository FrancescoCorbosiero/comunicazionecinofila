/**
 * Configurazione centrale del sito — sorgente unica di verità per
 * contatti, link e integrazioni. Importabile sia lato server (.astro)
 * sia lato client (scripts), così non si duplicano valori in giro.
 */

/** Dominio di produzione — aggiorna qui e in astro.config.mjs. */
export const SITE = 'https://www.comunicazionecinofila.it';

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
 * cal.com — UNICA costante per l'integrazione del calendario.
 * Finché è vuota, i pulsanti "Prenota una call" aprono il modale-placeholder
 * (selezione slot → conferma via WhatsApp).
 * In produzione: incolla qui es. 'andrea-bellettati/call-conoscitiva'
 * e attiva l'embed @calcom/embed-react in src/components/CallModal.astro.
 */
export const CAL_LINK = '';

/** Helper: costruisce un deep-link WhatsApp con testo precompilato. */
export function waLink(text: string): string {
  return `${WA_LINK}?text=${encodeURIComponent(text)}`;
}

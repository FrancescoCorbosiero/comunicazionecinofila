/* =====================================================================
   SEO — impostazioni centrali e helper per i dati strutturati.
   "Preparazione": qui si concentrerà la configurazione SEO definitiva
   quando i contenuti saranno reali (titoli, description, OG image dedicate…).
   ===================================================================== */
import { SITE, SITE_NAME, EMAIL, PHONE, IG_URL } from '../config';

export const DEFAULT_DESCRIPTION =
  'Consulenza in comportamento e alimentazione naturale per cani e gatti. Consulenza gratuita di 45 minuti, piano di lavoro su misura. Partner Reico Italia.';
export const DEFAULT_OG_IMAGE = '/assets/logo-original.jpg';
export const LOCALE = 'it_IT';
export const DEFAULT_ROBOTS = 'index, follow';
export const THEME_COLOR = '#7c9474';

/** Handle Twitter/X — compila quando l'account sarà attivo (es. '@...'). */
export const TWITTER_HANDLE = '';
/** Codice di verifica Google Search Console — incolla qui quando disponibile. */
export const GOOGLE_SITE_VERIFICATION = '';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE).href;
}

/** Grafo base presente su ogni pagina: Person + LocalBusiness. */
export function siteGraph(): Record<string, unknown>[] {
  return [
    {
      '@type': 'Person',
      '@id': `${SITE}/#andrea`,
      name: 'Andrea Bellettati',
      jobTitle: 'Consulente in comportamento e nutrizione per cani e gatti',
      url: SITE,
      image: absoluteUrl('/assets/logo-original.jpg'),
      sameAs: [IG_URL],
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE}/#business`,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      image: absoluteUrl('/assets/logo-original.jpg'),
      url: SITE,
      email: EMAIL,
      telephone: PHONE,
      areaServed: 'IT',
      priceRange: 'Consulenza gratuita',
      founder: { '@id': `${SITE}/#andrea` },
      sameAs: [IG_URL],
      knowsAbout: [
        'Alimentazione naturale per cani e gatti',
        'Comportamento animale',
        'Lettura delle etichette del pet food',
        'Benessere di cani e gatti',
      ],
    },
  ];
}

/** BreadcrumbList per le pagine di dettaglio. */
export function breadcrumbLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

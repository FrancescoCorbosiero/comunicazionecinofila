// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NB: aggiorna `site` con il dominio definitivo prima del deploy.
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  // TODO: confermare dominio definitivo
  site: 'https://www.andreabellettati.it',
  // /showcase è il laboratorio delle animazioni: pagina di prova, fuori dalla sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/showcase') })],
  // Font self-hosted (Fonts API, provider locale): i .woff2 (subset latin,
  // scaricati una tantum da Google Fonts / Fontsource) vivono in src/assets/fonts e vengono
  // serviti da /_astro con hash immutabile. Vantaggi:
  // · zero richieste a Google dal browser dei visitatori (privacy/GDPR);
  // · build deterministica, nessuna dipendenza di rete al deploy;
  // · fallback locali con metriche adattate (meno layout shift al caricamento).
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Anton',
      cssVariable: '--font-anton',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/anton-400.woff2'], weight: 400, style: 'normal' },
        ],
      },
    },
    {
      // Display e testo: una sola famiglia variabile (peso 200–800 + optical
      // size), così i titoli giganti e il corpo hanno lo stesso carattere.
      provider: fontProviders.local(),
      name: 'Bricolage Grotesque',
      cssVariable: '--font-bricolage',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/bricolage-grotesque-latin-opsz.woff2'],
            weight: '200 800',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Caveat',
      cssVariable: '--font-caveat',
      fallbacks: ['cursive'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/caveat-600.woff2'], weight: 600, style: 'normal' },
        ],
      },
    },
  ],
  // La vecchia pagina Contatti è stata divisa in /consulenza-gratuita e /lavora-con-noi.
  redirects: {
    '/contatti': '/consulenza-gratuita',
  },
  // Prefetch dei link interni (lavora insieme alle View Transitions del ClientRouter).
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
});

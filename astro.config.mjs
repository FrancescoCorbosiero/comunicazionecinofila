// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Dominio definitivo (anche in src/config.ts e public/robots.txt).
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  site: 'https://andreabellettati.it',
  integrations: [sitemap()],
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
      // Serif editoriale per i titoli (TYPE_STYLE = 'serif' in src/config.ts).
      provider: fontProviders.local(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/fraunces-latin-opsz.woff2'], weight: '100 900', style: 'normal' },
          { src: ['./src/assets/fonts/fraunces-latin-opsz-italic.woff2'], weight: '100 900', style: 'italic' },
        ],
      },
    },
    {
      // Serif marcato ad alto contrasto (TYPE_STYLE = 'serif-bold').
      provider: fontProviders.local(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/playfair-display-latin.woff2'], weight: '400 900', style: 'normal' },
          { src: ['./src/assets/fonts/playfair-display-latin-italic.woff2'], weight: '400 900', style: 'italic' },
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

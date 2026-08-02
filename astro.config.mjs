// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NB: aggiorna `site` con il dominio definitivo prima del deploy.
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  // TODO: confermare dominio definitivo
  site: 'https://www.andreabellettati.it',
  integrations: [sitemap()],
  // Font self-hosted (Fonts API, provider locale): i .woff2 (subset latin,
  // scaricati una tantum da Google Fonts) vivono in src/assets/fonts e vengono
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
      provider: fontProviders.local(),
      name: 'Inter',
      cssVariable: '--font-inter',
      fallbacks: ['Arial', 'sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/inter-400.woff2'], weight: 400, style: 'normal' },
          { src: ['./src/assets/fonts/inter-500.woff2'], weight: 500, style: 'normal' },
          { src: ['./src/assets/fonts/inter-600.woff2'], weight: 600, style: 'normal' },
          { src: ['./src/assets/fonts/inter-700.woff2'], weight: 700, style: 'normal' },
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
    {
      provider: fontProviders.local(),
      name: 'Cormorant Garamond',
      cssVariable: '--font-cormorant',
      fallbacks: ['Georgia', 'serif'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/cormorant-garamond-500-italic.woff2'],
            weight: 500,
            style: 'italic',
          },
          {
            src: ['./src/assets/fonts/cormorant-garamond-600-italic.woff2'],
            weight: 600,
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      fallbacks: ['Courier New', 'monospace'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/jetbrains-mono-400.woff2'], weight: 400, style: 'normal' },
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

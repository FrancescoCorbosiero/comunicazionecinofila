// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NB: aggiorna `site` con il dominio definitivo prima del deploy.
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  // TODO: confermare dominio definitivo
  site: 'https://www.andreabellettati.it',
  integrations: [sitemap()],
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

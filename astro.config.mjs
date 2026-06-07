// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NB: aggiorna `site` con il dominio definitivo prima del deploy.
// Serve a sitemap.xml, canonical e agli URL assoluti di Open Graph.
export default defineConfig({
  site: 'https://www.comunicazionecinofila.it',
  integrations: [sitemap()],
});

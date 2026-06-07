import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Content Collections in Markdown — Andrea aggiunge contenuti senza toccare codice.
 * Metti i file in src/content/articoli/*.md e src/content/eventi/*.md.
 * Il nome del file diventa lo slug della pagina di dettaglio.
 */

const articoli = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articoli' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    category: z.string(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    /** Etichetta del placeholder quando manca la foto reale (es. "FOTO · CIOTOLA"). */
    placeholderLabel: z.string().optional(),
    /** Mostrato in evidenza in cima all'indice. */
    featured: z.boolean().default(false),
    /** published = pagina on-site; coming-soon = card "Presto disponibile". */
    status: z.enum(['published', 'coming-soon']).default('published'),
    /** Se presente, i link puntano qui (es. Instagram) invece della pagina di dettaglio. */
    externalUrl: z.url().optional(),
  }),
});

const eventi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/eventi' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    /** Riga in grassetto sotto al titolo (eventi). */
    subtitle: z.string().optional(),
    /** Data/ora se l'evento è schedulato (per ordinamento e JSON-LD). */
    date: z.coerce.date().optional(),
    /** Etichetta libera quando non c'è una data (es. "Su richiesta", "In arrivo"). */
    whenLabel: z.string().optional(),
    category: z.string().optional(),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    placeholderLabel: z.string().optional(),
    featured: z.boolean().default(false),
    status: z.enum(['upcoming', 'on-request', 'coming-soon', 'past']).default('upcoming'),
    /** Pill di stato sull'immagine (es. "Prossimo · posti limitati"). */
    statusLabel: z.string().optional(),
    free: z.boolean().default(true),
    duration: z.string().optional(),
    locationLabel: z.string().optional(),
    collab: z.string().optional(),
    tags: z.array(z.string()).default([]),
    /** Testo WhatsApp precompilato per "Riserva il tuo posto". */
    reserveWaText: z.string().optional(),
    /** Link esterno (es. Instagram). */
    externalUrl: z.url().optional(),
    /** Link interno (es. /articoli) per le righe d'agenda. */
    internalUrl: z.string().optional(),
  }),
});

export const collections = { articoli, eventi };

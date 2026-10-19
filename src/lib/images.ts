/* =====================================================================
   Rilevamento build-time delle foto in public/assets.
   La convenzione dei nomi è documentata in public/assets/README.md:
   carichi il file col nome giusto → al build successivo la pagina lo usa
   da sola al posto del placeholder, senza toccare template o frontmatter.
   Gira solo lato server (frontmatter .astro): mai importarlo nei client script.
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';

const EXTS = ['jpg', 'jpeg', 'png', 'webp'] as const;

/** URL pubblico (es. "/assets/nome.jpg") se il file esiste, altrimenti undefined. */
export function publicImage(name: string): string | undefined {
  for (const ext of EXTS) {
    if (fs.existsSync(path.join(process.cwd(), 'public/assets', `${name}.${ext}`))) {
      return `/assets/${name}.${ext}`;
    }
  }
  return undefined;
}

/**
 * Cover di articoli ed eventi: vince il frontmatter `cover:` esplicito,
 * altrimenti si cerca `articolo-<slug>.*` / `evento-<slug>.*` in public/assets.
 */
export function autoCover(
  prefix: 'articolo' | 'evento',
  id: string,
  explicit?: string
): string | undefined {
  return explicit ?? publicImage(`${prefix}-${id}`);
}

/* Foto ottimizzate di src/assets (astro:assets): rilevate per nome, così una
   foto mancante non blocca la pagina — al suo posto compare il placeholder.
   Un `import foto from '../assets/x.jpg'` diretto, invece, fa fallire build e
   dev server ("ImageNotFound") se il file non c'è. */
const ASSET_PHOTOS = import.meta.glob<{ default: ImageMetadata }>('../assets/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

/** La foto src/assets/<name>.* se esiste, altrimenti undefined. */
export function assetImage(name: string): ImageMetadata | undefined {
  for (const ext of EXTS) {
    const mod = ASSET_PHOTOS[`../assets/${name}.${ext}`];
    if (mod) return mod.default;
  }
  return undefined;
}

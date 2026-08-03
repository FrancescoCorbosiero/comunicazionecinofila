/**
 * Ottimizzazione asset — favicon + foto di public/assets.
 *
 *   npm run assets
 *
 * Due compiti, entrambi idempotenti:
 * 1. Rigenera le favicon (ICO + PNG + apple-touch) e le icone del
 *    manifest a partire da public/assets/logo.jpg.
 * 2. Ricomprime le foto JPG di public/assets (mozjpeg, progressive,
 *    max 1600px): sono servite così come sono — niente pipeline Astro —
 *    e finiscono anche nelle anteprime social. WhatsApp ignora le
 *    og:image troppo pesanti, quindi restare leggeri qui è conversione.
 *    Riscrive un file solo se risparmia >10%: rilanciare lo script non
 *    degrada foto già ottimizzate.
 *
 * Usa sharp, già presente come dipendenza di Astro.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const ASSETS = path.join(ROOT, 'public/assets');
const LOGO = path.join(ASSETS, 'logo.jpg');

const CREAM = { r: 236, g: 228, b: 210 }; // --bg-cream

/** Ritaglio circolare del logo su un canvas trasparente. */
async function circleIcon(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`
  );
  return sharp(LOGO)
    .resize(size, size, { fit: 'cover' })
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Icona maskable: logo in cerchio dentro la safe-zone (80%) su fondo crema. */
async function maskableIcon(size) {
  const inner = Math.round(size * 0.78);
  const disc = await circleIcon(inner);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { ...CREAM, alpha: 1 } },
  })
    .composite([{ input: disc, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** ICO con una singola voce PNG (formato supportato ovunque). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // riservato
  header.writeUInt16LE(1, 2); // tipo: icona
  header.writeUInt16LE(1, 4); // numero voci
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size === 256 ? 0 : size, 0); // larghezza
  entry.writeUInt8(size === 256 ? 0 : size, 1); // altezza
  entry.writeUInt32LE(png.length, 8); // dimensione dati
  entry.writeUInt32LE(22, 12); // offset dati (6 + 16)
  return Buffer.concat([header, entry, png]);
}

async function generateIcons() {
  const [fav32, fav16, apple, m192, m512] = await Promise.all([
    circleIcon(32),
    circleIcon(16),
    sharp(LOGO).resize(180, 180, { fit: 'cover' }).png().toBuffer(),
    maskableIcon(192),
    maskableIcon(512),
  ]);
  await Promise.all([
    writeFile(path.join(ASSETS, 'favicon-32.png'), fav32),
    writeFile(path.join(ASSETS, 'favicon-16.png'), fav16),
    writeFile(path.join(ASSETS, 'apple-touch-icon.png'), apple),
    writeFile(path.join(ASSETS, 'icon-192.png'), m192),
    writeFile(path.join(ASSETS, 'icon-512.png'), m512),
    writeFile(path.join(ROOT, 'public/favicon.ico'), pngToIco(fav32, 32)),
  ]);
  console.log('✓ favicon + icone manifest rigenerate');
}

/* Le foto di public/assets finiscono nelle og:image: WhatsApp scarta le
   anteprime troppo pesanti, quindi si scende di qualità (mai sotto 65)
   e poi di lato finché non si sta sotto la soglia. */
const SOCIAL_BUDGET = 350 * 1024;

async function encodePhoto(input) {
  let width = 1600;
  while (true) {
    for (const quality of [80, 73, 65]) {
      const out = await sharp(input)
        .rotate() // applica l'orientamento EXIF prima di scartare i metadati
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true, progressive: true })
        .toBuffer();
      if (out.length <= SOCIAL_BUDGET || (quality === 65 && width <= 1280)) return out;
    }
    width -= 160;
  }
}

async function optimizePhotos() {
  const files = (await readdir(ASSETS)).filter((f) => /\.jpe?g$/i.test(f));
  for (const file of files) {
    const full = path.join(ASSETS, file);
    const before = (await stat(full)).size;
    const input = await readFile(full);
    const out = await encodePhoto(input);
    const saved = 1 - out.length / before;
    if (saved > 0.1) {
      await writeFile(full, out);
      console.log(
        `✓ ${file}: ${(before / 1024).toFixed(0)}kB → ${(out.length / 1024).toFixed(0)}kB (−${Math.round(saved * 100)}%)`
      );
    } else {
      console.log(`· ${file}: già ottimizzata (${(before / 1024).toFixed(0)}kB)`);
    }
  }
}

await generateIcons();
await optimizePhotos();

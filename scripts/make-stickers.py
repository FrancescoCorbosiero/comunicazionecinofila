"""
Sticker fustellati — foto vere scontornate, con il bordo bianco da sticker.

    pip install "rembg[cpu]" scipy
    python scripts/make-stickers.py

Scontorna le foto con rembg (modello BiRefNet, scaricato al primo uso),
pulisce la maschera (via i pezzetti staccati e i fili d'erba), aggiunge un
bordo bianco pieno e salva in src/assets/stickers/*.webp: da lì le pagine
li usano con <Sticker src={...} /> (components/Sticker.astro), e Astro ne
genera le varianti responsive al build.

Per cambiare uno sticker: sostituisci la foto sorgente (stesso nome) e
rilancia lo script. Le sorgenti sono le foto originali del design handoff
(alta risoluzione), non le copie ottimizzate in public/assets.
"""
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design_handoff_sito_andrea' / 'reference' / 'assets'
OUT = ROOT / 'src' / 'assets' / 'stickers'
MODEL = 'birefnet-general-lite'

# nome sticker → (foto sorgente, lato massimo in px, taglio verticale opzionale)
# Il taglio separa due soggetti che si toccano: (x_da, x_a, "left"/"right").
STICKERS = {
    'andrea-fiume': ('andrea-1.jpg', 1000, None),
    'andrea-segugio': ('andrea-2.jpg', 900, None),
    'cani': ('andrea-3.jpg', 1100, None),
    'segugio': ('andrea-3.jpg', 900, (1040, 1052, 'left')),
    'bassotto': ('andrea-3.jpg', 700, (1040, 1052, 'right')),
}


def disk(r: int) -> np.ndarray:
    y, x = np.ogrid[-r : r + 1, -r : r + 1]
    return x * x + y * y <= r * r


def clean_mask(alpha: np.ndarray, keep_ratio: float = 0.04) -> np.ndarray:
    """Maschera binaria senza briciole: apertura morfologica + solo i pezzi grandi."""
    m = ndi.binary_opening(alpha > 110, structure=disk(2))
    lab, n = ndi.label(m)
    if n == 0:
        return m
    sizes = ndi.sum(m, lab, range(1, n + 1))
    keep = [i + 1 for i, s in enumerate(sizes) if s >= sizes.max() * keep_ratio]
    return ndi.binary_fill_holes(np.isin(lab, keep))


def split(mask: np.ndarray, x0: int, x1: int, side: str) -> np.ndarray:
    """Tiene solo il soggetto a sinistra o a destra di una striscia verticale."""
    cut = mask.copy()
    cut[:, x0:x1] = False
    lab, n = ndi.label(cut)
    sizes = ndi.sum(cut, lab, range(1, n + 1))
    parts = sorted((i + 1 for i, s in enumerate(sizes) if s > 20000), key=lambda i: np.where(lab == i)[1].mean())
    keep = np.isin(lab, [parts[0] if side == 'left' else parts[-1]])
    strip = mask & ~cut
    cols = np.arange(mask.shape[1])[None, :]
    mid = (x0 + x1) // 2
    keep |= strip & ((cols < mid) if side == 'left' else (cols >= mid))
    return ndi.binary_fill_holes(keep)


def sticker(rgba: Image.Image, mask: np.ndarray, out: Path, max_side: int, border_ratio: float = 0.018) -> None:
    a = np.array(rgba).astype(np.float32)
    ys, xs = np.where(mask)
    r = max(6, int(max(np.ptp(ys), np.ptp(xs)) * border_ratio))
    pad = r + 8
    A = np.pad(a, ((pad, pad), (pad, pad), (0, 0)))
    M = np.pad(mask, pad)
    # Il soggetto tiene le sfumature originali solo dentro la maschera pulita.
    soft = ndi.gaussian_filter(M.astype(np.float32), 1.0)
    subj = np.minimum(A[..., 3] / 255.0, np.clip(soft * 1.4, 0, 1))
    # Bordo: dilatazione a disco, arrotondata e con antialias.
    edge = ndi.binary_dilation(M, structure=disk(r))
    edge = ndi.gaussian_filter(edge.astype(np.float32), r * 0.35) > 0.5
    edge = np.clip(ndi.gaussian_filter(edge.astype(np.float32), 0.8), 0, 1)
    rgb = A[..., :3] * subj[..., None] + 255 * (1 - subj[..., None])
    img = Image.fromarray(np.dstack([rgb, np.maximum(edge, subj) * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    img = img.crop(img.getbbox())
    img.thumbnail((max_side, max_side), Image.LANCZOS)
    img.save(out, 'WEBP', quality=88, method=6)
    print(f'{out.relative_to(ROOT)}  {img.size[0]}×{img.size[1]}')


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    session = new_session(MODEL)
    cutouts: dict[str, Image.Image] = {}
    for name, (src, max_side, cut) in STICKERS.items():
        if src not in cutouts:
            cutouts[src] = remove(Image.open(SRC / src).convert('RGB'), session=session, post_process_mask=True)
        rgba = cutouts[src].convert('RGBA')
        mask = clean_mask(np.array(rgba)[..., 3].astype(np.float32))
        if cut:
            mask = split(mask, *cut)
        sticker(rgba, mask, OUT / f'{name}.webp', max_side)


if __name__ == '__main__':
    main()

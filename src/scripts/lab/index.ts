/* =====================================================================
   Laboratorio (/showcase) — le animazioni belle che sul sito non usiamo.
   Ogni demo è una funzione (palco) => pulizia, montata quando la pagina
   entra (anche con le navigazioni soft del ClientRouter) e smontata su
   astro:before-swap. Ognuna vive nel suo gsap.context; i cicli continui
   (rAF, WebGL, fisica) girano solo mentre la demo è a schermo. Con
   prefers-reduced-motion non parte nulla: resta lo stato fermo.
   Questo script lo carica solo la pagina /showcase: i plugin pesanti
   (Flip, Draggable, Inertia, MorphSVG, ScrambleText) non toccano il sito.
   ===================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduced, type Demo } from './kit';
import { decode, liquid, torch, lookbook, steps, trail } from './tone';
import { particles, zoom, water, board, carousel, box } from './heavy';
import { morph, flip, swipe, tag, breath } from './homeless';

const DEMOS: Record<string, Demo> = {
  decode,
  liquid,
  torch,
  lookbook,
  steps,
  trail,
  particles,
  zoom,
  water,
  board,
  carousel,
  box,
  morph,
  flip,
  swipe,
  tag,
  breath,
};

let page: Element | null = null;
let mounted: (() => void)[] = [];

function mount(): void {
  const root = document.querySelector('[data-lab-page]');
  if (!root || root === page) return;
  unmount();
  page = root;
  if (reduced()) return;
  document.querySelectorAll<HTMLElement>('[data-lab]').forEach((stage) => {
    const demo = DEMOS[stage.dataset.lab ?? ''];
    if (!demo) return;
    let cleanup: void | (() => void);
    const ctx = gsap.context(() => {
      try {
        cleanup = demo(stage);
      } catch (err) {
        // Una demo che si rompe non deve portarsi dietro le altre.
        console.warn(`[lab] ${stage.dataset.lab}:`, err);
      }
    }, stage);
    mounted.push(() => {
      cleanup?.();
      ctx.revert();
    });
  });
  // Il "Dentro la lettera" aggiunge una sezione pinnata: tutti si rimisurano.
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

function unmount(): void {
  mounted.forEach((fn) => fn());
  mounted = [];
  page = null;
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', unmount);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
else mount();

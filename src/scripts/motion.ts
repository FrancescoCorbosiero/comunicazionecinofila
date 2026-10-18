/* =====================================================================
   Andrea Bellettati — motore delle animazioni.
   GSAP (ScrollTrigger + SplitText) con Lenis per lo scroll morbido.

   Stessa architettura del motore di alpacode, con un altro carattere:
   il pubblico arriva dai social, ama cani e gatti e si lascia
   incuriosire. Oltre alle rivelazioni "eleganti" ci sono intere sezioni
   raccontate dallo scroll (pinnate e scrubbate) ed effetti da toccare
   con mano: zampe dietro al mouse, sticker che cadono e rimbalzano,
   carte che si inclinano, coriandoli di zampe e cuori quando un form va
   a buon fine.

   La metà CSS vive in styles/motion.css (intro above-the-fold e stati)
   e in styles/sections.css (le sezioni delle landing).

   API ad attributi per il markup:
   ─ Rivelazioni
     data-reveal            blocco — sale e appare quando entra
       .stagger             … i figli entrano a cascata, con un rimbalzo
     data-split[="var"]     titolo — righe, parole, lettere… (lines, pop,
                            wipe, chars, blur; default: a turno)
     data-scrub             paragrafo — le parole si accendono con lo scroll
     data-hl                <mark> — l'evidenziatore passa quando entra
     data-pop               icona — entra con un timbro elastico
     data-stamp             timbro — sbatte sul biglietto quando entra
     data-draw              svg — i tracciati si disegnano da soli
     data-count="2021"      numero — conta fino al valore (data-count-from)
   ─ Sezioni guidate dallo scroll
     data-hero-zoom         hero home: la foto nella "ciotola" si allarga a
                            tutto schermo mentre la sezione resta ferma
     data-stories           "stories": barre che si riempiono, slide che
                            scorrono (con [data-story-slide] e [data-story-bar])
     data-stack             card che si impilano ([data-stack-card])
     data-strike            titolo pinnato: una parola viene barrata a mano
                            e sostituita (<del> + <ins> + [data-strike-path])
     data-hscroll           galleria orizzontale pinnata su desktop
                            ([data-hscroll-track], [data-hscroll-bar])
     data-rail              binario che si riempie, tappe che si accendono
                            ([data-rail-step])
     data-marquee           nastro che segue velocità e verso dello scroll
     data-peek              sticker che spunta dal fondo della sezione
     data-spin              badge che gira con lo scroll
     data-parallax[="40"]   deriva verticale in px; data-parallax-cover per
                            le img dentro .parallax-cover
     data-speed="0.2"       deriva in frazione della propria altezza
     data-hero-away         contenuto hero che si allontana scrollando
   ─ Da toccare
     data-tilt              carta in 3D verso il puntatore (.card già da sé)
     data-magnetic          elemento attirato dal puntatore
     data-paw-trail         impronte di zampa dietro al mouse / al tap
     data-path-row          riga indice: la miniatura segue il puntatore
     data-sticker-wall      sticker che cadono e rimbalzano quando entri
     data-float             sticker che ondeggiano piano
     data-lens="url"        lente d'ingrandimento sull'immagine
     data-pet               ritratto — scodinzola, cuori al click
     data-wordmark          wordmark del footer: lettere che salgono

   Regole della casa (come su alpacode):
   - Niente è nascosto dal CSS. Lo stato di partenza lo mette questo
     script, solo sotto la piega: senza JS la pagina è statica e completa
     (le sezioni pinnate mostrano già lo stato finale).
   - A fine rivelazione il controllo torna al CSS (clearProps).
   - Astro ClientRouter: tutto nasce per pagina dentro gsap.context() e
     gsap.matchMedia() e viene revertito su astro:before-swap.
   - prefers-reduced-motion: niente Lenis, niente animazioni; le funzioni
     esportate (step dei form, coriandoli…) diventano no-op.
   ===================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = (): boolean => reducedQuery.matches;
/* Tilt, magneti, lente e scia di zampe hanno senso solo con un mouse. */
const fineQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
const fine = (): boolean => fineQuery.matches;
/* Sezioni pinnate "grandi": solo dove c'è spazio per raccontarle. */
const DESKTOP = '(min-width: 900px)';
const MOBILE = '(max-width: 899px)';

const EASE = 'power4.out';

/* ── Forme decorative (zampa, cuore, osso) ──────────────────────── */
const PAW =
  '<svg viewBox="0 0 50 44" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="15" rx="4.3" ry="5.8"/><ellipse cx="21" cy="10" rx="4.3" ry="6"/><ellipse cx="30" cy="11" rx="4.3" ry="6"/><ellipse cx="38.5" cy="16" rx="4.3" ry="5.6"/><ellipse cx="25" cy="29" rx="9.5" ry="8"/></svg>';
const HEART =
  '<svg viewBox="0 0 24 22" fill="currentColor" aria-hidden="true"><path d="M12 21.5S1.5 15 1.5 7.6C1.5 4 4.2 1.5 7.3 1.5c2 0 3.7 1 4.7 2.6 1-1.6 2.7-2.6 4.7-2.6 3.1 0 5.8 2.5 5.8 6.1C22.5 15 12 21.5 12 21.5Z"/></svg>';
const BONE =
  '<svg viewBox="0 0 44 20" fill="currentColor" aria-hidden="true"><path d="M9 1.5a5 5 0 0 0-4.6 6.9A5 5 0 1 0 9.6 16H34.4a5 5 0 1 0 5.2-7.6A5 5 0 1 0 31 5.2H13A5 5 0 0 0 9 1.5Z"/></svg>';
const CONFETTI_COLORS = ['var(--peach)', 'var(--peach-deep)', 'var(--sage)', 'var(--ochre)', 'var(--olive-deep)'];

/* ── Selettori ──────────────────────────────────────────────────── */
const HEADINGS = [
  '.head-block h2',
  '.split-body h2',
  '.cta-band h2',
  '.booking-card h2',
  '.form-card h2',
  '[data-split]',
].join(',');

const BLOCKS = '[data-reveal]:not(.stagger), [data-reveal].stagger > *';
const TILTS = '.card, [data-tilt]';
const MAGNETS = '[data-magnetic]';

/* ── Helper ─────────────────────────────────────────────────────── */
/** Vero se l'elemento parte dentro (o sopra) il primo schermo: quelli
 *  si lasciano stare, nasconderli ora farebbe sparire contenuto già dipinto. */
const inFirstView = (el: Element): boolean => el.getBoundingClientRect().top < window.innerHeight * 0.92;

/** Gli elementi con intro CSS si sono già mossi: giù le mani. */
const skipIntro = (el: Element): boolean => !!el.closest('.intro-lines, [data-intro], [data-hero-zoom]');

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/* ── Lenis ──────────────────────────────────────────────────────── */
let lenis: Lenis | null = null;

function createLenis(): void {
  if (lenis || reduced()) return;
  lenis = new Lenis({
    lerp: 0.1,
    // I pannelli scrollabili (modale, menu mobile) scorrono nativi sotto il puntatore.
    allowNestedScroll: true,
    prevent: (node) => node.matches('.call-modal, .call-dialog, [data-nav]'),
  });
  lenis.on('scroll', ScrollTrigger.update);
}

function destroyLenis(): void {
  lenis?.destroy();
  lenis = null;
}

gsap.ticker.add((time) => lenis?.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/** Ferma/riprende lo scroll della pagina (modale o menu aperti). */
export function lockScroll(locked: boolean): void {
  if (locked) lenis?.stop();
  else lenis?.start();
}

/** Scorre fino a un elemento o a una posizione, morbido quando Lenis gira. */
export function scrollToTarget(target: HTMLElement | number): void {
  if (lenis) {
    let offset = -16;
    if (typeof target !== 'number' && target.getBoundingClientRect().top < 0) {
      // Risalendo l'header ricompare: lasciagli spazio.
      offset -= document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0;
    }
    lenis.scrollTo(target, { offset, duration: 1.3 });
    return;
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target, behavior: reduced() ? 'auto' : 'smooth' });
  } else {
    target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
  }
}

/* Le ancore della stessa pagina (#candidatura…) scivolano invece di
   saltare. In capture, così il router di Astro vede defaultPrevented. */
document.addEventListener(
  'click',
  (e) => {
    if (!lenis || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href*="#"]') : null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(history.state, '', url.hash);
  },
  true
);

/* ── Livello effetti (coriandoli) ───────────────────────────────── */
function fxLayer(): HTMLElement {
  let layer = document.querySelector<HTMLElement>('.fx-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

/** Esplosione di zampe, cuori e ossa dal centro di un elemento. */
export function celebrate(origin: Element, opts: { count?: number; shapes?: string[]; spread?: number } = {}): void {
  if (reduced()) return;
  const { count = 26, shapes = [PAW, HEART, BONE], spread = 1 } = opts;
  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const layer = fxLayer();
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('span');
    bit.className = 'fx-bit';
    bit.innerHTML = shapes[i % shapes.length];
    bit.style.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    layer.appendChild(bit);
    const angle = (i / count) * Math.PI * 2 + gsap.utils.random(-0.3, 0.3);
    const dist = gsap.utils.random(90, 220) * spread;
    const size = gsap.utils.random(14, 30);
    gsap.set(bit, { left: cx, top: cy, width: size, height: size, xPercent: -50, yPercent: -50, scale: 0 });
    gsap
      .timeline({ onComplete: () => bit.remove() })
      .to(bit, {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 60 * spread,
        scale: 1,
        rotation: gsap.utils.random(-140, 140),
        duration: gsap.utils.random(0.55, 0.85),
        ease: 'power3.out',
      })
      .to(bit, {
        y: `+=${gsap.utils.random(160, 320)}`,
        rotation: `+=${gsap.utils.random(-90, 90)}`,
        opacity: 0,
        duration: gsap.utils.random(0.9, 1.4),
        ease: 'power1.in',
      });
  }
}

/** Un'oscillazione da medaglietta appesa al collare (mirror della consulenza). */
export function swing(el: Element): void {
  if (reduced()) return;
  gsap.fromTo(
    el,
    { rotation: 0 },
    { keyframes: { rotation: [-7, 5, -3, 1.5, 0] }, duration: 0.9, ease: 'none', overwrite: 'auto', transformOrigin: '50% -12%' }
  );
}

/* ── Form a step: transizioni, zampa che salta, errori ──────────── */
/** Il pannello entra dal lato giusto, i campi a cascata. dir: 1 avanti, -1 indietro. */
export function stepEnter(panel: HTMLElement, dir: number): void {
  if (reduced()) return;
  gsap.fromTo(
    panel,
    { x: 56 * dir, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out', clearProps: 'transform,opacity' }
  );
  gsap.from(panel.querySelectorAll('.step-q, .field, .step-nav'), {
    y: 18,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.06,
    delay: 0.08,
    clearProps: 'transform,opacity',
  });
}

/** Una zampina salta di passo in passo sopra la barra di avanzamento. */
export function stepProgress(form: HTMLElement, index: number, animate: boolean): void {
  if (reduced()) return;
  const head = form.querySelector<HTMLElement>('.steps-head');
  const dots = form.querySelectorAll<HTMLElement>('.step-dot');
  const dot = dots[index];
  if (!head || !dot || !head.offsetWidth) return;
  let runner = head.querySelector<HTMLElement>('.step-runner');
  if (!runner) {
    runner = document.createElement('span');
    runner.className = 'step-runner';
    runner.setAttribute('aria-hidden', 'true');
    runner.innerHTML = PAW;
    head.appendChild(runner);
  }
  // In percentuale: la zampina resta al suo posto anche se la card cambia larghezza.
  const left = `${(((dot.offsetLeft + dot.offsetWidth / 2) / head.offsetWidth) * 100).toFixed(2)}%`;
  if (!animate) {
    gsap.set(runner, { left, xPercent: -50 });
    return;
  }
  gsap.to(runner, { left, xPercent: -50, duration: 0.7, ease: 'power2.inOut' });
  gsap.to(runner, { keyframes: { y: [0, -16, 0], rotation: [0, -18, 0] }, duration: 0.7, ease: 'none' });
  gsap.fromTo(dot, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 0.6, ease: 'power3.out', clearProps: 'transform' });
}

/** Scossa "no-no" sui campi che non vanno. */
export function nudge(fields: Element[]): void {
  if (reduced() || !fields.length) return;
  gsap.fromTo(fields, { x: 0 }, { keyframes: { x: [-10, 9, -6, 4, 0] }, duration: 0.45, ease: 'none', clearProps: 'transform' });
}

/** Conferma di invio: la spunta si disegna, poi festa. */
export function successBurst(success: HTMLElement): void {
  if (reduced()) return;
  const check = success.querySelector<HTMLElement>('.success-check');
  const path = success.querySelector<SVGPathElement>('.success-check path');
  if (check) gsap.from(check, { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(2.2)' });
  if (path) {
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.6, delay: 0.35, ease: 'power2.out' });
  }
  gsap.delayedCall(0.4, () => celebrate(check ?? success));
}

/* ── Header: si nasconde leggendo verso il basso ─────────────────── */
let lastY = 0;
function onScroll(): void {
  const y = window.scrollY;
  const header = document.querySelector<HTMLElement>('.site-header');
  if (header && !reduced()) {
    const navOpen = !!document.querySelector('[data-nav].open');
    if (!navOpen && y > 260 && y > lastY + 4) header.classList.add('is-hidden');
    else if (navOpen || y < lastY - 4 || y <= 260) header.classList.remove('is-hidden');
  }
  lastY = y;
}
window.addEventListener('scroll', onScroll, { passive: true });

/* ── Effetti per pagina ─────────────────────────────────────────── */
let ctx: gsap.Context | null = null;
let mm: gsap.MatchMedia | null = null;
let pageBody: HTMLElement | null = null;
let cleanups: (() => void)[] = [];

/** Listener con pulizia automatica allo swap di pagina. */
function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  fn: (e: HTMLElementEventMap[K]) => void,
  opts?: AddEventListenerOptions
): void {
  el.addEventListener(type, fn, opts);
  cleanups.push(() => el.removeEventListener(type, fn, opts));
}

/* I titoli non entrano tutti allo stesso modo: ognuno riceve una
   variante, richiesta (data-split="pop") o distribuita a turno lungo
   la pagina, così due sezioni vicine non ripetono la stessa mossa.
     lines  ogni riga sale dalla sua maschera
     pop    le parole saltano su con un rimbalzo e un filo di rotazione
     wipe   ogni riga si scopre da sinistra a destra
     chars  le lettere cadono e rimbalzano (solo titoli brevi)
     blur   le righe vanno a fuoco salendo */
type HeadingVariant = 'lines' | 'pop' | 'wipe' | 'chars' | 'blur';
const CYCLE: HeadingVariant[] = ['lines', 'pop', 'wipe', 'chars', 'blur'];

function headingVariant(el: HTMLElement, index: number): HeadingVariant {
  const asked = el.dataset.split as HeadingVariant | undefined;
  if (asked && CYCLE.includes(asked)) return asked;
  const v = CYCLE[index % CYCLE.length];
  // Lettera per lettera si legge bene solo su poche parole.
  return v === 'chars' && (el.textContent ?? '').trim().length > 28 ? 'pop' : v;
}

function headingTween(self: SplitText, v: HeadingVariant, trigger: HTMLElement): gsap.core.Tween {
  const scrollTrigger = { trigger, start: 'top 88%', once: true };
  switch (v) {
    case 'pop':
      return gsap.from(self.words, {
        opacity: 0,
        y: 46,
        scale: 0.6,
        rotation: () => gsap.utils.random(-12, 12),
        duration: 0.9,
        ease: 'back.out(2.2)',
        stagger: 0.05,
        scrollTrigger,
      });
    case 'wipe':
      return gsap.fromTo(
        self.lines,
        { clipPath: 'inset(-20% 100% -20% 0%)' },
        { clipPath: 'inset(-20% 0% -20% 0%)', duration: 1.2, ease: 'power3.inOut', stagger: 0.12, clearProps: 'clipPath', scrollTrigger }
      );
    case 'chars':
      return gsap.from(self.chars, {
        opacity: 0,
        yPercent: -90,
        rotation: () => gsap.utils.random(-25, 25),
        duration: 1.1,
        ease: 'elastic.out(1, 0.55)',
        stagger: 0.03,
        scrollTrigger,
      });
    case 'blur':
      return gsap.from(self.lines, {
        opacity: 0,
        y: 28,
        filter: 'blur(14px)',
        duration: 1.2,
        ease: 'power2.out',
        stagger: 0.1,
        clearProps: 'filter',
        scrollTrigger,
      });
    default:
      return gsap.from(self.lines, { yPercent: 115, duration: 1.15, ease: EASE, stagger: 0.09, scrollTrigger });
  }
}

function splitHeadings(): void {
  let n = 0;
  gsap.utils.toArray<HTMLElement>(HEADINGS).forEach((el) => {
    if (skipIntro(el) || inFirstView(el) || el.closest('[data-strike]')) return;
    const v = headingVariant(el, n++);
    SplitText.create(el, {
      type: v === 'pop' ? 'words,lines' : v === 'chars' ? 'chars,words' : 'lines',
      mask: v === 'lines' ? 'lines' : undefined,
      linesClass: 'split-line',
      wordsClass: 'split-word',
      autoSplit: true,
      onSplit: (self) => headingTween(self, v, el),
    });
    // La parola in corsivo (Caveat) arriva per ultima, con la sua sottolineatura a mano.
    el.querySelectorAll<HTMLElement>('.script').forEach((s) => {
      gsap.fromTo(
        s,
        { '--draw': 0, rotation: -8, scale: 0.7 },
        {
          '--draw': 1,
          rotation: 0,
          scale: 1,
          duration: 1.2,
          delay: 0.45,
          ease: 'elastic.out(1, 0.5)',
          clearProps: 'transform',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }
      );
    });
  });
}

function revealBlocks(): void {
  const blocks = gsap.utils.toArray<HTMLElement>(BLOCKS).filter((el) => !skipIntro(el) && !inFirstView(el));
  if (!blocks.length) return;
  const isChild = (el: HTMLElement) => !!el.parentElement?.matches('[data-reveal].stagger');
  blocks.forEach((el) => {
    gsap.set(el, isChild(el) ? { opacity: 0, y: 54, scale: 0.94, transition: 'none' } : { opacity: 0, y: 44, transition: 'none' });
    el.setAttribute('data-motion-pending', '');
  });
  ScrollTrigger.batch(blocks, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => {
      const els = batch as HTMLElement[];
      els.forEach((el) => el.removeAttribute('data-motion-pending'));
      // Un salto (ancora, ricerca nella pagina) consegna in un colpo tutti i
      // blocchi scavalcati: quelli già sopra al viewport compaiono subito.
      const passed = els.filter((el) => el.getBoundingClientRect().bottom < 0);
      const entering = els.filter((el) => !passed.includes(el));
      if (passed.length) gsap.set(passed, { overwrite: true, clearProps: 'opacity,transform,transition' });
      if (!entering.length) return;
      const stagger = entering.length > 5 ? { amount: 0.5 } : 0.1;
      const done = { overwrite: true, clearProps: 'opacity,transform,transition' } as const;
      const blocksIn = entering.filter((el) => !isChild(el));
      const childrenIn = entering.filter(isChild);
      if (blocksIn.length) gsap.to(blocksIn, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger, ...done });
      // I figli delle griglie atterrano con un piccolo rimbalzo.
      if (childrenIn.length) {
        gsap.to(childrenIn, { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'back.out(1.6)', stagger, ...done });
      }
    },
  });
}

/* Le foto si aprono da un ritaglio (l'img dentro ha già il suo parallax). */
function revealImages(): void {
  gsap.utils.toArray<HTMLElement>('.split-media, .svc-block-media, [data-clip]').forEach((box) => {
    if (skipIntro(box) || inFirstView(box)) return;
    gsap.fromTo(
      box,
      { clipPath: 'inset(14% 8% 14% 8% round 24px)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        duration: 1.5,
        ease: EASE,
        clearProps: 'clipPath',
        scrollTrigger: { trigger: box, start: 'top 88%', once: true },
      }
    );
  });
}

function scrubStatements(): void {
  gsap.utils.toArray<HTMLElement>('[data-scrub]').forEach((el) => {
    SplitText.create(el, {
      type: 'words',
      wordsClass: 'scrub-word',
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(
          self.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: 0.6 },
          }
        ),
    });
  });
}

/* Parallax: [data-parallax="N"] deriva di ±N/1.3 px attraverso lo schermo;
   [data-parallax-cover] (img pre-scalata a 1.24 in effects.css) di ±10%;
   [data-speed="0.2"] di una frazione della propria altezza. */
function parallax(): void {
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const scrollTrigger = { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true };
    if (el.hasAttribute('data-parallax-cover')) {
      gsap.fromTo(el, { yPercent: -10, scale: 1.24 }, { yPercent: 10, scale: 1.24, ease: 'none', scrollTrigger });
      return;
    }
    const s = (parseFloat(el.dataset.parallax ?? '') || 40) / 1.3;
    gsap.fromTo(el, { y: -s }, { y: s, ease: 'none', scrollTrigger });
  });
  gsap.utils.toArray<HTMLElement>('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed ?? '0.15') || 0.15;
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      { yPercent: speed * 50, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }
    );
  });
}

/* Sticker che ondeggiano piano, ognuno col suo tempo. */
function floaters(): void {
  gsap.utils.toArray<HTMLElement>('[data-float]').forEach((el, i) => {
    gsap.to(el, {
      y: '+=14',
      rotation: i % 2 ? '+=4' : '-=4',
      duration: gsap.utils.random(2.2, 3.2),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: gsap.utils.random(0, 1.5),
    });
  });
}

/* ── Hero home: la "ciotola" ─────────────────────────────────────────
   La foto di Andrea e del bassotto sta in un cerchio pesca, come una
   ciotola vista dall'alto. Scrollando la sezione resta ferma e il cerchio
   si allarga fino a riempire lo schermo, mentre la foto torna alla sua
   scala piena: si entra nella foto. La geometria iniziale la decide il
   CSS (variabili --x, --y, --r, --s, --tx, --ty sullo stage); qui si
   misura e si interpola fino allo stato finale. */
function heroZoom(media: gsap.MatchMedia): void {
  const stage = document.querySelector<HTMLElement>('[data-hero-zoom]');
  if (!stage) return;
  media.add(`${DESKTOP} and (min-height: 560px)`, () => {
    const ring = stage.querySelector<HTMLElement>('[data-zoom-ring]');
    const copy = stage.querySelectorAll<HTMLElement>('[data-zoom-out]');
    const fly = stage.querySelectorAll<HTMLElement>('[data-zoom-fly]');
    const caption = stage.querySelector<HTMLElement>('[data-zoom-caption]');
    if (!ring) return;
    const photo = stage.querySelector<HTMLElement>('[data-zoom-photo]');
    const img = photo?.querySelector('img');
    // Punto della foto da centrare nella ciotola (frazioni di larghezza/altezza).
    const [fx, fy] = (photo?.dataset.focal ?? '0.5 0.5').split(' ').map(Number);
    const geo = { x: 0, y: 0, r0: 0, r1: 0, s0: 1, tx0: 0, ty0: 0 };
    const measure = (): void => {
      // Si azzera lo stato animato per leggere la geometria di partenza.
      ['--r', '--x', '--y', '--s', '--tx', '--ty'].forEach((v) => stage.style.removeProperty(v));
      // Valori calcolati (non getBoundingClientRect): l'intro CSS scala la
      // ciotola, ma left/top/width restano quelli di riposo.
      const rcs = getComputedStyle(ring);
      const ringPad = parseFloat(getComputedStyle(stage).getPropertyValue('--ring-pad')) || 18;
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      geo.x = parseFloat(rcs.left);
      geo.y = parseFloat(rcs.top);
      geo.r0 = parseFloat(rcs.width) / 2 - ringPad;
      geo.r1 = Math.hypot(Math.max(geo.x, w - geo.x), Math.max(geo.y, h - geo.y)) + 24;
      // Dove cade il punto focale nella foto a tutto schermo (object-fit: cover).
      const iw = img?.naturalWidth || Number(img?.getAttribute('width')) || 1;
      const ih = img?.naturalHeight || Number(img?.getAttribute('height')) || 1;
      const k = Math.max(w / iw, h / ih);
      const [px, py] = (img ? getComputedStyle(img).objectPosition : '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
      const dw = iw * k;
      const dh = ih * k;
      const fxs = (w - dw) * (Number.isFinite(px) ? px : 0.5) + fx * dw;
      const fys = (h - dh) * (Number.isFinite(py) ? py : 0.5) + fy * dh;
      // Scala di partenza: la più piccola che riempie ancora tutto il cerchio
      // (mai meno di 0.55), con il punto focale portato al centro.
      geo.s0 = Math.min(1, Math.max(0.55, geo.r0 / fxs, geo.r0 / (w - fxs), geo.r0 / fys, geo.r0 / (h - fys)) * 1.02);
      geo.tx0 = geo.s0 * (geo.x - fxs);
      geo.ty0 = geo.s0 * (geo.y - fys);
    };
    const state = { p: 0 };
    const apply = (): void => {
      const p = state.p;
      const e = gsap.parseEase('power2.in')(p);
      stage.style.setProperty('--x', `${geo.x.toFixed(1)}px`);
      stage.style.setProperty('--y', `${geo.y.toFixed(1)}px`);
      stage.style.setProperty('--r', `${lerp(geo.r0, geo.r1, e).toFixed(1)}px`);
      stage.style.setProperty('--s', lerp(geo.s0, 1, p).toFixed(4));
      stage.style.setProperty('--tx', `${lerp(geo.tx0, 0, p).toFixed(1)}px`);
      stage.style.setProperty('--ty', `${lerp(geo.ty0, 0, p).toFixed(1)}px`);
    };
    measure();
    apply();
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: '+=130%',
        pin: true,
        scrub: 0.7,
        invalidateOnRefresh: true,
        onRefreshInit: () => {
          state.p = 0;
          measure();
        },
        onRefresh: apply,
      },
    });
    // fromTo con valori espliciti: all'init l'intro CSS è ancora in corso e
    // un semplice to() registrerebbe come partenza i suoi fotogrammi iniziali.
    tl.to(state, { p: 1, duration: 1, onUpdate: apply }, 0)
      .fromTo(copy, { opacity: 1, y: 0 }, { opacity: 0, y: -70, stagger: 0.03, duration: 0.32, ease: 'power1.in' }, 0.02)
      .fromTo(
        fly,
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        { y: -320, x: -160, rotation: -40, opacity: 0, duration: 0.45, ease: 'power2.in' },
        0
      )
      .fromTo(ring, { opacity: 1 }, { opacity: 0, duration: 0.3 }, 0.25);
    if (caption) tl.fromTo(caption, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.82);
    tl.to({}, { duration: 0.15 });
    return () => {
      ['--r', '--x', '--y', '--s', '--tx', '--ty'].forEach((v) => stage.style.removeProperty(v));
    };
  });
}

/* ── Galleria orizzontale pinnata (desktop) ──────────────────────────
   Su mobile resta un carosello nativo a swipe (scroll-snap in CSS). */
function hscroll(media: gsap.MatchMedia): void {
  gsap.utils.toArray<HTMLElement>('[data-hscroll]').forEach((sec) => {
    const track = sec.querySelector<HTMLElement>('[data-hscroll-track]');
    const bar = sec.querySelector<HTMLElement>('[data-hscroll-bar]');
    const viewport = track?.parentElement;
    if (!track || !viewport) return;
    media.add(DESKTOP, () => {
      sec.classList.add('is-pinned');
      const dist = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => bar?.style.setProperty('--p', self.progress.toFixed(4)),
        },
      });
      return () => {
        sec.classList.remove('is-pinned');
        bar?.style.removeProperty('--p');
      };
    });
  });
}

/* ── Stories: come su Instagram, ma guidate dallo scroll ─────────────
   Le barre in alto si riempiono, ogni slide entra da destra e spinge
   via la precedente. Senza script le slide sono una lista di card. */
function storiesScroll(media: gsap.MatchMedia): void {
  gsap.utils.toArray<HTMLElement>('[data-stories]').forEach((sec) => {
    const phone = sec.querySelector<HTMLElement>('[data-story-phone]');
    const slides = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll('[data-story-slide]'));
    const bars = gsap.utils.toArray<HTMLElement>(sec.querySelectorAll('[data-story-bar]'));
    if (!phone || slides.length < 2) return;
    media.add({ desk: DESKTOP, mob: MOBILE }, (c) => {
      const desk = Boolean(c.conditions?.desk);
      sec.classList.add('is-story');
      gsap.set(slides.slice(1), { xPercent: 104 });
      gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: desk ? sec : phone,
          start: desk ? 'top top' : 'center center',
          end: `+=${slides.length * 75}%`,
          pin: desk ? sec : phone,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      slides.forEach((slide, i) => {
        tl.to(bars[i], { scaleX: 1, duration: 1 }, i);
        const pieces = slide.querySelectorAll('[data-story-piece]');
        if (i > 0 && pieces.length) {
          tl.from(pieces, { y: 40, opacity: 0, stagger: 0.06, duration: 0.25, ease: 'power2.out' }, i + 0.02);
        }
        const next = slides[i + 1];
        if (next) {
          tl.to(slide, { xPercent: -24, scale: 0.88, rotation: -4, opacity: 0.35, duration: 0.3, ease: 'power2.inOut' }, i + 0.75).to(
            next,
            { xPercent: 0, duration: 0.3, ease: 'power2.inOut' },
            i + 0.75
          );
        }
      });
      return () => sec.classList.remove('is-story');
    });
  });
}

/* ── Card che si impilano ────────────────────────────────────────────
   Le card sono sticky in CSS (si impilano anche senza script); qui la
   card sotto si rimpicciolisce e si scurisce mentre la prossima la copre. */
function stackCards(): void {
  gsap.utils.toArray<HTMLElement>('[data-stack]').forEach((stack) => {
    const cards = gsap.utils.toArray<HTMLElement>(stack.querySelectorAll('[data-stack-card]'));
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.9 + i * 0.02,
        rotation: i % 2 ? 2.5 : -2.5,
        '--dim': 0.16,
        ease: 'none',
        scrollTrigger: {
          trigger: next,
          start: 'top bottom',
          end: () => `top ${parseFloat(getComputedStyle(next).top) || 100}px`,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    });
  });
}

/* ── Titolo barrato a mano ───────────────────────────────────────────
   "Stiamo creando ~~una rete di venditori~~ un Team." La sezione resta
   ferma mentre lo scarabocchio cancella la parola vecchia e quella
   nuova si scrive a mano. Senza script: già barrato e già scritto. */
function strikes(): void {
  gsap.utils.toArray<HTMLElement>('[data-strike]').forEach((sec) => {
    const path = sec.querySelector<SVGPathElement>('[data-strike-path]');
    const old = sec.querySelector<HTMLElement>('del');
    const neu = sec.querySelector<HTMLElement>('ins');
    if (!path || !old || !neu) return;
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(neu, { clipPath: 'inset(-30% 100% -40% -6%)' });
    gsap.set(old, { opacity: 1 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: sec, start: 'center center', end: '+=110%', pin: true, scrub: 0.6 },
    });
    tl.to(path, { strokeDashoffset: 0, duration: 1, ease: 'power1.inOut' })
      .to(old, { opacity: 0.38, duration: 0.5 }, 0.5)
      .to(neu, { clipPath: 'inset(-30% -6% -40% -6%)', duration: 1, ease: 'power1.inOut' }, 0.95)
      .fromTo(neu, { rotation: -8, scale: 0.85 }, { rotation: -3, scale: 1, duration: 0.6, ease: 'back.out(2.4)' }, 1.1)
      .to({}, { duration: 0.35 });
  });
}

/* Evidenziatore che passa sulle parole importanti. */
function highlights(): void {
  gsap.utils.toArray<HTMLElement>('[data-hl]').forEach((m) => {
    if (inFirstView(m)) return;
    gsap.fromTo(
      m,
      { '--hl': '0%' },
      { '--hl': '100%', duration: 1.1, ease: 'power2.inOut', scrollTrigger: { trigger: m, start: 'top 78%', once: true } }
    );
  });
}

/* Binario che si riempie con lo scroll; le tappe si accendono al passaggio. */
function rails(): void {
  gsap.utils.toArray<HTMLElement>('[data-rail]').forEach((root) => {
    const steps = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-rail-step]'));
    root.style.setProperty('--p', '0');
    cleanups.push(() => {
      root.style.removeProperty('--p');
      steps.forEach((s) => s.classList.remove('is-reached'));
    });
    ScrollTrigger.create({
      trigger: root,
      start: 'top 72%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (self) => {
        root.style.setProperty('--p', self.progress.toFixed(4));
        steps.forEach((s, i) => s.classList.toggle('is-reached', self.progress >= i / Math.max(1, steps.length - 1) - 0.001));
      },
    });
  });
}

/* Sticker che spuntano dal fondo della sezione mentre entra. */
function peeks(): void {
  gsap.utils.toArray<HTMLElement>('[data-peek]').forEach((el) => {
    const host = el.closest('section') ?? el;
    gsap.fromTo(
      el,
      { yPercent: 105 },
      { yPercent: 0, ease: 'none', scrollTrigger: { trigger: host, start: 'top 85%', end: 'center 60%', scrub: 0.8 } }
    );
  });
}

/* Badge circolari che girano con lo scroll. */
function spins(): void {
  gsap.utils.toArray<HTMLElement>('[data-spin]').forEach((el) => {
    gsap.to(el, {
      rotation: '+=300',
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  });
}

/* Sticker che cadono dall'alto e rimbalzano quando il muro entra. */
function stickerWalls(): void {
  gsap.utils.toArray<HTMLElement>('[data-sticker-wall]').forEach((wall) => {
    if (inFirstView(wall)) return;
    const items = wall.querySelectorAll<HTMLElement>('[data-wall-item]');
    gsap.from(items, {
      y: () => -gsap.utils.random(240, 420),
      rotation: () => gsap.utils.random(-60, 60),
      opacity: 0,
      duration: 1.15,
      ease: 'bounce.out',
      stagger: { each: 0.08, from: 'random' },
      clearProps: 'transform,opacity',
      scrollTrigger: { trigger: wall, start: 'top 78%', once: true },
    });
  });
}

/* Timbri che sbattono sul foglio. */
function stamps(): void {
  gsap.utils.toArray<HTMLElement>('[data-stamp]').forEach((el) => {
    if (inFirstView(el)) return;
    const host = el.parentElement;
    const tl = gsap.timeline({ scrollTrigger: { trigger: host ?? el, start: 'top 70%', once: true } });
    tl.from(el, { scale: 2.6, rotation: -45, opacity: 0, duration: 0.45, ease: 'power4.in' }).fromTo(
      host ?? el,
      { x: 0 },
      { keyframes: { x: [-6, 5, -3, 0] }, duration: 0.3, ease: 'none', clearProps: 'transform' }
    );
  });
}

/* Numeri che contano fino al valore (il testo statico resta quello giusto). */
function counters(): void {
  gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
    if (inFirstView(el)) return;
    const to = parseFloat(el.dataset.count ?? '');
    if (Number.isNaN(to)) return;
    const from = parseFloat(el.dataset.countFrom ?? '0') || 0;
    const original = el.textContent ?? '';
    const suffix = original.replace(/^[\d.,\s]+/, '');
    const state = { v: from };
    el.textContent = `${from}${suffix}`;
    cleanups.push(() => void (el.textContent = original));
    gsap.to(state, {
      v: to,
      duration: 1.8,
      ease: 'power2.out',
      onUpdate: () => void (el.textContent = `${Math.round(state.v)}${suffix}`),
      onComplete: () => void (el.textContent = original),
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* Icone che entrano come un timbro. */
function pops(): void {
  gsap.utils.toArray<HTMLElement>('[data-pop]').forEach((el) => {
    if (inFirstView(el)) return;
    gsap.from(el, {
      scale: 0,
      rotation: -160,
      duration: 1.3,
      ease: 'elastic.out(1, 0.45)',
      clearProps: 'transform',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

/* Scarabocchi SVG che si disegnano da soli. */
function drawPaths(): void {
  gsap.utils.toArray<SVGElement>('[data-draw]').forEach((svg) => {
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path'));
    if (!paths.length || inFirstView(svg)) return;
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
    paths.forEach((p) => {
      let len = 0;
      try {
        len = p.getTotalLength();
      } catch {
        return; // tracciato non renderizzato (es. display:none su mobile)
      }
      tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, '>-0.15');
    });
  });
}

/* Nastro di testo: scorre da solo, accelera con lo scroll e ne segue il
   verso; si ferma sotto il mouse. Guidato dal ticker solo quando è a schermo. */
function marquees(): void {
  gsap.utils.toArray<HTMLElement>('[data-marquee]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('.marquee-track');
    if (!track) return;
    track.style.animation = 'none';
    let x = 0;
    let dir = root.dataset.marquee === 'right' ? 1 : -1;
    const baseDir = dir;
    let boost = 0;
    let half = track.scrollWidth / 2;
    let active = false;
    let hovered = false;
    const BASE = 60; // px/s
    const tick = (_t: number, dt: number): void => {
      if (!active || hovered) return;
      x += dir * (BASE + boost) * (dt / 1000);
      if (x <= -half) x += half;
      else if (x > 0) x -= half;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      boost *= 0.94;
    };
    gsap.ticker.add(tick);
    const st = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (active = self.isActive),
      onRefresh: () => (half = track.scrollWidth / 2),
      onUpdate: (self) => {
        boost = Math.min(Math.abs(self.getVelocity()) * 0.35, 900);
        dir = self.direction === -1 ? -baseDir : baseDir;
      },
    });
    on(root, 'mouseenter', () => void (hovered = true));
    on(root, 'mouseleave', () => void (hovered = false));
    cleanups.push(() => {
      gsap.ticker.remove(tick);
      st.kill();
      track.style.removeProperty('transform');
      track.style.removeProperty('animation');
    });
  });
}

/* Il contenuto dell'hero si allontana e sfuma mentre la pagina sale. */
function heroAway(): void {
  gsap.utils.toArray<HTMLElement>('[data-hero-away]').forEach((el) => {
    const section = el.closest('section') ?? el;
    gsap.to(el, {
      yPercent: Number(el.dataset.heroAway) || 14,
      opacity: Number(el.dataset.heroFade ?? 0.2),
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
    });
  });
}

/* Il wordmark del footer: le lettere salgono, poi il bassotto ci salta sopra. */
function footerWordmark(): void {
  const wm = document.querySelector<HTMLElement>('[data-wordmark]');
  if (!wm || inFirstView(wm)) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: wm, start: 'top 96%', once: true } });
  tl.from(wm.querySelectorAll('.foot-char'), {
    yPercent: 115,
    rotation: () => gsap.utils.random(-14, 14),
    duration: 1,
    ease: 'back.out(1.7)',
    stagger: 0.028,
  });
  const dog = wm.querySelector('[data-foot-dog]');
  if (dog) tl.from(dog, { y: -260, rotation: -50, opacity: 0, duration: 1.1, ease: 'bounce.out' }, '-=0.55');
}

/* Carte che si inclinano verso il puntatore. */
function tiltCards(): void {
  if (!fine()) return;
  gsap.utils.toArray<HTMLElement>(TILTS).forEach((card) => {
    const rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3.out' });
    on(card, 'pointerenter', () => {
      // La transizione CSS su transform combatterebbe con GSAP: via finché si gioca.
      gsap.set(card, { transformPerspective: 900, transition: 'box-shadow .4s ease, border-color .35s ease, opacity .45s ease' });
      gsap.to(card, { y: -8, scale: 1.015, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    });
    on(card, 'pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 10);
      ry(px * 12);
    });
    on(card, 'pointerleave', () => {
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: 'elastic.out(1, 0.6)',
        overwrite: 'auto',
        clearProps: 'transform,transition',
      });
    });
  });
}

/* Elementi magnetici: si lasciano attirare e tornano a posto con una molla. */
function magnets(): void {
  if (!fine()) return;
  gsap.utils.toArray<HTMLElement>(MAGNETS).forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });
    on(el, 'pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
    });
    on(el, 'pointerleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
    });
  });
}

/* Righe dell'indice (home): la miniatura segue il puntatore. */
function pathRows(): void {
  if (!fine()) return;
  gsap.utils.toArray<HTMLElement>('[data-path-row]').forEach((row) => {
    const thumb = row.querySelector<HTMLElement>('[data-path-thumb]');
    if (!thumb) return;
    gsap.set(thumb, { xPercent: -50, yPercent: -50, scale: 0, rotation: -12 });
    const xTo = gsap.quickTo(thumb, 'x', { duration: 0.55, ease: 'power3.out' });
    const yTo = gsap.quickTo(thumb, 'y', { duration: 0.55, ease: 'power3.out' });
    const place = (e: PointerEvent): void => {
      const r = row.getBoundingClientRect();
      xTo(e.clientX - r.left);
      yTo(e.clientY - r.top);
    };
    on(row, 'pointerenter', (e) => {
      const r = row.getBoundingClientRect();
      gsap.set(thumb, { x: e.clientX - r.left, y: e.clientY - r.top });
      gsap.to(thumb, { scale: 1, rotation: gsap.utils.random(-9, 9), duration: 0.55, ease: 'back.out(2)', overwrite: 'auto' });
    });
    on(row, 'pointermove', place);
    on(row, 'pointerleave', () => gsap.to(thumb, { scale: 0, rotation: -12, duration: 0.35, ease: 'power2.in', overwrite: 'auto' }));
  });
}

/* Scia di zampe: un'impronta ogni tanti pixel, alternando destra e
   sinistra e ruotata nel verso del movimento. Su touch, un'impronta a tap. */
function pawTrails(): void {
  gsap.utils.toArray<HTMLElement>('[data-paw-trail]').forEach((section) => {
    let last: { x: number; y: number } | null = null;
    let side = 1;
    const STEP = 64;
    const stamp = (x: number, y: number, angle: number, big = false): void => {
      const paw = document.createElement('span');
      paw.className = 'paw-print';
      paw.setAttribute('aria-hidden', 'true');
      paw.innerHTML = PAW;
      section.appendChild(paw);
      // Le dita guardano avanti: l'SVG punta in alto, quindi +90°.
      const rot = (angle * 180) / Math.PI + 90;
      const off = big ? 0 : 11 * side;
      gsap.set(paw, {
        x: x + Math.cos(angle + Math.PI / 2) * off,
        y: y + Math.sin(angle + Math.PI / 2) * off,
        xPercent: -50,
        yPercent: -50,
        rotation: rot,
      });
      gsap
        .timeline({ onComplete: () => paw.remove() })
        .fromTo(paw, { scale: big ? 0.3 : 0.5, opacity: 0 }, { scale: big ? 1.6 : 1, opacity: 0.9, duration: 0.25, ease: 'back.out(3)' })
        .to(paw, { opacity: 0, scale: big ? 1.3 : 0.8, duration: 0.9, delay: big ? 0.6 : 0.45, ease: 'power1.in' });
      side *= -1;
    };
    const local = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    on(section, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const p = local(e);
      if (!last) {
        last = p;
        return;
      }
      const dx = p.x - last.x;
      const dy = p.y - last.y;
      if (Math.hypot(dx, dy) < STEP) return;
      stamp(p.x, p.y, Math.atan2(dy, dx));
      last = p;
    });
    on(section, 'pointerleave', () => void (last = null));
    on(section, 'pointerdown', (e) => {
      if ((e.target as Element).closest('a, button, input, textarea, select, label')) return;
      const p = local(e);
      stamp(p.x, p.y, -Math.PI / 2 + gsap.utils.random(-0.4, 0.4), true);
    });
  });
}

/* Lente d'ingrandimento: segue il puntatore sopra l'immagine e mostra il
   branco da vicino (stessa immagine, ingrandita, in un cerchio). */
function lenses(): void {
  if (!fine()) return;
  gsap.utils.toArray<HTMLElement>('[data-lens]').forEach((root) => {
    const src = root.dataset.lens;
    if (!src) return;
    const ZOOM = 1.9;
    const lens = document.createElement('span');
    lens.className = 'lens';
    lens.setAttribute('aria-hidden', 'true');
    lens.style.backgroundImage = `url("${src}")`;
    root.appendChild(lens);
    const hint = root.querySelector<HTMLElement>('.lens-hint');
    gsap.set(lens, { xPercent: -50, yPercent: -50, scale: 0 });
    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let shown = false;
    const tick = (): void => {
      if (!shown) return;
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      const w = root.offsetWidth;
      const h = root.offsetHeight;
      const r = lens.offsetWidth / 2;
      gsap.set(lens, { x: pos.x, y: pos.y });
      lens.style.backgroundSize = `${w * ZOOM}px ${h * ZOOM}px`;
      lens.style.backgroundPosition = `${(-(pos.x * ZOOM - r)).toFixed(1)}px ${(-(pos.y * ZOOM - r)).toFixed(1)}px`;
    };
    gsap.ticker.add(tick);
    cleanups.push(() => {
      gsap.ticker.remove(tick);
      lens.remove();
    });
    // Coordinate locali, anche quando il contenitore è scalato dallo scroll.
    const local = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const k = root.offsetWidth / r.width || 1;
      return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k };
    };
    on(root, 'pointerenter', (e) => {
      if (e.pointerType !== 'mouse') return;
      const p = local(e);
      Object.assign(target, p);
      Object.assign(pos, p);
      shown = true;
      gsap.to(lens, { scale: 1, duration: 0.55, ease: 'back.out(2)', overwrite: 'auto' });
      if (hint) gsap.to(hint, { opacity: 0, y: 8, duration: 0.3, overwrite: 'auto' });
    });
    on(root, 'pointermove', (e) => {
      if (e.pointerType === 'mouse') Object.assign(target, local(e));
    });
    on(root, 'pointerleave', () => {
      gsap.to(lens, { scale: 0, duration: 0.35, ease: 'power2.in', overwrite: 'auto', onComplete: () => void (shown = false) });
      if (hint) gsap.to(hint, { opacity: 1, y: 0, duration: 0.4, delay: 0.3, overwrite: 'auto' });
    });
  });
}

/* Ritratto da coccolare: scodinzola al passaggio, cuori al click. */
function petPortraits(): void {
  gsap.utils.toArray<HTMLElement>('[data-pet]').forEach((el) => {
    const wag = (): void => {
      gsap.fromTo(el, { rotation: 0 }, { keyframes: { rotation: [-9, 8, -5, 3, 0] }, duration: 0.7, ease: 'none', overwrite: 'auto' });
    };
    on(el, 'pointerenter', wag);
    on(el, 'click', () => {
      wag();
      celebrate(el, { count: 12, shapes: [HEART], spread: 0.7 });
    });
  });
}

/* Testo dei bottoni che "rotola" al passaggio (solo con un mouse): la
   stessa etichetta esce in alto e rientra dal basso. */
function rollButtons(): void {
  if (!fine()) return;
  document.querySelectorAll<HTMLElement>('.btn:not([data-roll]):not([data-no-roll])').forEach((btn) => {
    const texts = Array.from(btn.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (texts.length !== 1) return;
    const label = texts[0].textContent?.trim() ?? '';
    const wrap = document.createElement('span');
    wrap.className = 'btn-roll';
    wrap.dataset.label = label;
    const inner = document.createElement('span');
    inner.textContent = label;
    wrap.appendChild(inner);
    btn.replaceChild(wrap, texts[0]);
    btn.setAttribute('data-roll', '');
  });
}

/* Ciò che aspetta ancora di comparire si mostra appena ci arriva il focus da tastiera. */
document.addEventListener('focusin', (e) => {
  const pending = e.target instanceof Element && e.target.closest<HTMLElement>('[data-motion-pending]');
  if (!pending) return;
  pending.removeAttribute('data-motion-pending');
  gsap.to(pending, { opacity: 1, y: 0, scale: 1, duration: 0.3, overwrite: true, clearProps: 'opacity,transform,transition' });
});

function initPage(): void {
  if (pageBody === document.body) return; // già inizializzata per questa pagina
  teardownPage();
  pageBody = document.body;
  lastY = window.scrollY;
  if (reduced()) return;
  document.documentElement.classList.add('has-motion');
  createLenis();
  rollButtons();
  mm = gsap.matchMedia();
  const media = mm;
  ctx = gsap.context(() => {
    // Prima le sezioni pinnate, nell'ordine della pagina: i pin aggiungono
    // spazio e tutto ciò che sta sotto deve misurarsi dopo.
    heroZoom(media);
    storiesScroll(media);
    strikes();
    hscroll(media);
    stackCards();
    heroAway();
    splitHeadings();
    revealBlocks();
    revealImages();
    scrubStatements();
    parallax();
    floaters();
    highlights();
    rails();
    peeks();
    spins();
    stickerWalls();
    stamps();
    counters();
    pops();
    drawPaths();
    marquees();
    footerWordmark();
    tiltCards();
    magnets();
    pathRows();
    pawTrails();
    lenses();
    petPortraits();
  });
  ScrollTrigger.sort();
  // I font cambiano a capo e altezze: si rimisura quando sono pronti.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}

function teardownPage(): void {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  mm?.revert();
  mm = null;
  ctx?.revert();
  ctx = null;
  document.querySelector('.fx-layer')?.replaceChildren();
}

/* Immagini lazy e filtri del blog cambiano l'altezza della pagina dopo
   l'init: le posizioni dei trigger restano oneste. */
let refreshTimer = 0;
let lastHeight = 0;
new ResizeObserver(() => {
  const h = document.documentElement.scrollHeight;
  if (Math.abs(h - lastHeight) < 2) return;
  lastHeight = h;
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
}).observe(document.documentElement);

document.addEventListener('astro:before-swap', () => {
  teardownPage();
  pageBody = null;
  destroyLenis();
});
document.addEventListener('astro:after-swap', () => {
  if (!reduced()) document.documentElement.classList.add('has-motion');
});
// astro:page-load arriva dopo le navigazioni soft — e, alla prima visita,
// solo al "load" della finestra: si parte appena il DOM è pronto.
document.addEventListener('astro:page-load', initPage);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}

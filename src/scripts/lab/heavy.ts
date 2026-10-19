/* =====================================================================
   Laboratorio · 2 — Belle, ma troppo pesanti per un sito che si apre
   soprattutto dal telefono (il pubblico arriva da Instagram).
   ===================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { displayFont, listeners, local, loop, onScreen, type Demo } from './kit';

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

/* ── Particelle ─────────────────────────────────────────────────────
   La parola viene disegnata fuori schermo, campionata in qualche migliaio
   di punti e ricomposta: i punti scappano dal puntatore e tornano a casa
   con una molla. Tutto su un canvas 2D, un fill per colore. */
export const particles: Demo = (stage) => {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas');
  const word = stage.querySelector<HTMLElement>('[data-pt-word]');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !word || !ctx) return;
  const { on, off } = listeners();
  const COLORS = ['#f1f2ea', '#f4a98a', '#a4b59c'];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let n = 0;
  let size = 3;
  let px = new Float32Array(0);
  let py = new Float32Array(0);
  let vx = new Float32Array(0);
  let vy = new Float32Array(0);
  let hx = new Float32Array(0);
  let hy = new Float32Array(0);
  let ends: number[] = [];
  let built = false;
  let alive = true;
  const mouse = { x: -1e4, y: -1e4 };

  const draw = (): void => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let start = 0;
    ends.forEach((end, g) => {
      ctx.fillStyle = COLORS[g];
      ctx.beginPath();
      for (let i = start; i < end; i++) ctx.rect(px[i], py[i], size, size);
      ctx.fill();
      start = end;
    });
  };

  const lp = loop(stage, (dt) => {
    if (!built) return false;
    const k = dt * 60;
    const R = Math.max(70, W * 0.085);
    const R2 = R * R;
    const damp = Math.pow(0.86, k);
    let energy = 0;
    for (let i = 0; i < n; i++) {
      let x = px[i];
      let y = py[i];
      let ux = vx[i];
      let uy = vy[i];
      const dx = x - mouse.x;
      const dy = y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R2) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 3.4 * k;
        ux += (dx / d) * f;
        uy += (dy / d) * f;
      }
      ux = (ux + (hx[i] - x) * 0.045 * k) * damp;
      uy = (uy + (hy[i] - y) * 0.045 * k) * damp;
      x += ux * k;
      y += uy * k;
      px[i] = x;
      py[i] = y;
      vx[i] = ux;
      vy[i] = uy;
      energy += Math.abs(ux) + Math.abs(uy);
    }
    draw();
    return energy / Math.max(1, n) > 0.015 || mouse.x > -1e3;
  });

  const build = async (): Promise<void> => {
    const family = await displayFont(word);
    if (!alive) return;
    const r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(1.5, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const o = offscreen.getContext('2d', { willReadFrequently: true });
    if (!o) return;
    const text = (word.textContent ?? '').trim();
    let fs = Math.min(W * 0.3, H * 0.68);
    o.font = `800 ${fs}px ${family}`;
    const tw = o.measureText(text).width;
    if (tw > W * 0.86) {
      fs *= (W * 0.86) / tw;
      o.font = `800 ${fs}px ${family}`;
    }
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillText(text, W / 2, H / 2);
    const data = o.getImageData(0, 0, W, H).data;
    // Passo di campionamento: la parola deve leggersi, ma mai oltre ~3600 punti.
    let filled = 0;
    for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (data[(y * W + x) * 4 + 3] > 128) filled++;
    const step = Math.max(4, Math.ceil(Math.sqrt((filled * 9) / 3600)));
    size = Math.max(2, step * 0.62);
    const homes: number[][] = [[], [], []];
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] <= 128) continue;
        const c = Math.random();
        homes[c < 0.62 ? 0 : c < 0.86 ? 1 : 2].push(x, y);
      }
    }
    n = homes.reduce((s, h) => s + h.length / 2, 0);
    px = new Float32Array(n);
    py = new Float32Array(n);
    vx = new Float32Array(n);
    vy = new Float32Array(n);
    hx = new Float32Array(n);
    hy = new Float32Array(n);
    ends = [];
    let i = 0;
    homes.forEach((h) => {
      for (let j = 0; j < h.length; j += 2) {
        hx[i] = h[j];
        hy[i] = h[j + 1];
        // Si parte sparpagliati: la parola si compone quando la demo entra.
        px[i] = Math.random() * W;
        py[i] = Math.random() * H;
        i++;
      }
      ends.push(i);
    });
    built = true;
    stage.classList.add('is-live');
    lp.wake();
  };
  void build();

  let resizeTimer = 0;
  let lastW = stage.clientWidth;
  const ro = new ResizeObserver(() => {
    if (Math.abs(stage.clientWidth - lastW) < 2) return;
    lastW = stage.clientWidth;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => void build(), 200);
  });
  ro.observe(stage);

  const aim = (e: PointerEvent): void => {
    const p = local(stage, e);
    mouse.x = p.x;
    mouse.y = p.y;
    lp.wake();
  };
  on(stage, 'pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.buttons) aim(e);
  });
  on(stage, 'pointerdown', aim);
  const away = (): void => {
    mouse.x = -1e4;
    mouse.y = -1e4;
  };
  on(stage, 'pointerleave', away);
  on(stage, 'pointerup', (e) => {
    if (e.pointerType !== 'mouse') away();
  });

  return () => {
    alive = false;
    off();
    lp.destroy();
    ro.disconnect();
    window.clearTimeout(resizeTimer);
    stage.classList.remove('is-live');
  };
};

/* ── Dentro la lettera ──────────────────────────────────────────────
   Il verde notte copre la foto e la lascia vedere solo dentro la parola
   (maschera SVG). Scrollando la sezione resta ferma e la parola cresce
   attorno all'asta della "i" finché la foto non riempie lo schermo. */
export const zoom: Demo = (stage) => {
  const svg = stage.querySelector<SVGSVGElement>('[data-zm-svg]');
  const text = stage.querySelector<SVGTextElement>('[data-zm-word]');
  const rects = stage.querySelectorAll<SVGRectElement>('[data-zm-rect]');
  const photo = stage.querySelector<HTMLElement>('[data-zm-photo]');
  const caption = stage.querySelector<HTMLElement>('[data-zm-caption]');
  const ink = stage.querySelector<SVGRectElement>('.zm-ink');
  if (!svg || !text) return;
  stage.classList.add('is-live');
  const origin = { x: 0, y: 0 };
  const layout = (): void => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    rects.forEach((r) => {
      r.setAttribute('width', String(W));
      r.setAttribute('height', String(H));
    });
    const fs = Math.min(W * 0.34, H * 0.66);
    const base = H / 2 + fs * 0.27;
    text.setAttribute('font-size', fs.toFixed(1));
    text.setAttribute('x', (W / 2).toFixed(1));
    text.setAttribute('y', base.toFixed(1));
    try {
      const ext = text.getExtentOfChar(1); // la "i" di "ciao"
      origin.x = ext.x + ext.width / 2;
      origin.y = base - fs * 0.2;
    } catch {
      origin.x = W / 2;
      origin.y = H / 2;
    }
  };
  layout();
  ScrollTrigger.addEventListener('refreshInit', layout);
  const svgOrigin = (): string => `${origin.x.toFixed(1)} ${origin.y.toFixed(1)}`;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=170%', pin: true, scrub: 1, invalidateOnRefresh: true },
  });
  // Oltre una certa misura Chrome smette di disegnare il glifo nella
  // maschera: si cresce fino a 32× e nell'ultimo tratto il verde sfuma.
  tl.fromTo(text, { scale: 1, svgOrigin }, { scale: 32, svgOrigin, duration: 1, ease: 'power3.in' }, 0);
  if (ink) tl.fromTo(ink, { opacity: 1 }, { opacity: 0, duration: 0.14, ease: 'power1.in' }, 0.84);
  if (photo) tl.fromTo(photo, { scale: 1.3 }, { scale: 1, duration: 1, ease: 'power1.out' }, 0);
  if (caption) tl.fromTo(caption, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.16 }, 0.86);
  tl.to({}, { duration: 0.2 });
  return () => {
    ScrollTrigger.removeEventListener('refreshInit', layout);
    stage.classList.remove('is-live');
  };
};

/* ── Acqua ──────────────────────────────────────────────────────────
   Filtro SVG: rumore (feTurbulence) usato come mappa di spostamento. Il
   rumore respira piano; passando sopra la corrente si fa più forte. */
export const water: Demo = (stage) => {
  const turb = stage.querySelector<SVGElement>('feTurbulence');
  const disp = stage.querySelector<SVGElement>('feDisplacementMap');
  if (!turb || !disp) return;
  const { on, off } = listeners();
  stage.classList.add('is-live');
  const flow = gsap.to(turb, { attr: { baseFrequency: '0.013 0.036' }, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
  const stop = onScreen(stage, (v) => (v ? flow.play() : flow.pause()), '100px');
  const strength = (s: number): void => {
    gsap.to(disp, { attr: { scale: s }, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
  };
  on(stage, 'pointerenter', () => strength(40));
  on(stage, 'pointerleave', () => strength(16));
  on(stage, 'pointerdown', () => strength(40));
  on(stage, 'pointerup', (e) => {
    if (e.pointerType !== 'mouse') strength(16);
  });
  return () => {
    off();
    stop();
    flow.kill();
    stage.classList.remove('is-live');
  };
};

/* ── Tavolo infinito ────────────────────────────────────────────────
   Una griglia ripetuta 2×2: trascinandola (con l'inerzia) lo spostamento
   si avvolge su se stesso e il tavolo non finisce mai. A riposo scorre
   piano da solo. */
export const board: Demo = (stage) => {
  const track = stage.querySelector<HTMLElement>('[data-bd-track]');
  const grid = stage.querySelector<HTMLElement>('[data-bd-grid]');
  if (!track || !grid) return;
  stage.classList.add('is-live');
  let gw = grid.offsetWidth;
  let gh = grid.offsetHeight;
  let wrapX = gsap.utils.wrap(-gw, 0);
  let wrapY = gsap.utils.wrap(-gh, 0);
  const pos = { x: -gw * 0.22, y: -gh * 0.18 };
  const render = (): void => void gsap.set(track, { x: wrapX(pos.x), y: wrapY(pos.y) });
  render();
  let held = false;
  const proxy = document.createElement('div');
  gsap.set(proxy, { x: pos.x, y: pos.y });
  const [drag] = Draggable.create(proxy, {
    type: 'x,y',
    trigger: stage,
    inertia: true,
    onPress() {
      held = true;
      gsap.set(proxy, { x: pos.x, y: pos.y });
      this.update();
      stage.classList.add('is-grabbing');
    },
    onDrag() {
      pos.x = this.x;
      pos.y = this.y;
      render();
    },
    onThrowUpdate() {
      pos.x = this.x;
      pos.y = this.y;
      render();
    },
    onRelease() {
      stage.classList.remove('is-grabbing');
      if (!this.isThrowing) held = false;
    },
    onThrowComplete() {
      held = false;
    },
  });
  const lp = loop(stage, (dt) => {
    if (!held) {
      pos.x -= 16 * dt;
      pos.y -= 7 * dt;
      render();
    }
  });
  const ro = new ResizeObserver(() => {
    gw = grid.offsetWidth;
    gh = grid.offsetHeight;
    wrapX = gsap.utils.wrap(-gw, 0);
    wrapY = gsap.utils.wrap(-gh, 0);
    render();
  });
  ro.observe(grid);
  return () => {
    drag.kill();
    lp.destroy();
    ro.disconnect();
    gsap.set(track, { clearProps: 'transform' });
    stage.classList.remove('is-live', 'is-grabbing');
  };
};

/* ── Giostra 3D ─────────────────────────────────────────────────────
   Le card stanno su un cilindro (CSS 3D, preserve-3d). La giostra gira
   piano da sola; trascinandola si lancia con l'inerzia. Le card che
   guardano altrove si spengono. */
export const carousel: Demo = (stage) => {
  const ring = stage.querySelector<HTMLElement>('[data-cr-ring]');
  const cards = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-cr-card]'));
  if (!ring || !cards.length) return;
  stage.classList.add('is-live');
  const stepDeg = 360 / cards.length;
  let rot = 0;
  let base = 0;
  let held = false;
  const render = (): void => {
    ring.style.setProperty('--rot', `${rot.toFixed(2)}deg`);
    cards.forEach((c, i) => {
      const a = (((i * stepDeg + rot) % 360) + 360) % 360;
      const facing = Math.cos((a * Math.PI) / 180);
      c.style.setProperty('--f', facing.toFixed(3));
    });
  };
  const proxy = document.createElement('div');
  const [drag] = Draggable.create(proxy, {
    type: 'x',
    trigger: stage,
    inertia: true,
    onPress() {
      held = true;
      base = rot;
      gsap.set(proxy, { x: 0 });
      this.update();
    },
    onDrag() {
      rot = base + this.x * 0.28;
    },
    onThrowUpdate() {
      rot = base + this.x * 0.28;
    },
    onRelease() {
      if (!this.isThrowing) held = false;
    },
    onThrowComplete() {
      held = false;
    },
  });
  const lp = loop(stage, (dt) => {
    if (!held) rot += 10 * dt;
    render();
  });
  render();
  return () => {
    drag.kill();
    lp.destroy();
    ring.style.removeProperty('--rot');
    cards.forEach((c) => c.style.removeProperty('--f'));
    stage.classList.remove('is-live');
  };
};

/* ── Scatola di sticker ─────────────────────────────────────────────
   Fisica scritta a mano: gravità, rimbalzi, urti tra cerchi e un po' di
   rotazione. Gli sticker si afferrano e si lanciano; quando tutto è
   fermo il ciclo si spegne da solo. */
interface Body {
  el: HTMLElement;
  r: number;
  m: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  a: number;
  w: number;
}

export const box: Demo = (stage) => {
  const world = stage.querySelector<HTMLElement>('[data-bx-world]');
  const els = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-bx-body]'));
  if (!world || !els.length) return;
  const { on, off } = listeners();
  stage.classList.add('is-live');
  let W = world.clientWidth;
  let H = world.clientHeight;
  const G = 2200;
  const E = 0.38;
  const rnd = gsap.utils.random;
  const bodies: Body[] = els.map((el, i) => {
    const r = el.offsetWidth / 2;
    return {
      el,
      r,
      m: r * r,
      x: rnd(r, Math.max(r + 1, W - r)),
      y: -r - i * 70 - rnd(0, 60),
      vx: rnd(-80, 80),
      vy: 0,
      a: rnd(-40, 40),
      w: rnd(-60, 60),
    };
  });
  let grabbed: Body | null = null;
  const hand = { x: 0, y: 0 };
  let calm = 0;

  const render = (): void => {
    bodies.forEach((b) => {
      b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.a.toFixed(1)}deg)`;
    });
  };
  const step = (dt: number): void => {
    for (const b of bodies) {
      if (b === grabbed) {
        b.vx = gsap.utils.clamp(-2600, 2600, (hand.x - b.x) / dt);
        b.vy = gsap.utils.clamp(-2600, 2600, (hand.y - b.y) / dt);
        b.x = hand.x;
        b.y = hand.y;
        continue;
      }
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.a += b.w * dt;
      b.w *= 0.995;
      if (b.x < b.r) {
        b.x = b.r;
        b.vx = Math.abs(b.vx) * E;
      } else if (b.x > W - b.r) {
        b.x = W - b.r;
        b.vx = -Math.abs(b.vx) * E;
      }
      if (b.y > H - b.r) {
        b.y = H - b.r;
        b.vy = -Math.abs(b.vy) * E;
        if (Math.abs(b.vy) < 30) b.vy = 0;
        b.vx *= 0.97;
        b.w = (b.vx / b.r) * 57.3; // rotola sul fondo
      }
    }
    for (let it = 0; it < 3; it++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const min = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= min * min || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const ia = a === grabbed ? 0 : 1 / a.m;
          const ib = b === grabbed ? 0 : 1 / b.m;
          const sum = ia + ib;
          if (!sum) continue;
          const push = min - d;
          a.x -= nx * push * (ia / sum);
          a.y -= ny * push * (ia / sum);
          b.x += nx * push * (ib / sum);
          b.y += ny * push * (ib / sum);
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rv < 0) {
            const jn = (-(1 + E) * rv) / sum;
            a.vx -= jn * ia * nx;
            a.vy -= jn * ia * ny;
            b.vx += jn * ib * nx;
            b.vy += jn * ib * ny;
            const tv = (b.vx - a.vx) * -ny + (b.vy - a.vy) * nx;
            a.w -= tv * 0.25;
            b.w += tv * 0.25;
          }
        }
      }
    }
  };
  const lp = loop(stage, (dt) => {
    const sub = 3;
    for (let s = 0; s < sub; s++) step(dt / sub);
    render();
    const moving = grabbed || bodies.some((b) => Math.abs(b.vx) > 6 || Math.abs(b.vy) > 6 || b.y < 0);
    calm = moving ? 0 : calm + dt;
    return calm < 0.8;
  });
  render();

  const ro = new ResizeObserver(() => {
    W = world.clientWidth;
    H = world.clientHeight;
    lp.wake();
  });
  ro.observe(world);

  on(world, 'pointerdown', (e) => {
    const target = (e.target as Element).closest<HTMLElement>('[data-bx-body]');
    const b = bodies.find((x) => x.el === target);
    if (!b) return;
    grabbed = b;
    const p = local(world, e);
    hand.x = p.x;
    hand.y = p.y;
    world.setPointerCapture(e.pointerId);
    stage.classList.add('is-grabbing');
    lp.wake();
  });
  on(world, 'pointermove', (e) => {
    if (!grabbed) return;
    const p = local(world, e);
    hand.x = gsap.utils.clamp(grabbed.r, W - grabbed.r, p.x);
    hand.y = gsap.utils.clamp(-grabbed.r, H - grabbed.r, p.y);
  });
  const drop = (): void => {
    grabbed = null;
    stage.classList.remove('is-grabbing');
  };
  on(world, 'pointerup', drop);
  on(world, 'pointercancel', drop);
  const shake = stage.querySelector('[data-bx-shake]');
  if (shake) {
    on(shake, 'click', () => {
      bodies.forEach((b) => {
        b.vx += rnd(-520, 520);
        b.vy -= rnd(700, 1300);
        b.w += rnd(-300, 300);
      });
      lp.wake();
    });
  }

  return () => {
    off();
    lp.destroy();
    ro.disconnect();
    bodies.forEach((b) => b.el.style.removeProperty('transform'));
    stage.classList.remove('is-live', 'is-grabbing');
  };
};

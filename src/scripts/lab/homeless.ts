/* =====================================================================
   Laboratorio · 3 — Belle e in tono, ma senza una casa nel sito: non
   c'è (ancora) un contenuto che le giustifichi.
   ===================================================================== */
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { Flip } from 'gsap/Flip';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { fine, listeners, local, loop, onScreen, type Demo } from './kit';

gsap.registerPlugin(Draggable, Flip, MorphSVGPlugin, SplitText);

/* ── Metamorfosi ────────────────────────────────────────────────────
   Una forma che diventa un'altra (MorphSVGPlugin): zampa, cuore, osso,
   ciotola, e di nuovo zampa. Gira solo mentre è a schermo. */
export const morph: Demo = (stage) => {
  const path = stage.querySelector<SVGPathElement>('[data-mp-shape]');
  const label = stage.querySelector<HTMLElement>('[data-mp-label]');
  const targets = gsap.utils.toArray<SVGPathElement>(stage.querySelectorAll('[data-mp-target]'));
  if (!path || !targets.length) return;
  const startD = path.getAttribute('d') ?? '';
  const startFill = path.getAttribute('fill') ?? '';
  const startLabel = label?.textContent ?? '';
  const tl = gsap.timeline({ repeat: -1, paused: true });
  targets.forEach((t) => {
    tl.to(path, { morphSVG: { shape: t, shapeIndex: 'auto' }, fill: t.getAttribute('fill') ?? undefined, duration: 1.05, ease: 'expo.inOut' }, '+=1');
    if (label) {
      tl.call(() => {
        label.textContent = t.dataset.label ?? '';
        gsap.fromTo(label, { yPercent: 70, opacity: 0, rotation: -6 }, { yPercent: 0, opacity: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' });
      }, [], '<0.45');
    }
  });
  const stop = onScreen(stage, (v) => (v ? tl.play() : tl.pause()));
  return () => {
    stop();
    tl.kill();
    path.setAttribute('d', startD);
    if (startFill) path.setAttribute('fill', startFill);
    if (label) label.textContent = startLabel;
  };
};

/* ── Flip ───────────────────────────────────────────────────────────
   Cambio di disposizione animato (griglia, lista, pila, mescola) e card
   che si aprono in un dettaglio: l'immagine vola dalla card al pannello
   (stesso data-flip-id). */
export const flip: Demo = (stage) => {
  const list = stage.querySelector<HTMLElement>('[data-fl-list]');
  const detail = stage.querySelector<HTMLElement>('[data-fl-detail]');
  if (!list) return;
  const { on, off } = listeners();
  const items = (): HTMLElement[] => gsap.utils.toArray<HTMLElement>(list.querySelectorAll('[data-fl-item]'));
  const layoutBtns = gsap.utils.toArray<HTMLButtonElement>(stage.querySelectorAll('[data-fl-layout]'));
  const startLayout = list.dataset.layout ?? 'grid';
  const startOrder = items();
  stage.classList.add('is-live');

  // Durante il volo le card sono "absolute": la lista terrebbe altezza zero,
  // quindi la sua altezza passa da quella di prima a quella di dopo.
  const animate = (change: () => void): void => {
    const state = Flip.getState(items(), { props: 'borderRadius' });
    const h0 = list.offsetHeight;
    change();
    const h1 = list.offsetHeight;
    gsap.fromTo(list, { height: h0 }, { height: h1, duration: 0.8, ease: 'power3.inOut' });
    Flip.from(state, {
      duration: 0.8,
      ease: 'power3.inOut',
      stagger: 0.035,
      absolute: true,
      nested: true,
      onComplete: () => void gsap.set(list, { clearProps: 'height' }),
    });
  };
  layoutBtns.forEach((b) => {
    on(b, 'click', () => {
      const name = b.dataset.flLayout ?? 'grid';
      if (name === list.dataset.layout) return;
      animate(() => {
        list.dataset.layout = name;
        layoutBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
    });
  });
  const shuffle = stage.querySelector('[data-fl-shuffle]');
  if (shuffle) {
    on(shuffle, 'click', () => {
      animate(() => {
        const arr = items();
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        arr.forEach((el) => list.appendChild(el));
      });
    });
  }

  // Dettaglio: l'immagine della card vola nel pannello e torna indietro.
  const dImg = detail?.querySelector<HTMLImageElement>('[data-fl-detail-img]');
  const dTitle = detail?.querySelector<HTMLElement>('[data-fl-detail-title]');
  const dText = detail?.querySelector<HTMLElement>('[data-fl-detail-text]');
  const dClose = detail?.querySelector<HTMLButtonElement>('[data-fl-close]');
  let opened: HTMLElement | null = null;
  const open = (item: HTMLElement): void => {
    const img = item.querySelector<HTMLImageElement>('img');
    if (!detail || !dImg || !img || opened) return;
    opened = item;
    const state = Flip.getState(img);
    dImg.src = img.currentSrc || img.src;
    dImg.alt = img.alt;
    dImg.dataset.flipId = img.dataset.flipId;
    dImg.classList.toggle('is-sticker', img.classList.contains('is-sticker'));
    if (dTitle) dTitle.textContent = item.dataset.title ?? '';
    if (dText) dText.textContent = item.dataset.text ?? '';
    detail.hidden = false;
    img.style.visibility = 'hidden';
    Flip.from(state, { targets: dImg, duration: 0.75, ease: 'power3.inOut', scale: true, absolute: true });
    gsap.fromTo([dTitle, dText, dClose], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.35 });
    item.querySelector('button')?.setAttribute('aria-expanded', 'true');
    dClose?.focus({ preventScroll: true });
  };
  const close = (): void => {
    if (!detail || !dImg || !opened) return;
    const item = opened;
    const img = item.querySelector<HTMLImageElement>('img');
    opened = null;
    const state = Flip.getState(dImg);
    detail.hidden = true;
    if (img) {
      img.style.visibility = '';
      Flip.from(state, { targets: img, duration: 0.65, ease: 'power3.inOut', scale: true, absolute: true });
    }
    const btn = item.querySelector<HTMLButtonElement>('button');
    btn?.setAttribute('aria-expanded', 'false');
    btn?.focus({ preventScroll: true });
  };
  startOrder.forEach((item) => {
    const btn = item.querySelector('button');
    if (btn) on(btn, 'click', () => open(item));
  });
  if (dClose) on(dClose, 'click', close);
  on(stage, 'keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  return () => {
    off();
    if (detail) detail.hidden = true;
    startOrder.forEach((el) => {
      list.appendChild(el);
      el.querySelector('img')?.style.removeProperty('visibility');
    });
    list.dataset.layout = startLayout;
    layoutBtns.forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.flLayout === startLayout)));
    stage.classList.remove('is-live');
  };
};

/* ── Swipe ──────────────────────────────────────────────────────────
   Un mazzo di carte da lanciare a destra (sì) o a sinistra (no), come
   nelle app di incontri. I pulsanti fanno lo stesso, per chi non trascina. */
export const swipe: Demo = (stage) => {
  const cards = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-sw-card]'));
  const yesBtn = stage.querySelector<HTMLButtonElement>('[data-sw-yes]');
  const noBtn = stage.querySelector<HTMLButtonElement>('[data-sw-no]');
  const resetBtn = stage.querySelector<HTMLButtonElement>('[data-sw-reset]');
  if (!cards.length) return;
  const { on, off } = listeners();
  stage.classList.add('is-live');
  let index = 0;
  let drag: Draggable | null = null;
  let history: { x: number; t: number }[] = [];

  const stamps = (card: HTMLElement, x: number): void => {
    gsap.set(card.querySelector('[data-sw-stamp="yes"]'), { opacity: gsap.utils.clamp(0, 1, x / 110) });
    gsap.set(card.querySelector('[data-sw-stamp="no"]'), { opacity: gsap.utils.clamp(0, 1, -x / 110) });
  };
  const arrange = (instant = false): void => {
    cards.forEach((c, k) => {
      const d = k - index;
      if (d < 0) return;
      gsap.to(c, { x: 0, y: Math.min(d, 3) * 14, scale: 1 - Math.min(d, 3) * 0.05, rotation: 0, opacity: d > 3 ? 0 : 1, zIndex: 50 - d, duration: instant ? 0 : 0.5, ease: 'power3.out' });
    });
    stage.classList.toggle('is-empty', index >= cards.length);
    if (yesBtn) yesBtn.disabled = index >= cards.length;
    if (noBtn) noBtn.disabled = index >= cards.length;
  };
  const fling = (dir: number): void => {
    const card = cards[index];
    if (!card) return;
    drag?.kill();
    drag = null;
    stamps(card, dir * 200);
    index++;
    gsap.to(card, {
      x: dir * (stage.clientWidth * 0.8 + 260),
      y: '+=60',
      rotation: dir * 30,
      opacity: 0,
      duration: 0.55,
      ease: 'power2.in',
      onComplete: () => {
        arrange();
        arm();
      },
    });
  };
  const arm = (): void => {
    const card = cards[index];
    if (!card) return;
    [drag] = Draggable.create(card, {
      type: 'x,y',
      zIndexBoost: false,
      onPress() {
        history = [];
      },
      onDrag() {
        gsap.set(card, { rotation: this.x * 0.07 });
        stamps(card, this.x);
        history.push({ x: this.x, t: performance.now() });
        if (history.length > 6) history.shift();
      },
      onRelease() {
        const a = history[0];
        const b = history[history.length - 1];
        const v = a && b && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0;
        if (Math.abs(this.x) > 110 || Math.abs(v) > 900) {
          fling(Math.sign(Math.abs(this.x) > 20 ? this.x : v));
        } else {
          gsap.to(card, { x: 0, y: 0, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)' });
          stamps(card, 0);
        }
      },
    });
  };
  arrange(true);
  arm();
  if (yesBtn) on(yesBtn, 'click', () => fling(1));
  if (noBtn) on(noBtn, 'click', () => fling(-1));
  if (resetBtn) {
    on(resetBtn, 'click', () => {
      drag?.kill();
      drag = null;
      index = 0;
      cards.forEach((c) => stamps(c, 0));
      gsap.set(cards, { x: 0, y: 0, rotation: 0, opacity: 0 });
      arrange();
      arm();
    });
  }
  return () => {
    off();
    drag?.kill();
    gsap.set(cards, { clearProps: 'all' });
    cards.forEach((c) => c.querySelectorAll<HTMLElement>('[data-sw-stamp]').forEach((s) => s.style.removeProperty('opacity')));
    stage.classList.remove('is-live', 'is-empty');
  };
};

/* ── Medaglietta ────────────────────────────────────────────────────
   Una catenella fatta di punti (integrazione di Verlet + vincoli di
   distanza) con la medaglietta in fondo: si afferra, si lancia, oscilla
   e si ferma. */
export const tag: Demo = (stage) => {
  const chain = stage.querySelector<SVGPolylineElement>('[data-tg-chain]');
  const svg = chain?.ownerSVGElement;
  const medal = stage.querySelector<HTMLElement>('[data-tg-tag]');
  if (!chain || !svg || !medal) return;
  const { on, off } = listeners();
  stage.classList.add('is-live');
  const N = 12;
  let W = stage.clientWidth;
  let H = stage.clientHeight;
  let L = (H * 0.4) / N;
  const anchor = (): { x: number; y: number } => ({ x: W / 2, y: 34 });
  const pts = Array.from({ length: N }, (_, i) => {
    const a = anchor();
    // Si parte di lato: la medaglietta cade e oscilla quando la demo entra.
    const x = a.x + i * L * 0.9;
    const y = a.y + i * L * 0.3;
    return { x, y, ox: x, oy: y };
  });
  let held = false;
  const hand = { x: 0, y: 0 };
  let still = 0;

  const render = (): void => {
    chain.setAttribute('points', pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    const a = pts[N - 2];
    const b = pts[N - 1];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90;
    medal.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) translate(-50%, -14px) rotate(${ang.toFixed(1)}deg)`;
  };
  const lp = loop(stage, (dt) => {
    const g = 2600 * dt * dt;
    let energy = 0;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.ox) * 0.986;
      const vy = (p.y - p.oy) * 0.986;
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx;
      p.y += vy + g;
      energy += Math.abs(vx) + Math.abs(vy);
    }
    const a0 = anchor();
    for (let it = 0; it < 12; it++) {
      pts[0].x = a0.x;
      pts[0].y = a0.y;
      if (held) {
        pts[N - 1].x = hand.x;
        pts[N - 1].y = hand.y;
      }
      for (let i = 0; i < N - 1; i++) {
        const p = pts[i];
        const q = pts[i + 1];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d = Math.hypot(dx, dy) || 0.001;
        const diff = (d - L) / d;
        const pinP = i === 0;
        const pinQ = held && i + 1 === N - 1;
        if (pinP && pinQ) continue;
        if (pinP) {
          q.x -= dx * diff;
          q.y -= dy * diff;
        } else if (pinQ) {
          p.x += dx * diff;
          p.y += dy * diff;
        } else {
          p.x += dx * diff * 0.5;
          p.y += dy * diff * 0.5;
          q.x -= dx * diff * 0.5;
          q.y -= dy * diff * 0.5;
        }
      }
    }
    render();
    still = held || energy > 0.25 ? 0 : still + dt;
    return still < 0.6;
  });
  render();

  on(medal, 'pointerdown', (e) => {
    held = true;
    const p = local(stage, e);
    hand.x = p.x;
    hand.y = p.y;
    medal.setPointerCapture(e.pointerId);
    stage.classList.add('is-grabbing');
    lp.wake();
  });
  on(medal, 'pointermove', (e) => {
    if (!held) return;
    const p = local(stage, e);
    hand.x = gsap.utils.clamp(20, W - 20, p.x);
    hand.y = gsap.utils.clamp(20, H - 20, p.y);
  });
  const release = (): void => {
    held = false;
    stage.classList.remove('is-grabbing');
  };
  on(medal, 'pointerup', release);
  on(medal, 'pointercancel', release);
  // Il mouse che passa veloce vicino alla catenella le dà una spinta.
  let lastMove: { x: number; y: number } | null = null;
  on(stage, 'pointermove', (e) => {
    if (held || e.pointerType !== 'mouse') return;
    const p = local(stage, e);
    if (lastMove) {
      const dx = p.x - lastMove.x;
      pts.forEach((q) => {
        if (Math.hypot(q.x - p.x, q.y - p.y) < 60) q.ox -= dx * 0.25;
      });
      if (Math.abs(dx) > 2) lp.wake();
    }
    lastMove = p;
  });
  const ro = new ResizeObserver(() => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    L = (H * 0.4) / N;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    lp.wake();
  });
  ro.observe(stage);
  return () => {
    off();
    lp.destroy();
    ro.disconnect();
    medal.style.removeProperty('transform');
    chain.removeAttribute('points');
    stage.classList.remove('is-live', 'is-grabbing');
  };
};

/* ── Respiro tipografico ────────────────────────────────────────────
   Il font variabile del sito (Bricolage: peso 200–800, optical size
   12–96) letto lettera per lettera: si ispessisce vicino al cursore; senza
   cursore un'onda attraversa la frase. Ricalcola il layout a ogni frame. */
export const breath: Demo = (stage) => {
  const text = stage.querySelector<HTMLElement>('[data-br-text]');
  if (!text) return;
  const { on, off } = listeners();
  stage.classList.add('is-live');
  const split = SplitText.create(text, { type: 'words,chars', charsClass: 'br-ch' });
  const chars = split.chars as HTMLElement[];
  const cur = chars.map(() => ({ w: 300, o: 96 }));
  const mouse = { x: 0, y: 0, inside: false };
  let t = 0;
  const lp = loop(stage, (dt) => {
    t += dt;
    const sr = stage.getBoundingClientRect();
    const R = Math.max(150, sr.width * 0.2);
    // Prima tutte le letture, poi tutte le scritture: un solo layout per frame.
    const centers = chars.map((c) => {
      const r = c.getBoundingClientRect();
      return { x: r.left + r.width / 2 - sr.left, y: r.top + r.height / 2 - sr.top };
    });
    centers.forEach((p, i) => {
      let f: number;
      if (mouse.inside) {
        const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        f = Math.max(0, 1 - d / R);
        f = f * f * (3 - 2 * f);
      } else {
        f = (Math.sin((p.x / sr.width) * 7 - t * 2.2 + p.y * 0.01) + 1) / 2;
        f = Math.pow(f, 2.2);
      }
      const s = cur[i];
      s.w += (200 + 600 * f - s.w) * 0.16;
      s.o += (96 - 84 * f - s.o) * 0.16;
      chars[i].style.fontVariationSettings = `'wght' ${s.w.toFixed(0)}, 'opsz' ${s.o.toFixed(0)}`;
    });
  });
  const aim = (e: PointerEvent): void => {
    const p = local(stage, e);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
  };
  on(stage, 'pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.buttons) aim(e);
  });
  on(stage, 'pointerdown', aim);
  on(stage, 'pointerleave', () => void (mouse.inside = false));
  on(stage, 'pointerup', (e) => {
    if (e.pointerType !== 'mouse') mouse.inside = false;
  });
  if (!fine()) stage.classList.add('is-touch');
  return () => {
    off();
    lp.destroy();
    split.revert();
    stage.classList.remove('is-live', 'is-touch');
  };
};

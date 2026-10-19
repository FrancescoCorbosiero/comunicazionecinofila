/* =====================================================================
   Laboratorio — attrezzi comuni delle demo.
   ===================================================================== */

export const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = (): boolean => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Una demo: riceve il suo palco, restituisce (se serve) la pulizia. */
export type Demo = (stage: HTMLElement) => void | (() => void);

/** Listener legati a un AbortController: una chiamata li toglie tutti. */
export function listeners(): {
  on: <K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions
  ) => void;
  off: () => void;
} {
  const ac = new AbortController();
  return {
    on: (el, type, fn, opts = {}) => el.addEventListener(type, fn as EventListener, { ...opts, signal: ac.signal }),
    off: () => ac.abort(),
  };
}

export interface Loop {
  /** Riparte (se la demo è a schermo) dopo che tick ha chiesto una pausa. */
  wake: () => void;
  destroy: () => void;
}

/** requestAnimationFrame che gira solo mentre l'elemento è a schermo.
 *  tick(dt, t) restituisce false quando non c'è più niente da muovere:
 *  il ciclo si ferma finché qualcuno non chiama wake(). */
export function loop(el: Element, tick: (dt: number, t: number) => boolean | void): Loop {
  let raf = 0;
  let last = 0;
  let visible = false;
  let awake = true;
  let dead = false;
  const frame = (now: number): void => {
    raf = 0;
    if (dead || !visible) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    awake = tick(dt, now / 1000) !== false;
    if (awake) raf = requestAnimationFrame(frame);
    else last = 0;
  };
  const run = (): void => {
    if (!raf && visible && !dead) raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        if (awake) run();
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    },
    { rootMargin: '120px 0px' }
  );
  io.observe(el);
  return {
    wake: () => {
      awake = true;
      run();
    },
    destroy: () => {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect();
    },
  };
}

/** Avvisa quando l'elemento entra o esce dallo schermo. */
export function onScreen(el: Element, fn: (visible: boolean) => void, rootMargin = '0px'): () => void {
  const io = new IntersectionObserver(([entry]) => fn(entry.isIntersecting), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/** Coordinate del puntatore relative a un elemento. */
export const local = (el: Element, e: { clientX: number; clientY: number }): { x: number; y: number } => {
  const r = el.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

/** Famiglia del font display come la risolve il browser (serve al canvas). */
export async function displayFont(probe: Element, weight = 800): Promise<string> {
  const family = getComputedStyle(probe).fontFamily;
  try {
    await document.fonts.load(`${weight} 100px ${family}`);
  } catch {
    /* il fallback va bene lo stesso */
  }
  return family;
}

export const PALETTE = ['#f4a98a', '#d0673f', '#7c9474', '#c9a96a', '#34402a', '#15190f'];

export const PAW_SVG =
  '<svg viewBox="0 0 50 44" fill="currentColor" aria-hidden="true"><ellipse cx="12" cy="15" rx="4.3" ry="5.8"/><ellipse cx="21" cy="10" rx="4.3" ry="6"/><ellipse cx="30" cy="11" rx="4.3" ry="6"/><ellipse cx="38.5" cy="16" rx="4.3" ry="5.6"/><ellipse cx="25" cy="29" rx="9.5" ry="8"/></svg>';

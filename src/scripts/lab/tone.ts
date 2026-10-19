/* =====================================================================
   Laboratorio · 1 — Belle, ma stonano col tono del sito.
   ===================================================================== */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { SplitText } from 'gsap/SplitText';
import { fine, listeners, local, loop, onScreen, type Demo } from './kit';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, SplitText);

/* ── Decode ─────────────────────────────────────────────────────────
   Il testo si "decifra" da caratteri a caso (ScrambleTextPlugin); i link
   si rimescolano al passaggio. Il linguaggio del terminale. */
export const decode: Demo = (stage) => {
  const { on, off } = listeners();
  const lines = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-dc]'));
  const texts = lines.map((l) => l.textContent ?? '');
  const CHARS = '01<>/#%&▓▒░';
  let tl: gsap.core.Timeline | null = null;
  stage.classList.add('is-live');

  const play = (): void => {
    tl?.kill();
    lines.forEach((l) => (l.textContent = ''));
    tl = gsap.timeline();
    lines.forEach((l, i) => {
      tl?.to(
        l,
        {
          duration: 0.9 + texts[i].length * 0.035,
          ease: 'none',
          scrambleText: { text: texts[i], chars: CHARS, revealDelay: 0.3, speed: 0.55 },
        },
        i * 0.35
      );
    });
  };

  // Sotto la piega parte vuoto e si decifra quando entra; già a schermo, subito.
  if (stage.getBoundingClientRect().top < window.innerHeight * 0.8) play();
  else lines.forEach((l) => (l.textContent = ''));
  ScrollTrigger.create({ trigger: stage, start: 'top 80%', once: true, onEnter: play });

  stage.querySelectorAll<HTMLElement>('[data-dc-hover]').forEach((a) => {
    const text = a.textContent ?? '';
    const scramble = (): void => {
      gsap.to(a, { duration: 0.7, overwrite: true, scrambleText: { text, chars: 'lowerCase', speed: 0.9, revealDelay: 0.1 } });
    };
    on(a, 'pointerenter', scramble);
    on(a, 'focus', scramble);
    on(a, 'click', (e) => e.preventDefault());
  });
  const replay = stage.querySelector('[data-dc-replay]');
  if (replay) on(replay, 'click', play);

  return () => {
    off();
    tl?.kill();
    lines.forEach((l, i) => (l.textContent = texts[i]));
    stage.classList.remove('is-live');
  };
};

/* ── Liquid ─────────────────────────────────────────────────────────
   La foto diventa una superficie d'acqua: WebGL puro (niente librerie),
   onde concentriche dal puntatore e una separazione dei colori che segue
   la velocità del gesto. Il ciclo gira solo mentre si interagisce. */
const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uImg;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform float uHover;
uniform float uTime;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float rs = uRes.x / uRes.y;
  float ri = uImg.x / uImg.y;
  vec2 s = rs < ri ? vec2(rs / ri, 1.0) : vec2(1.0, ri / rs);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 d = vUv - uMouse;
  d.x *= aspect;
  float dist = length(d);
  float fall = smoothstep(0.55, 0.0, dist) * uHover;
  vec2 dir = d / max(dist, 0.0001);
  dir.x /= aspect;
  float wave = sin(dist * 34.0 - uTime * 6.0);
  vec2 offset = dir * wave * fall * 0.03 - uVel * fall * 2.2;
  vec2 tuv = cover(vUv + offset);
  vec2 split = uVel * fall * 1.1 + dir * wave * fall * 0.006;
  float r = texture2D(uTex, tuv + split).r;
  float g = texture2D(uTex, tuv).g;
  float b = texture2D(uTex, tuv - split).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[lab/liquid]', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

export const liquid: Demo = (stage) => {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas');
  const src = stage.dataset.src;
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!canvas || !src || !gl) return;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string): WebGLUniformLocation | null => gl.getUniformLocation(prog, n);
  const uRes = u('uRes');
  const uImg = u('uImg');
  const uMouse = u('uMouse');
  const uVel = u('uVel');
  const uHover = u('uHover');
  const uTime = u('uTime');
  gl.uniform1i(u('uTex'), 0);

  const mouse = { x: 0.5, y: 0.5 };
  const target = { x: 0.5, y: 0.5 };
  const vel = { x: 0, y: 0 };
  let hover = 0;
  let hoverTarget = 0;
  let time = 0;
  let ready = false;

  const draw = (): void => {
    if (!ready) return;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform2f(uVel, vel.x, vel.y);
    gl.uniform1f(uHover, hover);
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  const resize = (): void => {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);

  const img = new Image();
  img.decoding = 'async';
  img.onload = (): void => {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(uImg, img.naturalWidth, img.naturalHeight);
    ready = true;
    resize();
    stage.classList.add('is-live');
  };
  img.src = src;

  const lp = loop(stage, (dt) => {
    const px = mouse.x;
    const py = mouse.y;
    mouse.x += (target.x - mouse.x) * 0.14;
    mouse.y += (target.y - mouse.y) * 0.14;
    vel.x += (mouse.x - px - vel.x) * 0.3;
    vel.y += (mouse.y - py - vel.y) * 0.3;
    hover += (hoverTarget - hover) * 0.06;
    time += dt;
    draw();
    return hoverTarget > 0 || hover > 0.003;
  });

  const { on, off } = listeners();
  const aim = (e: PointerEvent): void => {
    const r = stage.getBoundingClientRect();
    target.x = (e.clientX - r.left) / r.width;
    target.y = 1 - (e.clientY - r.top) / r.height;
  };
  on(stage, 'pointerenter', (e) => {
    aim(e);
    mouse.x = target.x;
    mouse.y = target.y;
    hoverTarget = 1;
    lp.wake();
  });
  on(stage, 'pointermove', (e) => {
    aim(e);
    hoverTarget = 1;
    lp.wake();
  });
  on(stage, 'pointerleave', () => void (hoverTarget = 0));
  on(stage, 'pointerup', (e) => {
    if (e.pointerType !== 'mouse') hoverTarget = 0;
  });

  return () => {
    off();
    lp.destroy();
    ro.disconnect();
    stage.classList.remove('is-live');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
};

/* ── Torcia ─────────────────────────────────────────────────────────
   Il buio copre la foto, una luce morbida segue il puntatore. Senza
   puntatore la luce vaga da sola (anche su telefono). */
export const torch: Demo = (stage) => {
  const { on, off } = listeners();
  stage.classList.add('is-live');
  const radius = (): number => Math.max(90, Math.min(stage.clientWidth, stage.clientHeight) * 0.24);
  const pos = { x: stage.clientWidth * 0.5, y: stage.clientHeight * 0.5, r: 0 };
  const apply = (): void => {
    stage.style.setProperty('--x', `${pos.x.toFixed(1)}px`);
    stage.style.setProperty('--y', `${pos.y.toFixed(1)}px`);
    stage.style.setProperty('--r', `${pos.r.toFixed(1)}px`);
  };
  apply();
  const xTo = gsap.quickTo(pos, 'x', { duration: 0.5, ease: 'power3.out', onUpdate: apply });
  const yTo = gsap.quickTo(pos, 'y', { duration: 0.5, ease: 'power3.out', onUpdate: apply });
  let lit = false;
  gsap.to(pos, { r: radius(), duration: 1.4, ease: 'expo.out', onUpdate: apply, scrollTrigger: { trigger: stage, start: 'top 70%', once: true } });

  // Senza puntatore la luce gira per la stanza (lemniscata lenta).
  const orbit = { t: 0 };
  const wander = gsap.to(orbit, {
    t: Math.PI * 2,
    duration: 11,
    ease: 'none',
    repeat: -1,
    paused: true,
    onUpdate: () => {
      xTo(stage.clientWidth * (0.5 + 0.34 * Math.sin(orbit.t)));
      yTo(stage.clientHeight * (0.5 + 0.28 * Math.sin(orbit.t * 2)));
    },
  });
  let pointerInside = false;
  const stopScreen = onScreen(stage, (v) => (v && !pointerInside && !lit ? wander.play() : wander.pause()));
  on(stage, 'pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    pointerInside = true;
    wander.pause();
  });
  on(stage, 'pointermove', (e) => {
    if (e.pointerType === 'mouse' || e.buttons) {
      wander.pause();
      const p = local(stage, e);
      xTo(p.x);
      yTo(p.y);
    }
  });
  on(stage, 'pointerleave', () => {
    pointerInside = false;
    if (!lit) wander.play();
  });

  const sw = stage.querySelector<HTMLButtonElement>('[data-tc-switch]');
  if (sw) {
    on(sw, 'click', () => {
      lit = !lit;
      sw.setAttribute('aria-pressed', String(lit));
      sw.textContent = lit ? 'Spegni la luce' : 'Accendi la luce';
      stage.classList.toggle('is-lit', lit);
      if (lit) wander.pause();
      else if (!pointerInside) wander.play();
      gsap.to(pos, {
        r: lit ? Math.hypot(stage.clientWidth, stage.clientHeight) * 1.2 : radius(),
        duration: lit ? 1.1 : 0.8,
        ease: 'power3.inOut',
        onUpdate: apply,
      });
    });
  }

  return () => {
    off();
    stopScreen();
    wander.kill();
    stage.classList.remove('is-live', 'is-lit');
    ['--x', '--y', '--r'].forEach((p) => stage.style.removeProperty(p));
  };
};

/* ── Lookbook ───────────────────────────────────────────────────────
   Colonne a velocità diverse e foto che si piegano con la velocità dello
   scroll: il gesto di un catalogo di moda. */
export const lookbook: Demo = (stage) => {
  const cols = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-lb-col]'));
  const figs = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-lb-fig]'));
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    cols.forEach((c) => {
      const s = parseFloat(c.dataset.lbCol ?? '0') || 0;
      gsap.fromTo(
        c,
        { yPercent: -s * 26 },
        { yPercent: s * 26, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom top', scrub: true } }
      );
    });
  });
  gsap.set(figs, { transformOrigin: '50% 50%' });
  const skewTo = gsap.quickSetter(figs, 'skewY', 'deg');
  const stretchTo = gsap.quickSetter(figs, 'scaleY');
  const proxy = { skew: 0 };
  const clamp = gsap.utils.clamp(-13, 13);
  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const skew = clamp(self.getVelocity() / -300);
      if (Math.abs(skew) > Math.abs(proxy.skew)) {
        proxy.skew = skew;
        gsap.to(proxy, {
          skew: 0,
          duration: 0.9,
          ease: 'power3',
          overwrite: true,
          onUpdate: () => {
            skewTo(proxy.skew);
            stretchTo(1 + Math.abs(proxy.skew) * 0.014);
          },
        });
      }
    },
  });
  return () => mm.revert();
};

/* ── Scroll a scatti ────────────────────────────────────────────────
   Un colpo di rotella, una slide: niente scroll continuo. Qui è chiuso in
   un riquadro e lascia andare la pagina alla prima e all'ultima slide;
   su telefono si sfoglia di lato, da tastiera con le frecce. */
export const steps: Demo = (stage) => {
  const { on, off } = listeners();
  const slides = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-st-slide]'));
  const counter = stage.querySelector<HTMLElement>('[data-st-count]');
  const prevBtn = stage.querySelector<HTMLButtonElement>('[data-st-prev]');
  const nextBtn = stage.querySelector<HTMLButtonElement>('[data-st-next]');
  if (slides.length < 2) return;
  stage.classList.add('is-live');
  const splits = slides.map((s) => {
    const h = s.querySelector<HTMLElement>('[data-st-title]');
    return h ? SplitText.create(h, { type: 'lines', mask: 'lines' }) : null;
  });
  let index = 0;
  let busy = false;
  let acc = 0;
  let accTimer = 0;
  const HIDE_DOWN = 'inset(100% 0% 0% 0%)';
  const HIDE_UP = 'inset(0% 0% 100% 0%)';
  const SHOW = 'inset(0% 0% 0% 0%)';
  slides.forEach((s, i) => gsap.set(s, { clipPath: i === 0 ? SHOW : HIDE_DOWN, zIndex: i === 0 ? 1 : 0 }));

  const sync = (): void => {
    if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;
    slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== index)));
  };
  const go = (to: number): void => {
    if (busy || to === index || to < 0 || to >= slides.length) return;
    busy = true;
    const dir = to > index ? 1 : -1;
    const from = slides[index];
    const next = slides[to];
    gsap.set(next, { zIndex: 2, clipPath: dir > 0 ? HIDE_DOWN : HIDE_UP, scale: 1 });
    gsap.set(from, { zIndex: 1 });
    const lines = splits[to]?.lines ?? [];
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(from, { zIndex: 0, clipPath: HIDE_DOWN, scale: 1, yPercent: 0 });
          gsap.set(next, { zIndex: 1 });
          busy = false;
        },
      })
      .to(next, { clipPath: SHOW, duration: 0.95, ease: 'expo.inOut' })
      .to(from, { scale: 0.92, yPercent: -6 * dir, duration: 0.95, ease: 'expo.inOut' }, 0)
      .fromTo(lines, { yPercent: 110 * dir }, { yPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.07 }, 0.4);
    index = to;
    sync();
  };
  sync();

  on(
    stage,
    'wheel',
    (e) => {
      const dir = Math.sign(e.deltaY);
      const can = dir > 0 ? index < slides.length - 1 : index > 0;
      if (!dir || !can) return; // ai bordi la pagina riprende a scorrere
      e.preventDefault();
      e.stopPropagation(); // Lenis ascolta sulla finestra: qui la rotella è nostra
      if (busy) return;
      acc += e.deltaY;
      window.clearTimeout(accTimer);
      accTimer = window.setTimeout(() => (acc = 0), 180);
      if (Math.abs(acc) > 28) {
        acc = 0;
        go(index + dir);
      }
    },
    { passive: false }
  );
  let start: { x: number; y: number } | null = null;
  on(stage, 'pointerdown', (e) => void (start = { x: e.clientX, y: e.clientY }));
  on(stage, 'pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
  });
  on(stage, 'keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(k) && index < slides.length - 1) {
      e.preventDefault();
      go(index + 1);
    } else if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(k) && index > 0) {
      e.preventDefault();
      go(index - 1);
    }
  });
  if (prevBtn) on(prevBtn, 'click', () => go(index - 1));
  if (nextBtn) on(nextBtn, 'click', () => go(index + 1));

  return () => {
    off();
    window.clearTimeout(accTimer);
    splits.forEach((s) => s?.revert());
    gsap.set(slides, { clearProps: 'all' });
    slides.forEach((s) => s.removeAttribute('aria-hidden'));
    stage.classList.remove('is-live');
  };
};

/* ── Scia di foto ───────────────────────────────────────────────────
   Muovendo il mouse le foto spuntano sotto al puntatore e scivolano via
   nel verso del gesto. Un gruppo fisso di immagini riciclate. */
export const trail: Demo = (stage) => {
  const { on, off } = listeners();
  const imgs = gsap.utils.toArray<HTMLElement>(stage.querySelectorAll('[data-tr-img]'));
  if (!imgs.length) return;
  stage.classList.add('is-live');
  gsap.set(imgs, { xPercent: -50, yPercent: -50, opacity: 0 });
  let k = 0;
  let z = 1;
  let last: { x: number; y: number } | null = null;
  let down = false;
  const spawn = (x: number, y: number, dx: number, dy: number): void => {
    const el = imgs[k++ % imgs.length];
    gsap.killTweensOf(el);
    gsap.set(el, { x, y, zIndex: ++z, rotation: gsap.utils.random(-12, 12), opacity: 1, scale: 0.35 });
    gsap
      .timeline()
      .to(el, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' })
      .to(el, { x: x + dx * 1.6, y: y + dy * 1.6 + 50, rotation: '+=8', opacity: 0, scale: 0.72, duration: 0.95, ease: 'power2.in' }, 0.6);
    stage.classList.add('is-playing');
  };
  on(stage, 'pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !down) return;
    const p = local(stage, e);
    if (!last) {
      last = p;
      return;
    }
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (Math.hypot(dx, dy) < (fine() ? 95 : 60)) return;
    spawn(p.x, p.y, dx, dy);
    last = p;
  });
  on(stage, 'pointerdown', (e) => {
    down = true;
    last = local(stage, e);
  });
  on(window, 'pointerup', () => void (down = false));
  on(stage, 'pointerleave', () => void (last = null));
  return () => {
    off();
    gsap.killTweensOf(imgs);
    gsap.set(imgs, { clearProps: 'all' });
    stage.classList.remove('is-live', 'is-playing');
  };
};

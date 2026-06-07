/* =====================================================================
   Andrea Bellettati — comportamenti del sito.
   Compatibile con le View Transitions (Astro ClientRouter):
   - i listener globali (window/document) si registrano UNA volta sola;
   - gli inizializzatori legati agli elementi girano a ogni `astro:page-load`
     (gli elementi vecchi vengono scartati dallo swap, niente doppi bind).
   ===================================================================== */
import { WA_NUMBER, EMAIL } from '../config';
import { initCatalog } from './catalog';
// Quando attiverai cal.com, importa anche CAL_LINK da '../config'.

function waLink(text: string): string {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
}
const prefersReduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Mobile nav ──────────────────────────────────────────────── */
function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ── Scroll reveal ───────────────────────────────────────────── */
function initReveal(): void {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!els.length) return;
  if (prefersReduced() || !('IntersectionObserver' in window)) return; // il CSS base li lascia visibili
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          (e.target as HTMLElement).classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  const vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.95) {
      el.style.transition = 'none';
      el.classList.add('in');
    } else {
      io.observe(el);
    }
  });
}

/* ── Validazione campo ───────────────────────────────────────── */
function validateField(field: Element): boolean {
  const input = field.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select'
  );
  if (!input) return true;
  let ok = true;
  if (input.hasAttribute('required') && !input.value.trim()) ok = false;
  const type = (input as HTMLInputElement).type;
  if (type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) ok = false;
  if (type === 'tel' && input.value && input.value.replace(/\D/g, '').length < 6) ok = false;
  field.classList.toggle('show-error', !ok);
  input.classList.toggle('invalid', !ok);
  return ok;
}

/* ── Questionario a step → WhatsApp ──────────────────────────── */
function initStepForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-stepform]');
  if (!form) return;
  const panels = Array.from(form.querySelectorAll<HTMLElement>('.step-panel'));
  const dots = Array.from(form.querySelectorAll<HTMLElement>('.step-dot'));
  let current = 0;

  function show(i: number): void {
    current = i;
    panels.forEach((p, idx) => p.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('done', idx < i);
      d.classList.toggle('current', idx === i);
    });
    const firstInput = panels[i].querySelector<HTMLElement>('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 120);
  }
  function validatePanel(i: number): boolean {
    let ok = true;
    panels[i].querySelectorAll('.field').forEach((f) => {
      if (!validateField(f)) ok = false;
    });
    return ok;
  }

  form.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validatePanel(current)) return;
      if (current < panels.length - 1) show(current + 1);
    });
  });
  form.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (current > 0) show(current - 1);
    });
  });
  form.querySelectorAll('input, textarea, select').forEach((inp) => {
    inp.addEventListener('input', () => {
      const field = inp.closest('.field');
      if (field) {
        field.classList.remove('show-error');
        inp.classList.remove('invalid');
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validatePanel(current)) return;
    const d = new FormData(form);
    const nome = (d.get('nome') || '').toString().trim();
    const animale = (d.get('animale') || '').toString().trim();
    const profilo = (d.get('profilo') || '').toString();
    const messaggio = (d.get('messaggio') || '').toString().trim();
    const telefono = (d.get('telefono') || '').toString().trim();

    const lines = [
      'Ciao Andrea, vorrei prenotare la consulenza gratuita.',
      '',
      'Nome: ' + nome,
      'Sono: ' + (profilo || '—'),
      'Il mio animale: ' + (animale || '—'),
      'Telefono: ' + (telefono || '—'),
      '',
      messaggio ? 'Situazione: ' + messaggio : '',
    ].filter(Boolean);
    const text = lines.join('\n');

    const success = form.querySelector<HTMLElement>('.form-success');
    const waBtn = form.querySelector<HTMLAnchorElement>('[data-wa-out]');
    if (waBtn) waBtn.href = waLink(text);
    const mailBtn = form.querySelector<HTMLAnchorElement>('[data-mail-out]');
    if (mailBtn) {
      mailBtn.href =
        'mailto:' +
        EMAIL +
        '?subject=' +
        encodeURIComponent('Consulenza gratuita — ' + nome) +
        '&body=' +
        encodeURIComponent(text);
    }
    panels.forEach((p) => p.classList.remove('active'));
    const head = form.querySelector<HTMLElement>('.steps-head');
    if (head) head.style.display = 'none';
    if (success) success.classList.add('show');
    window.open(waLink(text), '_blank', 'noopener');
  });

  show(0);
}

/* ── Selettore di percorso (contatti) ────────────────────────── */
function initPathSelector(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-path]');
  if (!cards.length) return;
  const sections = document.querySelectorAll<HTMLElement>('[data-path-target]');
  function select(key: string): void {
    cards.forEach((c) => c.classList.toggle('selected', c.getAttribute('data-path') === key));
    sections.forEach((s) => {
      s.style.display = s.getAttribute('data-path-target') === key ? '' : 'none';
    });
  }
  cards.forEach((c) =>
    c.addEventListener('click', () => select(c.getAttribute('data-path') || 'famiglia'))
  );
  const p = new URLSearchParams(location.search).get('p');
  select(p === 'pro' ? 'pro' : 'famiglia');
}

/* ── Booking: slot → conferma WhatsApp (modale + card pro) ───── */
function callText(slot: string): string {
  return (
    'Ciao Andrea! Vorrei fissare una call conoscitiva' + (slot ? ' — slot preferito: ' + slot : '') + '.'
  );
}
function initBookings(): void {
  document.querySelectorAll<HTMLElement>('[data-booking]').forEach((group) => {
    const slots = group.querySelectorAll<HTMLButtonElement>('.cal-slot');
    const out = group.querySelector<HTMLElement>('[data-cal-confirm]');
    const waBtn = group.querySelector<HTMLAnchorElement>('[data-cal-wa]');
    slots.forEach((s) => {
      s.addEventListener('click', () => {
        slots.forEach((x) => x.classList.remove('sel'));
        s.classList.add('sel');
        const slot = (s.textContent || '').trim();
        if (out) {
          out.style.display = 'flex';
          const label = out.querySelector<HTMLElement>('[data-cal-label]');
          if (label) label.textContent = slot;
        }
        if (waBtn) waBtn.href = waLink(callText(slot));
      });
    });
  });
}

/* ── Modale call (apertura/chiusura via delega globale) ──────── */
function openCall(): void {
  const ov = document.querySelector<HTMLElement>('[data-call-modal]');
  if (!ov) return;
  ov.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  const f = ov.querySelector<HTMLElement>('.cal-slot');
  if (f) setTimeout(() => f.focus(), 60);
}
function closeCall(): void {
  const ov = document.querySelector<HTMLElement>('[data-call-modal]');
  if (!ov || ov.hidden) return;
  ov.hidden = true;
  document.documentElement.style.overflow = '';
}

/* ── Parallax ────────────────────────────────────────────────── */
let parallaxItems: HTMLElement[] = [];
function collectParallax(): void {
  parallaxItems = prefersReduced() ? [] : Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
}
function updateParallax(): void {
  if (!parallaxItems.length) return;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  for (const el of parallaxItems) {
    const rect = el.getBoundingClientRect();
    if (rect.bottom < -120 || rect.top > vh + 120) continue;
    const center = rect.top + rect.height / 2;
    const progress = (center - vh / 2) / (vh / 2 + rect.height / 2);
    const clamped = Math.max(-1, Math.min(1, progress));
    if (el.hasAttribute('data-parallax-cover')) {
      const shift = rect.height * 0.06 * -clamped;
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.12)`;
    } else {
      const speed = parseFloat(el.getAttribute('data-parallax') || '') || 40;
      el.style.transform = `translate3d(0, ${(-clamped * (speed / 2)).toFixed(2)}px, 0)`;
    }
  }
}

/* ── Elevazione header allo scroll ───────────────────────────── */
function updateHeader(): void {
  const h = document.querySelector<HTMLElement>('.site-header');
  if (h) h.style.boxShadow = window.scrollY > 8 ? '0 8px 28px -20px rgba(31,37,21,0.5)' : 'none';
}

/* ── Listener globali (una sola volta) ───────────────────────── */
let globalsReady = false;
function initGlobals(): void {
  if (globalsReady) return;
  globalsReady = true;

  let ticking = false;
  const onScroll = () => {
    updateHeader();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Modale "Prenota una call": delega → robusta tra le navigazioni.
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-open-call]')) {
      e.preventDefault();
      openCall();
    } else if (t.closest('[data-close-call]')) {
      closeCall();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCall();
  });
}

/* ── Per pagina (anche dopo ogni view transition) ───────────── */
function onPageLoad(): void {
  initNav();
  initReveal();
  initStepForm();
  initPathSelector();
  initBookings();
  initCatalog();
  collectParallax();
  updateParallax();
  updateHeader();
}

initGlobals();
document.addEventListener('astro:page-load', onPageLoad);

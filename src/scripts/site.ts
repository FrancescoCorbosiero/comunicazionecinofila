/* =====================================================================
   Andrea Bellettati — comportamenti del sito.
   Caricato una sola volta dal Base layout. Ogni blocco verifica i propri
   elementi, così è sicuro su tutte le pagine (progressive enhancement).
   ===================================================================== */
import { WA_NUMBER, EMAIL } from '../config';
// Quando attiverai cal.com, importa anche CAL_LINK da '../config' e usalo
// per aprire l'embed/popup ufficiale al posto del placeholder.

function waLink(text: string): string {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
}

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
  const reduce =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return; // il CSS base li lascia visibili
  document.documentElement.classList.add('js'); // opt-in: nascondi-poi-rivela
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
    // Above the fold: rivela subito senza transizione, non resta mai nascosto.
    if (el.getBoundingClientRect().top < vh * 0.95) {
      el.style.transition = 'none';
      el.classList.add('in');
    } else {
      io.observe(el);
    }
  });
}

/* ── Header: leggera elevazione allo scroll ──────────────────── */
function initHeader(): void {
  const h = document.querySelector<HTMLElement>('.site-header');
  if (!h) return;
  const onScroll = () => {
    h.style.boxShadow = window.scrollY > 8 ? '0 8px 28px -20px rgba(31,37,21,0.5)' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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

  // Pulisci l'errore mentre si scrive
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
    // apri WhatsApp direttamente
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
  // rispetta il deep-link ?p=
  const p = new URLSearchParams(location.search).get('p');
  select(p === 'pro' ? 'pro' : 'famiglia');
}

/* ── Booking: slot → conferma WhatsApp (modale + card pro) ───── */
function callText(slot: string): string {
  return 'Ciao Andrea! Vorrei fissare una call conoscitiva' + (slot ? ' — slot preferito: ' + slot : '') + '.';
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

/* ── Modale call condiviso, aperto da [data-open-call] ───────── */
function initCallModal(): void {
  const ov = document.querySelector<HTMLElement>('[data-call-modal]');
  if (!ov) return;
  const open = () => {
    ov.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    const f = ov.querySelector<HTMLElement>('.cal-slot');
    if (f) setTimeout(() => f.focus(), 60);
  };
  const close = () => {
    ov.hidden = true;
    document.documentElement.style.overflow = '';
  };
  ov.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-close-call]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !ov.hidden) close();
  });
  document.querySelectorAll('[data-open-call]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      open();
    });
  });
}

/* ── Bootstrap ───────────────────────────────────────────────── */
function ready(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
}

ready(() => {
  initNav();
  initReveal();
  initHeader();
  initCallModal();
  initBookings();
  initStepForm();
  initPathSelector();
});

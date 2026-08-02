/* =====================================================================
   Andrea Bellettati — comportamenti del sito.
   Compatibile con le View Transitions (Astro ClientRouter):
   - i listener globali (window/document) si registrano UNA volta sola;
   - gli inizializzatori legati agli elementi girano a ogni `astro:page-load`
     (gli elementi vecchi vengono scartati dallo swap, niente doppi bind).
   ===================================================================== */
import { WA_NUMBER, EMAIL, FORM_ENDPOINT } from '../config';
import { initCatalog } from './catalog';
// Quando attiverai cal.com, importa anche CAL_LINK da '../config'.

function waLink(text: string): string {
  return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
}
const prefersReduced = () =>
  window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Invio form ──────────────────────────────────────────────────
   Un solo punto di uscita per entrambi i form, endpoint configurabile:
   · FORM_ENDPOINT vuoto → Netlify Forms (POST alla pagina, i form
     statici con name= + data-netlify sono registrati dal bot di deploy);
   · FORM_ENDPOINT valorizzato → il tuo backend (es. function che inoltra
     via AWS SES). Stesso payload urlencoded, `form-name` incluso.
   In `astro dev` non c'è nessun endpoint: l'invio fallisce e scatta
   il fallback (per il questionario resta comunque WhatsApp). */
function encodeForm(form: HTMLFormElement): string {
  const params = new URLSearchParams();
  new FormData(form).forEach((value, key) => {
    params.append(key, typeof value === 'string' ? value : value.name);
  });
  return params.toString();
}
function submitForm(form: HTMLFormElement): Promise<boolean> {
  return fetch(FORM_ENDPOINT || '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodeForm(form),
    // keepalive: la richiesta sopravvive anche se l'utente naviga subito via.
    keepalive: true,
  })
    .then((res) => res.ok)
    .catch(() => false);
}

/* ── Mobile nav ──────────────────────────────────────────────── */
function setNavOpen(nav: HTMLElement, toggle: HTMLElement, open: boolean): void {
  nav.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
}
/* Chiusura da listener globali (Escape / click fuori): interroga il DOM
   corrente, così funziona anche dopo gli swap delle View Transitions. */
function closeNav(refocus = false): void {
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  if (!nav || !toggle || !nav.classList.contains('open')) return;
  setNavOpen(nav, toggle, false);
  if (refocus) toggle.focus();
}
function initNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    setNavOpen(nav, toggle, !nav.classList.contains('open'));
  });
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setNavOpen(nav, toggle, false));
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
  // Collega il messaggio d'errore all'input per le tecnologie assistive.
  const err = field.querySelector<HTMLElement>('.field-error');
  if (err && input.id) {
    if (!err.id) err.id = `${input.id}-error`;
    input.setAttribute('aria-describedby', err.id);
  }
  input.setAttribute('aria-invalid', ok ? 'false' : 'true');
  field.classList.toggle('show-error', !ok);
  input.classList.toggle('invalid', !ok);
  return ok;
}

/* ── Navigazione a step (condivisa dai questionari) ──────────── */
interface StepController {
  panels: HTMLElement[];
  readonly current: number;
  validatePanel(i: number): boolean;
  validateAll(): boolean;
  showSuccess(): void;
}

function setupSteps(form: HTMLFormElement): StepController {
  const panels = Array.from(form.querySelectorAll<HTMLElement>('.step-panel'));
  const dots = Array.from(form.querySelectorAll<HTMLElement>('.step-dot'));
  let current = 0;

  function show(i: number, focusFirst = false): void {
    current = i;
    panels.forEach((p, idx) => p.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => {
      d.classList.toggle('done', idx < i);
      d.classList.toggle('current', idx === i);
    });
    // Il focus solo sulle navigazioni dell'utente: all'init ruberebbe
    // focus e scroll alla pagina appena caricata.
    if (!focusFirst) return;
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
  // Al submit vanno controllati TUTTI gli step: l'implicit form submission
  // (Enter in un input) può arrivare da uno step intermedio.
  function validateAll(): boolean {
    for (let i = 0; i < panels.length; i++) {
      if (!validatePanel(i)) {
        show(i, true);
        return false;
      }
    }
    return true;
  }
  function showSuccess(): void {
    panels.forEach((p) => p.classList.remove('active'));
    const head = form.querySelector<HTMLElement>('.steps-head');
    if (head) head.style.display = 'none';
    const success = form.querySelector<HTMLElement>('.form-success');
    if (success) {
      success.classList.add('show');
      success.focus(); // il markup ha tabindex="-1" + role="status"
    }
  }

  form.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!validatePanel(current)) return;
      if (current < panels.length - 1) show(current + 1, true);
    });
  });
  form.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (current > 0) show(current - 1, true);
    });
  });
  // Enter su uno step intermedio = "Continua", non submit.
  form.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target instanceof HTMLTextAreaElement) return;
    if (current < panels.length - 1) {
      e.preventDefault();
      if (validatePanel(current)) show(current + 1, true);
    }
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

  show(0);
  return {
    panels,
    get current() {
      return current;
    },
    validatePanel,
    validateAll,
    showSuccess,
  };
}

/* ── Questionario consulenza (a step) → WhatsApp ─────────────── */
function initStepForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-stepform]');
  if (!form) return;
  const steps = setupSteps(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!steps.validateAll()) return;
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
    // Rete di sicurezza: salva il contatto in background (Netlify Forms oggi,
    // il tuo endpoint/AWS SES domani — vedi FORM_ENDPOINT in config.ts).
    // Se la persona chiude WhatsApp senza premere invio, il lead resta ad Andrea.
    void submitForm(form);
    steps.showSuccess();
    window.open(waLink(text), '_blank', 'noopener');
  });
}

/* ── Candidatura "Lavora con noi" (a step) → submitForm() ────── */
function initWorkForm(): void {
  const form = document.querySelector<HTMLFormElement>('[data-workform]');
  if (!form) return;
  const formEl = form; // snapshot post-guard: il tipo resta stretto nelle closure
  const steps = setupSteps(form);
  let sending = false;

  const errorBox = form.querySelector<HTMLElement>('[data-form-error]');
  function showError(): void {
    if (!errorBox) return;
    // Fallback email con le risposte già compilate: il lavoro non si perde.
    const mail = errorBox.querySelector<HTMLAnchorElement>('[data-error-mail]');
    if (mail) {
      const d = new FormData(formEl);
      const body = [
        'Ciao Andrea, ti mando la mia candidatura per TeamNutrizione.',
        '',
        'Nome: ' + (d.get('nome') || '—'),
        'Email: ' + (d.get('email') || '—'),
        'Telefono: ' + (d.get('telefono') || '—'),
        'Occupazione: ' + (d.get('occupazione') || '—'),
        'Nel settore animale: ' + (d.get('settore_animale') || '—'),
        'Ambito: ' + (d.get('ambito') || '—'),
        'Tempo da dedicare: ' + (d.get('tempo') || '—'),
        'Instagram/sito: ' + (d.get('social') || '—'),
        '',
        'Perché mi interessa: ' + (d.get('perche') || '—'),
      ].join('\n');
      mail.href =
        'mailto:' +
        EMAIL +
        '?subject=' +
        encodeURIComponent('Candidatura TeamNutrizione — ' + (d.get('nome') || '')) +
        '&body=' +
        encodeURIComponent(body);
    }
    errorBox.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    // Niente ricarica pagina: invio via fetch a Netlify Forms.
    e.preventDefault();
    if (sending) return;
    if (!steps.validateAll()) return;

    sending = true;
    errorBox?.classList.remove('show');
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const submitHtml = submitBtn?.innerHTML ?? '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-sending');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Invio in corso…';
    }

    const ok = await submitForm(form);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-sending');
      submitBtn.removeAttribute('aria-busy');
      submitBtn.innerHTML = submitHtml;
    }
    sending = false;

    if (ok) {
      steps.showSuccess();
      form.reset();
    } else {
      showError();
    }
  });
}

/* ── Spotlight delle carte-scelta (home): segue il puntatore ── */
function initPathGlow(): void {
  document.querySelectorAll<HTMLElement>('.path-choice').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      card.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    });
  });
}

/* ── Blog: filtro per categoria + ricerca live ───────────────────
   Stato (categoria e query) sincronizzato nell'URL (?cat=…&q=…):
   i filtri sono condivisibili e sopravvivono a refresh/back. */
function initBlogFilter(): void {
  const bar = document.querySelector<HTMLElement>('[data-blog-filters]');
  if (!bar) return;
  const chips = Array.from(bar.querySelectorAll<HTMLButtonElement>('.chip'));
  const cards = Array.from(
    document.querySelectorAll<HTMLElement>('[data-blog-grid] [data-cat]')
  );
  const search = document.querySelector<HTMLInputElement>('[data-blog-search]');
  const empty = document.querySelector<HTMLElement>('[data-blog-empty]');
  const counter = document.querySelector<HTMLElement>('[data-blog-count]');

  // Stessa normalizzazione dell'indice generato in ArticleCard.astro.
  const norm = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let cat = '*';
  let query = '';

  function apply(syncUrl = true): void {
    const q = norm(query.trim());
    let visible = 0;
    cards.forEach((card) => {
      const okCat = cat === '*' || card.dataset.cat === cat;
      const okQuery = !q || (card.dataset.search || '').includes(q);
      const show = okCat && okQuery;
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    chips.forEach((c) => {
      const active = (c.dataset.cat || '*') === cat;
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', String(active));
    });
    if (empty) empty.hidden = visible > 0;
    if (counter) {
      counter.textContent =
        visible === 1 ? '1 articolo trovato' : `${visible} articoli trovati`;
    }
    if (syncUrl) {
      const params = new URLSearchParams(location.search);
      if (cat === '*') params.delete('cat');
      else params.set('cat', cat);
      if (!query.trim()) params.delete('q');
      else params.set('q', query.trim());
      const qs = params.toString();
      // replaceState conserva history.state (scroll delle View Transitions).
      history.replaceState(history.state, '', location.pathname + (qs ? `?${qs}` : '') + location.hash);
    }
  }

  bar.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip');
    if (!chip) return;
    cat = chip.dataset.cat || '*';
    apply();
  });

  let debounce = 0;
  search?.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      query = search.value;
      apply();
    }, 120);
  });

  document.querySelector<HTMLButtonElement>('[data-blog-reset]')?.addEventListener('click', () => {
    cat = '*';
    query = '';
    if (search) search.value = '';
    apply();
    search?.focus();
  });

  // Stato iniziale dall'URL (link condivisi, refresh, back/forward).
  const params = new URLSearchParams(location.search);
  const urlCat = params.get('cat');
  if (urlCat && chips.some((c) => c.dataset.cat === urlCat)) cat = urlCat;
  query = params.get('q') ?? '';
  if (search && query) search.value = query;
  if (cat !== '*' || query) apply(false);
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

/* ── Booking: slot → conferma WhatsApp (modale consulenza) ───── */
function callText(slot: string): string {
  return (
    'Ciao Andrea! Vorrei richiedere la consulenza gratuita' +
    (slot ? ' — slot preferito: ' + slot : '') +
    '.'
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
let lastCallTrigger: HTMLElement | null = null;

function openCall(): void {
  const ov = document.querySelector<HTMLElement>('[data-call-modal]');
  if (!ov) return;
  lastCallTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
  // Il focus torna al pulsante che ha aperto il modale.
  if (lastCallTrigger && document.contains(lastCallTrigger)) lastCallTrigger.focus();
  lastCallTrigger = null;
}
// aria-modal dichiara il resto della pagina inerte: il Tab deve restare nel dialog.
function trapCallFocus(e: KeyboardEvent): void {
  const ov = document.querySelector<HTMLElement>('[data-call-modal]');
  if (!ov || ov.hidden) return;
  const focusables = Array.from(
    ov.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea')
  ).filter((el) => el.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !ov.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !ov.contains(active))) {
    e.preventDefault();
    first.focus();
  }
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
      // Escursione più ampia (0.10·h): l'immagine è pre-scalata a 1.24 in
      // effects.css, quindi c'è margine sufficiente a non scoprire i bordi.
      const shift = rect.height * 0.1 * -clamped;
      el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(1.24)`;
    } else {
      const speed = parseFloat(el.getAttribute('data-parallax') || '') || 40;
      el.style.transform = `translate3d(0, ${(-clamped * (speed / 1.3)).toFixed(2)}px, 0)`;
    }
  }
}

/* ── Copia link con fallback (contesti senza Clipboard API) ──── */
function copyPageUrl(btn: HTMLElement): void {
  const feedback = () => {
    const original = btn.textContent;
    btn.textContent = 'Link copiato!';
    window.setTimeout(() => {
      btn.textContent = original;
    }, 1800);
  };
  const legacyCopy = () => {
    const ta = document.createElement('textarea');
    ta.value = window.location.href;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      if (document.execCommand('copy')) feedback();
    } finally {
      ta.remove();
    }
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(window.location.href).then(feedback).catch(legacyCopy);
  } else {
    legacyCopy();
  }
}

/* ── Elevazione header allo scroll ───────────────────────────── */
function updateHeader(): void {
  const h = document.querySelector<HTMLElement>('.site-header');
  if (h) h.style.boxShadow = window.scrollY > 8 ? '0 8px 28px -20px rgba(31,37,21,0.5)' : 'none';
}

/* ── Avanzamento lettura (pagine articolo) ───────────────────── */
function updateReadProgress(): void {
  const bar = document.querySelector<HTMLElement>('[data-progress]');
  if (!bar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
  bar.style.width = pct.toFixed(2) + '%';
}

/* ── Torna su: visibilità + anello di avanzamento ────────────── */
const RING_LEN = 100.53; // 2π · r(16)
function updateToTop(): void {
  const btn = document.querySelector<HTMLElement>('[data-to-top]');
  if (!btn) return;
  const doc = document.documentElement;
  btn.classList.toggle('show', window.scrollY > 480);
  const ring = btn.querySelector<SVGCircleElement>('[data-ring]');
  if (ring) {
    const max = doc.scrollHeight - doc.clientHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    ring.style.strokeDashoffset = (RING_LEN * (1 - p)).toFixed(2);
  }
}

/* ── Smistatore: le tre strade si sfogliano dal mazzo ─────────────
   Animazione guidata dallo scroll (scrubbed): le card partono
   impilate e ruotate come un mazzo di carte e si distribuiscono
   nelle loro posizioni man mano che la sezione entra in viewport.
   A fine corsa gli stili inline vengono rimossi, così gli hover
   CSS riprendono il controllo. Off con prefers-reduced-motion. */
let dealCards: HTMLElement[] = [];
let dealHost: HTMLElement | null = null;

function collectDeal(): void {
  dealHost = prefersReduced() ? null : document.querySelector<HTMLElement>('[data-deal]');
  dealCards = dealHost ? (Array.from(dealHost.children) as HTMLElement[]) : [];
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function updateDeal(): void {
  if (!dealHost || !dealCards.length) return;
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const rect = dealHost.getBoundingClientRect();
  // 0 quando il bordo alto della sezione tocca il fondo del viewport,
  // 1 quando ha risalito il 75% dell'altezza dello schermo: la corsa
  // più lunga rende la distribuzione lenta ed elegante.
  const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.75)));

  dealCards.forEach((card, i) => {
    // Ogni carta ha la sua finestra di progresso, sfalsata: la prima
    // parte subito, le altre seguono come una mano che le distribuisce.
    const local = Math.max(0, Math.min(1, progress * 1.3 - i * 0.28));
    if (local >= 1) {
      card.style.transform = '';
      card.style.opacity = '';
      return;
    }
    const e = easeOutCubic(local);
    const fan = i - 1; // -1 · 0 · 1 → direzione del ventaglio
    const x = (1 - e) * fan * -60;
    const y = (1 - e) * 46;
    const rot = (1 - e) * fan * 6;
    const scale = 0.92 + e * 0.08;
    card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity = (0.2 + e * 0.8).toFixed(2);
  });
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
        updateReadProgress();
        updateToTop();
        updateDeal();
        ticking = false;
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Modale "Richiedi la tua consulenza gratuita": delega → robusta tra le navigazioni.
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-open-call]')) {
      e.preventDefault();
      openCall();
    } else if (t.closest('[data-close-call]')) {
      closeCall();
    } else if (t.closest('[data-to-top]')) {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
    } else if (t.closest('[data-copy-url]')) {
      const btn = t.closest<HTMLElement>('[data-copy-url]');
      if (btn) copyPageUrl(btn);
    } else if (!t.closest('.site-header')) {
      // Click/tap fuori dall'header: il menu mobile aperto si chiude.
      closeNav();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCall();
      closeNav(true);
    } else if (e.key === 'Tab') trapCallFocus(e);
  });
}

/* ── Per pagina (anche dopo ogni view transition) ───────────── */
function onPageLoad(): void {
  initNav();
  initReveal();
  initStepForm();
  initWorkForm();
  initBlogFilter();
  initPathGlow();
  initPathSelector();
  initBookings();
  initCatalog();
  collectParallax();
  collectDeal();
  updateParallax();
  updateHeader();
  updateReadProgress();
  updateToTop();
  updateDeal();
}

initGlobals();
document.addEventListener('astro:page-load', onPageLoad);

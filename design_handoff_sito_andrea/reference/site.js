/* =====================================================================
   Andrea Bellettati — Site behaviour
   Vanilla JS. Loaded on every page. Each block guards for its elements.
   ===================================================================== */
(function () {
  'use strict';

  var WA_NUMBER = '393476780938';
  var EMAIL = 'andrebellettati@gmail.com';
  // Quando avrai il link cal.com, incollalo qui (es. 'andrea-bellettati/call-conoscitiva').
  // Per ora i bottoni "Prenota una call" aprono un selettore di slot che conferma via WhatsApp.
  var CAL_LINK = '';

  /* ── Mobile nav ──────────────────────────────────────────────── */
  function initNav() {
    var toggle = document.querySelector('[data-nav-toggle]');
    var nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Scroll reveal ───────────────────────────────────────────── */
  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { return; } // base CSS keeps them visible
    document.documentElement.classList.add('js'); // opt in to hidden-then-reveal
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    var vh = window.innerHeight || document.documentElement.clientHeight;
    els.forEach(function (el) {
      // Above the fold: reveal instantly with no transition so it can never get stuck hidden.
      if (el.getBoundingClientRect().top < vh * 0.95) {
        el.style.transition = 'none';
        el.classList.add('in');
      } else {
        io.observe(el);
      }
    });
  }

  /* ── Header subtle elevation on scroll ───────────────────────── */
  function initHeader() {
    var h = document.querySelector('.site-header');
    if (!h) return;
    var onScroll = function () {
      if (window.scrollY > 8) h.style.boxShadow = '0 8px 28px -20px rgba(31,37,21,0.5)';
      else h.style.boxShadow = 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Tweaks panel (vanilla, host-protocol + localStorage) ────── */
  var TW_KEY = 'ab_tweaks_v1';
  var TW_DEFAULTS = { titlestyle: 'poster', accent: 'peach', paper: 'on' };
  var ACCENTS = {
    peach:  { '--peach': '#f4a98a', '--peach-deep': '#d97a55' },
    coral:  { '--peach': '#e8896a', '--peach-deep': '#c4623d' },
    ochre:  { '--peach': '#cf a86a', '--peach-deep': '#b08a3e' }
  };
  // fix stray space safeguard
  ACCENTS.ochre = { '--peach': '#cfa86a', '--peach-deep': '#b08a3e' };

  function readTweaks() {
    try { return Object.assign({}, TW_DEFAULTS, JSON.parse(localStorage.getItem(TW_KEY) || '{}')); }
    catch (e) { return Object.assign({}, TW_DEFAULTS); }
  }
  function applyTweaks(t) {
    var root = document.documentElement;
    root.setAttribute('data-titlestyle', t.titlestyle === 'serif' ? 'serif' : 'poster');
    root.setAttribute('data-paper', t.paper === 'off' ? 'off' : 'on');
    var acc = ACCENTS[t.accent] || ACCENTS.peach;
    root.style.setProperty('--peach', acc['--peach']);
    root.style.setProperty('--peach-deep', acc['--peach-deep']);
  }
  function saveTweaks(t) {
    try { localStorage.setItem(TW_KEY, JSON.stringify(t)); } catch (e) {}
    // mirror to host so on-disk EDITMODE persistence works when available
    try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: t }, '*'); } catch (e) {}
  }

  // Apply immediately (before paint where possible)
  var TW = readTweaks();
  applyTweaks(TW);

  function buildTweaksPanel() {
    var panel = document.createElement('div');
    panel.className = 'tw-panel';
    panel.setAttribute('data-omelette-chrome', '');
    panel.innerHTML =
      '<div class="tw-hd"><b>Tweaks</b><button class="tw-x" aria-label="Chiudi">✕</button></div>' +
      '<div class="tw-body">' +
        '<div class="tw-row"><span class="tw-lbl">Stile titoli</span>' +
          '<div class="tw-seg" data-tw="titlestyle">' +
            '<button data-v="poster">Poster</button>' +
            '<button data-v="serif">Elegante</button>' +
          '</div>' +
          '<span class="tw-note">Poster = Anton (firma del brand). Elegante = Playfair serif.</span>' +
        '</div>' +
        '<div class="tw-row"><span class="tw-lbl">Accento</span>' +
          '<div class="tw-chips" data-tw="accent">' +
            '<button class="tw-chip" data-v="peach" style="background:#f4a98a" title="Pesca"></button>' +
            '<button class="tw-chip" data-v="coral" style="background:#e8896a" title="Corallo"></button>' +
            '<button class="tw-chip" data-v="ochre" style="background:#cfa86a" title="Ocra"></button>' +
          '</div>' +
        '</div>' +
        '<div class="tw-row"><span class="tw-lbl">Texture carta</span>' +
          '<div class="tw-seg" data-tw="paper">' +
            '<button data-v="on">Attiva</button>' +
            '<button data-v="off">Pulita</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(panel);

    function syncUI() {
      panel.querySelectorAll('.tw-seg').forEach(function (seg) {
        var key = seg.getAttribute('data-tw');
        seg.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-v') === TW[key]);
        });
      });
      panel.querySelectorAll('.tw-chips').forEach(function (ch) {
        var key = ch.getAttribute('data-tw');
        ch.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('on', b.getAttribute('data-v') === TW[key]);
        });
      });
    }
    panel.querySelectorAll('[data-tw] button').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.parentElement.getAttribute('data-tw');
        TW[key] = b.getAttribute('data-v');
        applyTweaks(TW); saveTweaks(TW); syncUI();
      });
    });
    panel.querySelector('.tw-x').addEventListener('click', function () {
      panel.classList.remove('open');
      try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
    });
    syncUI();

    // host protocol
    window.addEventListener('message', function (e) {
      var t = e && e.data && e.data.type;
      if (t === '__activate_edit_mode') panel.classList.add('open');
      else if (t === '__deactivate_edit_mode') panel.classList.remove('open');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  }

  /* ── WhatsApp form (home quick + general) ────────────────────── */
  function waLink(text) { return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text); }

  function validateField(field) {
    var input = field.querySelector('input, textarea, select');
    if (!input) return true;
    var ok = true;
    if (input.hasAttribute('required') && !input.value.trim()) ok = false;
    if (input.type === 'email' && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) ok = false;
    if (input.type === 'tel' && input.value && input.value.replace(/\D/g, '').length < 6) ok = false;
    field.classList.toggle('show-error', !ok);
    input.classList.toggle('invalid', !ok);
    return ok;
  }

  /* ── Multi-step contact form ─────────────────────────────────── */
  function initStepForm() {
    var form = document.querySelector('[data-stepform]');
    if (!form) return;
    var panels = Array.prototype.slice.call(form.querySelectorAll('.step-panel'));
    var dots = Array.prototype.slice.call(form.querySelectorAll('.step-dot'));
    var current = 0;

    function show(i) {
      current = i;
      panels.forEach(function (p, idx) { p.classList.toggle('active', idx === i); });
      dots.forEach(function (d, idx) {
        d.classList.toggle('done', idx < i);
        d.classList.toggle('current', idx === i);
      });
      var firstInput = panels[i].querySelector('input, textarea, select');
      if (firstInput) setTimeout(function () { firstInput.focus(); }, 120);
    }
    function validatePanel(i) {
      var fields = panels[i].querySelectorAll('.field');
      var ok = true;
      fields.forEach(function (f) { if (!validateField(f)) ok = false; });
      return ok;
    }

    form.querySelectorAll('[data-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!validatePanel(current)) return;
        if (current < panels.length - 1) show(current + 1);
      });
    });
    form.querySelectorAll('[data-prev]').forEach(function (btn) {
      btn.addEventListener('click', function () { if (current > 0) show(current - 1); });
    });

    // clear error on input
    form.querySelectorAll('input, textarea, select').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var field = inp.closest('.field');
        if (field) { field.classList.remove('show-error'); inp.classList.remove('invalid'); }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validatePanel(current)) return;
      var d = new FormData(form);
      var nome = (d.get('nome') || '').toString().trim();
      var animale = (d.get('animale') || '').toString().trim();
      var profilo = (d.get('profilo') || '').toString();
      var messaggio = (d.get('messaggio') || '').toString().trim();
      var telefono = (d.get('telefono') || '').toString().trim();

      var lines = [
        'Ciao Andrea, vorrei prenotare la consulenza gratuita.',
        '',
        'Nome: ' + nome,
        'Sono: ' + (profilo || '—'),
        'Il mio animale: ' + (animale || '—'),
        'Telefono: ' + (telefono || '—'),
        '',
        messaggio ? ('Situazione: ' + messaggio) : ''
      ].filter(Boolean);
      var text = lines.join('\n');

      var success = form.querySelector('.form-success');
      var waBtn = form.querySelector('[data-wa-out]');
      if (waBtn) waBtn.href = waLink(text);
      var mailBtn = form.querySelector('[data-mail-out]');
      if (mailBtn) {
        mailBtn.href = 'mailto:' + EMAIL + '?subject=' +
          encodeURIComponent('Consulenza gratuita — ' + nome) + '&body=' + encodeURIComponent(text);
      }
      panels.forEach(function (p) { p.classList.remove('active'); });
      form.querySelector('.steps-head').style.display = 'none';
      if (success) success.classList.add('show');
      // open WhatsApp directly
      window.open(waLink(text), '_blank', 'noopener');
    });

    show(0);
  }

  /* ── Path selector (contatti) ────────────────────────────────── */
  function initPathSelector() {
    var cards = document.querySelectorAll('[data-path]');
    if (!cards.length) return;
    var sections = document.querySelectorAll('[data-path-target]');
    function select(key) {
      cards.forEach(function (c) { c.classList.toggle('selected', c.getAttribute('data-path') === key); });
      sections.forEach(function (s) {
        var show = s.getAttribute('data-path-target') === key;
        s.style.display = show ? '' : 'none';
      });
    }
    cards.forEach(function (c) {
      c.addEventListener('click', function () { select(c.getAttribute('data-path')); });
    });
    // honour ?p= deep link
    var p = new URLSearchParams(location.search).get('p');
    select(p === 'pro' ? 'pro' : 'famiglia');
  }

  /* ── Booking (cal.com placeholder) ───────────────────────────── */
  function callText(slot) {
    return 'Ciao Andrea! Vorrei fissare una call conoscitiva' + (slot ? (' \u2014 slot preferito: ' + slot) : '') + '.';
  }
  function waSvg() {
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.95.51 3.78 1.4 5.37L2 22l4.85-1.27a9.9 9.9 0 0 0 5.19 1.46h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Z"/></svg>';
  }
  // Wire every [data-booking] group: pick a slot → reveal confirm → update its WhatsApp link.
  function initBookings() {
    document.querySelectorAll('[data-booking]').forEach(function (group) {
      var slots = group.querySelectorAll('.cal-slot');
      var out = group.querySelector('[data-cal-confirm]');
      var waBtn = group.querySelector('[data-cal-wa]');
      slots.forEach(function (s) {
        s.addEventListener('click', function () {
          slots.forEach(function (x) { x.classList.remove('sel'); });
          s.classList.add('sel');
          if (out) {
            out.style.display = 'flex';
            var label = out.querySelector('[data-cal-label]');
            if (label) label.textContent = s.textContent.trim();
          }
          if (waBtn) waBtn.href = waLink(callText(s.textContent.trim()));
        });
      });
    });
  }

  /* ── Shared call modal, opened by any [data-open-call] ───────── */
  function buildCallModal() {
    var slots = ['Mar \u00b7 18:00', 'Mer \u00b7 21:00', 'Gio \u00b7 18:30', 'Ven \u00b7 19:00', 'Sab \u00b7 10:30'];
    var ov = document.createElement('div');
    ov.className = 'call-modal'; ov.setAttribute('data-omelette-chrome', ''); ov.hidden = true;
    ov.innerHTML =
      '<div class="call-backdrop" data-close-call></div>' +
      '<div class="call-dialog" role="dialog" aria-modal="true" aria-label="Prenota una call">' +
        '<button class="call-x" data-close-call aria-label="Chiudi"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<span class="eyebrow" style="color:var(--peach-deep);">Calendario \u00b7 cal.com</span>' +
        '<h3 class="display-md" style="margin-top:10px;">Prenota una call</h3>' +
        '<p style="margin:8px 0 0;">Per le opportunit\u00e0 di lavoro o un confronto veloce. Scegli uno slot indicativo: confermiamo insieme e ti mando il link del calendario.</p>' +
        '<div class="booking-cal" data-booking style="margin-top:18px;">' +
          '<div class="cal-head">Slot disponibili \u00b7 questa settimana</div>' +
          '<div class="cal-slots">' + slots.map(function (s) { return '<button class="cal-slot" type="button">' + s + '</button>'; }).join('') + '</div>' +
          '<div data-cal-confirm class="cal-confirm">' +
            '<p style="margin:0;">Slot scelto: <b data-cal-label>\u2014</b></p>' +
            '<a class="btn" data-cal-wa href="' + waLink(callText('')) + '" target="_blank" rel="noopener">Conferma su WhatsApp ' + waSvg() + '</a>' +
          '</div>' +
          '<p class="cal-note">Calendario smart in collegamento. Intanto fissiamo via WhatsApp.</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function open() { ov.hidden = false; document.documentElement.style.overflow = 'hidden'; var f = ov.querySelector('.cal-slot'); if (f) setTimeout(function () { f.focus(); }, 60); }
    function close() { ov.hidden = true; document.documentElement.style.overflow = ''; }
    ov.addEventListener('click', function (e) { if (e.target.closest('[data-close-call]')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) close(); });
    document.querySelectorAll('[data-open-call]').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    });
  }

  /* ── Simple inline (single-step) WA forms ────────────────────── */
  function initQuickForms() {
    document.querySelectorAll('[data-quickform]').forEach(function (form) {
      form.querySelectorAll('input, textarea, select').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var field = inp.closest('.field');
          if (field) { field.classList.remove('show-error'); inp.classList.remove('invalid'); }
        });
      });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var ok = true;
        form.querySelectorAll('.field').forEach(function (f) { if (!validateField(f)) ok = false; });
        if (!ok) return;
        var d = new FormData(form);
        var nome = (d.get('nome') || '').toString().trim();
        var profilo = (d.get('profilo') || 'Una famiglia').toString();
        var text = 'Ciao Andrea! Sono ' + (nome || '(nome)') + ' — ' + profilo +
          '. Vorrei informazioni sulla consulenza gratuita.';
        window.open(waLink(text), '_blank', 'noopener');
      });
    });
  }

  /* ── Year stamp ──────────────────────────────────────────────── */
  function initYear() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initHeader();
    buildTweaksPanel();
    buildCallModal();
    initStepForm();
    initPathSelector();
    initBookings();
    initQuickForms();
    initYear();
  });
})();

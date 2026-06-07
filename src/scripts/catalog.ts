/* =====================================================================
   Catalogo — filtro/ordinamento/ricerca client-side su card già renderizzate
   lato server (static-first: il contenuto resta indicizzabile, il JS filtra).
   ===================================================================== */

type Facet = 'animal' | 'type' | 'stage' | 'feature';

export function initCatalog(): void {
  const root = document.querySelector<HTMLElement>('[data-catalog]');
  if (!root) return;

  const grid = root.querySelector<HTMLElement>('[data-catalog-grid]');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-product]'));
  const search = root.querySelector<HTMLInputElement>('[data-catalog-search]');
  const sort = root.querySelector<HTMLSelectElement>('[data-catalog-sort]');
  const countEl = root.querySelector<HTMLElement>('[data-catalog-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-catalog-empty]');
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-catalog-reset]');
  const checks = Array.from(root.querySelectorAll<HTMLInputElement>('input[data-filter]'));
  const badge = root.querySelector<HTMLElement>('[data-filter-count]');
  if (!grid) return;
  const gridEl = grid;

  const tokens = (el: HTMLElement, attr: string): string[] =>
    (el.dataset[attr] || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

  function activeFilters(): Record<Facet, string[]> {
    const f: Record<Facet, string[]> = { animal: [], type: [], stage: [], feature: [] };
    checks.forEach((c) => {
      if (c.checked) f[c.dataset.filter as Facet]?.push(c.value.toLowerCase());
    });
    return f;
  }

  function matches(card: HTMLElement, f: Record<Facet, string[]>, q: string): boolean {
    // OR all'interno di un facet, AND tra facet diversi
    if (f.animal.length && !f.animal.includes((card.dataset.animal || '').toLowerCase())) return false;
    if (f.type.length && !f.type.includes((card.dataset.type || '').toLowerCase())) return false;
    if (f.stage.length) {
      const stage = (card.dataset.stage || '').toLowerCase();
      // "tutti" è valido per ogni fascia d'età selezionata
      if (stage !== 'tutti' && !f.stage.includes(stage)) return false;
    }
    if (f.feature.length) {
      const feats = tokens(card, 'features');
      if (!f.feature.some((x) => feats.includes(x))) return false;
    }
    if (q) {
      const hay = (card.dataset.search || card.textContent || '').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function syncUrl(f: Record<Facet, string[]>, q: string, sortVal: string): void {
    const params = new URLSearchParams();
    (Object.keys(f) as Facet[]).forEach((k) => {
      if (f[k].length) params.set(k, f[k].join(','));
    });
    if (q) params.set('q', q);
    if (sortVal && sortVal !== 'relevance') params.set('sort', sortVal);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }

  function apply(updateUrl = true): void {
    const f = activeFilters();
    const q = (search?.value || '').trim().toLowerCase();
    const sortVal = sort?.value || 'relevance';

    let visible = 0;
    cards.forEach((card) => {
      const ok = matches(card, f, q);
      card.style.display = ok ? '' : 'none';
      if (ok) visible++;
    });

    // ordinamento (riposiziona i nodi nel DOM)
    const sorted = [...cards].sort((a, b) => {
      if (sortVal === 'name-asc') return (a.dataset.name || '').localeCompare(b.dataset.name || '', 'it');
      if (sortVal === 'name-desc') return (b.dataset.name || '').localeCompare(a.dataset.name || '', 'it');
      return Number(a.dataset.order || 0) - Number(b.dataset.order || 0);
    });
    sorted.forEach((card) => gridEl.appendChild(card));

    if (countEl) countEl.innerHTML = `<b>${visible}</b> ${visible === 1 ? 'prodotto' : 'prodotti'}`;
    if (emptyEl) emptyEl.classList.toggle('show', visible === 0);

    const activeCount = (Object.values(f) as string[][]).reduce((n, arr) => n + arr.length, 0);
    if (badge) {
      badge.textContent = String(activeCount);
      badge.classList.toggle('on', activeCount > 0);
    }

    if (updateUrl) syncUrl(f, q, sortVal);
  }

  function readUrl(): void {
    const params = new URLSearchParams(location.search);
    (['animal', 'type', 'stage', 'feature'] as Facet[]).forEach((facet) => {
      const vals = (params.get(facet) || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!vals.length) return;
      checks.forEach((c) => {
        if (c.dataset.filter === facet && vals.includes(c.value.toLowerCase())) c.checked = true;
      });
    });
    if (search && params.get('q')) search.value = params.get('q') || '';
    if (sort && params.get('sort')) sort.value = params.get('sort') || 'relevance';
  }

  checks.forEach((c) => c.addEventListener('change', () => apply()));
  search?.addEventListener('input', () => apply());
  sort?.addEventListener('change', () => apply());
  resetBtn?.addEventListener('click', () => {
    checks.forEach((c) => (c.checked = false));
    if (search) search.value = '';
    if (sort) sort.value = 'relevance';
    apply();
  });

  // Drawer filtri (mobile)
  const toggle = root.querySelector<HTMLButtonElement>('[data-catalog-filter-toggle]');
  const sidebar = root.querySelector<HTMLElement>('[data-catalog-sidebar]');
  const backdrop = root.querySelector<HTMLElement>('[data-catalog-backdrop]');
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-catalog-sidebar-close]');
  const openDrawer = (open: boolean) => {
    sidebar?.classList.toggle('open', open);
    backdrop?.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  toggle?.addEventListener('click', () => openDrawer(!sidebar?.classList.contains('open')));
  closeBtn?.addEventListener('click', () => openDrawer(false));
  backdrop?.addEventListener('click', () => openDrawer(false));

  readUrl();
  apply(false);
}

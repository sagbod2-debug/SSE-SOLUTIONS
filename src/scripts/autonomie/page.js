// Page Autonomie & Inclusion : la ville miniature, la carte FALC / français courant, les tuiles des modules.
const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function initAutonomiePage() {
  const root = document.querySelector('[data-town]');
  const canvas = document.querySelector('[data-town-canvas]');
  const labels = Array.from(document.querySelectorAll('[data-town-label]'));
  const steps = Array.from(document.querySelectorAll('[data-town-step]'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let town = null, mod = null, disposed = false;
  const offs = [];
  const on = (el, ev, fn) => { el.addEventListener(ev, fn); offs.push(() => el.removeEventListener(ev, fn)); };

  async function start() {
    if (!root || !canvas) return;
    try {
      if (!mod) mod = await import('../three/autonomie-town.js');
    } catch {
      root.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    town?.dispose();
    town = mod.mountAutonomieTown(canvas, { dark: dark(), labels });
    root.classList.toggle('is-3d-ready', !!town);
    root.classList.toggle('is-3d-fallback', !town);
    measure();
  }

  const themeObs = new MutationObserver(() => { if (mod) start(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function measure() {
    if (!root) return;
    const vh = window.innerHeight || 800;
    const r = root.getBoundingClientRect();
    const p = reduce ? 0 : clamp(-r.top / Math.max(1, r.height - vh));
    root.style.setProperty('--ap', String(Math.round(p * 1000) / 1000));
    town?.setProgress(p);
    town?.setPaused(r.bottom < 0);
    const k = p < 0.2 ? -1 : Math.min(3, Math.floor(((p - 0.2) / 0.8) * 4));
    steps.forEach((s, i) => s.classList.toggle('is-active', reduce || i === k));
  }

  // carte FALC / français courant
  const card = document.querySelector('[data-flip-card]');
  const opts = Array.from(document.querySelectorAll('[data-flip]'));
  opts.forEach((b) =>
    on(b, 'click', () => {
      const back = b.dataset.flip === 'courant';
      card?.classList.toggle('is-flipped', back);
      opts.forEach((o) => {
        const act = o === b;
        o.classList.toggle('is-on', act);
        o.setAttribute('aria-pressed', act ? 'true' : 'false');
      });
      const faces = card ? card.querySelectorAll('.au-card__face') : [];
      if (faces.length === 2) {
        faces[0].setAttribute('aria-hidden', back ? 'true' : 'false');
        faces[1].setAttribute('aria-hidden', back ? 'false' : 'true');
      }
    })
  );

  // tuiles des 35 modules : le domaine choisi se soulève
  const chips = Array.from(document.querySelectorAll('.au-chip[data-filter]'));
  const tilesWrap = document.querySelector('[data-tiles]');
  const tiles = Array.from(document.querySelectorAll('.au-tile[data-module-cat]'));
  const live = document.getElementById('modules-live-status');
  chips.forEach((btn) =>
    on(btn, 'click', () => {
      const f = btn.dataset.filter || 'all';
      chips.forEach((b) => {
        const act = b === btn;
        b.classList.toggle('is-active', act);
        b.setAttribute('aria-pressed', act ? 'true' : 'false');
      });
      let n = 0;
      tiles.forEach((t) => {
        const match = f === 'all' || t.dataset.moduleCat === f;
        t.classList.toggle('is-match', match);
        if (match) n++;
      });
      tilesWrap?.classList.toggle('is-filtered', f !== 'all');
      if (live) live.textContent = f === 'all' ? '35 modules affichés' : `${n} modules mis en avant sur 35`;
    })
  );

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; measure(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 80));
  idle(() => { if (!disposed) start(); });

  return () => {
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    themeObs.disconnect();
    offs.forEach((f) => f());
    town?.dispose();
  };
}

// Page CC Care : constellation traversée au défilement, alvéoles des missions, champ de traits.
import { mountField } from '../three/particle-field.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function initCarePage() {
  const hero = document.querySelector('[data-care-hero]');
  const track = document.querySelector('[data-care-track]');
  const heroCanvas = document.querySelector('[data-care-hero-canvas]');
  const missions = document.querySelector('[data-care-missions]');
  const cellsCanvas = document.querySelector('[data-care-cells-canvas]');
  const fieldCanvas = document.querySelector('[data-care-field]');
  const items = Array.from(document.querySelectorAll('[data-care-mission]'));
  if (!hero) return () => {};

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let disposed = false, heroScene = null, cells = null, field = null, mods = null, active = -2;

  async function start() {
    try {
      if (!mods) mods = await import('../three/care-scenes.js');
    } catch {
      hero.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    heroScene?.dispose();
    cells?.dispose();
    heroScene = heroCanvas ? mods.mountCareHero(heroCanvas, { dark: dark() }) : null;
    cells = cellsCanvas ? mods.mountCareCells(cellsCanvas, { dark: dark(), count: items.length }) : null;
    hero.classList.toggle('is-3d-ready', !!heroScene);
    hero.classList.toggle('is-3d-fallback', !heroScene);
    missions?.classList.toggle('is-3d-ready', !!cells);
    active = -2;
    measure();
  }

  if (fieldCanvas) field = mountField(fieldCanvas, { theme: dark() ? 'sombre' : 'clair', palette: 'care' });
  const themeObs = new MutationObserver(() => {
    field?.setTheme(dark() ? 'sombre' : 'clair');
    if (mods) start();
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function measure() {
    const vh = window.innerHeight || 800;
    const hr = hero.getBoundingClientRect();
    const tr = track ? track.getBoundingClientRect() : hr;
    const span = tr.height > hr.height + 10 ? tr.height - vh : hr.height * 0.75;
    heroScene?.setTravel(reduce ? 0.6 : clamp(-tr.top / Math.max(1, span)));

    if (missions) {
      const r = missions.getBoundingClientRect();
      const sticky = window.matchMedia('(min-width: 960px)').matches;
      let p;
      if (sticky) p = clamp((-r.top + vh * 0.3) / Math.max(1, r.height - vh));
      else p = clamp((vh * 0.9 - r.top) / Math.max(1, r.height));
      cells?.setAssemble(reduce ? 1 : Math.min(1, p * 1.8));
      let k = -1;
      if (sticky) {
        if (p > 0.35) k = Math.min(items.length - 1, Math.floor(((p - 0.35) / 0.65) * items.length));
      } else {
        let best = Infinity;
        items.forEach((c, i) => {
          const cr = c.getBoundingClientRect();
          const d = Math.abs(cr.top + cr.height / 2 - vh * 0.55);
          if (d < best && cr.bottom > 0 && cr.top < vh) { best = d; k = i; }
        });
      }
      if (k !== active) {
        active = k;
        items.forEach((c, i) => c.classList.toggle('is-active', i === k));
        cells?.setActive(k);
      }
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; measure(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  idle(() => { if (!disposed) start(); });

  return () => {
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    themeObs.disconnect();
    heroScene?.dispose();
    cells?.dispose();
    field?.dispose();
  };
}

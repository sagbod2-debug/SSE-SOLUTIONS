// Page CC Events : scène qui se construit au défilement, sphères des offres, champ de traits.
import { mountField } from '../three/particle-field.js';

const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function initEventsPage() {
  const hero = document.querySelector('[data-ev-hero]');
  const track = document.querySelector('[data-ev-track]');
  const heroCanvas = document.querySelector('[data-ev-hero-canvas]');
  const offers = document.querySelector('[data-ev-offers]');
  const orbsCanvas = document.querySelector('[data-ev-orbs-canvas]');
  const fieldCanvas = document.querySelector('[data-ev-field]');
  const cards = Array.from(document.querySelectorAll('[data-ev-offer]'));
  if (!hero) return () => {};

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let disposed = false;
  let stageScene = null, orbsScene = null, field = null, mods = null;
  let active = -1;

  async function start() {
    try {
      if (!mods) {
        const [a, b] = await Promise.all([import('../three/events-stage.js'), import('../three/events-orbs.js')]);
        mods = { hero: a.mountEventsHero, orbs: b.mountEventsOrbs };
      }
    } catch {
      hero.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    stageScene?.dispose();
    orbsScene?.dispose();
    stageScene = heroCanvas ? mods.hero(heroCanvas, { dark: dark() }) : null;
    orbsScene = orbsCanvas ? mods.orbs(orbsCanvas, { dark: dark(), count: cards.length }) : null;
    hero.classList.toggle('is-3d-ready', !!stageScene);
    hero.classList.toggle('is-3d-fallback', !stageScene);
    offers?.classList.toggle('is-3d-ready', !!orbsScene);
    active = -1;
    measure();
  }

  if (fieldCanvas) field = mountField(fieldCanvas, { theme: dark() ? 'sombre' : 'clair', palette: 'events' });

  const themeObs = new MutationObserver(() => {
    field?.setTheme(dark() ? 'sombre' : 'clair');
    if (mods) start();
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function setActive(i) {
    if (i === active) return;
    active = i;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    orbsScene?.setActive(i);
  }

  function measure() {
    const vh = window.innerHeight || 800;
    const hr = hero.getBoundingClientRect();
    // la scène se construit pendant la traversée du hero (piste collante sur grand écran)
    const tr = track ? track.getBoundingClientRect() : hr;
    const span = tr.height > hr.height + 10 ? tr.height - vh : hr.height * 0.75;
    stageScene?.setBuild(reduce ? 1 : clamp(-tr.top / Math.max(1, span)));

    if (offers && cards.length) {
      const r = offers.getBoundingClientRect();
      const sticky = window.matchMedia('(min-width: 960px)').matches;
      if (sticky) {
        const p = clamp((-r.top + vh * 0.2) / Math.max(1, r.height - vh));
        setActive(r.top > vh * 0.6 ? -1 : Math.min(cards.length - 1, Math.floor(p * cards.length)));
      } else {
        // mobile : la carte la plus proche du centre de l'écran
        let best = -1, bestD = Infinity;
        cards.forEach((c, k) => {
          const cr = c.getBoundingClientRect();
          const d = Math.abs(cr.top + cr.height / 2 - vh * 0.55);
          if (d < bestD && cr.bottom > 0 && cr.top < vh) { bestD = d; best = k; }
        });
        setActive(best);
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

  const hoverHandlers = cards.map((c, k) => {
    const on = () => orbsScene?.setHover(k, true);
    const off = () => orbsScene?.setHover(k, false);
    c.addEventListener('pointerenter', on);
    c.addEventListener('pointerleave', off);
    c.addEventListener('focusin', on);
    c.addEventListener('focusout', off);
    return [c, on, off];
  });

  measure();
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  idle(() => { if (!disposed) start(); });

  return () => {
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    themeObs.disconnect();
    hoverHandlers.forEach(([c, on, off]) => {
      c.removeEventListener('pointerenter', on);
      c.removeEventListener('pointerleave', off);
      c.removeEventListener('focusin', on);
      c.removeEventListener('focusout', off);
    });
    stageScene?.dispose();
    orbsScene?.dispose();
    field?.dispose();
  };
}

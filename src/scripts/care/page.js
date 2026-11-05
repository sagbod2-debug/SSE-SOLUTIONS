// Page CC Care : le groupe qui se rassemble (hero) et l'abri qui se forme mission après mission.
const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function initCarePage() {
  const hero = document.querySelector('[data-care-hero]');
  const heroCanvas = document.querySelector('[data-care-hero-canvas]');
  const shelter = document.querySelector('[data-care-shelter]');
  const shelterCanvas = document.querySelector('[data-care-shelter-canvas]');
  const steps = Array.from(document.querySelectorAll('[data-care-step]'));
  const missions = Array.from(document.querySelectorAll('[data-care-mission]'));
  if (!hero) return () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroScene = null, shelterScene = null, mod = null, disposed = false, lastActive = -2;

  async function start() {
    try {
      if (!mod) mod = await import('../three/care-scenes.js');
    } catch {
      hero.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    heroScene?.dispose();
    shelterScene?.dispose();
    heroScene = heroCanvas ? mod.mountCareHero(heroCanvas, { dark: dark() }) : null;
    shelterScene = shelterCanvas ? mod.mountCareShelter(shelterCanvas, { dark: dark(), count: missions.length }) : null;
    hero.classList.toggle('is-3d-ready', !!heroScene);
    hero.classList.toggle('is-3d-fallback', !heroScene);
    lastActive = -2;
    measure();
  }

  const themeObs = new MutationObserver(() => { if (mod) start(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function measure() {
    const vh = window.innerHeight || 800;
    const hr = hero.getBoundingClientRect();
    heroScene?.setProgress(reduce ? 1 : clamp(-hr.top / Math.max(1, hr.height - vh)));
    heroScene?.setPaused(hr.bottom < 0);

    // étape au centre de l'écran
    let best = -1, bestD = Infinity;
    steps.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - vh * 0.55);
      if (d < bestD && r.bottom > 0 && r.top < vh) { bestD = d; best = i; }
    });
    steps.forEach((el, i) => el.classList.toggle('is-active', i === best));
    const activeMission = best >= 0 ? missions.indexOf(steps[best]) : -1;
    if (activeMission !== lastActive) {
      lastActive = activeMission;
      shelterScene?.setActive(reduce ? missions.length - 1 : activeMission);
    }
    if (shelter) {
      const sr = shelter.getBoundingClientRect();
      shelterScene?.setPaused(sr.bottom < 0 || sr.top > vh);
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
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 80));
  idle(() => { if (!disposed) start(); });

  return () => {
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    themeObs.disconnect();
    heroScene?.dispose();
    shelterScene?.dispose();
  };
}

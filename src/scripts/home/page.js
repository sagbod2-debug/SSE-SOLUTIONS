// Accueil : le logo SSE se sépare en trois univers pendant la traversée de la piste collante.
const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';

export function initHomePage() {
  const root = document.querySelector('[data-home]');
  const canvas = document.querySelector('[data-home-canvas]');
  if (!root || !canvas) return () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scene = null, mod = null, disposed = false;

  async function start() {
    try {
      if (!mod) mod = await import('../three/home-scene.js');
    } catch {
      root.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    scene?.dispose();
    scene = mod.mountHomeScene(canvas, { dark: dark() });
    root.classList.toggle('is-3d-ready', !!scene);
    root.classList.toggle('is-3d-fallback', !scene);
    measure();
  }

  const themeObs = new MutationObserver(() => { if (mod) start(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function measure() {
    const vh = window.innerHeight || 800;
    const r = root.getBoundingClientRect();
    const p = reduce ? 1 : clamp(-r.top / Math.max(1, r.height - vh));
    root.style.setProperty('--hp', String(Math.round(p * 1000) / 1000));
    root.classList.toggle('is-doors', p > 0.78);
    scene?.setProgress(p);
    scene?.setPaused(r.bottom < 0);
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
    scene?.dispose();
  };
}

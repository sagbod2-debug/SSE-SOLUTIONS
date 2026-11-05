// Page CC Events : une seule scène « maquette » derrière toute la page, pilotée par chapitres.
// Chaque chapitre [data-film-from, data-film-to] fait avancer la ligne de temps de la scène.
const clamp = (v) => Math.max(0, Math.min(1, v));
const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';
const COUNTDOWN = ['J-30', 'J-15', 'J-7', 'J-1', 'Jour J'];

export function initEventsPage() {
  const root = document.querySelector('[data-film]');
  const canvas = document.querySelector('[data-film-canvas]');
  if (!root || !canvas) return () => {};
  const chapters = Array.from(document.querySelectorAll('[data-film-from]'));
  const filmEnd = document.querySelector('[data-film-end]');
  const counter = document.querySelector('[data-film-count]');
  const offers = Array.from(document.querySelectorAll('[data-film-offer]'));
  const rules = Array.from(document.querySelectorAll('[data-film-rule]'));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let film = null, disposed = false, mod = null, lastCount = '';

  async function start() {
    try {
      if (!mod) mod = await import('../three/events-film.js');
    } catch {
      root.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    film?.dispose();
    film = mod.mountEventsFilm(canvas, { dark: dark() });
    root.classList.toggle('is-3d-ready', !!film);
    root.classList.toggle('is-3d-fallback', !film);
    measure();
  }

  const themeObs = new MutationObserver(() => { if (mod) start(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function measure() {
    const vh = window.innerHeight || 800;
    let p = 0;
    chapters.forEach((el) => {
      const r = el.getBoundingClientRect();
      const from = parseFloat(el.dataset.filmFrom || '0');
      const to = parseFloat(el.dataset.filmTo || '1');
      const span = Math.max(1, r.height - vh * 0.5);
      const local = clamp((vh * 0.5 - r.top) / span);
      if (r.top < vh * 0.5) p = from + (to - from) * local;
    });
    film?.setProgress(reduce ? Math.max(p, 0.3) : p);

    // compte à rebours du montage
    const k = Math.min(COUNTDOWN.length - 1, Math.floor(clamp(p / 0.3) * (COUNTDOWN.length - 1) + 0.0001));
    const label = COUNTDOWN[k];
    if (counter && label !== lastCount) {
      lastCount = label;
      counter.textContent = label;
    }

    const mark = (list) => {
      let best = -1, bestD = Infinity;
      list.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh / 2);
        if (d < bestD && r.bottom > 0 && r.top < vh) { bestD = d; best = i; }
      });
      list.forEach((el, i) => el.classList.toggle('is-active', i === best));
    };
    mark(offers);
    mark(rules);

    // au-delà du film : la scène est masquée par des blocs opaques, on l'arrête
    if (filmEnd) {
      const past = filmEnd.getBoundingClientRect().top < 0;
      root.classList.toggle('is-past', past);
      film?.setPaused(past);
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
    film?.dispose();
  };
}

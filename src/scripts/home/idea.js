// Accueil, « Notre idée » : les nœuds se relient au défilement ; le plan s'incline vers la souris.
const clamp = (v) => Math.max(0, Math.min(1, v));

export function initIdeaFlow() {
  const section = document.querySelector('[data-idea-flow]');
  if (!section) return () => {};
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastP = -1;

  function measure() {
    const vh = window.innerHeight || 800;
    const r = section.getBoundingClientRect();
    let p = 1;
    if (!reduce) {
      const sticky = window.matchMedia('(min-width: 1024px)').matches;
      p = sticky
        ? clamp((vh * 0.35 - r.top) / Math.max(1, r.height - vh * 1.1))
        : clamp((vh * 0.85 - r.top) / Math.max(1, r.height * 0.85));
    }
    p = Math.round(p * 500) / 500;
    if (p !== lastP) {
      lastP = p;
      section.style.setProperty('--p', String(p));
    }
  }

  function onPointer(e) {
    if (reduce) return;
    const r = section.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    section.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
    section.style.setProperty('--rx', `${(-y * 4).toFixed(2)}deg`);
  }

  // logo SSE en relief au centre (opaque, sans effet de lumière), sur le graphe visible seulement
  let logo = null, logoMod = null, logoCanvas = null, disposed = false;
  const dark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  async function mountLogo() {
    const canvas = Array.from(section.querySelectorAll('[data-idea-logo3d]')).find((c) => c.closest('[data-idea-graph]')?.offsetParent !== null);
    if (!canvas) return;
    try {
      if (!logoMod) logoMod = await import('../three/logo-showcase.js');
    } catch {
      return;
    }
    if (disposed) return;
    logo?.dispose();
    section.classList.add('is-logo3d');
    logoCanvas = canvas;
    logo = logoMod.mountLogoShowcase(canvas, { logo: 'sse-solutions', dark: dark(), transparent: true, interactive: !reduce, fill: 0.92 });
    if (!logo) section.classList.remove('is-logo3d');
  }
  const themeObs = new MutationObserver(() => { if (logoMod) mountLogo(); });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const mq = window.matchMedia('(min-width: 1024px)');
  const onMq = () => { if (logoMod) mountLogo(); };
  mq.addEventListener('change', onMq);
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  idle(() => { if (!disposed) mountLogo(); });

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; measure(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('pointermove', onPointer, { passive: true });
  measure();

  return () => {
    disposed = true;
    logo?.dispose();
    themeObs.disconnect();
    mq.removeEventListener('change', onMq);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    window.removeEventListener('pointermove', onPointer);
  };
}

// Cartes « Nos solutions » : la carte survolée s'incline doucement vers la souris (3D).
export function initSolutionsTilt() {
  const cards = Array.from(document.querySelectorAll('[data-solution-card]'));
  if (!cards.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};
  const offs = [];
  cards.forEach((card) => {
    const move = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--tilt-x', `${(x * 7).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(-y * 6).toFixed(2)}deg`);
    };
    const leave = () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    };
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', leave);
    offs.push(() => {
      card.removeEventListener('pointermove', move);
      card.removeEventListener('pointerleave', leave);
    });
  });
  return () => offs.forEach((f) => f());
}

// « Nos solutions » : paquet de cartes en 3D. La carte de devant bascule et sort,
// les suivantes avancent d'une place, au rythme du défilement (grand écran).
export function initSolutionsDeck() {
  const section = document.querySelector('[data-solutions-deck]');
  const stack = section?.querySelector('[data-solutions-stack]');
  const cards = Array.from(section?.querySelectorAll('[data-solution-card]') || []);
  if (!section || !stack || cards.length < 2) return () => {};
  const mq = window.matchMedia('(min-width: 1024px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const n = cards.length;

  function reset() {
    stack.classList.remove('is-deck');
    cards.forEach((c) => {
      c.style.transform = '';
      c.style.opacity = '';
      c.style.zIndex = '';
      c.style.pointerEvents = '';
      c.style.visibility = '';
    });
  }

  function render() {
    if (!mq.matches || reduce) {
      reset();
      return;
    }
    stack.classList.add('is-deck');
    const vh = window.innerHeight || 800;
    const r = section.getBoundingClientRect();
    const raw = clamp(-r.top / Math.max(1, r.height - vh)) * (n - 1);
    // petits paliers : chaque carte reste un instant seule au premier plan
    const step = Math.floor(raw);
    const frac = raw - step;
    const p = step + clamp((frac - 0.2) / 0.6);
    cards.forEach((c, i) => {
      const rel = i - p;
      let t, o;
      if (rel < 0) {
        const k = clamp(-rel);
        t = `translate3d(0, ${140 * k}px, ${160 * k}px) rotateX(${-72 * k}deg)`;
        o = 1 - k;
      } else {
        t = `translate3d(0, ${-22 * rel}px, ${-90 * rel}px) scale(${1 - 0.035 * rel})`;
        o = rel > 2 ? Math.max(0, 1 - (rel - 2)) * 0.44 : 1 - 0.28 * rel;
      }
      c.style.transform = t;
      c.style.opacity = String(clamp(o));
      c.style.zIndex = String(100 - Math.round(Math.abs(rel) * 10));
      const front = Math.abs(rel) < 0.5;
      c.style.pointerEvents = front ? 'auto' : 'none';
      c.style.visibility = o <= 0.01 ? 'hidden' : 'visible';
    });
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  render();
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    reset();
  };
}

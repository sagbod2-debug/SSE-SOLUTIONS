// Page CC Consulting : hero 3D, champ de traits réactif à la souris et nœuds de services au défilement.
import { mountField } from '../three/particle-field.js';

const STEPS = [
  ['Audit de conformité', 'Un état des lieux précis de votre établissement face à la réglementation incendie.'],
  ['Mise en conformité', 'Un plan d’actions clair et l’accompagnement jusqu’à la levée des observations.'],
  ['Commissions de sécurité', 'La préparation des registres, des documents et des visites.'],
  ['Suivi des prestataires', 'Le suivi des vérifications, des contrats et des rapports de vos prestataires.'],
  ['Assistance sécurité', 'Un appui à la gestion de la sécurité de votre bâtiment au quotidien.'],
  ['Sensibilisation des équipes', 'Des sessions pour que vos équipes connaissent les bons réflexes.'],
];
const INTRO = ['Votre établissement', 'Chaque service se relie à votre établissement, jusqu’à la commission.'];

// Calendrier des apparitions (doit correspondre aux variables CSS posées dans la page)
export const FLOW_TIMING = {
  link0: [0.02, 0.08],
  hub: [0.09, 0.04],
  service: (i) => [0.12 + i * 0.1, 0.08],
  serviceNode: (i) => [0.12 + i * 0.1 + 0.065, 0.04],
  out: (i) => [0.76 + i * 0.012, 0.1],
  final: [0.88, 0.05],
};

const clamp = (v) => Math.max(0, Math.min(1, v));
const theme = () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

export function initConsultingPage() {
  const heroEl = document.querySelector('[data-cc3d-hero]');
  const heroCanvas = document.querySelector('[data-cc3d-canvas]');
  const fieldCanvas = document.querySelector('[data-cc3d-field]');
  const flowEl = document.querySelector('[data-cc3d-flow]');
  if (!heroEl && !flowEl) return () => {};

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let disposed = false;
  let scene = null;
  let field = null;
  let mountScene = null;

  // --- Hero 3D (chargé à la demande : Three.js n'alourdit que cette page) ---
  async function startScene() {
    if (!heroCanvas) return;
    try {
      if (!mountScene) mountScene = (await import('./hero-scene.js')).mountHeroScene;
    } catch {
      heroEl?.classList.add('is-3d-fallback');
      return;
    }
    if (disposed) return;
    if (scene) scene.dispose();
    const dark = theme() === 'dark';
    scene = mountScene(heroCanvas, {
      mode: heroEl?.dataset.cc3dMode === 'texte' ? 'texte' : 'logo',
      accent: dark ? '#EF6A70' : '#D42A3A',
      background: dark ? '#0E0F11' : '#FFFFFF',
    });
    if (!scene) heroEl?.classList.add('is-3d-fallback');
    else heroEl?.classList.add('is-3d-ready');
    measure();
  }

  // --- Champ de traits ---
  if (fieldCanvas) field = mountField(fieldCanvas, { theme: theme() === 'dark' ? 'sombre' : 'clair' });

  // --- Thème ---
  const themeObs = new MutationObserver(() => {
    if (field) field.setTheme(theme() === 'dark' ? 'sombre' : 'clair');
    if (scene) startScene();
  });
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // --- Nœuds au défilement ---
  const stepNum = flowEl?.querySelector('[data-flow-step-num]');
  const stepTitle = flowEl?.querySelector('[data-flow-step-title]');
  const stepText = flowEl?.querySelector('[data-flow-step-text]');
  let lastStep = -1;
  let lastP = -1;

  function setStep(k) {
    if (k === lastStep || !stepTitle) return;
    lastStep = k;
    const [title, text] = k === 0 ? INTRO : STEPS[k - 1];
    if (stepNum) stepNum.textContent = String(k).padStart(2, '0');
    stepTitle.textContent = title;
    if (stepText) stepText.textContent = text;
  }

  function measure() {
    const vh = window.innerHeight || 800;
    if (heroEl && scene) {
      const r = heroEl.getBoundingClientRect();
      scene.setScroll(clamp(-r.top / Math.max(1, r.height)));
    }
    if (flowEl) {
      let p = 1;
      if (!reduce) {
        const sticky = window.matchMedia('(min-width: 960px)').matches;
        const r = flowEl.getBoundingClientRect();
        p = sticky
          ? clamp((vh * 0.35 - r.top) / Math.max(1, r.height - vh * 1.1))
          : clamp((vh * 0.85 - r.top) / Math.max(1, r.height * 0.9));
      }
      p = Math.round(p * 500) / 500;
      if (p !== lastP) {
        lastP = p;
        flowEl.style.setProperty('--p', String(p));
        let k = 0;
        for (let i = 0; i < 6; i++) if (p >= FLOW_TIMING.serviceNode(i)[0]) k = i + 1;
        setStep(k);
      }
    }
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      measure();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  measure();

  // Ne charge la 3D qu'une fois le navigateur disponible
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 120));
  idle(() => {
    if (!disposed) startScene();
  });

  return () => {
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    themeObs.disconnect();
    if (scene) scene.dispose();
    if (field) field.dispose();
    scene = null;
    field = null;
  };
}

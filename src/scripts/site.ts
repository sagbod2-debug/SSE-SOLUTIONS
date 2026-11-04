import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initLivingMeshes } from './mesh-webgl';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;
let cleanupMeshes: (() => void) | null = null;

function cleanupAnimations() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  if (rafCallback) {
    gsap.ticker.remove(rafCallback);
    rafCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
  if (cleanupMeshes) {
    cleanupMeshes();
    cleanupMeshes = null;
  }
}

function initThemeSwitcher() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.theme-btn[data-theme-choice]');
  if (!buttons.length) return;

  const STORAGE_KEY = 'sse-theme';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resolveTheme = (pref: string): 'light' | 'dark' => {
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  };

  const syncButtons = (pref: string) => {
    buttons.forEach((btn) => {
      const choice = btn.getAttribute('data-theme-choice');
      btn.setAttribute('aria-pressed', choice === pref ? 'true' : 'false');
    });
  };

  const applyThemePref = (pref: string, withTransition = false) => {
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {}
    const updateDom = () => {
      const resolved = resolveTheme(pref);
      document.documentElement.setAttribute('data-theme', resolved);
      document.documentElement.setAttribute('data-theme-pref', pref);
      const meta = document.getElementById('meta-theme-color');
      if (meta) {
        meta.setAttribute('content', resolved === 'light' ? '#F6F4EF' : '#111416');
      }
      syncButtons(pref);
    };

    const docAny = document as unknown as {
      startViewTransition?: (cb: () => void) => void;
    };
    if (withTransition && !prefersReducedMotion && typeof docAny.startViewTransition === 'function') {
      docAny.startViewTransition(updateDom);
    } else {
      updateDom();
    }
  };

  const currentPref = document.documentElement.getAttribute('data-theme-pref') || 'system';
  syncButtons(currentPref);

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-theme-choice') || 'system';
      applyThemePref(choice, true);
    });
  });
}

function initHeader() {
  initThemeSwitcher();
  const header = document.getElementById('site-header');
  if (!header) return;

  const updateScroll = () => {
    if (window.scrollY > 24) {
      header.classList.add('is-scrolled', 'glass');
    } else {
      header.classList.remove('is-scrolled', 'glass');
    }
  };
  updateScroll();
  window.addEventListener('scroll', updateScroll, { passive: true });

  const dropdown = header.querySelector('[data-dropdown]') as HTMLElement | null;
  const toggleBtn = header.querySelector('#activities-menu-btn') as HTMLButtonElement | null;

  const closeDropdown = () => {
    if (!dropdown || !toggleBtn) return;
    dropdown.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  };

  if (dropdown && toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    dropdown.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown();
        toggleBtn.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target as Node)) {
        closeDropdown();
      }
    });
  }

  const mobileToggle = document.getElementById('mobile-menu-toggle') as HTMLButtonElement | null;
  const mobileMenu = document.getElementById('mobile-fullscreen-menu') as HTMLElement | null;

  const setMobileMenu = (open: boolean) => {
    if (!mobileToggle || !mobileMenu) return;
    header.classList.toggle('menu-open', open);
    mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileToggle.setAttribute(
      'aria-label',
      open ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'
    );
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      mobileMenu.removeAttribute('inert');
      document.body.style.overflow = 'hidden';
      lenisInstance?.stop();
    } else {
      mobileMenu.setAttribute('inert', '');
      document.body.style.overflow = '';
      lenisInstance?.start();
    }
  };

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = header.classList.contains('menu-open');
      setMobileMenu(!isOpen);
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setMobileMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && header.classList.contains('menu-open')) {
        setMobileMenu(false);
        mobileToggle.focus();
      }
    });
  }
}

// Courbe cubic-bezier(.22, 1, .36, 1) pour les compteurs
function easeOutCubicCustom(t: number): number {
  return 1 - Math.pow(1 - t, 3.2);
}

function initMicroInteractions(prefersReducedMotion: boolean) {
  const canHover = window.matchMedia('(hover: hover)').matches;

  // 2.1 Reflet qui suit le pointeur via requestAnimationFrame (--mx, --my)
  if (canHover) {
    const glowTargets = document.querySelectorAll<HTMLElement>(
      '[data-glow], .btn-primary, .btn-secondary, [data-activity-row]'
    );
    glowTargets.forEach((el) => {
      let rafId = 0;
      el.addEventListener(
        'pointermove',
        (e: PointerEvent) => {
          if (rafId) return;
          rafId = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            el.style.setProperty('--mx', `${x.toFixed(1)}px`);
            el.style.setProperty('--my', `${y.toFixed(1)}px`);
            rafId = 0;
          });
        },
        { passive: true }
      );
    });
  }

  // En mouvement réduit : aucune attraction, aucune inclinaison, aucun compteur
  if (prefersReducedMotion) {
    document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
      const target = el.getAttribute('data-count-to');
      if (target) el.textContent = target;
    });
    return;
  }

  // 2.3 Bouton principal or : attraction magnétique dans un rayon de 80 px, déplacement 6 px max, retour 400 ms --ease-spring
  if (canHover) {
    const magneticBtns = document.querySelectorAll<HTMLElement>('.btn-primary, [data-magnetic]');
    magneticBtns.forEach((btn) => {
      let rafId = 0;
      const onMove = (e: PointerEvent) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < 80 + Math.max(rect.width, rect.height) / 2) {
            const pull = Math.min(1, 1 - dist / (80 + Math.max(rect.width, rect.height) / 2));
            const tx = Math.max(-6, Math.min(6, (dx / (rect.width / 2 || 1)) * 6 * pull));
            const ty = Math.max(-6, Math.min(6, (dy / (rect.height / 2 || 1)) * 6 * pull));
            btn.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
          } else {
            btn.style.transform = '';
          }
          rafId = 0;
        });
      };
      btn.addEventListener('pointermove', onMove, { passive: true });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      });
    });

    // 2.3 Cartes d'activités : légère inclinaison 3D (2° maximum, perspective: 900px)
    const tiltCards = document.querySelectorAll<HTMLElement>('[data-tilt-card], [data-activity-row]');
    tiltCards.forEach((card) => {
      let rafId = 0;
      card.addEventListener(
        'pointermove',
        (e: PointerEvent) => {
          if (rafId) return;
          rafId = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
            const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
            const rotY = Math.max(-2, Math.min(2, nx * 4));
            const rotX = Math.max(-2, Math.min(2, -ny * 4));
            card.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
            rafId = 0;
          });
        },
        { passive: true }
      );
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // 2.3 Chiffres 35 / 244 / 2 : compteur de 0 à la valeur en 1,2 s --ease-out une seule fois
  const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
  if (counters.length > 0) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          obs.unobserve(el);
          const targetVal = parseInt(el.getAttribute('data-count-to') || '0', 10);
          if (!targetVal) return;
          const duration = 1200;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = easeOutCubicCustom(p);
            el.textContent = String(Math.round(eased * targetVal));
            if (p < 1) {
              requestAnimationFrame(tick);
            } else {
              el.textContent = String(targetVal);
            }
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.35 }
    );
    counters.forEach((c) => io.observe(c));
  }
}

function initAnimations() {
  cleanupAnimations();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2.2 Arrière-plan vivant WebGL
  cleanupMeshes = initLivingMeshes();

  // 2.3 Micro-interactions
  initMicroInteractions(prefersReducedMotion);

  if (!prefersReducedMotion) {
    lenisInstance = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisInstance.on('scroll', ScrollTrigger.update);
    rafCallback = (time: number) => {
      lenisInstance?.raf(time * 1000);
    };
    gsap.ticker.add(rafCallback);
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId) as HTMLElement | null;
      if (!targetEl) return;
      e.preventDefault();
      if (lenisInstance && !prefersReducedMotion) {
        lenisInstance.scrollTo(targetEl, { offset: -80 });
      } else {
        targetEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  if (prefersReducedMotion) {
    gsap.set('.reveal-line, [data-reveal], [data-parallax-img]', {
      clearProps: 'all',
      opacity: 1,
    });
    document.querySelectorAll('.method-step').forEach((el) => el.classList.add('is-active'));
    return;
  }

  const heroLines = document.querySelectorAll('[data-hero-line]');
  if (heroLines.length > 0) {
    gsap.fromTo(
      heroLines,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: 'power4.out',
        delay: 0.05,
      }
    );
  }

  const heroFade = document.querySelectorAll('[data-hero-fade]');
  if (heroFade.length > 0) {
    gsap.fromTo(
      heroFade,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.32,
      }
    );
  }

  document.querySelectorAll<HTMLElement>('[data-reveal-title]').forEach((titleEl) => {
    const lines = titleEl.querySelectorAll('.reveal-line');
    const targets = lines.length > 0 ? lines : [titleEl];
    gsap.fromTo(
      targets,
      { yPercent: 105 },
      {
        yPercent: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: titleEl,
          start: 'top 86%',
          once: true,
        },
      }
    );
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        },
      }
    );
  });

  const activitiesList = document.querySelector('[data-activities-interactive]') as HTMLElement | null;
  const floatingPreview = document.getElementById('activities-floating-preview') as HTMLElement | null;
  if (
    activitiesList &&
    floatingPreview &&
    window.matchMedia('(hover: hover) and (min-width: 960px)').matches
  ) {
    const xTo = gsap.quickTo(floatingPreview, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(floatingPreview, 'y', { duration: 0.45, ease: 'power3.out' });
    const previewSlides = floatingPreview.querySelectorAll<HTMLElement>('[data-preview-slide]');

    activitiesList.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = activitiesList.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      xTo(relX - 180);
      yTo(relY - 120);
    });

    activitiesList.querySelectorAll<HTMLElement>('[data-activity-row]').forEach((row) => {
      const index = row.getAttribute('data-activity-row');
      row.addEventListener('mouseenter', () => {
        floatingPreview.classList.add('is-visible');
        previewSlides.forEach((slide) => {
          slide.classList.toggle(
            'is-active',
            slide.getAttribute('data-preview-slide') === index
          );
        });
      });
    });

    activitiesList.addEventListener('mouseleave', () => {
      floatingPreview.classList.remove('is-visible');
    });
  }

  const methodSection = document.querySelector('[data-method-pin]') as HTMLElement | null;
  const methodProgress = document.querySelector('[data-method-progress]') as HTMLElement | null;
  const methodSteps = gsap.utils.toArray<HTMLElement>('.method-step');

  if (methodSection && methodProgress && methodSteps.length > 0) {
    const isDesktop = window.matchMedia('(min-width: 960px)').matches;

    if (isDesktop) {
      ScrollTrigger.create({
        trigger: methodSection,
        start: 'top top+=80',
        end: '+=140%',
        pin: true,
        scrub: 0.5,
        onUpdate: (self) => {
          gsap.set(methodProgress, { scaleY: self.progress });
          const activeIdx = Math.min(
            methodSteps.length - 1,
            Math.floor(self.progress * methodSteps.length + 0.15)
          );
          methodSteps.forEach((step, idx) => {
            step.classList.toggle('is-active', idx <= activeIdx);
          });
        },
      });
    } else {
      ScrollTrigger.create({
        trigger: methodSection,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: true,
        onUpdate: (self) => {
          gsap.set(methodProgress, { scaleY: self.progress });
        },
      });
      methodSteps.forEach((step) => {
        ScrollTrigger.create({
          trigger: step,
          start: 'top 80%',
          onEnter: () => step.classList.add('is-active'),
        });
      });
    }
  }

  document.querySelectorAll<HTMLElement>('[data-parallax-img]').forEach((img) => {
    const frame = img.closest('.media-frame') || img.parentElement;
    if (!frame) return;

    gsap.fromTo(
      img,
      { scale: 1.06 },
      {
        scale: 1.0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: frame,
          start: 'top 88%',
          once: true,
        },
      }
    );

    gsap.fromTo(
      img,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: {
          trigger: frame,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

document.addEventListener('astro:page-load', () => {
  initHeader();
  initAnimations();
});

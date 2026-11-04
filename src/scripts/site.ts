import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;

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

  // Dropdown Activités (clavier + clic)
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

  // Menu mobile plein écran
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

function initAnimations() {
  cleanupAnimations();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 2. Défilement fluide Lenis (désactivé si prefers-reduced-motion)
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

  // Ancres internes fluides
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
    // Si mouvement réduit : seulement des fondus rapides de 0.2 s, aucune translation ni parallaxe
    gsap.set('.reveal-line, [data-reveal], [data-parallax-img]', {
      clearProps: 'all',
      opacity: 1,
    });
    document.querySelectorAll('.method-step').forEach((el) => el.classList.add('is-active'));
    return;
  }

  // 1. Chargement de l'accueil : les trois mots du titre montent ligne par ligne derrière un masque
  // (durée 0.9 s, décalage 0.12 s, courbe power4.out)
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

  // 3. Apparitions au scroll : titres en révélation par ligne, paragraphes en fondu + translation de 24 px, une seule fois
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

  // 4. Liste des trois activités à l'accueil : au survol d'une ligne, la photo apparaît et suit légèrement le curseur (desktop)
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

  // 6. Méthode en 4 étapes : section épinglée, la ligne de progression or se remplit au scroll et chaque étape s'allume à son tour
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
      // Sur mobile/tablette : activation progressive sans bloquer le scroll
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

  // 7. Images : léger zoom de 1.08 à 1.0 à l'apparition, et parallaxe très douce (10 % maximum)
  document.querySelectorAll<HTMLElement>('[data-parallax-img]').forEach((img) => {
    const frame = img.closest('.media-frame') || img.parentElement;
    if (!frame) return;

    gsap.fromTo(
      img,
      { scale: 1.08 },
      {
        scale: 1.0,
        duration: 1.25,
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
      { yPercent: -4 },
      {
        yPercent: 4,
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


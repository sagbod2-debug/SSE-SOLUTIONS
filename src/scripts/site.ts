import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initLivingMeshes } from './mesh-webgl';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let rafCallback: ((time: number) => void) | null = null;
let cleanupMeshes: (() => void) | null = null;
let matchMediaCtx: gsap.MatchMedia | null = null;

function cleanupAnimations() {
  if (matchMediaCtx) {
    matchMediaCtx.revert();
    matchMediaCtx = null;
  }
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

function currentTheme(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function setTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem('sse-theme', theme);
  } catch {}
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0E0F11' : '#FFFFFF');
  syncThemeToggles();
}

function syncThemeToggles() {
  const dark = currentTheme() === 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    btn.setAttribute('aria-label', dark ? 'Passer en mode clair' : 'Passer en mode sombre');
    const label = btn.querySelector<HTMLElement>('[data-theme-toggle-label]');
    if (label) label.textContent = dark ? 'Mode clair' : 'Mode sombre';
  });
}

function initThemeToggle() {
  syncThemeToggles();
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.themeBound) return;
    btn.dataset.themeBound = '1';
    btn.addEventListener('click', () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark'));
  });
}

function detectSvgRefractionSupport() {
  try {
    const ua = navigator.userAgent || '';
    const isChromium =
      /Chrome\/|Chromium\/|Edg\//.test(ua) && !/Firefox\/|FxiOS\/|OPR\//.test(ua);
    const supportsFilter =
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('backdrop-filter', 'url(#liquid-glass)');
    if (isChromium && supportsFilter) {
      document.documentElement.classList.add('supports-svg-refraction');
    }
  } catch {}
}

function initHeader() {
  detectSvgRefractionSupport();
  initThemeToggle();
  const header = document.getElementById('site-header');
  if (!header) return;

  const updateScroll = () => {
    if (window.scrollY > 24) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
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

function applyWillChange(targets: gsap.TweenTarget, value = 'transform, opacity') {
  gsap.utils.toArray<HTMLElement>(targets).forEach((el) => {
    if (el && el.style) el.style.willChange = value;
  });
}

function clearWillChange(targets: gsap.TweenTarget) {
  gsap.utils.toArray<HTMLElement>(targets).forEach((el) => {
    if (el && el.style) el.style.willChange = 'auto';
  });
}

function setupRefreshListeners() {
  let refreshTimer = 0;
  const scheduleRefresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 60);
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleRefresh).catch(() => {});
  }

  document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', scheduleRefresh, { once: true });
    }
  });

  scheduleRefresh();
}

function initAnimations() {
  cleanupAnimations();

  // 2.2 Arrière-plan vivant WebGL
  cleanupMeshes = initLivingMeshes();

  // Ancres fluides et retour haut de page
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId) as HTMLElement | null;
      if (!targetEl) return;
      e.preventDefault();
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (lenisInstance && !reduce) {
        lenisInstance.scrollTo(targetEl, { offset: -80 });
      } else {
        targetEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }
    });
  });

  // Clic sur "Accueil" quand on est déjà sur la page d'accueil : retour fluide en haut
  document.querySelectorAll<HTMLAnchorElement>('a[href="/"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        e.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (lenisInstance && !reduce) {
          lenisInstance.scrollTo(0);
        } else {
          window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        }
      }
    });
  });

  // 2.7 Toutes les animations GSAP passent par gsap.matchMedia()
  matchMediaCtx = gsap.matchMedia();

  matchMediaCtx.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
      motionOk: '(prefers-reduced-motion: no-preference)',
      isDesktop: '(min-width: 960px)',
      canHover: '(hover: hover)',
    },
    (context) => {
      const { reduceMotion, motionOk, isDesktop, canHover } = context.conditions as Record<
        string,
        boolean
      >;

      // Condition (prefers-reduced-motion: reduce) : aucune animation ne tourne
      if (reduceMotion || !motionOk) {
        gsap.set(
          '.reveal-line, [data-reveal], [data-parallax-img], [data-hero-line], [data-hero-fade], [data-opening-item], [data-idea-panel], [data-solution-card]',
          {
            clearProps: 'all',
            opacity: 1,
          }
        );
        document.querySelectorAll('.method-step').forEach((el) => el.classList.add('is-active'));
        document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
          const target = el.getAttribute('data-count-to');
          if (target) el.textContent = target;
        });
        document.querySelectorAll<HTMLElement>('[data-checklist-item]').forEach((item) => {
          item.classList.add('is-checked');
          item.setAttribute('aria-checked', 'true');
        });
        gsap.set('[data-check-icon]', { opacity: 1, scale: 1 });
        // Affichage direct du texte complet des solutions sans délai
        document.querySelectorAll<HTMLElement>('[data-typewriter-text]').forEach((container) => {
          const txt = container.getAttribute('data-typewriter-text');
          const target = container.querySelector<HTMLElement>('.solution-typewriter__text');
          if (txt && target) target.textContent = txt;
          container.closest('.solution-card')?.classList.add('is-typing-done');
        });
        return;
      }

      // Défilement réactif et fluide : molette native 120 FPS sur GPU, zéro inertie lente
      lenisInstance = new Lenis({
        duration: 0.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: false,
        touchMultiplier: 1.0,
      });

      lenisInstance.on('scroll', ScrollTrigger.update);
      rafCallback = (time: number) => {
        lenisInstance?.raf(time * 1000);
      };
      gsap.ticker.add(rafCallback);

      // Interactions pointeur avec gsap.quickTo() uniquement (aucun nouveau tween par pointermove)
      if (canHover) {
        // 1) Reflet verre discret sur les éléments ciblés
        const glowTargets = document.querySelectorAll<HTMLElement>(
          '[data-glow], .btn-primary, .btn-secondary'
        );
        glowTargets.forEach((el) => {
          let rect = el.getBoundingClientRect();
          const pos = { x: 0, y: 0 };
          const xTo = gsap.quickTo(pos, 'x', {
            duration: 0.15,
            ease: 'power2.out',
            onUpdate: () => el.style.setProperty('--mx', `${pos.x.toFixed(1)}px`),
          });
          const yTo = gsap.quickTo(pos, 'y', {
            duration: 0.15,
            ease: 'power2.out',
            onUpdate: () => el.style.setProperty('--my', `${pos.y.toFixed(1)}px`),
          });

          el.addEventListener(
            'pointerenter',
            () => {
              rect = el.getBoundingClientRect();
            },
            { passive: true }
          );

          el.addEventListener(
            'pointermove',
            (e: PointerEvent) => {
              xTo(e.clientX - rect.left);
              yTo(e.clientY - rect.top);
            },
            { passive: true }
          );
        });

        // 2) Attraction magnétique (.btn-primary) via gsap.quickTo() (rayon 80 px, max 6 px, retour 400 ms --ease-spring)
        const magneticBtns = document.querySelectorAll<HTMLElement>('.btn-primary, [data-magnetic]');
        magneticBtns.forEach((btn) => {
          const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'back.out(1.7)' });
          const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'back.out(1.7)' });

          btn.addEventListener(
            'pointerenter',
            () => {
              btn.style.willChange = 'transform';
            },
            { passive: true }
          );

          btn.addEventListener(
            'pointermove',
            (e: PointerEvent) => {
              const rect = btn.getBoundingClientRect();
              const cx = rect.left + rect.width / 2;
              const cy = rect.top + rect.height / 2;
              const dx = e.clientX - cx;
              const dy = e.clientY - cy;
              const radius = 80 + Math.max(rect.width, rect.height) / 2;
              const dist = Math.hypot(dx, dy);
              if (dist < radius) {
                const pull = Math.min(1, 1 - dist / radius);
                const tx = Math.max(-6, Math.min(6, (dx / (rect.width / 2 || 1)) * 6 * pull));
                const ty = Math.max(-6, Math.min(6, (dy / (rect.height / 2 || 1)) * 6 * pull));
                xTo(tx);
                yTo(ty);
              } else {
                xTo(0);
                yTo(0);
              }
            },
            { passive: true }
          );

          btn.addEventListener('pointerleave', () => {
            xTo(0);
            yTo(0);
            window.setTimeout(() => {
              btn.style.willChange = 'auto';
            }, 420);
          });
        });

        // 3) Inclinaison 3D des cartes d'activités (2° max, perspective 900px) via gsap.quickTo()
        const tiltCards = document.querySelectorAll<HTMLElement>(
          '[data-tilt-card], [data-activity-row]'
        );
        tiltCards.forEach((card) => {
          gsap.set(card, { transformPerspective: 900 });
          const rotXTo = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power3.out' });
          const rotYTo = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power3.out' });

          card.addEventListener(
            'pointerenter',
            () => {
              card.style.willChange = 'transform';
            },
            { passive: true }
          );

          card.addEventListener(
            'pointermove',
            (e: PointerEvent) => {
              const rect = card.getBoundingClientRect();
              const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
              const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
              const rotY = Math.max(-2, Math.min(2, nx * 4));
              const rotX = Math.max(-2, Math.min(2, -ny * 4));
              rotXTo(rotX);
              rotYTo(rotY);
            },
            { passive: true }
          );

          card.addEventListener('pointerleave', () => {
            rotXTo(0);
            rotYTo(0);
            window.setTimeout(() => {
              card.style.willChange = 'auto';
            }, 380);
          });
        });

        // 3b) 7.4 Inclinaison 3D des logos au survol (4° max, gsap.quickTo)
        const brandLogos = document.querySelectorAll<HTMLElement>('[data-brand-logo]');
        brandLogos.forEach((logo) => {
          const tiltTarget = logo.querySelector<HTMLElement>('[data-brand-logo-tilt]') || logo;
          gsap.set(tiltTarget, { transformPerspective: 700 });
          const rotXTo = gsap.quickTo(tiltTarget, 'rotationX', {
            duration: 0.35,
            ease: 'power3.out',
          });
          const rotYTo = gsap.quickTo(tiltTarget, 'rotationY', {
            duration: 0.35,
            ease: 'power3.out',
          });

          logo.addEventListener(
            'pointerenter',
            () => {
              tiltTarget.style.willChange = 'transform';
            },
            { passive: true }
          );

          logo.addEventListener(
            'pointermove',
            (e: PointerEvent) => {
              const rect = logo.getBoundingClientRect();
              const nx = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
              const ny = (e.clientY - rect.top) / Math.max(1, rect.height) - 0.5;
              const rotY = Math.max(-4, Math.min(4, nx * 8));
              const rotX = Math.max(-4, Math.min(4, -ny * 8));
              rotXTo(rotX);
              rotYTo(rotY);
            },
            { passive: true }
          );

          logo.addEventListener('pointerleave', () => {
            rotXTo(0);
            rotYTo(0);
            window.setTimeout(() => {
              tiltTarget.style.willChange = 'auto';
            }, 380);
          });
        });

        // 4) Halo / aperçu flottant des activités sur l'accueil via gsap.quickTo()
        const activitiesList = document.querySelector(
          '[data-activities-interactive]'
        ) as HTMLElement | null;
        const floatingPreview = document.getElementById(
          'activities-floating-preview'
        ) as HTMLElement | null;
        if (activitiesList && floatingPreview && isDesktop) {
          const xTo = gsap.quickTo(floatingPreview, 'x', { duration: 0.45, ease: 'power3.out' });
          const yTo = gsap.quickTo(floatingPreview, 'y', { duration: 0.45, ease: 'power3.out' });
          const previewSlides =
            floatingPreview.querySelectorAll<HTMLElement>('[data-preview-slide]');

          activitiesList.addEventListener(
            'pointermove',
            (e: PointerEvent) => {
              const rect = activitiesList.getBoundingClientRect();
              xTo(e.clientX - rect.left - 180);
              yTo(e.clientY - rect.top - 120);
            },
            { passive: true }
          );

          activitiesList.querySelectorAll<HTMLElement>('[data-activity-row]').forEach((row) => {
            const index = row.getAttribute('data-activity-row');
            row.addEventListener('mouseenter', () => {
              floatingPreview.style.willChange = 'transform, opacity';
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
            floatingPreview.style.willChange = 'auto';
          });
        }
      }

      // 7.4 Révélation des logos de gauche à droite par masque (1 s) + reflet lumineux unique (0,9 s)
      document.querySelectorAll<HTMLElement>('[data-brand-logo]').forEach((logo) => {
        const mask = logo.querySelector<HTMLElement>('[data-brand-logo-mask]');
        const sheen = logo.querySelector<HTMLElement>('[data-brand-logo-sheen]');
        if (!mask) return;

        gsap.set(mask, { clipPath: 'inset(0 100% 0 0)' });
        if (sheen) {
          gsap.set(sheen, { xPercent: -140, opacity: 1 });
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: logo,
            start: 'top 92%',
            once: true,
          },
          onStart: () => applyWillChange(mask, 'transform, opacity'),
          onComplete: () => {
            clearWillChange(mask);
            if (sheen) clearWillChange(sheen);
          },
        });

        tl.to(mask, {
          clipPath: 'inset(0 0% 0 0)',
          duration: 1.0,
          ease: 'power3.out',
        });

        if (sheen) {
          tl.to(
            sheen,
            {
              xPercent: 140,
              duration: 0.9,
              ease: 'power2.inOut',
            },
            '-=0.15'
          ).set(sheen, { opacity: 0 });
        }
      });

      // 7.6 Section 1 — Ouverture : entrée en cascade (logo, nom, accroche, boutons, 120 ms d'écart)
      const openingItems = document.querySelectorAll('[data-opening-item]');
      if (openingItems.length > 0) {
        gsap.fromTo(
          openingItems,
          { opacity: 0, y: 22 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.08,
            onStart: () => applyWillChange(openingItems, 'transform, opacity'),
            onComplete: () => clearWillChange(openingItems),
          }
        );
      }

      // Section 2 — « Notre idée » : Bulles liquides Siri et gravitation magnétique vers SSE Solutions
      const ideaPanel = document.querySelector<HTMLElement>('[data-idea-panel]');
      if (ideaPanel) {
        gsap.set(ideaPanel, { scale: 0.92, borderRadius: '36px' });
        gsap.to(ideaPanel, {
          scale: 1,
          borderRadius: '24px',
          ease: 'none',
          scrollTrigger: {
            trigger: ideaPanel,
            start: 'top 92%',
            end: 'top 30%',
            scrub: 0.2,
          },
        });

        const nodeCare = ideaPanel.querySelector<HTMLElement>('[data-siri-node="care"]');
        const nodeConsulting = ideaPanel.querySelector<HTMLElement>('[data-siri-node="consulting"]');
        const nodeEvents = ideaPanel.querySelector<HTMLElement>('[data-siri-node="events"]');
        const siriCore = ideaPanel.querySelector<HTMLElement>('[data-siri-core]');

        if (isDesktop && nodeCare && nodeConsulting && nodeEvents && siriCore) {
          gsap.set(siriCore, { scale: 1, opacity: 1 });
          gsap.set([nodeCare, nodeConsulting, nodeEvents], { zIndex: 2, opacity: 1 });

          const ideaTl = gsap.timeline({
            scrollTrigger: {
              trigger: ideaPanel,
              start: 'top 32%',
              end: 'bottom 15%',
              scrub: 0.4,
            },
          });

          // Gravitation orbitale : les 3 bulles satellites tournent, convergent derrière SSE Solutions et disparaissent
          ideaTl
            // Phase 1 : Rotation orbitale fluide et amorce de trajectoire
            .to(
              nodeCare,
              {
                x: 150,
                y: -15,
                rotation: -16,
                scale: 0.8,
                duration: 0.45,
                ease: 'power1.inOut',
              },
              0.1
            )
            .to(
              nodeEvents,
              {
                x: -150,
                y: 15,
                rotation: 16,
                scale: 0.8,
                duration: 0.45,
                ease: 'power1.inOut',
              },
              0.1
            )
            .to(
              nodeConsulting,
              {
                x: 30,
                y: 130,
                rotation: 10,
                scale: 0.8,
                duration: 0.45,
                ease: 'power1.inOut',
              },
              0.1
            )
            .to(siriCore, { scale: 1.02, opacity: 1, duration: 0.45, ease: 'power1.out' }, 0.1)
            // Phase 2 : Convergence complète derrière le cœur SSE Solutions et fusion
            .to(
              nodeCare,
              {
                x: 250,
                y: 20,
                rotation: -35,
                scale: 0.22,
                autoAlpha: 0,
                duration: 0.45,
                ease: 'power2.in',
              },
              0.55
            )
            .to(
              nodeEvents,
              {
                x: -250,
                y: 20,
                rotation: 35,
                scale: 0.22,
                autoAlpha: 0,
                duration: 0.45,
                ease: 'power2.in',
              },
              0.55
            )
            .to(
              nodeConsulting,
              {
                x: 0,
                y: 250,
                rotation: 22,
                scale: 0.22,
                autoAlpha: 0,
                duration: 0.45,
                ease: 'power2.in',
              },
              0.55
            )
            .to(
              siriCore,
              {
                scale: 1.06,
                opacity: 1,
                boxShadow:
                  '0 0 55px -2px rgba(79, 209, 165, 0.45), 0 0 75px -5px rgba(169, 155, 255, 0.4), 0 20px 45px rgba(0,0,0,0.35)',
                duration: 0.45,
                ease: 'power2.out',
              },
              0.55
            );
        }
      }

      // Section 3 — « Nos solutions » : cartes ultra-fluides avec effet d'écriture rapide en direct
      const solutionsSection = document.querySelector<HTMLElement>('[data-solutions-pin]');
      const solutionsStack = document.querySelector<HTMLElement>('[data-solutions-stack]');
      const solutionCards = gsap.utils.toArray<HTMLElement>('[data-solution-card]');

      if (solutionsSection && solutionsStack && solutionCards.length > 1) {
        // Moteur de dactylographie rapide pour les cartes commerciales
        interface TypewriterControl {
          card: HTMLElement;
          start: () => void;
          instant: () => void;
        }

        const typewriterControls: TypewriterControl[] = solutionCards.map((card) => {
          const textContainer = card.querySelector<HTMLElement>('[data-typewriter-text]');
          const textTarget = card.querySelector<HTMLElement>('.solution-typewriter__text');
          const fullText = textContainer?.getAttribute('data-typewriter-text') || '';
          let timer = 0;
          let started = false;

          const start = () => {
            if (started || !textTarget) return;
            started = true;
            textTarget.textContent = '';
            let charIndex = 0;
            // Écriture éclair à 6 ms/caractère
            timer = window.setInterval(() => {
              if (charIndex < fullText.length) {
                textTarget.textContent = fullText.slice(0, charIndex + 1);
                charIndex++;
              } else {
                window.clearInterval(timer);
                card.classList.add('is-typing-done');
              }
            }, 6);
          };

          const instant = () => {
            window.clearInterval(timer);
            if (textTarget) textTarget.textContent = fullText;
            started = true;
            card.classList.add('is-typing-done');
          };

          return { card, start, instant };
        });

        if (isDesktop) {
          solutionsStack.classList.add('is-pinned-ready');

          solutionCards.forEach((card, idx) => {
            if (idx === 0) {
              gsap.set(card, {
                y: 0,
                scale: 1,
                opacity: 1,
                zIndex: 10,
                pointerEvents: 'auto',
              });
            } else {
              gsap.set(card, {
                y: 60,
                scale: 0.98,
                opacity: 0,
                zIndex: 10 + idx,
                pointerEvents: 'none',
              });
            }
          });

          // Déclenche l'écriture de la première carte dès l'entrée dans la section
          ScrollTrigger.create({
            trigger: solutionsSection,
            start: 'top 85%',
            once: true,
            onEnter: () => typewriterControls[0]?.start(),
          });

          const solTl = gsap.timeline({
            scrollTrigger: {
              trigger: solutionsSection,
              start: 'top top+=72',
              end: `+=${(solutionCards.length - 1) * 45}%`,
              pin: true,
              scrub: 0.1, // Réponse instantanée au défilement
              onUpdate: (self) => {
                const activeIdx = Math.min(
                  solutionCards.length - 1,
                  Math.round(self.progress * (solutionCards.length - 1))
                );
                solutionCards.forEach((c, idx) => {
                  c.style.pointerEvents = idx === activeIdx ? 'auto' : 'none';
                });
                typewriterControls[activeIdx]?.start();
                const activeTint = solutionCards[activeIdx]?.getAttribute('data-particle-tint');
                if (activeTint) {
                  solutionsSection.setAttribute('data-particle-tint', activeTint);
                }
              },
            },
          });

          for (let i = 1; i < solutionCards.length; i++) {
            const prev = solutionCards[i - 1];
            const curr = solutionCards[i];
            const stepPos = i - 1;

            solTl.to(
              prev,
              {
                scale: 0.94,
                y: -15,
                autoAlpha: 0,
                duration: 0.45,
                ease: 'power2.inOut',
              },
              stepPos
            );

            solTl.fromTo(
              curr,
              { y: 50, scale: 0.98, autoAlpha: 0 },
              {
                y: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 0.45,
                ease: 'power2.out',
              },
              stepPos + 0.04
            );
          }
        } else {
          solutionsStack.classList.remove('is-pinned-ready');
          solutionCards.forEach((card, idx) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 50 },
              {
                opacity: 1,
                y: 0,
                duration: 0.65,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 88%',
                  once: true,
                  onEnter: () => typewriterControls[idx]?.start(),
                },
              }
            );
          });
        }
      }

      // Animations d'entrée du hero (transform + opacity uniquement)
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
            onStart: () => applyWillChange(heroLines, 'transform'),
            onComplete: () => clearWillChange(heroLines),
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
            delay: 0.28,
            onStart: () => applyWillChange(heroFade, 'transform, opacity'),
            onComplete: () => clearWillChange(heroFade),
          }
        );
      }

      // Compteurs (35 / 244 / 2) en 1,2 s --ease-out une seule fois
      const counters = document.querySelectorAll<HTMLElement>('[data-count-to]');
      counters.forEach((el) => {
        const targetVal = parseInt(el.getAttribute('data-count-to') || '0', 10);
        if (!targetVal) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top 85%',
          once: true,
          onEnter: () => {
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
          },
        });
      });

      // ScrollTriggers créés sur des tweens/timelines de premier niveau, triés dans l'ordre du DOM
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
            onStart: () => applyWillChange(targets, 'transform'),
            onComplete: () => clearWillChange(targets),
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
            onStart: () => applyWillChange(el, 'transform, opacity'),
            onComplete: () => clearWillChange(el),
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          }
        );
      });

      // 5.4 Liste à cocher animée (« Ce que la commission regarde en premier ») : 120 ms d'écart
      document.querySelectorAll<HTMLElement>('[data-checklist-animated]').forEach((listEl) => {
        const items = listEl.querySelectorAll<HTMLElement>('[data-checklist-item]');
        const icons = listEl.querySelectorAll<HTMLElement>('[data-check-icon]');
        if (!items.length) return;
        gsap.set(icons, { opacity: 0, scale: 0.5 });
        gsap.to(icons, {
          opacity: 1,
          scale: 1,
          duration: 0.36,
          stagger: 0.12,
          ease: 'back.out(1.7)',
          onStart: () => {
            applyWillChange(icons, 'transform, opacity');
            items.forEach((item, idx) => {
              window.setTimeout(() => {
                item.classList.add('is-checked');
                item.setAttribute('aria-checked', 'true');
              }, idx * 120);
            });
          },
          onComplete: () => clearWillChange(icons),
          scrollTrigger: {
            trigger: listEl,
            start: 'top 82%',
            once: true,
          },
        });
      });

      // Section méthode épinglée (CC Care / CC Consulting / CC Events)
      const methodSection = document.querySelector('[data-method-pin]') as HTMLElement | null;
      const methodProgress = document.querySelector('[data-method-progress]') as HTMLElement | null;
      const methodSteps = gsap.utils.toArray<HTMLElement>('.method-step');

      if (methodSection && methodProgress && methodSteps.length > 0) {
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

      // Parallaxe d'images (transform uniquement)
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
            onStart: () => applyWillChange(img, 'transform'),
            onComplete: () => clearWillChange(img),
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

      // Tri strict des ScrollTrigger dans l'ordre d'apparition dans la page
      ScrollTrigger.sort();
    }
  );

  // Refresh après chargement des polices, des images et de la View Transition
  setupRefreshListeners();
}

document.addEventListener('astro:before-swap', () => {
  cleanupAnimations();
});

document.addEventListener('astro:page-load', () => {
  initHeader();
  initAnimations();
});

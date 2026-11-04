# Prompt à coller dans Antigravity

Copie tout le bloc ci-dessous dans Antigravity, après avoir ouvert ce dossier comme projet.

---

Tu es le développeur front-end et directeur artistique du site de **SSE Solutions** (« Social, Security and Events »), une entreprise française qui regroupe trois activités commerciales : **CC Care** (social), **CC Consulting** (sécurité incendie) et **CC Events** (événementiel).

Ce dossier contient tout ce qu'il te faut. Lis les fichiers dans cet ordre avant d'écrire une ligne de code :

1. `01_BRIEF_DESIGN.md` : direction artistique, palette, typographies, animations, références.
2. `02_ARBORESCENCE_ET_TEXTES.md` : les pages, leurs URL et **tous les textes définitifs** (ne réécris pas les textes, ne rajoute pas de contenu).
3. `03_IMAGES.md` : les emplacements d'images, la direction photo et où trouver les photos.
4. `04_REGLES_A_RESPECTER.md` : ce qu'il ne faut jamais faire (obligatoire).
5. `assets/logos/` : les logos officiels.

## Ce que je veux

- Un site **très épuré, premium, avec de belles animations**, dans l'esprit du studio fraxbit.com : fond très sombre, titres courts et massifs qui finissent par un point, sur-titres en petites capitales, cartes numérotées 01 / 02 / 03, beaucoup d'espace, défilement fluide, révélations au scroll. **On s'inspire de l'esprit, on ne copie rien** (ni texte, ni code, ni image de fraxbit).
- Un site **global SSE Solutions**, avec **une page par activité** accessible par une URL directe (`/cc-care`, `/cc-consulting`, `/cc-events`), qu'on pourra coller dans nos e-mails et nos réseaux. Chaque page d'activité garde la structure du site mais prend la couleur d'accent de son activité.
- Le site doit avoir l'air **dessiné à la main par un studio**, pas généré par une IA : pas de dégradé violet, pas d'icônes génériques en pastilles, pas d'emoji, pas de cartes toutes identiques avec ombre, pas de faux chiffres.

## Stack technique

- **Astro** (site statique, une page = un fichier), CSS maison avec variables (pas de Tailwind par défaut), **GSAP + ScrollTrigger** pour les animations, **Lenis** pour le défilement fluide.
- Formulaire de contact avec **Netlify Forms** (gratuit, sans serveur).
- Déploiement sur **Netlify**. Prévois un `netlify.toml` et des redirections propres (`/cc-care` sans `.html`).
- Images en **AVIF/WebP** avec `<picture>`, chargement différé, dimensions fixées (pas de saut de mise en page).
- Note Lighthouse visée : **90+** en performance et **100** en accessibilité.

## Ordre de travail

1. Mets en place le projet, les variables de design (`01_BRIEF_DESIGN.md`) et les polices.
2. Construis l'accueil complet, puis montre-le-moi.
3. Construis les trois pages d'activité, puis la page « Autonomie & Inclusion », contact, mentions légales et confidentialité.
4. Ajoute les animations à la fin, en respectant `prefers-reduced-motion`.
5. Vérifie chaque page en 375 px, 768 px et 1440 px, au clavier, et avec un lecteur d'écran.
6. Liste-moi à la fin les images encore provisoires et les points marqués « [À COMPLÉTER] ».

# Éléments à compléter — SSE Solutions

Ce fichier regroupe les notes de travail et éléments en attente de validation ou de fichiers définitifs (aucun commentaire de travail ni contenu inventé ne figure dans le HTML généré). Toutes les sections en attente sont pilotées par les variables de `src/config/flags.ts` (toutes à `false` par défaut).

## 1. Variables `SHOW_*` et sections en attente de contenus réels (`src/config/flags.ts`)

| Variable | Valeur par défaut | Page | Section / Élément | Contenu attendu avant passage à `true` |
| :--- | :--- | :--- | :--- | :--- |
| `SHOW_TEAM` | `false` | `/` (`src/pages/index.astro`) | Section « Qui est derrière SSE Solutions » (5.2) | Tableau `TEAM_MEMBERS` dans `src/config/flags.ts` : photo, nom, rôle, diplôme et années d'expérience de chaque intervenant. |
| `SHOW_CARE_FAQ` | `false` | `/cc-care` (`src/pages/cc-care/index.astro`) | Section FAQ CC Care + balisage JSON-LD `FAQPage` (5.3 & 5.9) | Réponses officielles aux 3 questions dans `CARE_FAQ_ITEMS` (`src/config/flags.ts`). |
| `SHOW_CONSULTING_FAQ` | `false` | `/cc-consulting` (`src/pages/cc-consulting.astro`) | Section FAQ CC Consulting + balisage JSON-LD `FAQPage` (5.4 & 5.9) | Réponses officielles aux 3 questions dans `CONSULTING_FAQ_ITEMS` (`src/config/flags.ts`), avec source officielle pour tout point réglementaire. |
| `SHOW_EVENTS_PROOF` | `false` | `/cc-events` (`src/pages/cc-events.astro`) | Section « Ils nous ont fait confiance » et galerie de vraies photos (5.5) | Références autorisées et photographies réelles d'événements organisés. |
| `SHOW_PILOT_DETAILS` | `false` | `/cc-care/autonomie-inclusion` (`src/pages/cc-care/autonomie-inclusion.astro`) | Section « Ce que comprend le test gratuit » (5.6) | Modalités détaillées de l'expérimentation gratuite début 2027. |
| `SHOW_CONTACT_PHONE` | `false` | `/contact` (`src/pages/contact.astro`) | Bloc Téléphone dans la colonne « Coordonnées directes » (5.7) | Variables `CONTACT_PHONE_DISPLAY` et `CONTACT_PHONE_HREF`. |
| `SHOW_CONTACT_BOOKING` | `false` | `/contact` (`src/pages/contact.astro`) | Bouton « Prendre rendez-vous » dans la colonne « Coordonnées directes » (5.7) | Variable `CONTACT_BOOKING_URL` (lien de prise de rendez-vous). |
| `SHOW_LINKEDIN` | `false` | Toutes les pages (`src/components/Footer.astro`) | Lien LinkedIn dans le pied de page (3.4) | Variable `LINKEDIN_URL` dès l'ouverture de la page entreprise officielle. |

## 2. Mentions légales (`src/pages/mentions-legales.astro`)
- **Forme juridique précise** : actuellement « Entrepreneur individuel (micro-entreprise) ».
- **Numéro SIRET (14 chiffres)** : actuellement « En cours d'attribution / à compléter avant mise en ligne définitive » (SIREN : `931 611 669`).
- **Numéro de téléphone de contact** : actuellement « Sur demande par écrit aux adresses e-mail ci-dessus ».

## 3. Logo officiel SSE Solutions (`src/pages/index.astro`)
- Dans la section « Trois lettres. Une seule maison. », l'image `logo_SSE_Solutions.png` (1,3 Mo sur fond blanc) a été remplacée par la composition typographique `.brand-wordmark-large` (« SSE » en Marcellus, filet or, « Solutions ») sans fond.
- Dès qu'une version vectorielle (`.svg`) ou `.png` détourée sur fond transparent (< 40 Ko) du logo principal est disponible, elle pourra remplacer ce bloc.

## 4. Teintes d'activité (`src/styles/global.css`)
- Les variables `--tint-care` (`#8FB5A0` / `#3F6B55`), `--tint-consulting` (`#D98A6A` / `#A6512F`) et `--tint-events` (`#8FA8D9` / `#3F5A94`) utilisent les valeurs de repli harmonisées avec l'or `#C9A24B` et conformes au contraste AA.

# TODO — Points en attente de validation ou d'éléments par SSE Solutions

Ce fichier regroupe l'ensemble des éléments provisoires ou à confirmer (retirés des commentaires HTML publics pour garder un code de production irréprochable).

## 1. Logos et identité visuelle
- [ ] **Logo officiel SSE Solutions** (`src/pages/index.astro`, section « Trois lettres. Une seule maison. ») : fournir une version SVG ou PNG sur fond transparent (< 40 Ko) pour remplacer la composition typographique actuelle si souhaité.
- [ ] **Logos CC Care et CC Events** : fournir les versions vectorielles SVG ou PNG sur fond transparent.
- [ ] **Logo CC Consulting** : fournir le logo officiel de l'activité sécurité incendie.
- [ ] **Validation des teintes d'activité (Lot 2.5)** : confirmer auprès de SSE Solutions la proposition de teintes d'accent :
  - CC Care : `#8FB5A0` (sombre) / `#3F6B55` (clair)
  - CC Consulting : `#D98A6A` (sombre) / `#A6512F` (clair)
  - CC Events : `#8FA8D9` (sombre) / `#3F5A94` (clair)

## 2. Contenus et coordonnées
- [ ] **CC Care (`/cc-care`)** : validation finale par CC Care de la liste des 4 missions affichées.
- [ ] **CC Consulting (`/cc-consulting`)** : vérification du numéro de déclaration d'activité avant toute évolution terminologique du point 06 (*Sensibilisation des équipes*).
- [ ] **CC Events (`/cc-events`)** : création de la redirection ou boîte `ccevents@ssesolutions.fr` chez Ionos, puis ajout dans `src/pages/api/contact.ts` et `src/pages/cc-events.astro`.
- [ ] **Mentions légales (`/mentions-legales`)** : ajout du numéro de téléphone professionnel dès qu'il est défini.
- [ ] **LinkedIn (`src/components/Footer.astro`)** : une fois les pages vitrines créées, passer `SHOW_LINKEDIN=true` et renseigner `PUBLIC_LINKEDIN_URL`.

## 3. Photographies (`src/data/credits.json`)
- [ ] Validation ou remplacement par Jean-David des 13 photographies Unsplash sélectionnées.

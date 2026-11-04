# Brief design — site SSE Solutions

## L'idée en une phrase

Une maison mère sobre et métallique, argent et or sur fond graphite, qui présente trois activités très différentes avec la même rigueur. On doit sentir le sérieux d'un cabinet et le soin d'un studio de design.

## Référence d'esprit : fraxbit.com

Ce qu'on reprend (l'esprit, pas le contenu) :
- Fond très sombre, presque noir, et texte clair.
- Titres très courts, très grands, qui finissent par un point. Exemple chez nous : « Social. Sécurité. Événements. »
- Sur-titres en petites capitales espacées au-dessus de chaque titre.
- Cartes et étapes numérotées 01, 02, 03.
- Beaucoup d'espace vide, une grille stricte, peu d'éléments par écran.
- Défilement fluide, apparitions au scroll, bandeau de mots qui défile en boucle.
- Un formulaire de contact avec des pastilles à cliquer pour choisir son sujet.

Ce qu'on ne reprend pas : leurs textes, leur code, leurs images, leurs chiffres, leur logo, leur showreel, leurs avis clients.

## Palette

Tirée des logos fournis (argent brossé, or brossé, bleu profond, vert feuille, noir laqué).

| Rôle | Nom | Hex |
| --- | --- | --- |
| Fond principal | Graphite | #111416 |
| Fond secondaire (sections alternées) | Graphite clair | #1A1E21 |
| Lignes, bordures fines | Acier | #2C3237 |
| Texte principal | Blanc argent | #EDEEEF |
| Texte secondaire | Argent | #A3AAB1 |
| Accent maison mère | Or brossé | #C9A24B |
| Or au survol | Or clair | #E0BE6A |

Accents par activité (utilisés seulement sur leur page et sur leur carte à l'accueil) :

| Activité | Couleur 1 | Couleur 2 | Or |
| --- | --- | --- | --- |
| CC Care (social) | Bleu profond #1F4E86 | Vert feuille #5E9B3A | #C9A24B |
| CC Consulting (sécurité) | Bleu nuit #13233F | — | #C9A24B (à confirmer avec le logo, encore absent) |
| CC Events (événementiel) | Noir laqué #0B0B0B | — | Or vif #D4A62A |

Règles :
- L'or est rare : un mot, un trait, un bouton principal. Jamais de grands aplats dorés, jamais de dégradé doré « bling ».
- **Page CC Care : sections claires.** Le public (structures sociales, personnes accompagnées) a besoin de confort de lecture. La page CC Care alterne des sections sombres et des sections claires sur fond #F3F5F4 avec texte #14202B. Contraste AA minimum partout.
- Pas de violet, pas de néon, pas de dégradé bleu-violet.

## Typographies (Google Fonts)

- **Titres : Marcellus.** Capitales gravées, proche des lettres du logo « SOLUTIONS ». Utilisée en très grand (clamp 3rem → 7.5rem), interlignage serré (1.0), légère tension négative de l'approche (-0.01em).
- **Texte : Hanken Grotesk** (400, 500, 600). Corps 17–18 px, interlignage 1.6, 65 caractères par ligne au maximum.
- **Sur-titres et numéros :** Hanken Grotesk 600, 12–13 px, capitales, espacement 0.18em, couleur argent ; numéros 01 / 02 / 03 en chiffres tabulaires.
- Pas d'Inter, pas de Space Grotesk, pas de Poppins.

## Grille et espacements

- Grille 12 colonnes, conteneur 1320 px maximum, gouttières 24 px, marges latérales 20 px sur mobile.
- Échelle d'espacement : 8 / 16 / 24 / 40 / 64 / 104 / 168 px. Les sections respirent : 104 à 168 px entre elles sur grand écran.
- Bordures fines 1 px couleur Acier plutôt que des ombres. Rayon de bordure 2 px maximum (ou zéro) : on reste anguleux et précis comme les lettres du logo.

## Logos

- Les logos fournis sont des PNG **sur fond blanc**, sans transparence (`assets/logos/`).
- Ne les pose pas directement sur le fond sombre. Deux options : (1) les présenter dans un panneau clair (#F3F5F4) qui fait partie de la mise en page, ou (2) dans l'en-tête, utiliser un mot-symbole typographique « SSE Solutions » en Marcellus, en attendant les versions transparentes.
- **[À COMPLÉTER]** Obtenir les logos en PNG transparent ou en SVG, et le logo CC Consulting.
- Ne redessine pas, ne recolore pas et ne déforme pas les logos.

## Animations (GSAP + ScrollTrigger + Lenis)

Une animation doit guider l'œil, jamais distraire. Liste complète de ce qu'on veut :

1. **Chargement de l'accueil** : les trois mots du titre « Social. Sécurité. Événements. » montent ligne par ligne derrière un masque (durée 0.9 s, décalage 0.12 s, courbe `power4.out`). Pas d'écran de chargement.
2. **Défilement fluide** Lenis sur tout le site (désactivé si `prefers-reduced-motion`).
3. **Apparitions au scroll** : titres en révélation par ligne, paragraphes en fondu + translation de 24 px, une seule fois.
4. **Liste des trois activités à l'accueil** : au survol d'une ligne, la photo de l'activité apparaît et suit légèrement le curseur (sur ordinateur uniquement) ; sur mobile, la photo est simplement affichée au-dessus de la ligne.
5. **Bandeau défilant** en boucle avec les métiers : « Accompagnement social · Sécurité incendie · Établissements recevant du public · Événementiel · Autonomie · Commissions de sécurité · Coordination d'équipes · » (pause au survol, arrêté si mouvement réduit).
6. **Méthode en 4 étapes** : section épinglée, la ligne de progression or se remplit au scroll et chaque étape s'allume à son tour.
7. **Images** : léger zoom de 1.08 à 1.0 à l'apparition, et parallaxe très douce (10 % maximum).
8. **Boutons** : soulignement or qui se trace de gauche à droite au survol ; bouton principal plein or, texte graphite.
9. **Transition entre pages** : fondu rapide (0.3 s) avec un voile graphite, via les View Transitions d'Astro.
10. **Curseur** : on garde le curseur normal (pas de curseur personnalisé), pour l'accessibilité.

Si `prefers-reduced-motion: reduce` : aucune translation, aucune parallaxe, aucun défilement automatique ; seulement des fondus de 0.2 s.

## Accessibilité (non négociable)

- Contraste AA minimum, focus clavier très visible (contour or 2 px).
- Lien « Aller au contenu » en premier élément.
- Textes alternatifs sur toutes les images, en français.
- Tailles de texte en `rem`, zoom 200 % sans casse.
- La page CC Care doit être exemplaire : c'est une activité sociale qui parle d'inclusion et de FALC.

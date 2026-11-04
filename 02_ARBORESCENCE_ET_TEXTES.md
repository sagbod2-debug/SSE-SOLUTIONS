# Arborescence et textes définitifs

Tous les textes ci-dessous sont définitifs. Ne les réécris pas, ne les rallonge pas, n'ajoute ni chiffre, ni client, ni témoignage. Les mentions « [À COMPLÉTER] » restent visibles dans le code (commentaire) mais **pas sur le site** : masque l'élément concerné tant qu'il n'est pas complété.

## Arborescence et URL

| Page | URL | Rôle |
| --- | --- | --- |
| Accueil | `/` | Présenter SSE Solutions et orienter vers les 3 activités |
| CC Care | `/cc-care` | Activité sociale (lien direct envoyé aux structures sociales) |
| Autonomie & Inclusion | `/cc-care/autonomie-inclusion` | Programme en ligne de CC Care (lien direct pour la prospection) |
| CC Consulting | `/cc-consulting` | Activité sécurité incendie |
| CC Events | `/cc-events` | Activité événementielle |
| Contact | `/contact` | Formulaire + coordonnées |
| Mentions légales | `/mentions-legales` | Obligatoire |
| Confidentialité | `/confidentialite` | Obligatoire (formulaire = données personnelles) |

Le formulaire de contact accepte un paramètre pour présélectionner le sujet : `/contact?sujet=cc-care`, `?sujet=autonomie`, `?sujet=cc-consulting`, `?sujet=cc-events`.

## Éléments communs

**En-tête (fixe, devient opaque au scroll)**
- À gauche : mot-symbole « SSE Solutions » (voir brief, section Logos), lien vers `/`.
- Navigation : « Activités » (menu déroulant : CC Care · CC Consulting · CC Events) · « Autonomie & Inclusion » · « Contact ».
- Bouton à droite : « Nous écrire » → `/contact`.
- Mobile : menu plein écran, liens en très grand (Marcellus).

**Pied de page**
- « SSE Solutions — Social, Security and Events »
- « Une entreprise, trois activités : CC Care, CC Consulting, CC Events. »
- Colonnes : Activités (3 liens) · Programme (Autonomie & Inclusion) · Contact (cccare@ssesolutions.fr, ccconsulting@ssesolutions.fr) · Légal (Mentions légales, Confidentialité).
- « © 2026 SSE Solutions · Boussy-Saint-Antoine, Essonne »
- [À COMPLÉTER] Liens réseaux sociaux (LinkedIn) : ne rien afficher tant qu'ils n'existent pas.

---

## 1. Accueil `/`

**Hero**
- Sur-titre : SSE SOLUTIONS · ESSONNE
- Titre : Social. Sécurité. Événements.
- Texte : Trois activités, une même exigence : accompagner les personnes, protéger les lieux, réussir les moments qui comptent.
- Boutons : « Découvrir nos activités » (ancre vers la section Activités) · « Nous écrire » (→ `/contact`)
- Indicateur en bas : Défiler

**Bandeau défilant**
Accompagnement social · Sécurité incendie · Établissements recevant du public · Événementiel · Autonomie au quotidien · Commissions de sécurité · Coordination d'équipes ·

**Section Activités**
- Sur-titre : NOS ACTIVITÉS
- Titre : Une entreprise. Trois métiers.
- Liste (une grande ligne par activité, photo au survol) :
  - 01 — **CC Care** · Social — Accompagnement social en établissement de santé, en structure sociale et en entreprise. → `/cc-care`
  - 02 — **CC Consulting** · Sécurité — Mise en conformité incendie des établissements recevant du public et préparation aux commissions de sécurité. → `/cc-consulting`
  - 03 — **CC Events** · Événementiel — Organisation de grands événements et coordination des équipes sur le terrain. → `/cc-events`

**Section À propos**
- Sur-titre : QUI SOMMES-NOUS
- Titre : Trois lettres. Une seule maison.
- Texte : SSE Solutions porte les initiales de ses trois métiers : Social, Security and Events. Chaque activité a son équipe, son savoir-faire et sa marque. Toutes partagent la même façon de travailler : comprendre avant d'agir, écrire clairement, suivre jusqu'au bout.

**Section Programme (mise en avant)**
- Sur-titre : NOUVEAU · CC CARE
- Titre : Autonomie & Inclusion.
- Texte : Un programme en ligne pour aider les adultes accompagnés par les structures sociales à gagner en autonomie au quotidien. Chaque atelier existe en français courant et en FALC, Facile à lire et à comprendre.
- Trois chiffres (ce sont les vrais chiffres du programme, ne pas en ajouter) :
  - 35 — modules thématiques
  - 244 — ateliers
  - 2 — versions de chaque atelier : FALC et français courant
- Bouton : « Découvrir le programme » → `/cc-care/autonomie-inclusion`

**Section Méthode (épinglée, 4 étapes)**
- Sur-titre : NOTRE MÉTHODE
- Titre : Comprendre avant d'agir.
- 01 Écouter. — Nous partons de votre situation, de vos contraintes et de vos échéances.
- 02 Diagnostiquer. — Nous faisons un état des lieux précis et écrit, sans jargon.
- 03 Agir. — Nous menons les actions avec vous et coordonnons les bons interlocuteurs.
- 04 Suivre. — Nous restons présents jusqu'au résultat, et au-delà si besoin.

**Section Engagements (4 points numérotés)**
- Sur-titre : NOS ENGAGEMENTS
- Titre : Ce que vous pouvez attendre de nous.
- 01 Un interlocuteur. — Une personne qui connaît votre dossier, du premier échange au dernier.
- 02 Des écrits clairs. — Des comptes rendus courts, datés et compréhensibles par tous.
- 03 Le terrain. — Des solutions pensées pour votre établissement, pas pour un modèle type.
- 04 La discrétion. — Les situations sociales et les informations de sécurité restent confidentielles.

**Section Contact (fin de page)**
- Titre : Parlons de votre projet.
- Texte : Dites-nous en quelques lignes ce dont vous avez besoin. Nous vous répondons sous 48 heures ouvrées.
- Bouton : « Nous écrire » → `/contact`

---

## 2. CC Care `/cc-care`

Accent : bleu profond #1F4E86 et vert feuille #5E9B3A, sections claires alternées (voir brief).

**Hero**
- Sur-titre : CC CARE · SOCIAL
- Titre : Accompagner. Simplifier. Rendre autonome.
- Texte : CC Care mène des missions d'accompagnement social, conduites par une assistante sociale, dans les établissements de santé, les structures sociales et les entreprises.
- Boutons : « Nous écrire » (→ `/contact?sujet=cc-care`) · « Le programme Autonomie & Inclusion » (→ `/cc-care/autonomie-inclusion`)
- Logo CC Care présenté dans un panneau clair.

**Section Missions**
- Sur-titre : NOS MISSIONS
- Titre : Tout ce qui touche au social.
- Texte : Nous intervenons là où une situation sociale freine un parcours de soin, un retour à domicile ou une vie professionnelle. [À VALIDER par CC Care : liste des missions ci-dessous]
- 01 Accès aux droits et démarches. — Accompagner les personnes dans leurs démarches administratives et l'ouverture de leurs droits.
- 02 Parcours de soin. — Préparer avec les équipes soignantes les sorties d'hospitalisation et les relais à domicile.
- 03 Orientation. — Mettre les personnes en lien avec les bons services et les bons partenaires.
- 04 Appui aux équipes. — Apporter un regard social aux équipes des établissements et des entreprises.

**Section Pour qui**
- Sur-titre : POUR QUI
- Titre : Nos interlocuteurs.
- Hôpitaux et cliniques · Établissements médico-sociaux · Structures sociales · Entreprises

**Section Programme**
- Titre : Autonomie & Inclusion.
- Texte : Notre programme en ligne de 35 modules pour l'autonomie au quotidien, en FALC et en français courant. Nous cherchons des structures partenaires pour le tester gratuitement début 2027.
- Bouton : « Découvrir le programme » → `/cc-care/autonomie-inclusion`

**Contact**
- Titre : Une situation à accompagner ?
- E-mail affiché : cccare@ssesolutions.fr · Bouton « Nous écrire » → `/contact?sujet=cc-care`

---

## 3. Autonomie & Inclusion `/cc-care/autonomie-inclusion`

Page la plus importante pour la prospection actuelle. Accent CC Care, sections claires, lecture très confortable.

**Hero**
- Sur-titre : CC CARE · PROGRAMME EN LIGNE
- Titre : Autonomie & Inclusion.
- Texte : Un programme en ligne pour aider les adultes accompagnés par votre structure à gagner en autonomie dans la vie de tous les jours : démarches, santé, logement, numérique, budget, parentalité, mobilité.
- Bouton principal : « Devenir structure partenaire » → `/contact?sujet=autonomie`
- Mention sous le bouton : Test gratuit en avant-première, début 2027.

**Section Deux versions**
- Titre : Deux façons de lire. Le même contenu.
- Colonne 1 — **FALC** : Facile à lire et à comprendre. Des phrases courtes, des mots simples, une idée à la fois.
- Colonne 2 — **Français courant** : Pour les personnes à l'aise avec l'écrit, qui veulent aller plus loin.
- Phrase sous les colonnes : Chaque personne choisit sa version. Les objectifs restent les mêmes, et restent pensés pour des adultes.

**Section Chiffres**
- 35 modules · 244 ateliers · 488 fiches (chaque atelier en 2 versions)

**Section Parcours (4 étapes)**
- Titre : Un parcours en quatre étapes.
- 01 Découvrir. — Les consignes, le vocabulaire, une première réussite.
- 02 S'entraîner. — Répéter, voir des démonstrations, faire des exercices corrigés.
- 03 Appliquer. — Des situations de la vie réelle et des prises de décision.
- 04 Devenir autonome. — Agir seul, prévenir les risques, faire le bilan.

**Section Une séance**
- Titre : Comment se passe une séance.
- Découverte → Exemple guidé → Exercice → Correction expliquée → Nouvel essai → Validation
- Texte : En cas de difficulté, la personne reçoit un rappel et un nouvel exemple, puis elle réessaie. Votre équipe suit la progression de chacun.

**Section Les 35 modules** (grille compacte, filtrable par thème si possible ; noms exacts)
1. Santé, hygiène et bien-être · 2. Vie sociale et citoyenneté · 3. Autonomie et vie quotidienne · 4. Culture, loisirs et créativité · 5. Ateliers sociolinguistiques (ASL) · 6. Parentalité et vie familiale · 7. Gestion sociale, familiale et administrative · 8. Sécurité et prévention · 9. Sorties pédagogiques et culturelles · 10. Cuisine du monde et interculturalité · 11. Remédiation et stimulation cognitive · 12. Autonomie numérique · 13. Insertion socioprofessionnelle · 14. Santé mentale et bien-être psychologique · 15. Communication verbale et non verbale · 16. Écogestes et développement durable · 17. Grands moments historiques · 18. Événements calendaires et prévention · 19. Mobilité, code de la route et accès au permis · 20. Prévention des écrans et réseaux sociaux · 21. Mathématiques et raisonnement logique du quotidien · 22. Gestion des conflits et médiation · 23. Droits, devoirs et citoyenneté · 24. Relaxation et sophrologie · 25. Éducation morale et civique · 26. Sensibilisation aux premiers secours · 27. Prévention incendie et évacuation · 28. Gestes et postures au travail · 29. Prévention des accidents domestiques · 30. Prévention des risques climatiques · 31. Prévention des chutes et mobilité · 32. Sécurité alimentaire et prévention des intoxications · 33. Prévention des violences et demande d'aide · 34. Santé sexuelle et consentement · 35. Logement et autonomie résidentielle

**Section Partenaires**
- Titre : Testez-le avec nous.
- Texte : Nous cherchons quelques structures de l'Essonne pour tester le programme gratuitement en avant-première, début 2027, avec un petit groupe de personnes accompagnées, et l'ajuster à leurs besoins. CCAS, centres sociaux, CHRS, missions locales, ESAT, associations : parlons-en.
- Bouton : « Devenir structure partenaire » → `/contact?sujet=autonomie`

---

## 4. CC Consulting `/cc-consulting`

Accent : bleu nuit #13233F et or.

**Hero**
- Sur-titre : CC CONSULTING · SÉCURITÉ
- Titre : Conformer. Préparer. Sécuriser.
- Texte : CC Consulting accompagne les établissements recevant du public, en priorité les établissements de soins, dans leur mise en conformité incendie et la préparation de leurs commissions de sécurité.
- Bouton : « Nous écrire » → `/contact?sujet=cc-consulting`

**Section Services (numérotés)**
- Sur-titre : NOS SERVICES
- Titre : De l'audit à la commission.
- 01 Audit de conformité. — Un état des lieux précis de votre établissement face à la réglementation incendie.
- 02 Mise en conformité. — Un plan d'actions clair et l'accompagnement jusqu'à la levée des observations.
- 03 Commissions de sécurité. — La préparation des registres, des documents et des visites.
- 04 Suivi des prestataires. — Le suivi des vérifications, des contrats et des rapports de vos prestataires.
- 05 Assistance sécurité. — Un appui à la gestion de la sécurité de votre bâtiment au quotidien.
- 06 Sensibilisation des équipes. — Des sessions pour que vos équipes connaissent les bons réflexes. [À VÉRIFIER avant de parler de « formation » : numéro de déclaration d'activité de formation]

**Section Pour qui**
- Établissements de soins (type U) · Autres établissements recevant du public · Entreprises

**Contact**
- Titre : Une commission de sécurité approche ?
- E-mail affiché : ccconsulting@ssesolutions.fr · Bouton « Nous écrire » → `/contact?sujet=cc-consulting`

---

## 5. CC Events `/cc-events`

Accent : noir laqué #0B0B0B et or vif #D4A62A. Page la plus « spectaculaire » visuellement (grandes photos plein écran).

**Hero**
- Sur-titre : CC EVENTS · ÉVÉNEMENTIEL
- Titre : Imaginer. Coordonner. Réussir.
- Texte : CC Events organise de grands événements et coordonne les équipes événementielles, de la préparation au dernier invité parti.
- Bouton : « Nous écrire » → `/contact?sujet=cc-events`

**Section Services**
- 01 Organisation d'événements. — Conception, planning, prestataires et logistique de vos grands événements.
- 02 Gestion des équipes. — Recrutement, briefing et encadrement des équipes sur le terrain.
- 03 Coordination le jour J. — Un pilotage en temps réel pour que tout se déroule comme prévu.

**Section Pour qui**
- Entreprises · Institutions · Associations · Organisateurs

**Contact**
- Titre : Un événement en préparation ?
- [À COMPLÉTER] E-mail CC Events (suggestion : créer une redirection gratuite ccevents@ssesolutions.fr chez Ionos). En attendant, seulement le bouton « Nous écrire » → `/contact?sujet=cc-events`

---

## 6. Contact `/contact`

- Titre : Parlons de votre projet.
- Pastilles « Votre sujet » (une seule au choix) : CC Care · Autonomie & Inclusion · CC Consulting · CC Events · Autre
- Champs : Nom et prénom* · Structure ou entreprise · E-mail* · Téléphone · Votre message*
- Case à cocher* : « J'accepte que SSE Solutions utilise ces informations pour me répondre. » (lien vers `/confidentialite`)
- Bouton : Envoyer
- Message après envoi : « Merci. Votre message est bien arrivé. Nous vous répondons sous 48 heures ouvrées. »
- Colonne latérale : CC Care — cccare@ssesolutions.fr · CC Consulting — ccconsulting@ssesolutions.fr
- Technique : Netlify Forms, champ caché `sujet`, anti-spam « honeypot ».

## 7. Mentions légales `/mentions-legales`

- Éditeur : SSE Solutions, entreprise individuelle de Carine Chali — 13 rue Marcel Pagnol, 91800 Boussy-Saint-Antoine — SIRET 999 125 131 00014 — TVA non applicable, article 293 B du CGI.
- Contact : cccare@ssesolutions.fr — Téléphone : [À COMPLÉTER]
- Directrice de la publication : Carine Chali.
- Hébergeur : Netlify, Inc. — [À VÉRIFIER sur netlify.com : adresse postale actuelle de Netlify].
- Propriété intellectuelle : textes, logos et visuels propres à SSE Solutions ; crédits photos listés en bas de page.
- Crédits photos : [À COMPLÉTER au fur et à mesure, voir 03_IMAGES.md].

## 8. Confidentialité `/confidentialite`

- Données collectées : celles du formulaire de contact (nom, structure, e-mail, téléphone, message).
- Finalité : répondre à votre demande. Base légale : votre consentement.
- Durée de conservation : 3 ans après le dernier échange.
- Destinataires : SSE Solutions uniquement ; hébergement des formulaires par Netlify.
- Vos droits : accès, rectification, effacement, opposition, en écrivant à cccare@ssesolutions.fr ; réclamation possible auprès de la CNIL (cnil.fr).
- Pas de cookie publicitaire. Si une mesure d'audience est ajoutée plus tard, utiliser un outil sans cookie.

/**
 * Variables d'affichage des sections « À COMPLÉTER » (Lot 3.4 & Lot 5).
 * Toutes les variables valent `false` par défaut afin qu'aucune section en attente
 * de données réelles ne soit visible ni ne contienne de contenu inventé.
 */

export const SHOW_TEAM = import.meta.env.SHOW_TEAM === 'true' || false;
export const SHOW_CARE_FAQ = import.meta.env.SHOW_CARE_FAQ === 'true' || false;
export const SHOW_CONSULTING_FAQ = import.meta.env.SHOW_CONSULTING_FAQ === 'true' || false;
export const SHOW_EVENTS_PROOF = import.meta.env.SHOW_EVENTS_PROOF === 'true' || false;
export const SHOW_PILOT_DETAILS = import.meta.env.SHOW_PILOT_DETAILS === 'true' || false;
export const SHOW_CONTACT_PHONE = import.meta.env.SHOW_CONTACT_PHONE === 'true' || false;
export const SHOW_CONTACT_BOOKING = import.meta.env.SHOW_CONTACT_BOOKING === 'true' || false;
export const SHOW_LINKEDIN = import.meta.env.SHOW_LINKEDIN === 'true' || false;
export const SHOW_HERO_VIDEO = import.meta.env.SHOW_HERO_VIDEO === 'true' || false;
export const SHOW_REAL_PHOTOS = import.meta.env.SHOW_REAL_PHOTOS === 'true' || false;

// Valeurs associées aux sections en attente (strictement vides tant qu'elles ne sont pas fournies)
export const CONTACT_PHONE_DISPLAY = import.meta.env.CONTACT_PHONE_DISPLAY || '';
export const CONTACT_PHONE_HREF = import.meta.env.CONTACT_PHONE_HREF || '';
export const CONTACT_BOOKING_URL = import.meta.env.CONTACT_BOOKING_URL || '';
export const LINKEDIN_URL = import.meta.env.LINKEDIN_URL || '';
export const HERO_VIDEO_URL = import.meta.env.HERO_VIDEO_URL || '';

export interface TeamMember {
  photo: string;
  name: string;
  role: string;
  diploma: string;
  experienceYears: string;
}

// 5.2 Liste des membres de l'équipe (vide jusqu'à fourniture des informations réelles)
export const TEAM_MEMBERS: TeamMember[] = [];

export interface FaqItem {
  question: string;
  answer: string;
}

// 5.3 Questions de la FAQ CC Care (réponses à compléter)
export const CARE_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Intervenez-vous ponctuellement ou dans la durée ?',
    answer: '',
  },
  {
    question: 'Comment se passe le premier échange ?',
    answer: '',
  },
  {
    question: 'Comment la confidentialité est-elle garantie ?',
    answer: '',
  },
];

// 5.4 Questions de la FAQ CC Consulting (réponses à compléter)
export const CONSULTING_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Combien de temps avant la visite faut-il nous contacter ?',
    answer: '',
  },
  {
    question: 'Que se passe-t-il après un avis défavorable ?',
    answer: '',
  },
  {
    question: 'Travaillez-vous avec nos prestataires actuels ?',
    answer: '',
  },
];


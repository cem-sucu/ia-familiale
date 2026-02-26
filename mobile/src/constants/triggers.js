// Les déclencheurs de livraison disponibles
// id          → identifiant unique
// label       → texte affiché sur le bouton
// icon        → emoji
// description → explication courte
export const TRIGGERS = [
  {
    id: 'maintenant',
    label: 'Maintenant',
    icon: '⚡',
    description: 'Livré immédiatement',
  },
  {
    id: 'depart_travail',
    label: 'Départ travail',
    icon: '🏢',
    description: 'Livré à ton heure de sortie',
  },
  {
    id: 'arrivee_maison',
    label: 'Arrivée maison',
    icon: '🏠',
    description: 'Livré en arrivant chez toi',
  },
];

// Déclencheur par défaut
export const TRIGGER_DEFAUT = 'maintenant';

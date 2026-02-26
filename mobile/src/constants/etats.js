// Les états possibles de l'utilisateur
export const ETATS = [
  {
    id: 'au_travail',
    label: 'Au travail',
    icon: '🏢',
    couleur: '#F39C12',
  },
  {
    id: 'en_route',
    label: 'En route',
    icon: '🚗',
    couleur: '#3498DB',
  },
  {
    id: 'a_la_maison',
    label: 'À la maison',
    icon: '🏠',
    couleur: '#27AE60',
  },
];

// État par défaut au démarrage de l'app
export const ETAT_DEFAUT = 'au_travail';

// Quel état → quels messages déclencher
// Exemple : quand je passe à "en_route", livrer les messages "depart_travail"
export const DECLENCHEMENTS = {
  en_route: 'depart_travail',
  a_la_maison: 'arrivee_maison',
};

// Données de démonstration
// sentAt   = heure à laquelle le message a été ÉCRIT
// deliveredAt = heure à laquelle il a été LIVRÉ (peut être différente !)
export const MESSAGES_DEMO = [
  {
    id: '1',
    sender: 'Maman',
    text: 'Achète du pain en rentrant 🍞',
    sentAt: '15:00',
    deliveredAt: '18:05',
    isMe: false,
  },
  {
    id: '2',
    sender: 'Moi',
    text: 'OK pas de problème ! 👍',
    sentAt: '18:06',
    deliveredAt: '18:06',
    isMe: true,
  },
];

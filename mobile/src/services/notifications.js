import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure l'affichage des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Demande la permission d'envoyer des notifications
export async function demanderPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'IA Familiale',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
    });
  }

  return status === 'granted';
}

// Affiche une notification locale immédiatement
// Utilisé quand des messages sont livrés suite à un changement d'état
export async function afficherNotification(expediteur, texte) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Message de ${expediteur} 💬`,
      body: texte,
      sound: 'default',
    },
    trigger: null, // null = immédiat
  });
}

// ─── Configuration ────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

// L'émulateur Android accède au PC hôte via 10.0.2.2 (pas besoin de tunnel)
// L'iPhone passe par le tunnel Dev Tunnels
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000'
  : 'https://tqb2dd4b-8000.uks1.devtunnels.ms';

// URL WebSocket (ws:// pour Android, wss:// pour iOS via tunnel)
export const WS_BASE = Platform.OS === 'android'
  ? 'ws://10.0.2.2:8000'
  : 'wss://tqb2dd4b-8000.uks1.devtunnels.ms';

// ─── Fonction utilitaire ──────────────────────────────────────────────────────
async function appel(method, route, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': '1',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const reponse = await fetch(`${BASE_URL}${route}`, options);

  if (!reponse.ok) {
    throw new Error(`Erreur ${reponse.status} sur ${route}`);
  }

  return reponse.json();
}

// ─── Membres ──────────────────────────────────────────────────────────────────

// Récupère tous les membres de la famille
export function getMembres() {
  return appel('GET', '/membres');
}

// Change l'état d'un membre → déclenche la livraison des messages en attente
export function changerEtat(membreId, etat) {
  return appel('POST', `/membres/${membreId}/etat`, { etat });
}

// Enregistre le push token du téléphone sur le serveur
export function enregistrerToken(membreId, pushToken) {
  return appel('POST', `/membres/${membreId}/token`, { push_token: pushToken });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

// Envoie un message avec un déclencheur
export function envoyerMessageAPI(expediteurId, destinataireId, texte, trigger) {
  return appel('POST', '/messages', {
    expediteur_id:   expediteurId,
    destinataire_id: destinataireId,
    texte,
    trigger,
  });
}

// Récupère les messages livrés pour un destinataire
export function getMessages(destinataireId) {
  return appel('GET', `/messages/${destinataireId}`);
}

// Récupère TOUS les messages (livrés + en attente) — mode démo
export function getTousMessages(destinataireId) {
  return appel('GET', `/messages/${destinataireId}?tous=true`);
}

// Modifie le texte d'un message encore en attente
export function modifierMessage(messageId, texte) {
  return appel('PATCH', `/messages/${messageId}`, { texte });
}

// Annule un message en attente — il ne sera jamais livré
export function annulerMessage(messageId) {
  return appel('PATCH', `/messages/${messageId}/annuler`);
}

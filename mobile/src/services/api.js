// ─── Configuration ────────────────────────────────────────────────────────────
import { API_URL, WS_URL } from '../config';
import { supabase } from './supabase';

export const WS_BASE = WS_URL;

// ─── Fonction utilitaire ──────────────────────────────────────────────────────
async function appel(method, route, body = null) {
  // Récupère le JWT Supabase depuis la session active (auto-refresh si expiré)
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Bypass-Tunnel-Reminder': '1',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  if (body) options.body = JSON.stringify(body);

  const reponse = await fetch(`${API_URL}${route}`, options);

  if (!reponse.ok) {
    throw new Error(`Erreur ${reponse.status} sur ${route}`);
  }

  return reponse.json();
}

// ─── Profil ───────────────────────────────────────────────────────────────────

// Récupère le profil de l'utilisateur connecté
export function getProfil() {
  return appel('GET', '/profil');
}

// Change l'état du membre connecté → déclenche la livraison des messages en attente
export function changerEtat(membreId, etat) {
  return appel('POST', `/membres/${membreId}/etat`, { etat });
}

// Enregistre le push token du téléphone
export function enregistrerToken(pushToken) {
  return appel('PUT', '/profil/token', { push_token: pushToken });
}

// ─── Membres du cercle ────────────────────────────────────────────────────────

// Récupère tous les membres du cercle familial
export function getMembres() {
  return appel('GET', '/membres');
}

// ─── Cercles ─────────────────────────────────────────────────────────────────

// Liste les cercles de l'utilisateur connecté
export function getCircles() {
  return appel('GET', '/circles');
}

// Crée un nouveau cercle familial
export function creerCircle(nom) {
  return appel('POST', '/circles', { nom });
}

// Génère un code d'invitation à partager (admin uniquement)
export function inviterMembre(circleId) {
  return appel('POST', `/circles/${circleId}/inviter`);
}

// Rejoindre un cercle via un code d'invitation
export function rejoindreCircle(token) {
  return appel('POST', '/invitations/rejoindre', { token });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

// Envoie un message avec un déclencheur
export function envoyerMessageAPI(destinataireId, texte, trigger, circleId) {
  return appel('POST', '/messages', {
    destinataire_id: destinataireId,
    circle_id:       circleId,
    texte,
    trigger,
  });
}

// Récupère TOUS les messages visibles (envoyés + reçus livrés)
export function getTousMessages(userId) {
  return appel('GET', `/messages/${userId}`);
}

// Modifie le texte d'un message encore en attente
export function modifierMessage(messageId, texte) {
  return appel('PATCH', `/messages/${messageId}`, { texte });
}

// Annule un message en attente — il ne sera jamais livré
export function annulerMessage(messageId) {
  return appel('PATCH', `/messages/${messageId}/annuler`);
}

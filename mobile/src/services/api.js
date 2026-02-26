// ─── Configuration ────────────────────────────────────────────────────────────
// L'adresse IP de ton PC sur le WiFi
// Si ça ne marche pas, change cette IP par celle de ton PC (ipconfig dans le terminal)
const BASE_URL = 'https://tqb2dd4b-8000.uks1.devtunnels.ms';

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

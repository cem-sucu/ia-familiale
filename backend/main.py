import logging
import uuid
from datetime import datetime

import requests

# Désactive les logs d'accès HTTP (GET /... 200 OK) — trop verbeux
logging.getLogger("uvicorn.access").disabled = True
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import get_connexion, initialiser_db
from models import Membre, MembreCreation, MembreEtat, Message, MessageEnvoi

# ─── Configuration ───────────────────────────────────────────────────────────

app = FastAPI(title="IA Familiale API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DECLENCHEMENTS = {
    "en_route":     "depart_travail",
    "a_la_maison":  "arrivee_maison",
}

# Connexions WebSocket actives : membre_id → WebSocket
connexions: dict[str, WebSocket] = {}


# ─── Démarrage ───────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    initialiser_db()
    print("✅ Serveur IA Familiale démarré !")


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/{membre_id}")
async def websocket_endpoint(websocket: WebSocket, membre_id: str):
    """Ouvre un canal temps réel pour un membre."""
    await websocket.accept()
    connexions[membre_id] = websocket
    print(f"🔌 {membre_id} connecté via WebSocket")
    try:
        while True:
            # Garde la connexion ouverte (le client envoie des pings)
            await websocket.receive_text()
    except WebSocketDisconnect:
        connexions.pop(membre_id, None)
        print(f"🔌 {membre_id} déconnecté")


async def notifier(membre_id: str, data: dict):
    """Pousse des données en temps réel vers un membre connecté."""
    ws = connexions.get(membre_id)
    if ws:
        try:
            await ws.send_json(data)
        except Exception:
            connexions.pop(membre_id, None)


# ─── Route de test ───────────────────────────────────────────────────────────

@app.get("/")
def accueil():
    return {"message": "🏠 IA Familiale API fonctionne !"}


# ─── Membres ─────────────────────────────────────────────────────────────────

@app.get("/membres", response_model=list[Membre])
def lister_membres():
    conn = get_connexion()
    membres = conn.execute("SELECT * FROM membres").fetchall()
    conn.close()
    return [dict(m) for m in membres]


def envoyer_push(push_token: str, expediteur: str, texte: str):
    try:
        requests.post(
            'https://exp.host/--/api/v2/push/send',
            json={
                'to': push_token,
                'title': f'Message de {expediteur} 💬',
                'body': texte,
                'sound': 'default',
            },
            timeout=5,
        )
    except Exception as e:
        print(f'⚠️ Erreur push notification : {e}')


@app.post("/membres/{membre_id}/token")
def sauvegarder_token(membre_id: str, data: dict):
    conn = get_connexion()
    conn.execute(
        "UPDATE membres SET push_token = ? WHERE id = ?",
        (data['push_token'], membre_id)
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@app.post("/membres", response_model=Membre)
def creer_membre(data: MembreCreation):
    conn = get_connexion()
    try:
        conn.execute(
            "INSERT INTO membres (id, nom) VALUES (?, ?)",
            (data.id, data.nom)
        )
        conn.commit()
    except Exception:
        raise HTTPException(status_code=400, detail="Ce membre existe déjà")
    finally:
        conn.close()
    return {"id": data.id, "nom": data.nom, "etat": "au_travail"}


@app.post("/membres/{membre_id}/etat")
async def changer_etat(membre_id: str, data: MembreEtat):
    """
    Change l'état d'un membre.
    Déclenche la livraison des messages en attente
    et notifie le membre via WebSocket.
    """
    conn = get_connexion()

    membre = conn.execute(
        "SELECT * FROM membres WHERE id = ?", (membre_id,)
    ).fetchone()
    if not membre:
        conn.close()
        raise HTTPException(status_code=404, detail="Membre introuvable")

    conn.execute(
        "UPDATE membres SET etat = ? WHERE id = ?",
        (data.etat, membre_id)
    )

    trigger_a_declencher = DECLENCHEMENTS.get(data.etat)
    messages_livres = 0

    if trigger_a_declencher:
        maintenant = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        resultat = conn.execute(
            """UPDATE messages
               SET statut = 'livre', livre_a = ?
               WHERE destinataire_id = ?
                 AND trigger = ?
                 AND statut = 'en_attente'""",
            (maintenant, membre_id, trigger_a_declencher)
        )
        messages_livres = resultat.rowcount

    # Commit AVANT de notifier — sinon le client lirait des données pas encore commitées
    conn.commit()
    conn.close()

    if messages_livres > 0 and trigger_a_declencher:
        push_token = dict(membre).get('push_token') if membre else None
        if push_token:
            conn2 = get_connexion()
            msgs = conn2.execute(
                """SELECT * FROM messages
                   WHERE destinataire_id = ? AND trigger = ?
                   AND statut = 'livre' AND livre_a = ?""",
                (membre_id, trigger_a_declencher, maintenant)
            ).fetchall()
            conn2.close()
            for msg in msgs:
                envoyer_push(push_token, msg['expediteur_id'], msg['texte'])

        await notifier(membre_id, {"type": "reload"})

    return {
        "etat": data.etat,
        "messages_livres": messages_livres,
        "message": f"✅ {messages_livres} message(s) livré(s)"
    }


# ─── Messages ─────────────────────────────────────────────────────────────────

@app.post("/messages", response_model=Message)
async def envoyer_message(data: MessageEnvoi):
    """
    Envoie un message et notifie le destinataire en temps réel via WebSocket.
    """
    conn = get_connexion()

    maintenant = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    message_id = str(uuid.uuid4())

    statut  = "livre"    if data.trigger == "maintenant" else "en_attente"
    livre_a = maintenant if data.trigger == "maintenant" else None

    conn.execute(
        """INSERT INTO messages
           (id, expediteur_id, destinataire_id, texte, trigger, statut, envoye_a, livre_a)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (message_id, data.expediteur_id, data.destinataire_id,
         data.texte, data.trigger, statut, maintenant, livre_a)
    )
    conn.commit()
    conn.close()

    message = {
        "id":               message_id,
        "expediteur_id":    data.expediteur_id,
        "destinataire_id":  data.destinataire_id,
        "texte":            data.texte,
        "trigger":          data.trigger,
        "statut":           statut,
        "envoye_a":         maintenant,
        "livre_a":          livre_a,
    }

    # Pousse le message en temps réel vers le destinataire
    await notifier(data.destinataire_id, message)

    return message


@app.get("/messages/{destinataire_id}", response_model=list[Message])
def get_messages(destinataire_id: str, tous: bool = False):
    conn = get_connexion()

    if tous:
        # Messages envoyés par moi (tous statuts) OU reçus ET déjà livrés
        # → le destinataire ne voit pas les messages "en_attente" avant livraison
        messages = conn.execute(
            """SELECT * FROM messages
               WHERE expediteur_id = ?
                  OR (destinataire_id = ? AND statut = 'livre')
               ORDER BY envoye_a""",
            (destinataire_id, destinataire_id)
        ).fetchall()
    else:
        messages = conn.execute(
            """SELECT * FROM messages
               WHERE destinataire_id = ? AND statut = 'livre'
               ORDER BY envoye_a""",
            (destinataire_id,)
        ).fetchall()

    conn.close()
    return [dict(m) for m in messages]

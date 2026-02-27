import logging
import uuid
from datetime import datetime, timezone

import httpx

# Désactive les logs d'accès HTTP — trop verbeux
logging.getLogger("uvicorn.access").disabled = True

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from auth import get_current_user
from database import fermer_pool, get_pool
from models import (
    Circle,
    CircleCreation,
    InvitationRejoindre,
    Message,
    MessageEnvoi,
    MessageModification,
    Profil,
    ProfilEtat,
)

# ─── Configuration ───────────────────────────────────────────────────────────

app = FastAPI(title="IA Familiale API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DECLENCHEMENTS = {
    "en_route":    "depart_travail",
    "a_la_maison": "arrivee_maison",
}

# Connexions WebSocket actives : user_id → WebSocket
connexions: dict[str, WebSocket] = {}


# ─── Démarrage / Arrêt ────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await get_pool()
    print("✅ Serveur IA Familiale v2 démarré — PostgreSQL connecté !")


@app.on_event("shutdown")
async def shutdown():
    await fermer_pool()


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """Canal temps réel pour un utilisateur connecté."""
    await websocket.accept()
    connexions[user_id] = websocket
    print(f"🔌 {user_id} connecté via WebSocket")
    try:
        while True:
            await websocket.receive_text()  # garde la connexion ouverte
    except WebSocketDisconnect:
        connexions.pop(user_id, None)
        print(f"🔌 {user_id} déconnecté")


async def notifier(user_id: str, data: dict):
    """Pousse des données en temps réel vers un utilisateur connecté."""
    ws = connexions.get(user_id)
    if ws:
        try:
            await ws.send_json(data)
        except Exception:
            connexions.pop(user_id, None)


# ─── Utilitaires ─────────────────────────────────────────────────────────────

def maintenant_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")


async def envoyer_push(push_token: str, expediteur_nom: str, texte: str):
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "https://exp.host/--/api/v2/push/send",
                json={
                    "to": push_token,
                    "title": f"Message de {expediteur_nom} 💬",
                    "body": texte,
                    "sound": "default",
                },
                timeout=5,
            )
    except Exception as e:
        print(f"⚠️ Erreur push notification : {e}")


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/")
def accueil():
    return {"message": "🏠 IA Familiale API v2 fonctionne !"}


# ─── Profil ──────────────────────────────────────────────────────────────────

@app.get("/profil", response_model=Profil)
async def get_profil(user: dict = Depends(get_current_user)):
    """Retourne le profil de l'utilisateur connecté."""
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT id, nom, etat FROM public.profiles WHERE id = $1",
        user["id"],
    )
    if not row:
        raise HTTPException(status_code=404, detail="Profil introuvable")
    return dict(row)


@app.post("/membres/{membre_id}/etat")
async def changer_etat(membre_id: str, data: ProfilEtat, user: dict = Depends(get_current_user)):
    """
    Change l'état du membre connecté.
    Déclenche la livraison des messages en attente et notifie via WebSocket.
    """
    if membre_id != user["id"]:
        raise HTTPException(status_code=403, detail="Vous ne pouvez changer que votre propre état")

    pool = await get_pool()

    # Met à jour l'état dans le profil
    await pool.execute(
        "UPDATE public.profiles SET etat = $1 WHERE id = $2",
        data.etat, user["id"],
    )

    trigger_a_declencher = DECLENCHEMENTS.get(data.etat)
    messages_livres_count = 0
    maintenant = maintenant_iso()

    if trigger_a_declencher:
        # Livre les messages en attente pour ce déclencheur
        result = await pool.execute(
            """UPDATE public.messages
               SET statut = 'livre', livre_a = $1
               WHERE destinataire_id = $2
                 AND trigger = $3
                 AND statut = 'en_attente'""",
            maintenant, user["id"], trigger_a_declencher,
        )
        # asyncpg retourne "UPDATE N" dans result
        try:
            messages_livres_count = int(str(result).split()[-1])
        except (ValueError, IndexError):
            messages_livres_count = 0

    if messages_livres_count > 0:
        # Récupère les messages qu'on vient de livrer
        msgs = await pool.fetch(
            """SELECT m.*, p.nom as expediteur_nom, dest.push_token
               FROM public.messages m
               JOIN public.profiles p   ON p.id   = m.expediteur_id
               JOIN public.profiles dest ON dest.id = m.destinataire_id
               WHERE m.destinataire_id = $1
                 AND m.trigger = $2
                 AND m.statut = 'livre'
                 AND m.livre_a = $3""",
            user["id"], trigger_a_declencher, maintenant,
        )

        # Push notification si le destinataire a un push token
        push_token = msgs[0]["push_token"] if msgs else None
        if push_token:
            for msg in msgs:
                await envoyer_push(push_token, msg["expediteur_nom"], msg["texte"])

        # Notifie le destinataire : recharge ses messages
        await notifier(user["id"], {"type": "reload"})

        # Notifie chaque expéditeur : son message est passé en "livré"
        for exp_id in {str(msg["expediteur_id"]) for msg in msgs}:
            await notifier(exp_id, {"type": "reload"})

    return {
        "etat": data.etat,
        "messages_livres": messages_livres_count,
        "message": f"✅ {messages_livres_count} message(s) livré(s)",
    }


@app.put("/profil/token")
async def sauvegarder_token(data: dict, user: dict = Depends(get_current_user)):
    """Enregistre le push token Expo du téléphone."""
    pool = await get_pool()
    await pool.execute(
        "UPDATE public.profiles SET push_token = $1 WHERE id = $2",
        data["push_token"], user["id"],
    )
    return {"ok": True}


# ─── Membres du cercle ────────────────────────────────────────────────────────

@app.get("/membres", response_model=list[Profil])
async def lister_membres(user: dict = Depends(get_current_user)):
    """Retourne tous les membres du cercle familial de l'utilisateur connecté."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT p.id, p.nom, p.etat
           FROM public.profiles p
           INNER JOIN public.circle_members cm ON cm.user_id = p.id
           WHERE cm.circle_id = (
               SELECT circle_id FROM public.circle_members
               WHERE user_id = $1
               LIMIT 1
           )""",
        user["id"],
    )
    return [dict(r) for r in rows]


# ─── Cercles ─────────────────────────────────────────────────────────────────

@app.post("/circles", response_model=Circle)
async def creer_circle(data: CircleCreation, user: dict = Depends(get_current_user)):
    """Crée un nouveau cercle familial et y ajoute le créateur comme admin."""
    pool = await get_pool()
    circle_id = str(uuid.uuid4())

    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """INSERT INTO public.circles (id, nom, created_by)
                   VALUES ($1, $2, $3)""",
                circle_id, data.nom, user["id"],
            )
            await conn.execute(
                """INSERT INTO public.circle_members (circle_id, user_id, role)
                   VALUES ($1, $2, 'admin')""",
                circle_id, user["id"],
            )

    return {"id": circle_id, "nom": data.nom, "created_by": user["id"]}


@app.get("/circles", response_model=list[Circle])
async def lister_circles(user: dict = Depends(get_current_user)):
    """Liste les cercles dont l'utilisateur est membre."""
    pool = await get_pool()
    rows = await pool.fetch(
        """SELECT c.id, c.nom, c.created_by::TEXT
           FROM public.circles c
           INNER JOIN public.circle_members cm ON cm.circle_id = c.id
           WHERE cm.user_id = $1""",
        user["id"],
    )
    return [dict(r) for r in rows]


# ─── Invitations ─────────────────────────────────────────────────────────────

@app.post("/circles/{circle_id}/inviter")
async def creer_invitation(circle_id: str, user: dict = Depends(get_current_user)):
    """
    Génère un code d'invitation à partager avec un nouveau membre.
    Seuls les admins du cercle peuvent inviter.
    """
    pool = await get_pool()

    # Vérifie que l'utilisateur est admin du cercle
    row = await pool.fetchrow(
        """SELECT role FROM public.circle_members
           WHERE circle_id = $1 AND user_id = $2""",
        circle_id, user["id"],
    )
    if not row or row["role"] != "admin":
        raise HTTPException(status_code=403, detail="Réservé aux admins du cercle")

    invitation_id = str(uuid.uuid4())
    token = str(uuid.uuid4())

    await pool.execute(
        """INSERT INTO public.invitations (id, circle_id, inviteur_id, email_invite, token)
           VALUES ($1, $2, $3, '', $4)""",
        invitation_id, circle_id, user["id"], token,
    )

    return {"token": token, "message": "Partage ce code avec le membre à inviter"}


@app.post("/invitations/rejoindre")
async def rejoindre_circle(data: InvitationRejoindre, user: dict = Depends(get_current_user)):
    """
    Rejoint un cercle via un code d'invitation.
    Le token est à usage unique (passe en statut 'accepte').
    """
    pool = await get_pool()

    invitation = await pool.fetchrow(
        """SELECT * FROM public.invitations
           WHERE token = $1 AND statut = 'en_attente'""",
        data.token,
    )
    if not invitation:
        raise HTTPException(status_code=400, detail="Code invalide ou déjà utilisé")

    circle_id = str(invitation["circle_id"])

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Ajoute l'utilisateur au cercle
            await conn.execute(
                """INSERT INTO public.circle_members (circle_id, user_id, role)
                   VALUES ($1, $2, 'membre')
                   ON CONFLICT DO NOTHING""",
                circle_id, user["id"],
            )
            # Marque l'invitation comme acceptée
            await conn.execute(
                "UPDATE public.invitations SET statut = 'accepte' WHERE token = $1",
                data.token,
            )

    # Récupère le cercle pour le retourner au client
    circle = await pool.fetchrow(
        "SELECT id, nom, created_by::TEXT FROM public.circles WHERE id = $1",
        circle_id,
    )
    return {
        "circle_id": circle_id,
        "nom": circle["nom"],
        "message": f"✅ Tu as rejoint « {circle['nom']} » !",
    }


# ─── Messages ─────────────────────────────────────────────────────────────────

@app.post("/messages", response_model=Message)
async def envoyer_message(data: MessageEnvoi, user: dict = Depends(get_current_user)):
    """
    Envoie un message dans un cercle et notifie le destinataire en temps réel.
    """
    pool = await get_pool()

    maintenant = maintenant_iso()
    message_id = str(uuid.uuid4())
    statut  = "livre"    if data.trigger == "maintenant" else "en_attente"
    livre_a = maintenant if data.trigger == "maintenant" else None

    await pool.execute(
        """INSERT INTO public.messages
           (id, expediteur_id, destinataire_id, circle_id, texte, trigger, statut, envoye_a, livre_a)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
        message_id,
        user["id"],
        data.destinataire_id,
        data.circle_id,
        data.texte,
        data.trigger,
        statut,
        maintenant,
        livre_a,
    )

    message = {
        "id":               message_id,
        "expediteur_id":    user["id"],
        "destinataire_id":  data.destinataire_id,
        "circle_id":        data.circle_id,
        "texte":            data.texte,
        "trigger":          data.trigger,
        "statut":           statut,
        "envoye_a":         maintenant,
        "livre_a":          livre_a,
    }

    # Pousse le message vers le destinataire
    await notifier(data.destinataire_id, message)

    return message


@app.patch("/messages/{message_id}")
async def modifier_message(message_id: str, data: MessageModification, user: dict = Depends(get_current_user)):
    """Modifie le texte d'un message encore en attente."""
    pool = await get_pool()

    msg = await pool.fetchrow(
        "SELECT * FROM public.messages WHERE id = $1",
        message_id,
    )
    if not msg or msg["statut"] != "en_attente":
        raise HTTPException(status_code=400, detail="Message introuvable ou déjà livré")
    if str(msg["expediteur_id"]) != user["id"]:
        raise HTTPException(status_code=403, detail="Ce message ne vous appartient pas")

    await pool.execute(
        "UPDATE public.messages SET texte = $1 WHERE id = $2",
        data.texte, message_id,
    )

    await notifier(user["id"], {"type": "reload"})
    return {"ok": True}


@app.patch("/messages/{message_id}/annuler")
async def annuler_message(message_id: str, user: dict = Depends(get_current_user)):
    """Annule un message encore en attente — il ne sera jamais livré."""
    pool = await get_pool()

    msg = await pool.fetchrow(
        "SELECT * FROM public.messages WHERE id = $1",
        message_id,
    )
    if not msg or msg["statut"] != "en_attente":
        raise HTTPException(status_code=400, detail="Message introuvable ou déjà livré")
    if str(msg["expediteur_id"]) != user["id"]:
        raise HTTPException(status_code=403, detail="Ce message ne vous appartient pas")

    await pool.execute(
        "UPDATE public.messages SET statut = 'annule' WHERE id = $1",
        message_id,
    )

    await notifier(user["id"], {"type": "reload"})
    return {"ok": True}


@app.get("/messages/{user_id}", response_model=list[Message])
async def get_messages(user_id: str, user: dict = Depends(get_current_user)):
    """
    Retourne tous les messages visibles pour l'utilisateur :
    - Ses messages envoyés (tous statuts)
    - Les messages qu'il a reçus ET qui sont livrés
    """
    if user_id != user["id"]:
        raise HTTPException(status_code=403, detail="Accès refusé")

    pool = await get_pool()

    rows = await pool.fetch(
        """SELECT id, expediteur_id::TEXT, destinataire_id::TEXT, circle_id::TEXT,
                  texte, trigger, statut,
                  to_char(envoye_a AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') AS envoye_a,
                  to_char(livre_a  AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') AS livre_a
           FROM public.messages
           WHERE expediteur_id = $1
              OR (destinataire_id = $1 AND statut = 'livre')
           ORDER BY envoye_a""",
        user["id"],
    )
    return [dict(r) for r in rows]

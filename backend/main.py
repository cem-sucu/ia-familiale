import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import get_connexion, initialiser_db
from models import Membre, MembreCreation, MembreEtat, Message, MessageEnvoi

# ─── Configuration ───────────────────────────────────────────────────────────

app = FastAPI(title="IA Familiale API", version="0.1.0")

# Autorise l'app mobile à appeler le serveur (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Quand l'utilisateur passe à cet état → on déclenche ce trigger
DECLENCHEMENTS = {
    "en_route":     "depart_travail",
    "a_la_maison":  "arrivee_maison",
}


# ─── Démarrage ───────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    """Initialise la base de données au démarrage du serveur."""
    initialiser_db()
    print("✅ Serveur IA Familiale démarré !")


# ─── Route de test ───────────────────────────────────────────────────────────

@app.get("/")
def accueil():
    return {"message": "🏠 IA Familiale API fonctionne !"}


# ─── Membres ─────────────────────────────────────────────────────────────────

@app.get("/membres", response_model=list[Membre])
def lister_membres():
    """Retourne tous les membres de la famille."""
    conn = get_connexion()
    membres = conn.execute("SELECT * FROM membres").fetchall()
    conn.close()
    return [dict(m) for m in membres]


@app.post("/membres", response_model=Membre)
def creer_membre(data: MembreCreation):
    """Crée un nouveau membre de la famille."""
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
def changer_etat(membre_id: str, data: MembreEtat):
    """
    Change l'état d'un membre (ex: 'a_la_maison').
    Déclenche automatiquement la livraison des messages en attente.
    """
    conn = get_connexion()

    # Vérifier que le membre existe
    membre = conn.execute(
        "SELECT * FROM membres WHERE id = ?", (membre_id,)
    ).fetchone()
    if not membre:
        conn.close()
        raise HTTPException(status_code=404, detail="Membre introuvable")

    # Mettre à jour l'état
    conn.execute(
        "UPDATE membres SET etat = ? WHERE id = ?",
        (data.etat, membre_id)
    )

    # Déclencher la livraison des messages en attente
    trigger_a_declencher = DECLENCHEMENTS.get(data.etat)
    messages_livres = 0

    if trigger_a_declencher:
        maintenant = datetime.now().strftime("%H:%M")
        resultat = conn.execute(
            """UPDATE messages
               SET statut = 'livre', livre_a = ?
               WHERE destinataire_id = ?
                 AND trigger = ?
                 AND statut = 'en_attente'""",
            (maintenant, membre_id, trigger_a_declencher)
        )
        messages_livres = resultat.rowcount

    conn.commit()
    conn.close()

    return {
        "etat": data.etat,
        "messages_livres": messages_livres,
        "message": f"✅ {messages_livres} message(s) livré(s)"
    }


# ─── Messages ─────────────────────────────────────────────────────────────────

@app.post("/messages", response_model=Message)
def envoyer_message(data: MessageEnvoi):
    """
    Envoie un message.
    S'il est pour 'maintenant', il est livré immédiatement.
    Sinon, il reste en attente jusqu'au déclencheur.
    """
    conn = get_connexion()

    maintenant = datetime.now().strftime("%H:%M")
    message_id = str(uuid.uuid4())

    # Livraison immédiate si trigger = "maintenant"
    statut   = "livre"    if data.trigger == "maintenant" else "en_attente"
    livre_a  = maintenant if data.trigger == "maintenant" else None

    conn.execute(
        """INSERT INTO messages
           (id, expediteur_id, destinataire_id, texte, trigger, statut, envoye_a, livre_a)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (message_id, data.expediteur_id, data.destinataire_id,
         data.texte, data.trigger, statut, maintenant, livre_a)
    )
    conn.commit()
    conn.close()

    return {
        "id":               message_id,
        "expediteur_id":    data.expediteur_id,
        "destinataire_id":  data.destinataire_id,
        "texte":            data.texte,
        "trigger":          data.trigger,
        "statut":           statut,
        "envoye_a":         maintenant,
        "livre_a":          livre_a,
    }


@app.get("/messages/{destinataire_id}", response_model=list[Message])
def get_messages(destinataire_id: str, tous: bool = False):
    """
    Retourne les messages d'un destinataire.
    Par défaut : uniquement les messages livrés.
    Avec ?tous=true : tous les messages (utile pour le mode démo).
    """
    conn = get_connexion()

    if tous:
        messages = conn.execute(
            "SELECT * FROM messages WHERE destinataire_id = ? ORDER BY envoye_a",
            (destinataire_id,)
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

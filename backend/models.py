from typing import Optional
from pydantic import BaseModel


# ─── Profils ─────────────────────────────────────────────────────────────────

class ProfilEtat(BaseModel):
    """Ce qu'on envoie pour changer son propre état."""
    etat: str   # "au_travail" | "en_route" | "a_la_maison"


class Profil(BaseModel):
    """Ce que le serveur retourne pour un membre."""
    id:   str
    nom:  str
    etat: str


# ─── Cercles ─────────────────────────────────────────────────────────────────

class CircleCreation(BaseModel):
    """Ce qu'on envoie pour créer un cercle familial."""
    nom: str    # ex: "Famille Sucu"


class Circle(BaseModel):
    """Ce que le serveur retourne pour un cercle."""
    id:         str
    nom:        str
    created_by: str


# ─── Invitations ─────────────────────────────────────────────────────────────

class InvitationRejoindre(BaseModel):
    """Code d'invitation partagé par un admin du cercle."""
    token: str


# ─── Messages ─────────────────────────────────────────────────────────────────

class MessageEnvoi(BaseModel):
    """Ce qu'on envoie pour créer un message."""
    destinataire_id: str            # qui reçoit
    circle_id:       str            # cercle dans lequel le message est envoyé
    texte:           str            # contenu du message
    trigger:         str = "maintenant"  # déclencheur de livraison


class MessageModification(BaseModel):
    """Ce qu'on envoie pour modifier le texte d'un message en attente."""
    texte: str


class Message(BaseModel):
    """Ce que le serveur retourne pour un message."""
    id:               str
    expediteur_id:    str
    destinataire_id:  str
    circle_id:        str
    texte:            str
    trigger:          str
    statut:           str           # "en_attente" | "livre" | "annule"
    envoye_a:         str
    livre_a:          Optional[str]  # null si pas encore livré

from typing import Optional
from pydantic import BaseModel


# ─── Membres ────────────────────────────────────────────────────────────────

class MembreCreation(BaseModel):
    """Ce qu'on envoie pour créer un membre."""
    id: str         # ex: "moi", "maman", "papa"
    nom: str        # ex: "Cem"


class MembreEtat(BaseModel):
    """Ce qu'on envoie pour changer l'état d'un membre."""
    etat: str       # "au_travail", "en_route", "a_la_maison"


class Membre(BaseModel):
    """Ce que le serveur retourne pour un membre."""
    id: str
    nom: str
    etat: str


# ─── Messages ────────────────────────────────────────────────────────────────

class MessageEnvoi(BaseModel):
    """Ce qu'on envoie pour créer un message."""
    expediteur_id:   str            # qui envoie
    destinataire_id: str            # qui reçoit
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
    texte:            str
    trigger:          str
    statut:           str           # "en_attente", "livre" ou "annule"
    envoye_a:         str
    livre_a:          Optional[str] # null si pas encore livré

import sqlite3

# Le fichier de base de données — créé automatiquement au premier lancement
DB_PATH = "famille.db"


def get_connexion():
    """Retourne une connexion à la base de données."""
    conn = sqlite3.connect(DB_PATH)
    # Permet d'accéder aux colonnes par leur nom (ex: row["texte"])
    conn.row_factory = sqlite3.Row
    return conn


def initialiser_db():
    """
    Crée les tables si elles n'existent pas encore.
    Appelé une seule fois au démarrage du serveur.
    """
    conn = get_connexion()
    cursor = conn.cursor()

    # Table des membres de la famille
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS membres (
            id          TEXT PRIMARY KEY,
            nom         TEXT NOT NULL,
            etat        TEXT NOT NULL DEFAULT 'au_travail'
        )
    """)

    # Table des messages
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id               TEXT PRIMARY KEY,
            expediteur_id    TEXT NOT NULL,
            destinataire_id  TEXT NOT NULL,
            texte            TEXT NOT NULL,
            trigger          TEXT NOT NULL DEFAULT 'maintenant',
            statut           TEXT NOT NULL DEFAULT 'en_attente',
            envoye_a         TEXT NOT NULL,
            livre_a          TEXT
        )
    """)

    # Ajoute push_token si la colonne n'existe pas encore (migration douce)
    try:
        cursor.execute("ALTER TABLE membres ADD COLUMN push_token TEXT")
    except Exception:
        pass  # La colonne existe déjà

    # Membres de démonstration (insérés uniquement s'ils n'existent pas)
    cursor.execute("""
        INSERT OR IGNORE INTO membres (id, nom, etat)
        VALUES
            ('moi',   'Cem',   'au_travail'),
            ('maman', 'Maman', 'a_la_maison'),
            ('papa',  'Papa',  'a_la_maison')
    """)

    conn.commit()
    conn.close()

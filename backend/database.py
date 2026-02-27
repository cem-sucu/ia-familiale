import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Pool de connexions global — créé une seule fois au démarrage
_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Retourne le pool de connexions (le crée si besoin)."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool


async def fermer_pool():
    """Ferme proprement le pool à l'arrêt du serveur."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None

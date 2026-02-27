import os

import jwt as pyjwt
from dotenv import load_dotenv
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")

# Récupère et met en cache les clés publiques Supabase (ECC P-256)
# Supabase les publie à cette URL standard JWKS (JSON Web Key Set)
_jwks_client: PyJWKClient | None = None


def get_jwks_client() -> PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        _jwks_client = PyJWKClient(jwks_url)
    return _jwks_client


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
) -> dict:
    """
    Valide le JWT Supabase via les clés publiques JWKS.
    Supporte ES256 (nouveau, ECC P-256) et HS256 (ancien, legacy).
    Retourne un dict {"id": user_uuid, "email": "..."}
    Lève une 401 si le token est invalide ou expiré.
    """
    token = credentials.credentials
    try:
        client = get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],
            audience="authenticated",
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide : pas de sub")
        return {"id": user_id, "email": payload.get("email", "")}
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré") from exc

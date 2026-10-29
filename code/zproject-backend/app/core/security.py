from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import settings


def hashPassword(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verifyPassword(password: str, passwordHash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), passwordHash.encode("utf-8"))


def createAccessToken(userId: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.accessTokenMinutes)
    payload = {"sub": str(userId), "exp": expire}
    return jwt.encode(payload, settings.secretKey, algorithm=settings.algorithm)

def decodeAccessToken(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.secretKey, algorithms=[settings.algorithm])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
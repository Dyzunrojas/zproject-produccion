from collections.abc import Callable, Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import decodeAccessToken
from app.modules.auth.models import User

bearerScheme = HTTPBearer()


def getDb() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def getCurrentUser(
    credentials: HTTPAuthorizationCredentials = Depends(bearerScheme),
    db: Session = Depends(getDb),
) -> User:
    userId = decodeAccessToken(credentials.credentials)
    if userId is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado")

    user = db.get(User, userId)
    if user is None or not user.isActive:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario no válido")
    return user


def requirePermission(code: str) -> Callable[..., User]:

    def checker(user: User = Depends(getCurrentUser)) -> User:
        userCodes = {permission.code for permission in user.role.permissions}
        if code not in userCodes:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "No tienes permiso para esta acción")
        return user

    return checker
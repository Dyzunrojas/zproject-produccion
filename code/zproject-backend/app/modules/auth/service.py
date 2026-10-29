from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.auth.models import User
from app.modules.auth.schemas import LoginRequest, TokenResponse, UserResponse

from app.core.security import createAccessToken, verifyPassword
from app.modules.auth import repository
from app.modules.auth.schemas import LoginRequest, TokenResponse


def login(db: Session, data: LoginRequest) -> TokenResponse:
    user = repository.getUserByUsername(db, data.username)

    # Mismo mensaje para usuario inexistente o contraseña mala (no revelar cuál falló)
    if user is None or not verifyPassword(data.password, user.passwordHash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuario o contraseña incorrectos")
    if not user.isActive:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Usuario inactivo")

    return TokenResponse(accessToken=createAccessToken(user.id))


def getMe(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        username=user.username,
        role=user.role.name,
        permissions=sorted(permission.code for permission in user.role.permissions),
    )
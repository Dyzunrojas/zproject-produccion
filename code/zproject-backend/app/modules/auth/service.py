from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import createAccessToken, hashPassword, verifyPassword
from app.modules.auth import repository
from app.modules.auth.models import Permission, Role, User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    RoleCreate,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)


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


def changePassword(db: Session, user: User, data: ChangePasswordRequest) -> None:
    if not verifyPassword(data.currentPassword, user.passwordHash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "La contraseña actual es incorrecta")
    if data.currentPassword == data.newPassword:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "La nueva contraseña debe ser distinta a la actual"
        )

    user.passwordHash = hashPassword(data.newPassword)
    repository.save(db, user)


# ---------- Permisos y roles ----------

def listPermissions(db: Session) -> list[Permission]:
    return repository.listPermissions(db)


def listRoles(db: Session) -> list[Role]:
    return repository.listRoles(db)


def createRole(db: Session, data: RoleCreate) -> Role:
    if repository.getRoleByName(db, data.name) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un rol con ese nombre")

    codes = set(data.permissionCodes)
    permissions = repository.getPermissionsByCodes(db, list(codes))
    unknown = codes - {permission.code for permission in permissions}
    if unknown:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Permisos inexistentes: {', '.join(sorted(unknown))}"
        )

    role = Role(name=data.name, permissions=permissions)
    return repository.createRole(db, role)


# ---------- Usuarios ----------

def listUsers(db: Session) -> list[User]:
    return repository.listUsers(db)


def createUser(db: Session, data: UserCreate) -> User:
    if repository.getUserByUsername(db, data.username) is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Ya existe un usuario con ese nombre")
    if repository.getRoleById(db, data.roleId) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Rol no encontrado")

    user = User(
        username=data.username,
        passwordHash=hashPassword(data.password),
        roleId=data.roleId,
    )
    return repository.createUser(db, user)


def _getUser(db: Session, userId: int) -> User:
    user = repository.getUserById(db, userId)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
    return user


def updateUser(db: Session, admin: User, userId: int, data: UserUpdate) -> User:
    user = _getUser(db, userId)

    # Evitar que el administrador se bloquee a sí mismo
    if user.id == admin.id and (data.isActive is False or data.roleId is not None):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "No puedes desactivarte ni cambiarte el rol a ti mismo"
        )

    if data.roleId is not None:
        if repository.getRoleById(db, data.roleId) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Rol no encontrado")
        user.roleId = data.roleId
    if data.isActive is not None:
        user.isActive = data.isActive

    return repository.save(db, user)


def resetPassword(db: Session, userId: int, data: ResetPasswordRequest) -> None:
    user = _getUser(db, userId)
    user.passwordHash = hashPassword(data.newPassword)
    repository.save(db, user)
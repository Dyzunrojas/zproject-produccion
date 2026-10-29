from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getCurrentUser, getDb, requirePermission
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    PermissionResponse,
    ResetPasswordRequest,
    RoleCreate,
    RoleResponse,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserSummary,
    UserUpdate,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(getDb)):
    return service.login(db, data)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(getCurrentUser)):
    return service.getMe(user)


@router.post("/changePassword", status_code=status.HTTP_204_NO_CONTENT)
def changePassword(
    data: ChangePasswordRequest,
    user: User = Depends(getCurrentUser),
    db: Session = Depends(getDb),
):
    service.changePassword(db, user, data)


# ---------- Permisos y roles ----------

@router.get(
    "/permissions",
    response_model=list[PermissionResponse],
    dependencies=[Depends(requirePermission("auth:manageRoles"))],
)
def listPermissions(db: Session = Depends(getDb)):
    return service.listPermissions(db)


@router.get(
    "/roles",
    response_model=list[RoleResponse],
    dependencies=[Depends(requirePermission("auth:manageRoles"))],
)
def listRoles(db: Session = Depends(getDb)):
    return service.listRoles(db)


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("auth:manageRoles"))],
)
def createRole(data: RoleCreate, db: Session = Depends(getDb)):
    return service.createRole(db, data)


# ---------- Usuarios ----------

@router.get(
    "/users",
    response_model=list[UserSummary],
    dependencies=[Depends(requirePermission("auth:manageUsers"))],
)
def listUsers(db: Session = Depends(getDb)):
    return service.listUsers(db)


@router.post(
    "/users",
    response_model=UserSummary,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("auth:manageUsers"))],
)
def createUser(data: UserCreate, db: Session = Depends(getDb)):
    return service.createUser(db, data)


@router.patch("/users/{userId}", response_model=UserSummary)
def updateUser(
    userId: int,
    data: UserUpdate,
    admin: User = Depends(requirePermission("auth:manageUsers")),
    db: Session = Depends(getDb),
):
    return service.updateUser(db, admin, userId, data)


@router.put(
    "/users/{userId}/password",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("auth:manageUsers"))],
)
def resetPassword(userId: int, data: ResetPasswordRequest, db: Session = Depends(getDb)):
    service.resetPassword(db, userId, data)
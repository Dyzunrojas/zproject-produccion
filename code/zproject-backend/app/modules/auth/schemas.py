from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    permissions: list[str]


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str = Field(min_length=8, max_length=72)


# ---------- Administración de usuarios y roles ----------

class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    description: str


class RoleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    permissionCodes: list[str] = Field(min_length=1)


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    permissions: list[PermissionResponse]


class RoleSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=72)
    roleId: int


class UserUpdate(BaseModel):
    roleId: int | None = None
    isActive: bool | None = None


class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    isActive: bool
    role: RoleSummary


class ResetPasswordRequest(BaseModel):
    newPassword: str = Field(min_length=8, max_length=72)
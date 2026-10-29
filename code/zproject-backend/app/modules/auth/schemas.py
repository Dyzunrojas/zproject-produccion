from pydantic import BaseModel


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
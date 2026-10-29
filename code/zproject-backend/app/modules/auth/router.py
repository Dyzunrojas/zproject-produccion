from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import getCurrentUser, getDb
from app.modules.auth import service
from app.modules.auth.models import User
from app.modules.auth.schemas import LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(getDb)):
    return service.login(db, data)


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(getCurrentUser)):
    return service.getMe(user)
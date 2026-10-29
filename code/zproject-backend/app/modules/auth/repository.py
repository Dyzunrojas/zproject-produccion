from sqlalchemy.orm import Session

from app.modules.auth.models import User


def getUserByUsername(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()
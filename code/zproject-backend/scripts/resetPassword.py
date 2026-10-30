from getpass import getpass

from app import models  # noqa: F401
from app.core.database import SessionLocal
from app.core.security import hashPassword
from app.modules.auth.models import User


def resetPassword() -> None:
    username = input("Usuario: ").strip()
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(username=username).first()
        if user is None:
            raise SystemExit("Usuario no encontrado")

        password = getpass("Nueva contraseña (mínimo 8 caracteres): ")
        if len(password) < 8:
            raise SystemExit("La contraseña debe tener al menos 8 caracteres")

        user.passwordHash = hashPassword(password)
        db.commit()
        print(f"Contraseña de '{username}' actualizada")
    finally:
        db.close()


if __name__ == "__main__":
    resetPassword()
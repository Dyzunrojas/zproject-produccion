from getpass import getpass

import app.models  # noqa: F401  (registra los modelos)
from app.core.database import Base, SessionLocal, engine
from app.core.security import hashPassword
from app.modules.auth.models import Permission, Role, User

RESOURCES = [
    "clients",
    "orders",
    "print_orders",
    "repairs",
    "warranties",
    "payments",
    "materials",
    "spare_parts",
    "tools",
]
ACTIONS = ["create", "read", "update", "delete"]
EXTRA = [
    "print_orders:finalize",
    "repairs:finalize",
    "materials:purchase",
    "auth:manageUsers",
    "auth:manageRoles",
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        codes = [f"{r}:{a}" for r in RESOURCES for a in ACTIONS] + EXTRA

        permissions = {p.code: p for p in db.query(Permission).all()}
        for code in codes:
            if code not in permissions:
                permission = Permission(code=code)
                db.add(permission)
                permissions[code] = permission

        role = db.query(Role).filter_by(name="Administrador").first()
        if role is None:
            role = Role(name="Administrador")
            db.add(role)
        role.permissions = list(permissions.values())

        user = db.query(User).filter_by(username="admin").first()
        if user is None:
            password = getpass("Contraseña para el usuario admin: ")
            if not password:
                raise SystemExit("La contraseña no puede estar vacía")
            db.add(User(username="admin", passwordHash=hashPassword(password), role=role))

        db.commit()
        print("Seed completado")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
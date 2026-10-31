from sqlalchemy.orm import Session

from app.modules.auth.models import Permission, Role, User


def getUserByUsername(db: Session, username: str) -> User | None:
    return db.query(User).filter(User.username == username).first()


def getUserById(db: Session, userId: int) -> User | None:
    return db.get(User, userId)


def listUsers(db: Session) -> list[User]:
    return db.query(User).order_by(User.username).all()


def createUser(db: Session, user: User) -> User:
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def save(db: Session, user: User) -> User:
    db.commit()
    db.refresh(user)
    return user


def getRoleById(db: Session, roleId: int) -> Role | None:
    return db.get(Role, roleId)


def getRoleByName(db: Session, name: str) -> Role | None:
    return db.query(Role).filter(Role.name == name).first()


def listRoles(db: Session) -> list[Role]:
    return db.query(Role).order_by(Role.name).all()


def createRole(db: Session, role: Role) -> Role:
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def listPermissions(db: Session) -> list[Permission]:
    return db.query(Permission).order_by(Permission.code).all()


def getPermissionsByCodes(db: Session, codes: list[str]) -> list[Permission]:
    return db.query(Permission).filter(Permission.code.in_(codes)).all()

def saveRole(db: Session, role: Role) -> Role:
    db.commit()
    db.refresh(role)
    return role
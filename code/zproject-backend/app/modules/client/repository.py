from sqlalchemy.orm import Session

from app.modules.client.models import Client


def getAll(db: Session, search: str | None = None) -> list[Client]:
    query = db.query(Client).filter(Client.isActive.is_(True))
    if search:
        query = query.filter(Client.name.ilike(f"%{search}%"))
    return query.order_by(Client.name).all()


def getById(db: Session, clientId: int) -> Client | None:
    return db.get(Client, clientId)


def create(db: Session, client: Client) -> Client:
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def save(db: Session, client: Client) -> Client:
    db.commit()
    db.refresh(client)
    return client
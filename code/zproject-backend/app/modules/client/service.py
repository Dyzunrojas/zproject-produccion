from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.client import repository
from app.modules.client.models import Client
from app.modules.client.schemas import ClientCreate, ClientUpdate


def getClients(db: Session, search: str | None = None) -> list[Client]:
    return repository.getAll(db, search)


def getClient(db: Session, clientId: int) -> Client:
    client = repository.getById(db, clientId)
    # Un cliente desactivado se trata como si no existiera
    if client is None or not client.isActive:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")
    return client


def createClient(db: Session, data: ClientCreate) -> Client:
    client = Client(**data.model_dump())
    return repository.create(db, client)


def updateClient(db: Session, clientId: int, data: ClientUpdate) -> Client:
    client = getClient(db, clientId)
    for field, value in data.model_dump(exclude_unset=True).items():
        # name es obligatorio en la BD: no se acepta null explícito
        if field == "name" and value is None:
            continue
        setattr(client, field, value if value is not None else "")
    return repository.save(db, client)


def deleteClient(db: Session, clientId: int) -> None:
    client = getClient(db, clientId)
    client.isActive = False  # borrado lógico: pedidos y reparaciones conservan su cliente
    repository.save(db, client)
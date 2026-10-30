from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.client import service
from app.modules.client.schemas import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter(prefix="/clients", tags=["clients"])


@router.get(
    "",
    response_model=list[ClientResponse],
    dependencies=[Depends(requirePermission("clients:read"))],
)
def listClients(search: str | None = None, db: Session = Depends(getDb)):
    return service.getClients(db, search)


@router.get(
    "/{clientId}",
    response_model=ClientResponse,
    dependencies=[Depends(requirePermission("clients:read"))],
)
def getClient(clientId: int, db: Session = Depends(getDb)):
    return service.getClient(db, clientId)


@router.post(
    "",
    response_model=ClientResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("clients:create"))],
)
def createClient(data: ClientCreate, db: Session = Depends(getDb)):
    return service.createClient(db, data)


@router.put(
    "/{clientId}",
    response_model=ClientResponse,
    dependencies=[Depends(requirePermission("clients:update"))],
)
def updateClient(clientId: int, data: ClientUpdate, db: Session = Depends(getDb)):
    return service.updateClient(db, clientId, data)


@router.delete(
    "/{clientId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("clients:delete"))],
)
def deleteClient(clientId: int, db: Session = Depends(getDb)):
    service.deleteClient(db, clientId)
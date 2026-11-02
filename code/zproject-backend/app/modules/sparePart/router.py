from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.sparePart import service
from app.modules.sparePart.schemas import SparePartCreate, SparePartResponse, SparePartUpdate

router = APIRouter(prefix="/spareParts", tags=["spareParts"])


@router.get(
    "",
    response_model=list[SparePartResponse],
    dependencies=[Depends(requirePermission("spare_parts:read"))],
)
def listSpareParts(db: Session = Depends(getDb)):
    return service.getSpareParts(db)


@router.get(
    "/{sparePartId}",
    response_model=SparePartResponse,
    dependencies=[Depends(requirePermission("spare_parts:read"))],
)
def getSparePart(sparePartId: int, db: Session = Depends(getDb)):
    return service.getSparePart(db, sparePartId)


@router.post(
    "",
    response_model=SparePartResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("spare_parts:create"))],
)
def createSparePart(data: SparePartCreate, db: Session = Depends(getDb)):
    return service.createSparePart(db, data)


@router.put(
    "/{sparePartId}",
    response_model=SparePartResponse,
    dependencies=[Depends(requirePermission("spare_parts:update"))],
)
def updateSparePart(sparePartId: int, data: SparePartUpdate, db: Session = Depends(getDb)):
    return service.updateSparePart(db, sparePartId, data)


@router.delete(
    "/{sparePartId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("spare_parts:delete"))],
)
def deleteSparePart(sparePartId: int, db: Session = Depends(getDb)):
    service.deleteSparePart(db, sparePartId)
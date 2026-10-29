from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.warranty import service
from app.modules.warranty.schemas import WarrantyCreate, WarrantyResponse, WarrantyUpdate

router = APIRouter(prefix="/warranties", tags=["warranties"])


@router.get(
    "",
    response_model=list[WarrantyResponse],
    dependencies=[Depends(requirePermission("warranties:read"))],
)
def listWarranties(
    repairOrderId: int | None = None,
    fromDate: date | None = None,
    toDate: date | None = None,
    db: Session = Depends(getDb),
):
    return service.getWarranties(db, repairOrderId, fromDate, toDate)


@router.get(
    "/{warrantyId}",
    response_model=WarrantyResponse,
    dependencies=[Depends(requirePermission("warranties:read"))],
)
def getWarranty(warrantyId: int, db: Session = Depends(getDb)):
    return service.getWarranty(db, warrantyId)


@router.post(
    "",
    response_model=WarrantyResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("warranties:create"))],
)
def createWarranty(
    data: WarrantyCreate,
    force: bool = Query(default=False),
    db: Session = Depends(getDb),
):
    return service.createWarranty(db, data, force)


@router.put(
    "/{warrantyId}",
    response_model=WarrantyResponse,
    dependencies=[Depends(requirePermission("warranties:update"))],
)
def updateWarranty(
    warrantyId: int, data: WarrantyUpdate, db: Session = Depends(getDb)
):
    return service.updateWarranty(db, warrantyId, data)


@router.delete(
    "/{warrantyId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("warranties:delete"))],
)
def deleteWarranty(warrantyId: int, db: Session = Depends(getDb)):
    service.deleteWarranty(db, warrantyId)

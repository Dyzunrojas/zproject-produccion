from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.warranty import repository
from app.modules.warranty.models import Warranty
from app.modules.warranty.schemas import WarrantyCreate, WarrantyUpdate


def getWarranties(
    db: Session,
    repairOrderId: int | None = None,
    fromDate: date | None = None,
    toDate: date | None = None,
) -> list[Warranty]:
    return repository.getAll(db, repairOrderId, fromDate, toDate)


def getWarranty(db: Session, warrantyId: int) -> Warranty:
    warranty = repository.getById(db, warrantyId)
    if warranty is None or not warranty.isActive:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Garantía no encontrada")
    return warranty


def createWarranty(db: Session, data: WarrantyCreate, force: bool = False) -> Warranty:
    checkDates(data.startDate, data.expirationDate)

    active = repository.findActiveByRepairOrder(db, data.repairOrderId, date.today())
    if active is not None and not force:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "La reparación ya tiene una garantía vigente; confirme para registrar otra",
        )

    warranty = Warranty(
        repairOrderId=data.repairOrderId,
        startDate=data.startDate,
        expirationDate=data.expirationDate,
        conditions=data.conditions,
    )
    return repository.create(db, warranty)


def updateWarranty(db: Session, warrantyId: int, data: WarrantyUpdate) -> Warranty:
    warranty = getWarranty(db, warrantyId)

    changes = data.model_dump(exclude_unset=True)
    startDate = changes.get("startDate", warranty.startDate)
    expirationDate = changes.get("expirationDate", warranty.expirationDate)
    checkDates(startDate, expirationDate)

    repairOrderId = changes.get("repairOrderId")
    if repairOrderId is not None and repairOrderId != warranty.repairOrderId:
        active = repository.findActiveByRepairOrder(db, repairOrderId, date.today())
        if active is not None and active.id != warranty.id:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "La reparación ya tiene una garantía vigente",
            )

    for field, value in changes.items():
        setattr(warranty, field, value)
    return repository.save(db, warranty)


def deleteWarranty(db: Session, warrantyId: int) -> None:
    warranty = getWarranty(db, warrantyId)
    warranty.isActive = False
    repository.save(db, warranty)


def checkDates(startDate: date, expirationDate: date) -> None:
    if startDate > expirationDate:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "startDate no puede ser posterior a expirationDate",
        )

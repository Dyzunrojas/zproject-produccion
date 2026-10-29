from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.spare_parts import repository
from app.modules.spare_parts.models import SparePart, SparePartUsage
from app.modules.spare_parts.schemas import SparePartCreate, SparePartUpdate, SparePartUsageLine


def getSpareParts(db: Session) -> list[SparePart]:
    return repository.getAll(db)


def getSparePart(db: Session, sparePartId: int) -> SparePart:
    sparePart = repository.getById(db, sparePartId)
   
    if sparePart is None or not sparePart.isActive:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Repuesto no encontrado")
    return sparePart


def createSparePart(db: Session, data: SparePartCreate) -> SparePart:
    sparePart = SparePart(**data.model_dump())
    return repository.create(db, sparePart)


def updateSparePart(db: Session, sparePartId: int, data: SparePartUpdate) -> SparePart:
    sparePart = getSparePart(db, sparePartId)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(sparePart, field, value)
    return repository.save(db, sparePart)


def deleteSparePart(db: Session, sparePartId: int) -> None:
    sparePart = getSparePart(db, sparePartId)
    sparePart.isActive = False  
    repository.save(db, sparePart)


def consumeSpareParts(db: Session, repairOrderId: int, lines: list[SparePartUsageLine]) -> None:
    totals: dict[int, int] = {}
    for line in lines:
        totals[line.sparePartId] = totals.get(line.sparePartId, 0) + line.quantityUsed

    for sparePartId, quantity in sorted(totals.items()):
        sparePart = repository.getByIdForUpdate(db, sparePartId)
        if sparePart is None or not sparePart.isActive:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Repuesto no encontrado")
        if quantity > sparePart.stockUnits:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Stock insuficiente de {sparePart.name}: disponibles {sparePart.stockUnits}",
            )
        sparePart.stockUnits -= quantity
        repository.addUsage(db, SparePartUsage(
            repairOrderId=repairOrderId, sparePartId=sparePartId, quantityUsed=quantity
        ))
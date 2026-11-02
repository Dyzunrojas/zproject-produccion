from sqlalchemy.orm import Session

from app.modules.order.enums import OrderStatus
from app.modules.repairs.models import Device, RepairOrder


def getAll(db: Session, status: str | None = None, clientId: int | None = None) -> list[RepairOrder]:
    query = db.query(RepairOrder)
    if status is not None:
        query = query.filter(RepairOrder.status == status)
    if clientId is not None:
        query = query.filter(RepairOrder.clientId == clientId)
    return query.order_by(RepairOrder.id.desc()).all()


def getById(db: Session, repairId: int) -> RepairOrder | None:
    return db.get(RepairOrder, repairId)


def findActiveBySerial(
    db: Session, serialNumber: str, excludeRepairId: int | None = None
) -> RepairOrder | None:
    """Reparación abierta con ese serial. excludeRepairId sirve al editar (ignora la propia)."""
    query = (
        db.query(RepairOrder)
        .join(Device, RepairOrder.deviceId == Device.id)
        .filter(Device.serialNumber == serialNumber)
        .filter(RepairOrder.status.not_in([OrderStatus.finished.value, OrderStatus.cancelled.value]))
    )
    if excludeRepairId is not None:
        query = query.filter(RepairOrder.id != excludeRepairId)
    return query.first()


def create(db: Session, repair: RepairOrder) -> RepairOrder:
    db.add(repair)
    db.commit()
    db.refresh(repair)
    return repair


def save(db: Session, repair: RepairOrder) -> RepairOrder:
    db.commit()
    db.refresh(repair)
    return repair


def rollback(db: Session) -> None:
    db.rollback()
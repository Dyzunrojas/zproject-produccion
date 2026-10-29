from sqlalchemy.orm import Session

from app.modules.repairs.models import CANCELLED, FINISHED, Device, RepairOrder


def getAll(db: Session, status: str | None = None, clientId: int | None = None) -> list[RepairOrder]:
    query = db.query(RepairOrder)
    if status is not None:
        query = query.filter(RepairOrder.status == status)
    if clientId is not None:
        query = query.filter(RepairOrder.clientId == clientId)
    return query.order_by(RepairOrder.id.desc()).all()


def getById(db: Session, repairId: int) -> RepairOrder | None:
    return db.get(RepairOrder, repairId)


def findActiveBySerial(db: Session, serialNumber: str) -> RepairOrder | None:
    return (
        db.query(RepairOrder)
        .join(Device, RepairOrder.deviceId == Device.id)
        .filter(Device.serialNumber == serialNumber)
        .filter(RepairOrder.status.not_in([FINISHED, CANCELLED]))
        .first()
    )


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
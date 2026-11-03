from datetime import date

from sqlalchemy.orm import Session

from app.modules.warranty.models import Warranty


def getAll(
    db: Session,
    repairOrderId: int | None = None,
    fromDate: date | None = None,
    toDate: date | None = None,
) -> list[Warranty]:
    query = db.query(Warranty).filter(Warranty.isActive.is_(True))
    if repairOrderId is not None:
        query = query.filter(Warranty.repairOrderId == repairOrderId)
    if fromDate is not None:
        query = query.filter(Warranty.expirationDate >= fromDate)
    if toDate is not None:
        query = query.filter(Warranty.startDate <= toDate)
    return query.order_by(Warranty.startDate.desc()).all()


def getById(db: Session, warrantyId: int) -> Warranty | None:
    return db.get(Warranty, warrantyId)


def findActiveByRepairOrder(
    db: Session, repairOrderId: int, today: date
) -> Warranty | None:
    return (
        db.query(Warranty)
        .filter(Warranty.repairOrderId == repairOrderId)
        .filter(Warranty.isActive.is_(True))
        .filter(Warranty.startDate <= today)
        .filter(Warranty.expirationDate >= today)
        .first()
    )


def create(db: Session, warranty: Warranty) -> Warranty:
    db.add(warranty)
    db.commit()
    db.refresh(warranty)
    return warranty


def save(db: Session, warranty: Warranty) -> Warranty:
    db.commit()
    db.refresh(warranty)
    return warranty

from sqlalchemy.orm import Session

from app.modules.spare_parts.models import SparePart, SparePartUsage


def getAll(db: Session) -> list[SparePart]:
    return (
        db.query(SparePart)
        .filter(SparePart.isActive.is_(True))
        .order_by(SparePart.name, SparePart.brand)
        .all()
    )


def getById(db: Session, sparePartId: int) -> SparePart | None:
    return db.get(SparePart, sparePartId)


def getByIdForUpdate(db: Session, sparePartId: int) -> SparePart | None:
    return db.query(SparePart).filter(SparePart.id == sparePartId).with_for_update().first()


def create(db: Session, sparePart: SparePart) -> SparePart:
    db.add(sparePart)
    db.commit()
    db.refresh(sparePart)
    return sparePart


def save(db: Session, sparePart: SparePart) -> SparePart:
    db.commit()
    db.refresh(sparePart)
    return sparePart


def addUsage(db: Session, usage: SparePartUsage) -> SparePartUsage:
    db.add(usage)
    return usage
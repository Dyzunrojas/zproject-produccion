from sqlalchemy.orm import Session

from app.modules.printOrder.models import PrintOrder


def getAll(db: Session) -> list[PrintOrder]:
    return db.query(PrintOrder).order_by(PrintOrder.id.desc()).all()


def getById(db: Session, printOrderId: int) -> PrintOrder | None:
    return db.get(PrintOrder, printOrderId)


def create(db: Session, printOrder: PrintOrder) -> PrintOrder:
    db.add(printOrder)
    db.commit()
    db.refresh(printOrder)
    return printOrder


def save(db: Session, printOrder: PrintOrder) -> PrintOrder:
    db.commit()
    db.refresh(printOrder)
    return printOrder
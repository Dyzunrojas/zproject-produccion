from sqlalchemy.orm import Session

from app.modules.printOrder.models import Object3D, PrintOrder


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


def getObject(db: Session, printOrderId: int, objectId: int) -> Object3D | None:
    return (
        db.query(Object3D)
        .filter(Object3D.id == objectId, Object3D.printOrderId == printOrderId)
        .first()
    )


def createObject(db: Session, obj: Object3D) -> Object3D:
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def saveObject(db: Session, obj: Object3D) -> Object3D:
    db.commit()
    db.refresh(obj)
    return obj


def deleteObject(db: Session, obj: Object3D) -> None:
    db.delete(obj)
    db.commit()
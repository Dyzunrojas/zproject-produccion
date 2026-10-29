from sqlalchemy.orm import Session

from app.modules.material.models import Material


def getAll(db: Session) -> list[Material]:
    return (
        db.query(Material)
        .filter(Material.isActive.is_(True))
        .order_by(Material.type, Material.color)
        .all()
    )


def getById(db: Session, materialId: int) -> Material | None:
    return db.get(Material, materialId)


def create(db: Session, material: Material) -> Material:
    db.add(material)
    db.commit()
    db.refresh(material)
    return material


def save(db: Session, material: Material) -> Material:
    db.commit()
    db.refresh(material)
    return material
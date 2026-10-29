from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.modules.material import repository
from app.modules.material.models import Material
from app.modules.material.schemas import MaterialCreate, MaterialPurchase, MaterialUpdate


def getMaterials(db: Session) -> list[Material]:
    return repository.getAll(db)


def getMaterial(db: Session, materialId: int) -> Material:
    material = repository.getById(db, materialId)
    # Un material desactivado se trata como si no existiera
    if material is None or not material.isActive:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Material no encontrado")
    return material


def createMaterial(db: Session, data: MaterialCreate) -> Material:
    material = Material(**data.model_dump())
    return repository.create(db, material)


def updateMaterial(db: Session, materialId: int, data: MaterialUpdate) -> Material:
    material = getMaterial(db, materialId)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(material, field, value)
    return repository.save(db, material)


def deleteMaterial(db: Session, materialId: int) -> None:
    material = getMaterial(db, materialId)
    material.isActive = False  # borrado lógico: la fila queda en la BD
    repository.save(db, material)

def purchaseMaterial(db: Session, materialId: int, data: MaterialPurchase) -> Material:
    material = getMaterial(db, materialId)
    material.stockGrams += Decimal(str(data.grams))
    return repository.save(db, material)
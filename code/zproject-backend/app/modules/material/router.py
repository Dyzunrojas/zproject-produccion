from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.material import service
from app.modules.material.schemas import MaterialCreate, MaterialResponse, MaterialUpdate, MaterialPurchase

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get(
    "",
    response_model=list[MaterialResponse],
    dependencies=[Depends(requirePermission("materials:read"))],
)
def listMaterials(db: Session = Depends(getDb)):
    return service.getMaterials(db)


@router.get(
    "/{materialId}",
    response_model=MaterialResponse,
    dependencies=[Depends(requirePermission("materials:read"))],
)
def getMaterial(materialId: int, db: Session = Depends(getDb)):
    return service.getMaterial(db, materialId)


@router.post(
    "",
    response_model=MaterialResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("materials:create"))],
)
def createMaterial(data: MaterialCreate, db: Session = Depends(getDb)):
    return service.createMaterial(db, data)


@router.put(
    "/{materialId}",
    response_model=MaterialResponse,
    dependencies=[Depends(requirePermission("materials:update"))],
)
def updateMaterial(materialId: int, data: MaterialUpdate, db: Session = Depends(getDb)):
    return service.updateMaterial(db, materialId, data)


@router.delete(
    "/{materialId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("materials:delete"))],
)
def deleteMaterial(materialId: int, db: Session = Depends(getDb)):
    service.deleteMaterial(db, materialId)

@router.post(
    "/{materialId}/purchase",
    response_model=MaterialResponse,
    dependencies=[Depends(requirePermission("materials:purchase"))],
)
def purchaseMaterial(materialId: int, data: MaterialPurchase, db: Session = Depends(getDb)):
    return service.purchaseMaterial(db, materialId, data)
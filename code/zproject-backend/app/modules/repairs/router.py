from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.repairs import service
from app.modules.repairs.schemas import (
    RepairCreate,
    RepairDiagnosis,
    RepairFinalize,
    RepairFinalizeResponse,
    RepairResponse,
    RepairStatusChange,
    RepairUpdate,
)

router = APIRouter(prefix="/repairs", tags=["repairs"])



@router.get(
    "",
    response_model=list[RepairResponse],
    dependencies=[Depends(requirePermission("repairs:read"))],
)
def listRepairs(status: str | None = None, clientId: int | None = None, db: Session = Depends(getDb)):
    return service.getRepairs(db, status, clientId)


@router.get(
    "/{repairId}",
    response_model=RepairResponse,
    dependencies=[Depends(requirePermission("repairs:read"))],
)
def getRepair(repairId: int, db: Session = Depends(getDb)):
    return service.getRepair(db, repairId)



@router.post(
    "",
    response_model=RepairResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("repairs:create"))],
)
def createRepair(data: RepairCreate, db: Session = Depends(getDb)):
    return service.createRepair(db, data)



@router.put(
    "/{repairId}",
    response_model=RepairResponse,
    dependencies=[Depends(requirePermission("repairs:update"))],
)
def updateRepair(repairId: int, data: RepairUpdate, db: Session = Depends(getDb)):
    return service.updateRepair(db, repairId, data)



@router.post(
    "/{repairId}/diagnosis",
    response_model=RepairResponse,
    dependencies=[Depends(requirePermission("repairs:update"))],
)
def registerDiagnosis(repairId: int, data: RepairDiagnosis, db: Session = Depends(getDb)):
    return service.registerDiagnosis(db, repairId, data)



@router.patch(
    "/{repairId}/status",
    response_model=RepairResponse,
    dependencies=[Depends(requirePermission("repairs:update"))],
)
def changeStatus(repairId: int, data: RepairStatusChange, db: Session = Depends(getDb)):
    return service.changeStatus(db, repairId, data)



@router.post(
    "/{repairId}/finalize",
    response_model=RepairFinalizeResponse,
    dependencies=[Depends(requirePermission("repairs:finalize"))],
)
def finalizeRepair(repairId: int, data: RepairFinalize, db: Session = Depends(getDb)):
    repair, warning = service.finalizeRepair(db, repairId, data)
    return RepairFinalizeResponse(repair=repair, warning=warning)
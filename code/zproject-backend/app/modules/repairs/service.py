from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.client.models import Client
from app.modules.repairs import repository
from app.modules.repairs.models import CANCELLED, DIAGNOSED, FINISHED, RECEIVED, Device, RepairOrder
from app.modules.repairs.schemas import (
    RepairCreate,
    RepairDiagnosis,
    RepairFinalize,
    RepairStatusChange,
    RepairUpdate,
)
from app.modules.sparePart import service as sparePartService


def getRepairs(db: Session, status: str | None = None, clientId: int | None = None) -> list[RepairOrder]:
    return repository.getAll(db, status, clientId)


def getRepair(db: Session, repairId: int) -> RepairOrder:
    repair = repository.getById(db, repairId)
    if repair is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reparación no encontrada")
    return repair


def getOpenRepair(db: Session, repairId: int) -> RepairOrder:
    repair = getRepair(db, repairId)
    if repair.status in (FINISHED, CANCELLED):
        raise HTTPException(status.HTTP_409_CONFLICT, "La reparación ya está finalizada o cancelada")
    return repair


def createRepair(db: Session, data: RepairCreate) -> RepairOrder:
    if db.get(Client, data.clientId) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")

    serial = data.device.serialNumber
    if serial and not data.allowDuplicate:
        existing = repository.findActiveBySerial(db, serial)
        if existing is not None:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Este equipo ya está en reparación (reparación {existing.id})",
            )

    repair = RepairOrder(
        clientId=data.clientId,
        status=RECEIVED,
        estimatedDeliveryDate=data.estimatedDeliveryDate,
        problemDescription=data.problemDescription,
        device=Device(clientId=data.clientId, **data.device.model_dump()),
    )
    return repository.create(db, repair)


def updateRepair(db: Session, repairId: int, data: RepairUpdate) -> RepairOrder:
    repair = getOpenRepair(db, repairId)
    values = data.model_dump(exclude_unset=True)
    deviceValues = values.pop("device", None) or {}
    if values.get("workAmount") is not None:
        values["workAmount"] = Decimal(str(values["workAmount"]))
    for field, value in values.items():
        setattr(repair, field, value)
    for field, value in deviceValues.items():
        setattr(repair.device, field, value)
    return repository.save(db, repair)


def registerDiagnosis(db: Session, repairId: int, data: RepairDiagnosis) -> RepairOrder:
    repair = getOpenRepair(db, repairId)
    repair.diagnosis = data.diagnosis
    repair.diagnosisAmount = Decimal(str(data.diagnosisAmount))
    if repair.status == RECEIVED:
        repair.status = DIAGNOSED
    return repository.save(db, repair)


def changeStatus(db: Session, repairId: int, data: RepairStatusChange) -> RepairOrder:
    repair = getOpenRepair(db, repairId)
    if data.status == DIAGNOSED and not repair.diagnosis:
        raise HTTPException(status.HTTP_409_CONFLICT, "Primero hay que registrar el diagnóstico")
    repair.status = data.status
    return repository.save(db, repair)


def finalizeRepair(db: Session, repairId: int, data: RepairFinalize) -> tuple[RepairOrder, str | None]:
    repair = getOpenRepair(db, repairId)
    if not repair.diagnosis:
        raise HTTPException(status.HTTP_409_CONFLICT, "La reparación no tiene diagnóstico registrado")


    sparePartService.consumeSpareParts(db, repair.id, data.spareParts)
    repair.status = FINISHED
    repair.finishedAt = datetime.now()
    repository.save(db, repair)

    return repair, notifyClient(repair)



def notifyClient(repair: RepairOrder) -> str | None:
    if not repair.client.email:
        return "El cliente no tiene correo registrado"
    return None
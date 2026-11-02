from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.client.models import Client
from app.modules.order import service as orderService
from app.modules.order.enums import OrderStatus
from app.modules.order.notifications import notifyOrderFinished
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.repairs import repository
from app.modules.repairs.models import Device, RepairOrder
from app.modules.repairs.schemas import (
    RepairCreate,
    RepairDiagnosis,
    RepairFinalize,
    RepairUpdate,
)
from app.modules.sparePart import service as sparePartService


def getRepairs(
    db: Session,
    status: str | None = None,
    clientId: int | None = None
) -> list[RepairOrder]:
    return repository.getAll(db, status, clientId)


def getRepair(db: Session, repairId: int) -> RepairOrder:
    repair = repository.getById(db, repairId)

    if repair is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Reparación no encontrada"
        )

    return repair


def getOpenRepair(db: Session, repairId: int) -> RepairOrder:
    """Reparación que todavía se puede modificar."""
    repair = getRepair(db, repairId)
    orderService.ensureEditable(repair)

    return repair


def checkSerialNotInRepair(
    db: Session,
    serial: str | None,
    excludeRepairId: int | None = None
) -> None:
    """Evita registrar un equipo que ya tiene otra reparación abierta."""

    if not serial:
        return

    existing = repository.findActiveBySerial(
        db,
        serial,
        excludeRepairId
    )

    if existing is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Este equipo ya está en reparación (reparación {existing.id})"
        )


def createRepair(db: Session, data: RepairCreate) -> RepairOrder:
    if db.get(Client, data.clientId) is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            "Cliente no encontrado"
        )

    if not data.allowDuplicate:
        checkSerialNotInRepair(db, data.device.serialNumber)

    repair = RepairOrder(
        clientId=data.clientId,
        status=OrderStatus.pending.value,
        estimatedDeliveryDate=data.estimatedDeliveryDate,
        problemDescription=data.problemDescription,
        device=Device(
            clientId=data.clientId,
            **data.device.model_dump()
        ),
    )

    return repository.create(db, repair)


def updateRepair(
    db: Session,
    repairId: int,
    data: RepairUpdate
) -> RepairOrder:
    repair = getOpenRepair(db, repairId)

    values = data.model_dump(exclude_unset=True)
    deviceValues = values.pop("device", None) or {}

    # Si cambia el serial, no puede coincidir con otra reparación abierta.
    newSerial = deviceValues.get("serialNumber")

    if newSerial and newSerial != repair.device.serialNumber:
        checkSerialNotInRepair(
            db,
            newSerial,
            excludeRepairId=repair.id
        )

    if values.get("workAmount") is not None:
        values["workAmount"] = Decimal(str(values["workAmount"]))

    for field, value in values.items():
        setattr(repair, field, value)

    for field, value in deviceValues.items():
        setattr(repair.device, field, value)

    return repository.save(db, repair)


def registerDiagnosis(
    db: Session,
    repairId: int,
    data: RepairDiagnosis
) -> RepairOrder:
    repair = getOpenRepair(db, repairId)

    repair.diagnosis = data.diagnosis
    repair.diagnosisAmount = Decimal(str(data.diagnosisAmount))

    return repository.save(db, repair)


def changeStatus(
    db: Session,
    repairId: int,
    data: OrderStatusUpdate
) -> RepairOrder:
    """
    Cambia el estado con las reglas compartidas (orderService)
    más una propia: no se empieza a reparar un equipo sin diagnóstico.
    """

    repair = getRepair(db, repairId)

    if data.status == OrderStatus.inProgress and not repair.diagnosis:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Primero hay que registrar el diagnóstico"
        )

    return orderService.changeStatus(db, repair, data.status)


def finalizeRepair(
    db: Session,
    repairId: int,
    data: RepairFinalize
) -> tuple[RepairOrder, str | None]:
    repair = getOpenRepair(db, repairId)

    if not repair.diagnosis:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "La reparación no tiene diagnóstico registrado"
        )

    if repair.status != OrderStatus.inProgress.value:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Primero debes iniciar la reparación después del diagnóstico"
        )

    if not repair.workDescription or not repair.workDescription.strip():
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Debes registrar la descripción del trabajo realizado"
        )

    if repair.workAmount is None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Debes registrar el monto del trabajo"
        )

    sparePartService.consumeSpareParts(
        db,
        repair.id,
        data.spareParts
    )

    repair.status = OrderStatus.finished.value
    repair.finishedAt = datetime.now()
    repair.deliveryDate = data.deliveryDate or date.today()

    repository.save(db, repair)

    # La reparación ya quedó guardada: el correo nunca debe deshacerla.
    return repair, notifyClient(repair)


def notifyClient(repair: RepairOrder) -> str | None:
    """Avisa al cliente que su equipo está listo. Devuelve un aviso si no se pudo."""
    return notifyOrderFinished(
        repair,
        kind="reparación",
        subject=f"Tu reparación #{repair.id} está lista",
        summary=(
            f"Tu equipo {repair.device.brand} {repair.device.model} "
            "ya está listo para retirar."
        ),
    )

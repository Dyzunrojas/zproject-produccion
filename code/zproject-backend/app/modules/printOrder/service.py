from datetime import date
from decimal import Decimal
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.mailer import sendEmail
from app.modules.client.models import Client
from app.modules.material.models import Material
from app.modules.order import service as orderService
from app.modules.order.enums import OrderStatus
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.printOrder import repository
from app.modules.printOrder.models import MaterialUsage, Object3D, PrintOrder
from app.modules.printOrder.schemas import (
    Object3DCreate,
    PrintOrderCreate,
    PrintOrderFinalize,
    PrintOrderUpdate,
)


def toDecimal(value: float | None) -> Decimal | None:
    return None if value is None else Decimal(str(value))


def getPrintOrders(db: Session) -> list[PrintOrder]:
    return repository.getAll(db)


def getPrintOrder(db: Session, printOrderId: int) -> PrintOrder:
    printOrder = repository.getById(db, printOrderId)
    if printOrder is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    return printOrder


def createPrintOrder(db: Session, data: PrintOrderCreate) -> PrintOrder:
    if db.get(Client, data.clientId) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cliente no encontrado")

    printOrder = PrintOrder(
        clientId=data.clientId,
        estimatedDeliveryDate=data.estimatedDeliveryDate,
        totalAmount=toDecimal(data.totalAmount),
        objects=[
            Object3D(name=obj.name, description=obj.description) for obj in data.objects
        ],
    )
    return repository.create(db, printOrder)


def updatePrintOrder(db: Session, printOrderId: int, data: PrintOrderUpdate) -> PrintOrder:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)

    changes = data.model_dump(exclude_unset=True)
    if "totalAmount" in changes:
        newTotal = toDecimal(changes["totalAmount"]) or Decimal("0")
        if newTotal < printOrder.totalPaid:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Ya hay {printOrder.totalPaid} abonados: el monto no puede ser menor. "
                "Cancela un pago si necesitas bajarlo más",
            )

    for field, value in changes.items():
        setattr(printOrder, field, toDecimal(value) if field == "totalAmount" else value)
    return repository.save(db, printOrder)


def changeStatus(db: Session, printOrderId: int, data: OrderStatusUpdate) -> PrintOrder:
    printOrder = getPrintOrder(db, printOrderId)
    return orderService.changeStatus(db, printOrder, data.status)  # type: ignore[return-value]


# ---------- Objetos 3D ----------

def getObject(db: Session, printOrderId: int, objectId: int) -> Object3D:
    obj = repository.getObject(db, printOrderId, objectId)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Objeto no encontrado en este pedido")
    return obj


def addObject(db: Session, printOrderId: int, data: Object3DCreate) -> Object3D:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)
    obj = Object3D(
        printOrderId=printOrder.id,
        name=data.name,
        description=data.description,
    )
    return repository.createObject(db, obj)


def deleteObject(db: Session, printOrderId: int, objectId: int) -> None:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)
    obj = getObject(db, printOrderId, objectId)
    if len(printOrder.objects) <= 1:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "El pedido debe tener al menos un objeto"
        )
    if obj.stlFilePath:
        Path(obj.stlFilePath).unlink(missing_ok=True)
    repository.deleteObject(db, obj)


def uploadStl(db: Session, printOrderId: int, objectId: int, file: UploadFile) -> Object3D:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)
    obj = getObject(db, printOrderId, objectId)

    if not file.filename or not file.filename.lower().endswith(".stl"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "El archivo debe ser .stl")

    maxBytes = settings.maxStlMb * 1024 * 1024
    content = file.file.read(maxBytes + 1)
    if len(content) > maxBytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"El archivo supera el máximo de {settings.maxStlMb} MB",
        )

    directory = Path(settings.uploadDir) / "stl" / str(printOrderId)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{objectId}.stl"
    path.write_bytes(content)

    obj.stlFilePath = path.as_posix()
    return repository.saveObject(db, obj)


def getStlPath(db: Session, printOrderId: int, objectId: int) -> tuple[Path, str]:
    obj = getObject(db, printOrderId, objectId)
    if not obj.stlFilePath or not Path(obj.stlFilePath).exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Este objeto no tiene archivo STL")
    return Path(obj.stlFilePath), f"{obj.name}.stl"


# ---------- Finalizar pedido ----------

def finalizePrintOrder(
    db: Session, printOrderId: int, data: PrintOrderFinalize
) -> tuple[PrintOrder, str | None]:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)

    materialIds = [item.materialId for item in data.materialsUsed]
    if len(materialIds) != len(set(materialIds)):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Un material no puede repetirse: manda el total gastado"
        )

    for item in data.materialsUsed:
        material = db.get(Material, item.materialId)
        if material is None or not material.isActive:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND, f"Material {item.materialId} no encontrado"
            )

        grams = Decimal(str(item.gramsUsed))
        if material.stockGrams < grams:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Stock insuficiente de {material.type} {material.color} "
                f"(hay {material.stockGrams} g)",
            )

        material.stockGrams -= grams
        printOrder.materialUsages.append(
            MaterialUsage(materialId=material.id, gramsUsed=grams)
        )

    printOrder.status = OrderStatus.finished.value
    printOrder.deliveryDate = data.deliveryDate or date.today()
    repository.save(db, printOrder)

    # El pedido ya quedó guardado: el correo nunca debe deshacerlo
    return printOrder, notifyClient(printOrder)


def notifyClient(printOrder: PrintOrder) -> str | None:
    """Avisa al cliente que su pedido está listo. Devuelve un aviso si no se pudo."""
    client = printOrder.client
    if not client.email:
        return "El cliente no tiene correo registrado"

    objects = ", ".join(obj.name for obj in printOrder.objects)
    body = (
        f"Hola {client.name},\n\n"
        f"Tu pedido de impresión 3D ya está listo: {objects}.\n"
        f"Número de pedido: #{printOrder.id}\n"
        f"Fecha de entrega: {printOrder.deliveryDate:%d/%m/%Y}\n\n"
        "¡Gracias por tu preferencia!"
    )
    return sendEmail(client.email, f"Tu pedido #{printOrder.id} está listo", body)
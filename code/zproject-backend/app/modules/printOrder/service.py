from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.client.models import Client
from app.modules.order import service as orderService
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.printOrder import repository
from app.modules.printOrder.models import Object3D, PrintOrder
from app.modules.printOrder.schemas import PrintOrderCreate, PrintOrderUpdate


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
        objects=[Object3D(name=obj.name) for obj in data.objects],
    )
    return repository.create(db, printOrder)


def updatePrintOrder(db: Session, printOrderId: int, data: PrintOrderUpdate) -> PrintOrder:
    printOrder = getPrintOrder(db, printOrderId)
    orderService.ensureEditable(printOrder)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(printOrder, field, value)
    return repository.save(db, printOrder)


def changeStatus(db: Session, printOrderId: int, data: OrderStatusUpdate) -> PrintOrder:
    printOrder = getPrintOrder(db, printOrderId)
    return orderService.changeStatus(db, printOrder, data.status)  # type: ignore[return-value]
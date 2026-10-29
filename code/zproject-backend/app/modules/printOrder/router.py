from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.printOrder import service
from app.modules.printOrder.schemas import (
    PrintOrderCreate,
    PrintOrderResponse,
    PrintOrderUpdate,
)

router = APIRouter(prefix="/printOrders", tags=["printOrders"])


@router.get(
    "",
    response_model=list[PrintOrderResponse],
    dependencies=[Depends(requirePermission("print_orders:read"))],
)
def listPrintOrders(db: Session = Depends(getDb)):
    return service.getPrintOrders(db)


@router.get(
    "/{printOrderId}",
    response_model=PrintOrderResponse,
    dependencies=[Depends(requirePermission("print_orders:read"))],
)
def getPrintOrder(printOrderId: int, db: Session = Depends(getDb)):
    return service.getPrintOrder(db, printOrderId)


@router.post(
    "",
    response_model=PrintOrderResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("print_orders:create"))],
)
def createPrintOrder(data: PrintOrderCreate, db: Session = Depends(getDb)):
    return service.createPrintOrder(db, data)


@router.put(
    "/{printOrderId}",
    response_model=PrintOrderResponse,
    dependencies=[Depends(requirePermission("print_orders:update"))],
)
def updatePrintOrder(printOrderId: int, data: PrintOrderUpdate, db: Session = Depends(getDb)):
    return service.updatePrintOrder(db, printOrderId, data)


@router.patch(
    "/{printOrderId}/status",
    response_model=PrintOrderResponse,
    dependencies=[Depends(requirePermission("print_orders:update"))],
)
def changePrintOrderStatus(
    printOrderId: int, data: OrderStatusUpdate, db: Session = Depends(getDb)
):
    return service.changeStatus(db, printOrderId, data)
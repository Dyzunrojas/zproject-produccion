from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.printOrder import service
from app.modules.printOrder.schemas import (
    Object3DCreate,
    Object3DResponse,
    PrintOrderCreate,
    PrintOrderFinalize,
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


@router.post(
    "/{printOrderId}/finalize",
    response_model=PrintOrderResponse,
    dependencies=[Depends(requirePermission("print_orders:finalize"))],
)
def finalizePrintOrder(
    printOrderId: int, data: PrintOrderFinalize, db: Session = Depends(getDb)
):
    return service.finalizePrintOrder(db, printOrderId, data)


# ---------- Objetos 3D ----------

@router.post(
    "/{printOrderId}/objects",
    response_model=Object3DResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("print_orders:update"))],
)
def addObject(printOrderId: int, data: Object3DCreate, db: Session = Depends(getDb)):
    return service.addObject(db, printOrderId, data)


@router.delete(
    "/{printOrderId}/objects/{objectId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("print_orders:update"))],
)
def deleteObject(printOrderId: int, objectId: int, db: Session = Depends(getDb)):
    service.deleteObject(db, printOrderId, objectId)


@router.post(
    "/{printOrderId}/objects/{objectId}/stl",
    response_model=Object3DResponse,
    dependencies=[Depends(requirePermission("print_orders:update"))],
)
def uploadStl(
    printOrderId: int,
    objectId: int,
    file: UploadFile = File(...),
    db: Session = Depends(getDb),
):
    return service.uploadStl(db, printOrderId, objectId, file)


@router.get(
    "/{printOrderId}/objects/{objectId}/stl",
    dependencies=[Depends(requirePermission("print_orders:read"))],
)
def downloadStl(printOrderId: int, objectId: int, db: Session = Depends(getDb)):
    path, filename = service.getStlPath(db, printOrderId, objectId)
    return FileResponse(path, filename=filename, media_type="model/stl")
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.payment import service
from app.modules.payment.schemas import (
    OrderBalanceResponse,
    PaymentCreate,
    PaymentRegisteredResponse,
    PaymentResponse,
)

router = APIRouter(prefix="/payments", tags=["payments"])


#CU-28: historial de pagos (filtrable por pedido o cliente)
@router.get(
    "",
    response_model=list[PaymentResponse],
    dependencies=[Depends(requirePermission("payments:read"))],
)
def listPayments(
    orderId: int | None = None,
    clientId: int | None = None,
    db: Session = Depends(getDb),
):
    return service.getPayments(db, orderId, clientId)


#Saldo del pedido (paso 4 de CU-26). Va antes de /{paymentId} para que no choque con la ruta
@router.get(
    "/orders/{orderId}/balance",
    response_model=OrderBalanceResponse,
    dependencies=[Depends(requirePermission("payments:read"))],
)
def getOrderBalance(orderId: int, db: Session = Depends(getDb)):
    return service.getOrderBalance(db, orderId)


@router.get(
    "/{paymentId}",
    response_model=PaymentResponse,
    dependencies=[Depends(requirePermission("payments:read"))],
)
def getPayment(paymentId: int, db: Session = Depends(getDb)):
    return service.getPayment(db, paymentId)


#CU-26: registrar abono
@router.post(
    "",
    response_model=PaymentRegisteredResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("payments:create"))],
)
def registerPayment(data: PaymentCreate, db: Session = Depends(getDb)):
    return service.registerPayment(db, data)


# CU-27: cancelar pago
@router.post(
    "/{paymentId}/cancel",
    response_model=PaymentRegisteredResponse,
    dependencies=[Depends(requirePermission("payments:update"))],
)
def cancelPayment(paymentId: int, db: Session = Depends(getDb)):
    return service.cancelPayment(db, paymentId)
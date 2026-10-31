from datetime import date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.order.enums import OrderStatus
from app.modules.order.models import Order
from app.modules.payment import repository
from app.modules.payment.models import Payment
from app.modules.payment.schemas import (
    OrderBalanceResponse,
    PaymentCreate,
    PaymentRegisteredResponse,
    PaymentResponse,
)
from app.modules.repairs.models import RepairOrder

cancelledStatuses = (OrderStatus.cancelled.value, "cancelado")


def findOrder(db: Session, orderId: int) -> Order:
    order = db.get(Order, orderId)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")
    return order


def calculateOrderTotal(order: Order) -> Decimal:
    """Monto total del pedido: en reparaciones es diagnóstico + trabajo; en el resto, totalAmount."""
    if isinstance(order, RepairOrder):
        return (order.diagnosisAmount or Decimal("0")) + (order.workAmount or Decimal("0"))
    return order.totalAmount or Decimal("0")


def buildBalance(db: Session, order: Order) -> OrderBalanceResponse:
    total = calculateOrderTotal(order)
    paid = repository.sumActivePayments(db, order.id)
    balance = total - paid
    return OrderBalanceResponse(
        orderId=order.id,
        clientId=order.clientId,
        totalAmount=total,
        totalPaid=paid,
        balance=balance,
        fullyPaid=total > 0 and balance <= 0,
    )


def getOrderBalance(db: Session, orderId: int) -> OrderBalanceResponse:
    return buildBalance(db, findOrder(db, orderId))


def registerPayment(db: Session, data: PaymentCreate) -> PaymentRegisteredResponse:
    order = findOrder(db, data.orderId)
    if order.status in cancelledStatuses:
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido no admite abonos")

    balance = buildBalance(db, order)
    if balance.totalAmount <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido no tiene un monto total definido")
    if balance.balance <= 0:
        raise HTTPException(status.HTTP_409_CONFLICT, "El pedido no admite abonos")
    if data.amountPaid > balance.balance:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"El monto supera el saldo pendiente ({balance.balance})",
        )

    payment = Payment(
        orderId=order.id,
        amountPaid=data.amountPaid,
        paymentMethod=data.paymentMethod,
        paymentDate=data.paymentDate or date.today(),
        note=data.note,
    )
    payment = repository.create(db, payment)
    return PaymentRegisteredResponse(
        payment=PaymentResponse.model_validate(payment),
        balance=buildBalance(db, order),
    )


def cancelPayment(db: Session, paymentId: int) -> PaymentRegisteredResponse:
    payment = getPayment(db, paymentId)
    if payment.isCancelled:
        raise HTTPException(status.HTTP_409_CONFLICT, "El pago ya está cancelado")
    payment.isCancelled = True
    payment.cancelledAt = datetime.now()
    payment = repository.save(db, payment)
    return PaymentRegisteredResponse(
        payment=PaymentResponse.model_validate(payment),
        balance=buildBalance(db, findOrder(db, payment.orderId)),
    )


def getPayment(db: Session, paymentId: int) -> Payment:
    payment = repository.getById(db, paymentId)
    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pago no encontrado")
    return payment


def getPayments(
    db: Session, orderId: int | None = None, clientId: int | None = None
) -> list[Payment]:
    return repository.getAll(db, orderId, clientId)
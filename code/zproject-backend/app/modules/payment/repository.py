from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.order.models import Order
from app.modules.payment.models import Payment


def getById(db: Session, paymentId: int) -> Payment | None:
    return db.get(Payment, paymentId)


def getAll(
    db: Session, orderId: int | None = None, clientId: int | None = None
) -> list[Payment]:
    query = db.query(Payment)
    if orderId is not None:
        query = query.filter(Payment.orderId == orderId)
    if clientId is not None:
        query = query.join(Order, Payment.orderId == Order.id).filter(Order.clientId == clientId)
    return query.order_by(Payment.paymentDate.desc(), Payment.id.desc()).all()


def sumActivePayments(db: Session, orderId: int) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(Payment.amountPaid), 0))
        .filter(Payment.orderId == orderId, Payment.isCancelled.is_(False))
        .scalar()
    )
    return Decimal(str(total))


def create(db: Session, payment: Payment) -> Payment:
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def save(db: Session, payment: Payment) -> Payment:
    db.commit()
    db.refresh(payment)
    return payment
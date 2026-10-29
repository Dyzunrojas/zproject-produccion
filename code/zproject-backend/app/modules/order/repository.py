from sqlalchemy.orm import Session

from app.modules.order.models import Order


def save(db: Session, order: Order) -> Order:
    db.commit()
    db.refresh(order)
    return order
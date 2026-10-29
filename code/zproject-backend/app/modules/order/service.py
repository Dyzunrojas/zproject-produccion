from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.order import repository
from app.modules.order.enums import OrderStatus
from app.modules.order.models import Order


def ensureEditable(order: Order) -> None:
    """Un pedido finalizado o cancelado ya no se puede modificar."""
    if order.status in (OrderStatus.finished.value, OrderStatus.cancelled.value):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "No se puede modificar un pedido finalizado o cancelado"
        )


def changeStatus(db: Session, order: Order, newStatus: OrderStatus) -> Order:
    """Cambia el estado de cualquier tipo de pedido (impresión o reparación)."""
    ensureEditable(order)
    if newStatus == OrderStatus.finished:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Para finalizar usa la acción de finalizar"
        )
    order.status = newStatus.value
    return repository.save(db, order)
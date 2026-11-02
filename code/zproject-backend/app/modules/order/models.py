from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.client.models import Client
    from app.modules.payment.models import Payment


class Order(Base):
    # "order" no se puede porque es comando, asi que se pone asi
    __tablename__ = "client_order"

    id: Mapped[int] = mapped_column(primary_key=True)
    orderType: Mapped[str] = mapped_column(String(20))  # "print" o "repair"
    clientId: Mapped[int] = mapped_column(ForeignKey("client.id"))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    estimatedDeliveryDate: Mapped[date] = mapped_column(Date)
    deliveryDate: Mapped[date | None] = mapped_column(Date, default=None)
    totalAmount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=None)

    client: Mapped["Client"] = relationship(back_populates="orders")
    # Solo para leer los abonos del pedido (los pagos se crean desde el módulo de pagos)
    payments: Mapped[list["Payment"]] = relationship(viewonly=True)

    @property
    def clientName(self) -> str:
        return self.client.name

    __mapper_args__ = {
        "polymorphic_on": "orderType",
        "polymorphic_identity": "order",
    }
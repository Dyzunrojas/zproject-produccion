from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.order.models import Order


class Payment(Base):
    __tablename__ = "payment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    orderId: Mapped[int] = mapped_column(ForeignKey("client_order.id"))
    amountPaid: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    paymentMethod: Mapped[str] = mapped_column(String(20))
    paymentDate: Mapped[date] = mapped_column(Date)
    note: Mapped[str] = mapped_column(String(255), default="")
    #CU-27: pago cancelado no se borra, queda en el historial y deja de contar en el saldo
    isCancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    cancelledAt: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    createdAt: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    order: Mapped["Order"] = relationship()
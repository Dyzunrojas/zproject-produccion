from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.modules.order.models import Order

if TYPE_CHECKING:
    from app.modules.client.models import Client
    from app.modules.sparePart.models import SparePartUsage

RECEIVED = "recibido"
DIAGNOSED = "diagnosticado"
IN_REPAIR = "enReparacion"
FINISHED = "finalizado"
CANCELLED = "cancelado"


class Device(Base):
    __tablename__ = "device"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    clientId: Mapped[int] = mapped_column(ForeignKey("client.id"))
    type: Mapped[str] = mapped_column(String(30))  # celular, laptop, consola...
    brand: Mapped[str] = mapped_column(String(30))
    model: Mapped[str] = mapped_column(String(30))
    serialNumber: Mapped[str | None] = mapped_column(String(50), default=None)

    client: Mapped["Client"] = relationship()


class RepairOrder(Order):
    __tablename__ = "repair_order"

    id: Mapped[int] = mapped_column(ForeignKey("client_order.id"), primary_key=True)
    deviceId: Mapped[int] = mapped_column(ForeignKey("device.id"))
    problemDescription: Mapped[str] = mapped_column(String(255))
    diagnosis: Mapped[str | None] = mapped_column(String(255), default=None)
    workDescription: Mapped[str | None] = mapped_column(String(255), default=None)
    diagnosisAmount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=None)
    workAmount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), default=None)
    finishedAt: Mapped[datetime | None] = mapped_column(DateTime, default=None)  # CU-20

    device: Mapped[Device] = relationship()
    spareParts: Mapped[list["SparePartUsage"]] = relationship()

    __mapper_args__ = {"polymorphic_identity": "repair"}
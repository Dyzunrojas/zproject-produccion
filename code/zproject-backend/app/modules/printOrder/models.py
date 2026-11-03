from decimal import Decimal
from typing import TYPE_CHECKING


from sqlalchemy import ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Text  # agrégalo al import de sqlalchemy que ya tienes


from app.core.database import Base
from app.modules.order.models import Order

if TYPE_CHECKING:
    from app.modules.material.models import Material


class PrintOrder(Order):
    __tablename__ = "print_order"

    # PK y FK a la vez: así se hace la herencia (una fila aquí = una fila en client_order)
    id: Mapped[int] = mapped_column(ForeignKey("client_order.id"), primary_key=True)

    objects: Mapped[list["Object3D"]] = relationship(
        back_populates="printOrder", cascade="all, delete-orphan"
    )
    materialUsages: Mapped[list["MaterialUsage"]] = relationship(back_populates="printOrder")

    @property
    def totalPaid(self) -> Decimal:
        """Suma de los abonos que no están cancelados."""
        return sum((p.amountPaid for p in self.payments if not p.isCancelled), Decimal("0"))

    @property
    def balance(self) -> Decimal:
        """Saldo pendiente = monto total - abonado."""
        return (self.totalAmount or Decimal("0")) - self.totalPaid

    __mapper_args__ = {"polymorphic_identity": "print"}


class Object3D(Base):
    __tablename__ = "object_3d"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    printOrderId: Mapped[int] = mapped_column(ForeignKey("print_order.id"))
    name: Mapped[str] = mapped_column(String(100))
    stlFilePath: Mapped[str | None] = mapped_column(String(255), default=None)  # se llena al subir el STL
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    printOrder: Mapped["PrintOrder"] = relationship(back_populates="objects")


class MaterialUsage(Base):
    __tablename__ = "material_usage"
    __table_args__ = (UniqueConstraint("printOrderId", "materialId"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    printOrderId: Mapped[int] = mapped_column(ForeignKey("print_order.id"))
    materialId: Mapped[int] = mapped_column(ForeignKey("material.id"))
    gramsUsed: Mapped[Decimal] = mapped_column(Numeric(10, 2))

    printOrder: Mapped["PrintOrder"] = relationship(back_populates="materialUsages")
    material: Mapped["Material"] = relationship()

    @property
    def materialName(self) -> str:
        return f"{self.material.type} {self.material.color}"
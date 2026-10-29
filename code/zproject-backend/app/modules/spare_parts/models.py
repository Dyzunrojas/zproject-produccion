from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SparePart(Base):
    __tablename__ = "spare_part"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100))
    brand: Mapped[str] = mapped_column(String(30))
    isOriginal: Mapped[bool] = mapped_column(default=False)
    partNumber: Mapped[str] = mapped_column(String(50))
    stockUnits: Mapped[int] = mapped_column(default=0)
    isActive: Mapped[bool] = mapped_column(default=True)


class SparePartUsage(Base):
    __tablename__ = "spare_part_usage"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    repairOrderId: Mapped[int] = mapped_column(ForeignKey("repair_order.id"))
    sparePartId: Mapped[int] = mapped_column(ForeignKey("spare_part.id"))
    quantityUsed: Mapped[int]

    sparePart: Mapped[SparePart] = relationship()
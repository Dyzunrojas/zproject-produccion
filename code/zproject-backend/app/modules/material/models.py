from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Material(Base):
    __tablename__ = "material"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    type: Mapped[str] = mapped_column(String(30))  # PLA, PETG, ABS...
    color: Mapped[str] = mapped_column(String(30))
    diameter: Mapped[Decimal] = mapped_column(Numeric(4, 2))  # 1.75, 2.85
    stockGrams: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    isActive: Mapped[bool] = mapped_column(default=True)
from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Warranty(Base):
    __tablename__ = "warranty"

    id: Mapped[int] = mapped_column(primary_key=True)
    repairOrderId: Mapped[int] = mapped_column(index=True)
    startDate: Mapped[date] = mapped_column(Date)
    expirationDate: Mapped[date] = mapped_column(Date)
    conditions: Mapped[str] = mapped_column(String(255))
    isActive: Mapped[bool] = mapped_column(default=True)

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

PaymentMethod = Literal["efectivo", "tarjeta", "transferencia", "sinpe"]


class PaymentCreate(BaseModel):
    orderId: int
    amountPaid: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    paymentMethod: PaymentMethod
    paymentDate: date | None = None  # si no se envía, se usa la fecha de hoy
    note: str = Field(default="", max_length=255)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    orderId: int
    amountPaid: Decimal
    paymentMethod: str
    paymentDate: date
    note: str
    isCancelled: bool
    cancelledAt: datetime | None


class OrderBalanceResponse(BaseModel):
    orderId: int
    clientId: int
    totalAmount: Decimal
    totalPaid: Decimal
    balance: Decimal
    fullyPaid: bool


class PaymentRegisteredResponse(BaseModel):
    payment: PaymentResponse
    balance: OrderBalanceResponse
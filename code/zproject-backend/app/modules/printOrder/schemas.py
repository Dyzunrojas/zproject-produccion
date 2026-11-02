from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.order.enums import OrderStatus


class Object3DCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None   


class Object3DResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None = None   # <- nuevo
    stlFilePath: str | None


class MaterialUsageCreate(BaseModel):
    materialId: int
    gramsUsed: float = Field(gt=0)


class MaterialUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    materialId: int
    gramsUsed: float


class PrintOrderCreate(BaseModel):
    clientId: int
    estimatedDeliveryDate: date
    totalAmount: float | None = Field(default=None, ge=0)
    objects: list[Object3DCreate] = Field(min_length=1)


class PrintOrderUpdate(BaseModel):
    estimatedDeliveryDate: date | None = None
    totalAmount: float | None = Field(default=None, ge=0)


class PrintOrderFinalize(BaseModel):
    deliveryDate: date | None = None  # si no se manda, se usa la fecha de hoy
    materialsUsed: list[MaterialUsageCreate] = []


class PrintOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clientId: int
    clientName: str
    status: OrderStatus
    createdAt: datetime
    estimatedDeliveryDate: date
    deliveryDate: date | None
    totalAmount: float | None = None
    totalPaid: float = 0
    balance: float = 0
    objects: list[Object3DResponse]
    materialUsages: list[MaterialUsageResponse]


class PrintOrderFinalizeResponse(BaseModel):
    printOrder: PrintOrderResponse
    warning: str | None = None
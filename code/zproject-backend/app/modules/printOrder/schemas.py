from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.order.enums import OrderStatus


class Object3DCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class Object3DResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    stlFilePath: str | None


class PrintOrderCreate(BaseModel):
    clientId: int
    estimatedDeliveryDate: date
    objects: list[Object3DCreate] = Field(min_length=1)


class PrintOrderUpdate(BaseModel):
    estimatedDeliveryDate: date | None = None


class PrintOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clientId: int
    status: OrderStatus
    createdAt: datetime
    estimatedDeliveryDate: date
    deliveryDate: date | None
    objects: list[Object3DResponse]
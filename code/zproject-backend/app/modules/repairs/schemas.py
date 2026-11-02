from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.order.enums import OrderStatus
from app.modules.sparePart.schemas import SparePartUsageLine, SparePartUsageResponse


def ensureNotPast(value: date | None) -> date | None:
    """La fecha no puede ser anterior a hoy"""
    if value is not None and value < date.today():
        raise ValueError("La fecha no puede ser anterior a hoy")
    return value


def ensureNotNull(value):
    """Para campos obligatorios en la BD: si vienen en el JSON, no pueden ser null."""
    if value is None:
        raise ValueError("Este campo no puede ser null")
    return value


class DeviceData(BaseModel):
    type: str = Field(min_length=1, max_length=30)
    brand: str = Field(min_length=1, max_length=30)
    model: str = Field(min_length=1, max_length=30)
    serialNumber: str | None = Field(default=None, max_length=50)


class DeviceUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=30)
    brand: str | None = Field(default=None, min_length=1, max_length=30)
    model: str | None = Field(default=None, min_length=1, max_length=30)
    serialNumber: str | None = Field(default=None, max_length=50)  # este sí puede ser null

    # Solo corren si el campo viene en el JSON
    _notNull = field_validator("type", "brand", "model")(ensureNotNull)


class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clientId: int
    type: str
    brand: str
    model: str
    serialNumber: str | None


class RepairCreate(BaseModel):
    clientId: int
    device: DeviceData
    problemDescription: str = Field(min_length=1, max_length=255)
    estimatedDeliveryDate: date

    allowDuplicate: bool = False

    _datePast = field_validator("estimatedDeliveryDate")(ensureNotPast)


class RepairUpdate(BaseModel):
    problemDescription: str | None = Field(default=None, min_length=1, max_length=255)
    workDescription: str | None = Field(default=None, max_length=255)
    workAmount: float | None = Field(default=None, ge=0)
    estimatedDeliveryDate: date | None = None
    device: DeviceUpdate | None = None

    _notNull = field_validator("problemDescription", "estimatedDeliveryDate")(ensureNotNull)
    _datePast = field_validator("estimatedDeliveryDate")(ensureNotPast)


class RepairDiagnosis(BaseModel):
    diagnosis: str = Field(min_length=1, max_length=255)
    diagnosisAmount: float = Field(ge=0)


class RepairFinalize(BaseModel):
    deliveryDate: date | None = None  # si no se manda, se usa la fecha de hoy
    spareParts: list[SparePartUsageLine] = []

    _datePast = field_validator("deliveryDate")(ensureNotPast)


class RepairResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clientId: int
    clientName: str
    status: OrderStatus
    createdAt: datetime
    estimatedDeliveryDate: date
    deliveryDate: date | None
    finishedAt: datetime | None
    problemDescription: str
    diagnosis: str | None
    workDescription: str | None
    diagnosisAmount: float | None
    workAmount: float | None
    device: DeviceResponse
    spareParts: list[SparePartUsageResponse]


class RepairFinalizeResponse(BaseModel):
    repair: RepairResponse
    warning: str | None = None
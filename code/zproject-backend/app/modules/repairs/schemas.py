from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.spare_parts.schemas import SparePartUsageLine, SparePartUsageResponse


class DeviceData(BaseModel):
    type: str = Field(min_length=1, max_length=30)
    brand: str = Field(min_length=1, max_length=30)
    model: str = Field(min_length=1, max_length=30)
    serialNumber: str | None = Field(default=None, max_length=50)


class DeviceUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=30)
    brand: str | None = Field(default=None, min_length=1, max_length=30)
    model: str | None = Field(default=None, min_length=1, max_length=30)
    serialNumber: str | None = Field(default=None, max_length=50)


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


class RepairUpdate(BaseModel):
    problemDescription: str | None = Field(default=None, min_length=1, max_length=255)
    workDescription: str | None = Field(default=None, max_length=255)
    workAmount: float | None = Field(default=None, ge=0)
    estimatedDeliveryDate: date | None = None
    device: DeviceUpdate | None = None


class RepairDiagnosis(BaseModel):
    diagnosis: str = Field(min_length=1, max_length=255)
    diagnosisAmount: float = Field(ge=0)


class RepairStatusChange(BaseModel):
    status: str = Field(pattern="^(received|diagnosed|inRepair|cancelled)$")


class RepairFinalize(BaseModel):
    spareParts: list[SparePartUsageLine] = []


class RepairResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    clientId: int
    status: str
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
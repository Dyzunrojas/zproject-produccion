from pydantic import BaseModel, ConfigDict, Field


class SparePartCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    brand: str = Field(min_length=1, max_length=30)
    isOriginal: bool = False
    partNumber: str = Field(min_length=1, max_length=50)
    stockUnits: int = Field(default=0, ge=0)


class SparePartUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    brand: str | None = Field(default=None, min_length=1, max_length=30)
    isOriginal: bool | None = None
    partNumber: str | None = Field(default=None, min_length=1, max_length=50)
    stockUnits: int | None = Field(default=None, ge=0)


class SparePartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand: str
    isOriginal: bool
    partNumber: str
    stockUnits: int
    isActive: bool


class SparePartUsageLine(BaseModel):
    sparePartId: int
    quantityUsed: int = Field(gt=0)  


class SparePartUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sparePartId: int
    quantityUsed: int
    sparePart: SparePartResponse
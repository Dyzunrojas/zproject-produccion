from pydantic import BaseModel, ConfigDict, Field


class MaterialCreate(BaseModel):
    type: str = Field(min_length=1, max_length=30)
    color: str = Field(min_length=1, max_length=30)
    diameter: float = Field(gt=0)
    stockGrams: float = Field(default=0, ge=0)


class MaterialUpdate(BaseModel):
    type: str | None = Field(default=None, min_length=1, max_length=30)
    color: str | None = Field(default=None, min_length=1, max_length=30)
    diameter: float | None = Field(default=None, gt=0)
    stockGrams: float | None = Field(default=None, ge=0)


class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    color: str
    diameter: float
    stockGrams: float
    isActive: bool

class MaterialPurchase(BaseModel):
    grams: float = Field(gt=0)    
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WarrantyCreate(BaseModel):
    repairOrderId: int = Field(gt=0)
    startDate: date
    expirationDate: date
    conditions: str = Field(min_length=1, max_length=255)

    @model_validator(mode="after")
    def checkDates(self):
        if self.startDate > self.expirationDate:
            raise ValueError("startDate no puede ser posterior a expirationDate")
        return self


class WarrantyUpdate(BaseModel):
    repairOrderId: int | None = Field(default=None, gt=0)
    startDate: date | None = None
    expirationDate: date | None = None
    conditions: str | None = Field(default=None, min_length=1, max_length=255)

    @model_validator(mode="after")
    def checkDates(self):
        if (
            self.startDate is not None
            and self.expirationDate is not None
            and self.startDate > self.expirationDate
        ):
            raise ValueError("startDate no puede ser posterior a expirationDate")
        return self


class WarrantyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    repairOrderId: int
    startDate: date
    expirationDate: date
    conditions: str
    isActive: bool

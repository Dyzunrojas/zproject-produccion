from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ToolStatus = Literal["disponible", "en_uso", "mantenimiento", "baja"]


class ToolCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=255)
    quantity: int = Field(default=0, ge=0)
    status: ToolStatus = "disponible"


class ToolUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    quantity: int | None = Field(default=None, ge=0)
    status: ToolStatus | None = None


class ToolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    quantity: int
    status: str
    isActive: bool

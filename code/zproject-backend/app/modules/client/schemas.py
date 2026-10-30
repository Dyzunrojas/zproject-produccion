import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validateEmail(value: str | None) -> str | None:
    if value is None:
        return value
    value = value.strip()
    if value and not EMAIL_PATTERN.match(value):
        raise ValueError("El correo no tiene un formato válido")
    return value


class ClientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(default="", max_length=20)
    email: str = Field(default="", max_length=100)

    @field_validator("name")
    @classmethod
    def nameNotBlank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío")
        return value

    @field_validator("email")
    @classmethod
    def emailFormat(cls, value: str) -> str:
        return _validateEmail(value)


class ClientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=100)

    @field_validator("name")
    @classmethod
    def nameNotBlank(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("El nombre no puede estar vacío")
        return value

    @field_validator("email")
    @classmethod
    def emailFormat(cls, value: str | None) -> str | None:
        return _validateEmail(value)


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: str
    isActive: bool
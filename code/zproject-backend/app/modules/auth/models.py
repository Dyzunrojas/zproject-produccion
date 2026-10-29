from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

rolePermission = Table(
    "role_permission",
    Base.metadata,
    Column("roleId", ForeignKey("role.id"), primary_key=True),
    Column("permissionId", ForeignKey("permission.id"), primary_key=True),
)


class Permission(Base):
    __tablename__ = "permission"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str] = mapped_column(String(150), default="")


class Role(Base):
    __tablename__ = "role"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    permissions: Mapped[list[Permission]] = relationship(secondary=rolePermission)
    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)
    passwordHash: Mapped[str] = mapped_column(String(255))
    isActive: Mapped[bool] = mapped_column(default=True)
    roleId: Mapped[int] = mapped_column(ForeignKey("role.id"))
    role: Mapped[Role] = relationship(back_populates="users")
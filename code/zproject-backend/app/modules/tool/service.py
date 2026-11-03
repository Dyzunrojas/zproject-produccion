from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.tool import repository
from app.modules.tool.models import Tool
from app.modules.tool.schemas import ToolCreate, ToolUpdate


def getTools(db: Session, statusFilter: str | None = None) -> list[Tool]:
    return repository.getAll(db, statusFilter)


def getTool(db: Session, toolId: int) -> Tool:
    tool = repository.getById(db, toolId)
    if tool is None or not tool.isActive:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Herramienta no encontrada")
    return tool


def createTool(db: Session, data: ToolCreate, force: bool = False) -> Tool:
    checkQuantityStatus(data.quantity, data.status)

    existing = repository.findByName(db, data.name)
    if existing is not None and not force:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Ya existe una herramienta con ese nombre; confirme para registrarla igualmente",
        )

    tool = Tool(**data.model_dump())
    return repository.create(db, tool)


def updateTool(db: Session, toolId: int, data: ToolUpdate) -> Tool:
    tool = getTool(db, toolId)

    changes = data.model_dump(exclude_unset=True)
    newQuantity = changes.get("quantity", tool.quantity)
    newStatus = changes.get("status", tool.status)
    checkQuantityStatus(newQuantity, newStatus)

    newName = changes.get("name")
    if newName is not None and newName.lower() != tool.name.lower():
        existing = repository.findByName(db, newName)
        if existing is not None and existing.id != tool.id:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                "Ya existe una herramienta con ese nombre",
            )

    for field, value in changes.items():
        setattr(tool, field, value)
    return repository.save(db, tool)


def deleteTool(db: Session, toolId: int) -> None:
    tool = getTool(db, toolId)
    tool.isActive = False
    repository.save(db, tool)


def checkQuantityStatus(quantity: int, toolStatus: str) -> None:
    if quantity == 0 and toolStatus in ("disponible", "en_uso"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Una herramienta sin unidades no puede estar disponible ni en uso",
        )

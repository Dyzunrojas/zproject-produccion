from sqlalchemy import func
from sqlalchemy.orm import Session

from app.modules.tool.models import Tool


def getAll(db: Session, statusFilter: str | None = None) -> list[Tool]:
    query = db.query(Tool).filter(Tool.isActive.is_(True))
    if statusFilter is not None:
        query = query.filter(Tool.status == statusFilter)
    return query.order_by(Tool.name).all()


def getById(db: Session, toolId: int) -> Tool | None:
    return db.get(Tool, toolId)


def findByName(db: Session, name: str) -> Tool | None:
    return (
        db.query(Tool)
        .filter(Tool.isActive.is_(True))
        .filter(func.lower(Tool.name) == name.lower())
        .first()
    )


def create(db: Session, tool: Tool) -> Tool:
    db.add(tool)
    db.commit()
    db.refresh(tool)
    return tool


def save(db: Session, tool: Tool) -> Tool:
    db.commit()
    db.refresh(tool)
    return tool

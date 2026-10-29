from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import getDb, requirePermission
from app.modules.tool import service
from app.modules.tool.schemas import ToolCreate, ToolResponse, ToolUpdate

router = APIRouter(prefix="/tools", tags=["tools"])


@router.get(
    "",
    response_model=list[ToolResponse],
    dependencies=[Depends(requirePermission("tools:read"))],
)
def listTools(statusFilter: str | None = None, db: Session = Depends(getDb)):
    return service.getTools(db, statusFilter)


@router.get(
    "/{toolId}",
    response_model=ToolResponse,
    dependencies=[Depends(requirePermission("tools:read"))],
)
def getTool(toolId: int, db: Session = Depends(getDb)):
    return service.getTool(db, toolId)


@router.post(
    "",
    response_model=ToolResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(requirePermission("tools:create"))],
)
def createTool(
    data: ToolCreate,
    force: bool = Query(default=False),
    db: Session = Depends(getDb),
):
    return service.createTool(db, data, force)


@router.put(
    "/{toolId}",
    response_model=ToolResponse,
    dependencies=[Depends(requirePermission("tools:update"))],
)
def updateTool(toolId: int, data: ToolUpdate, db: Session = Depends(getDb)):
    return service.updateTool(db, toolId, data)


@router.delete(
    "/{toolId}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(requirePermission("tools:delete"))],
)
def deleteTool(toolId: int, db: Session = Depends(getDb)):
    service.deleteTool(db, toolId)

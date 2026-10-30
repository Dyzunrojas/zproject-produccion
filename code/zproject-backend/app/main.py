from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models  # noqa: F401
from app.core.config import settings
from app.core.database import Base, engine
from app.modules.auth.router import router as authRouter
from app.modules.material.router import router as materialRouter
from app.modules.printOrder.router import router as printOrderRouter
from app.modules.repairs.router import router as repairsRouter
from app.modules.sparePart.router import router as sparePartRouter
from app.modules.tool.router import router as toolRouter
from app.modules.warranty.router import router as warrantyRouter

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZProject")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.corsOrigins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(authRouter)
app.include_router(materialRouter)
app.include_router(printOrderRouter)
app.include_router(warrantyRouter)
app.include_router(toolRouter)
app.include_router(repairsRouter)
app.include_router(sparePartRouter)


@app.get("/")
def root():
    return {"message": "ZProject API funcionando"}


@app.get("/health/db")
def healthDb():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"database": "ok"}
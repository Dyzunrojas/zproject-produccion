from fastapi import FastAPI
from sqlalchemy import text
from app.modules.auth.router import router as authRouter
from app.modules.material.router import router as materialRouter
from app.modules.printOrder.router import router as printOrderRouter
from app.modules.warranty.router import router as warrantyRouter
from app.modules.tool.router import router as toolRouter

import app.models  # noqa: F401
from app.core.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="ZProject")


@app.get("/")
def root():
    return {"message": "ZProject API funcionando"}


@app.get("/health/db")
def healthDb():
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"database": "ok"}

#router de autorizacion
app.include_router(authRouter)

#router de material
app.include_router(materialRouter)

#router de orden print
app.include_router(printOrderRouter)

#router de garantia
app.include_router(warrantyRouter)

#router de herramienta
app.include_router(toolRouter)

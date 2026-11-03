from datetime import date, timedelta

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.dependencies import getDb
from app.modules.repairs import service as repairsService
from app.modules.repairs.schemas import DeviceData, RepairCreate
from app.modules.warranty import service
from app.modules.warranty.router import router as warrantyRouter
from app.modules.warranty.schemas import WarrantyCreate, WarrantyUpdate


@pytest.fixture()
def apiClient(db):
    """App mínima con solo el router de garantías y la BD de pruebas."""
    app = FastAPI()
    app.include_router(warrantyRouter)
    app.dependency_overrides[getDb] = lambda: db
    return TestClient(app)


@pytest.fixture()
def makeRepair(db, makeClient):
    """Crea una reparación real: la garantía la exige por clave foránea."""

    def _make():
        client = makeClient()
        data = RepairCreate(
            clientId=client.id,
            device=DeviceData(type="Laptop", brand="Lenovo", model="ThinkPad"),
            problemDescription="No enciende",
            estimatedDeliveryDate=date.today() + timedelta(days=10),
        )
        return repairsService.createRepair(db, data)

    return _make


def makeWarranty(db, repairOrderId, force=False):
    return service.createWarranty(
        db,
        WarrantyCreate(
            repairOrderId=repairOrderId,
            startDate=date(2026, 1, 1),
            expirationDate=date(2027, 1, 1),
            conditions="Cubre mano de obra",
        ),
        force,
    )


def test_war01_crearGarantia(db, makeRepair):
    """Crear una garantía sobre una reparación existente.
    Esperado: se guarda activa y asociada a esa reparación."""
    repair = makeRepair()

    warranty = makeWarranty(db, repair.id)

    assert warranty.id is not None
    assert warranty.isActive is True
    assert warranty.repairOrderId == repair.id
    assert warranty.conditions == "Cubre mano de obra"


def test_war02_reparacionInexistenteDevuelve404(db):
    """Crear una garantía para una reparación que no existe.
    Esperado: error 404 de reparación no encontrada."""
    with pytest.raises(HTTPException) as error:
        makeWarranty(db, repairOrderId=999)

    assert error.value.status_code == 404


def test_war03_garantiaVigenteDevuelve409(db, makeRepair):
    """Registrar una segunda garantía vigente para la misma reparación.
    Esperado: error 409 de conflicto."""
    repair = makeRepair()
    makeWarranty(db, repair.id)

    with pytest.raises(HTTPException) as error:
        makeWarranty(db, repair.id)

    assert error.value.status_code == 409


def test_war04_forzarGarantiaVigenteCrea(db, makeRepair):
    """Registrar otra garantía vigente confirmando con force.
    Esperado: se crea una segunda garantía activa."""
    repair = makeRepair()
    makeWarranty(db, repair.id)

    warranty = makeWarranty(db, repair.id, force=True)

    assert warranty.id is not None
    assert warranty.isActive is True


def test_war05_fechasInvertidasNoSeAceptan():
    """Construir una garantía con la expiración antes del inicio.
    Esperado: el esquema la rechaza antes de llegar al servicio."""
    with pytest.raises(ValidationError):
        WarrantyCreate(
            repairOrderId=1,
            startDate=date(2026, 12, 31),
            expirationDate=date(2026, 1, 1),
            conditions="Fechas invertidas",
        )


def test_war06_actualizarSoloCondiciones(db, makeRepair):
    """Actualizar únicamente las condiciones de una garantía.
    Esperado: cambian las condiciones y se conservan las fechas."""
    repair = makeRepair()
    warranty = makeWarranty(db, repair.id)

    updated = service.updateWarranty(
        db, warranty.id, WarrantyUpdate(conditions="Cubre repuestos")
    )

    assert updated.conditions == "Cubre repuestos"
    assert updated.startDate == date(2026, 1, 1)
    assert updated.expirationDate == date(2027, 1, 1)


def test_war07_eliminarEsBorradoLogico(db, makeRepair):
    """Eliminar una garantía.
    Esperado: queda inactiva y ya no se encuentra (404)."""
    repair = makeRepair()
    warranty = makeWarranty(db, repair.id)

    service.deleteWarranty(db, warranty.id)

    db.refresh(warranty)
    assert warranty.isActive is False
    with pytest.raises(HTTPException) as error:
        service.getWarranty(db, warranty.id)
    assert error.value.status_code == 404


def test_war08_endpointSinPermisoDevuelve403(apiClient, makeUser, authHeader):
    """Listar garantías sin el permiso warranties:read y con él.
    Esperado: 403 sin permiso; 200 con permiso."""
    sinPermiso = makeUser(username="sinpermiso", codes=["tools:read"])
    conPermiso = makeUser(username="conpermiso", codes=["warranties:read"])

    denegado = apiClient.get("/warranties", headers=authHeader(sinPermiso))
    permitido = apiClient.get("/warranties", headers=authHeader(conPermiso))

    assert denegado.status_code == 403
    assert permitido.status_code == 200

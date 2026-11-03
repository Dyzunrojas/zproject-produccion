
from datetime import date, timedelta

import pytest
from fastapi import HTTPException

from app.modules.order.enums import OrderStatus
from app.modules.order import notifications
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.repairs import service
from app.modules.repairs.schemas import (
    DeviceData,
    RepairCreate,
    RepairDiagnosis,
    RepairFinalize,
    RepairUpdate,
)
from app.modules.sparePart.schemas import SparePartCreate, SparePartUsageLine
from app.modules.sparePart import service as sparePartService


@pytest.fixture()
def sentEmails(monkeypatch):
    """Reemplaza sendEmail por uno falso que guarda los correos (no envía nada)."""
    sent = []

    def fake(to, subject, body):
        sent.append({"to": to, "subject": subject, "body": body})
        return None

    monkeypatch.setattr(notifications, "sendEmail", fake)
    return sent


@pytest.fixture()
def makeRepair(db, makeClient):
    """Crea una reparación de prueba para reutilizarla en los tests."""

    def _make(email="cliente@correo.com", serialNumber="SERIAL-001"):
        client = makeClient(email=email)

        data = RepairCreate(
            clientId=client.id,
            device=DeviceData(
                type="Laptop",
                brand="Lenovo",
                model="ThinkPad",
                serialNumber=serialNumber,
            ),
            problemDescription="No enciende",
            estimatedDeliveryDate=date.today() + timedelta(days=10),
        )

        return service.createRepair(db, data)

    return _make


def test_rep01_crearReparacion(makeRepair):
    """Crear una reparación con datos válidos.
    Esperado: queda pendiente y guarda el equipo y el problema reportado."""
    repair = makeRepair()

    assert repair.id is not None
    assert repair.status == OrderStatus.pending.value
    assert repair.device.brand == "Lenovo"
    assert repair.problemDescription == "No enciende"


def test_rep02_crearReparacionClienteInexistente(db):
    """Crear una reparación para un cliente que no existe.
    Esperado: error 404 'Cliente no encontrado'."""
    data = RepairCreate(
        clientId=999,
        device=DeviceData(type="Laptop", brand="Dell", model="Inspiron"),
        problemDescription="No enciende",
        estimatedDeliveryDate=date.today() + timedelta(days=10),
    )

    with pytest.raises(HTTPException) as error:
        service.createRepair(db, data)

    assert error.value.status_code == 404


def test_rep03_noPermiteSerialEnOtraReparacionAbierta(makeRepair):
    """Registrar un equipo que ya tiene una reparación abierta.
    Esperado: error 409 para evitar duplicar la reparación."""
    makeRepair(serialNumber="ABC-123")

    with pytest.raises(HTTPException) as error:
        makeRepair(serialNumber="ABC-123")

    assert error.value.status_code == 409


def test_rep04_registrarDiagnostico(db, makeRepair):
    """Registrar el diagnóstico de una reparación.
    Esperado: guarda el diagnóstico y su monto."""
    repair = makeRepair()

    updated = service.registerDiagnosis(
        db,
        repair.id,
        RepairDiagnosis(
            diagnosis="Pantalla dañada",
            diagnosisAmount=15000,
        ),
    )

    assert updated.diagnosis == "Pantalla dañada"
    assert float(updated.diagnosisAmount) == 15000


def test_rep05_noIniciarSinDiagnostico(db, makeRepair):
    """Intentar iniciar una reparación sin diagnóstico.
    Esperado: error 400 y la reparación sigue pendiente."""
    repair = makeRepair()

    with pytest.raises(HTTPException) as error:
        service.changeStatus(
            db,
            repair.id,
            OrderStatusUpdate(status=OrderStatus.inProgress.value),
        )

    db.refresh(repair)

    assert error.value.status_code == 400
    assert repair.status == OrderStatus.pending.value


def test_rep06_iniciarConDiagnostico(db, makeRepair):
    """Iniciar una reparación que ya tiene diagnóstico.
    Esperado: cambia su estado a en proceso."""
    repair = makeRepair()

    service.registerDiagnosis(
        db,
        repair.id,
        RepairDiagnosis(
            diagnosis="Batería dañada",
            diagnosisAmount=5000,
        ),
    )

    updated = service.changeStatus(
        db,
        repair.id,
        OrderStatusUpdate(status=OrderStatus.inProgress.value),
    )

    assert updated.status == OrderStatus.inProgress.value


def test_rep07_noFinalizarSinDiagnostico(db, makeRepair):
    """Intentar finalizar una reparación sin diagnóstico.
    Esperado: error 400 y la reparación no se finaliza."""
    repair = makeRepair()

    with pytest.raises(HTTPException) as error:
        service.finalizeRepair(
            db,
            repair.id,
            RepairFinalize(),
        )

    db.refresh(repair)

    assert error.value.status_code == 400
    assert repair.status == OrderStatus.pending.value


def test_rep08_finalizarDescuentaRepuestosYEnviaCorreo(
    db, makeRepair, sentEmails
):
    """Finalizar una reparación usando repuestos.
    Esperado: queda finalizada, descuenta el inventario y envía un correo."""
    repair = makeRepair()

    service.registerDiagnosis(
        db,
        repair.id,
        RepairDiagnosis(
            diagnosis="Puerto de carga dañado",
            diagnosisAmount=8000,
        ),
    )

    # Registrar el trabajo realizado.
    service.updateRepair(
        db,
        repair.id,
        RepairUpdate(
            workDescription="Se reemplazó el puerto de carga",
            workAmount=8000,
        ),
    )

    # Iniciar la reparación.
    service.changeStatus(
        db,
        repair.id,
        OrderStatusUpdate(status=OrderStatus.inProgress.value),
    )

    part = sparePartService.createSparePart(
        db,
        SparePartCreate(
            name="Puerto de carga",
            brand="Genérico",
            partNumber="USB-C-01",
            stockUnits=10,
        ),
    )

    result, warning = service.finalizeRepair(
        db,
        repair.id,
        RepairFinalize(
            spareParts=[
                SparePartUsageLine(
                    sparePartId=part.id,
                    quantityUsed=2,
                )
            ],
        ),
    )

    db.refresh(part)

    assert result.status == OrderStatus.finished.value
    assert result.deliveryDate is not None
    assert part.stockUnits == 8
    assert len(result.spareParts) == 1
    assert warning is None
    assert len(sentEmails) == 1
    assert sentEmails[0]["to"] == "cliente@correo.com"


def test_rep09_finalizarConStockInsuficiente(db, makeRepair):
    """Finalizar usando más repuestos de los disponibles.
    Esperado: error 400, no se descuenta stock y la reparación sigue abierta."""
    repair = makeRepair()

    service.registerDiagnosis(
        db,
        repair.id,
        RepairDiagnosis(
            diagnosis="Batería dañada",
            diagnosisAmount=5000,
        ),
    )

    service.updateRepair(
        db,
        repair.id,
        RepairUpdate(
            workDescription="Se intentó reemplazar la batería",
            workAmount=5000,
        ),
    )

    service.changeStatus(
        db,
        repair.id,
        OrderStatusUpdate(status=OrderStatus.inProgress.value),
    )

    part = sparePartService.createSparePart(
        db,
        SparePartCreate(
            name="Batería",
            brand="Genérica",
            partNumber="BAT-01",
            stockUnits=2,
        ),
    )

    with pytest.raises(HTTPException) as error:
        service.finalizeRepair(
            db,
            repair.id,
            RepairFinalize(
                spareParts=[
                    SparePartUsageLine(
                        sparePartId=part.id,
                        quantityUsed=5,
                    )
                ],
            ),
        )

    db.rollback()
    db.refresh(repair)
    db.refresh(part)

    assert error.value.status_code == 400
    assert repair.status == OrderStatus.inProgress.value
    assert part.stockUnits == 2


def test_rep10_finalizarClienteSinCorreo(db, makeRepair, sentEmails):
    """Finalizar una reparación cuyo cliente no tiene correo.
    Esperado: se finaliza igual, no se envía correo y devuelve un aviso."""
    repair = makeRepair(email="")

    service.registerDiagnosis(
        db,
        repair.id,
        RepairDiagnosis(
            diagnosis="Teclado dañado",
            diagnosisAmount=3000,
        ),
    )

    service.updateRepair(
        db,
        repair.id,
        RepairUpdate(
            workDescription="Se revisó y reparó el teclado",
            workAmount=3000,
        ),
    )

    service.changeStatus(
        db,
        repair.id,
        OrderStatusUpdate(status=OrderStatus.inProgress.value),
    )

    result, warning = service.finalizeRepair(
        db,
        repair.id,
        RepairFinalize(),
    )

    assert result.status == OrderStatus.finished.value
    assert warning == "El cliente no tiene correo registrado"
    assert sentEmails == []

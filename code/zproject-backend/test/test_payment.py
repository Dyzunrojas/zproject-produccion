from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.core.dependencies import getDb
from app.modules.payment import service
from app.modules.payment.router import router as paymentRouter
from app.modules.payment.schemas import PaymentCreate
from app.modules.printOrder.models import PrintOrder
from app.modules.repairs.models import Device, RepairOrder


@pytest.fixture()
def paymentApi(db):
    """App mínima con solo el router de pagos y la BD de pruebas."""
    app = FastAPI()
    app.include_router(paymentRouter)
    app.dependency_overrides[getDb] = lambda: db
    return TestClient(app)


@pytest.fixture()
def makePrintOrder(db, makeClient):
    """Pedido de impresión con monto total (el total de un pedido no reparación es totalAmount)."""

    def _make(total=10000, status="pending"):
        owner = makeClient()
        order = PrintOrder(
            clientId=owner.id,
            estimatedDeliveryDate=date.today() + timedelta(days=5),
            totalAmount=total,
            status=status,
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        return order

    return _make


@pytest.fixture()
def makeRepairOrder(db, makeClient):
    """Reparación: su total es diagnosisAmount + workAmount."""

    def _make(diagnosisAmount=5000, workAmount=15000):
        owner = makeClient()
        device = Device(clientId=owner.id, type="Laptop", brand="Lenovo", model="T14")
        db.add(device)
        db.commit()
        repair = RepairOrder(
            clientId=owner.id,
            estimatedDeliveryDate=date.today() + timedelta(days=5),
            deviceId=device.id,
            problemDescription="No enciende",
            diagnosisAmount=diagnosisAmount,
            workAmount=workAmount,
        )
        db.add(repair)
        db.commit()
        db.refresh(repair)
        return repair

    return _make


def abono(orderId, amount, method="efectivo"):
    return PaymentCreate(orderId=orderId, amountPaid=amount, paymentMethod=method)


def test_pag01_abonosActualizanElSaldoHastaPagarTodo(db, makePrintOrder):
    """Registrar un abono de 4000 y luego uno de 6000 sobre un pedido de 10000.
    Esperado: tras el primero el saldo es 6000; tras el segundo es 0 y el pedido queda pagado."""
    order = makePrintOrder(total=10000)

    primero = service.registerPayment(db, abono(order.id, 4000))
    segundo = service.registerPayment(db, abono(order.id, 6000))

    assert primero.balance.balance == Decimal("6000")
    assert primero.balance.fullyPaid is False
    assert segundo.balance.balance == Decimal("0")
    assert segundo.balance.fullyPaid is True


def test_pag02_abonoMayorAlSaldoSeRechaza(db, makePrintOrder):
    """Registrar un abono de 7000 cuando el saldo pendiente es 6000.
    Esperado: error 400 y no se guarda ningún pago nuevo."""
    order = makePrintOrder(total=10000)
    service.registerPayment(db, abono(order.id, 4000))

    with pytest.raises(HTTPException) as error:
        service.registerPayment(db, abono(order.id, 7000))

    assert error.value.status_code == 400
    assert len(service.getPayments(db, orderId=order.id)) == 1


def test_pag03_pedidoCanceladoNoAdmiteAbonos(db, makePrintOrder):
    """Registrar un abono sobre un pedido cancelado.
    Esperado: error 409 'El pedido no admite abonos'."""
    order = makePrintOrder(status="cancelled")

    with pytest.raises(HTTPException) as error:
        service.registerPayment(db, abono(order.id, 100))

    assert error.value.status_code == 409


def test_pag04_reparacionSumaDiagnosticoYTrabajo(db, makeRepairOrder):
    """Consultar el saldo de una reparación con diagnóstico 5000 y trabajo 15000.
    Esperado: el total es 20000."""
    repair = makeRepairOrder(diagnosisAmount=5000, workAmount=15000)

    balance = service.getOrderBalance(db, repair.id)

    assert balance.totalAmount == Decimal("20000")


def test_pag05_cancelarPagoDevuelveElMontoAlSaldo(db, makePrintOrder):
    """Cancelar un abono de 2000 en un pedido de 10000 con 6000 abonados.
    Esperado: el pago queda cancelado con fecha y el saldo sube de 4000 a 6000."""
    order = makePrintOrder(total=10000)
    service.registerPayment(db, abono(order.id, 4000))
    segundo = service.registerPayment(db, abono(order.id, 2000))

    result = service.cancelPayment(db, segundo.payment.id)

    assert result.payment.isCancelled is True
    assert result.payment.cancelledAt is not None
    assert result.balance.balance == Decimal("6000")


def test_pag06_historialFiltraPorPedido(db, makePrintOrder):
    """Consultar el historial de pagos filtrando por un pedido.
    Esperado: solo aparecen los pagos de ese pedido."""
    primero = makePrintOrder()
    segundo = makePrintOrder()
    service.registerPayment(db, abono(primero.id, 100))
    service.registerPayment(db, abono(segundo.id, 200))

    history = service.getPayments(db, orderId=segundo.id)

    assert len(history) == 1
    assert history[0].orderId == segundo.id


def test_pag07_endpointSinPermisoDevuelve403(paymentApi, makeUser, authHeader):
    """Consultar el historial de pagos con un usuario sin el permiso payments:read.
    Esperado: 403; con el permiso, 200."""
    sinPermiso = makeUser(username="sinpermiso", codes=["clients:read"])
    conPermiso = makeUser(username="conpermiso", codes=["payments:read"])

    denegado = paymentApi.get("/payments", headers=authHeader(sinPermiso))
    permitido = paymentApi.get("/payments", headers=authHeader(conPermiso))

    assert denegado.status_code == 403
    assert permitido.status_code == 200
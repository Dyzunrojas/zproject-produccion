from datetime import date

import pytest
from fastapi import HTTPException

from app.modules.order import notifications
from app.modules.order.enums import OrderStatus
from app.modules.printOrder import service
from app.modules.printOrder.schemas import (
    Object3DCreate,
    PrintOrderCreate,
    PrintOrderFinalize,
    PrintOrderUpdate,
)


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
def makeOrder(db, makeClient):
    def _make(clientEmail="cliente@correo.com", objects=("Soporte",)):
        newClient = makeClient(email=clientEmail)
        data = PrintOrderCreate(
            clientId=newClient.id,
            estimatedDeliveryDate=date(2026, 12, 1),
            objects=[Object3DCreate(name=name) for name in objects],
        )
        return service.createPrintOrder(db, data)

    return _make


def finalizeData(*items):
    return PrintOrderFinalize(
        materialsUsed=[{"materialId": materialId, "gramsUsed": grams} for materialId, grams in items]
    )


def test_ped01_crearPedido(makeOrder):
    """Crear un pedido de impresión con 2 objetos.
    Esperado: queda pendiente y con sus 2 objetos."""
    order = makeOrder(objects=("Soporte", "Engranaje"))

    assert order.status == OrderStatus.pending.value
    assert len(order.objects) == 2


def test_ped02_crearPedidoClienteInexistente(db):
    """Crear un pedido para un cliente que no existe.
    Esperado: error 404 'Cliente no encontrado'."""
    data = PrintOrderCreate(
        clientId=999,
        estimatedDeliveryDate=date(2026, 12, 1),
        objects=[Object3DCreate(name="Soporte")],
    )

    with pytest.raises(HTTPException) as error:
        service.createPrintOrder(db, data)

    assert error.value.status_code == 404


def test_ped03_noSePuedeEliminarElUltimoObjeto(db, makeOrder):
    """Eliminar el único objeto de un pedido.
    Esperado: error 400 'El pedido debe tener al menos un objeto'."""
    order = makeOrder(objects=("Soporte",))

    with pytest.raises(HTTPException) as error:
        service.deleteObject(db, order.id, order.objects[0].id)

    assert error.value.status_code == 400


def test_ped04_finalizarDescuentaStockYEnviaCorreo(db, makeOrder, makeMaterial, sentEmails):
    """Finalizar un pedido gastando 200 g de un material con 1000 g.
    Esperado: pedido finalizado, stock en 800 g, se envía 1 correo y no hay aviso."""
    material = makeMaterial(stockGrams=1000)
    order = makeOrder()

    result, warning = service.finalizePrintOrder(db, order.id, finalizeData((material.id, 200)))

    db.refresh(material)
    assert result.status == OrderStatus.finished.value
    assert result.deliveryDate is not None
    assert float(material.stockGrams) == 800
    assert len(result.materialUsages) == 1
    assert warning is None
    assert len(sentEmails) == 1
    assert sentEmails[0]["to"] == "cliente@correo.com"


def test_ped05_finalizarConStockInsuficiente(db, makeOrder, makeMaterial, sentEmails):
    """Finalizar gastando más gramos de los que hay en stock.
    Esperado: error 400, el pedido sigue pendiente y no se envía correo."""
    material = makeMaterial(stockGrams=100)
    order = makeOrder()

    with pytest.raises(HTTPException) as error:
        service.finalizePrintOrder(db, order.id, finalizeData((material.id, 500)))

    db.refresh(order)
    db.refresh(material)
    assert error.value.status_code == 400
    assert order.status == OrderStatus.pending.value
    assert float(material.stockGrams) == 100
    assert sentEmails == []


def test_ped06_finalizarMaterialRepetido(db, makeOrder, makeMaterial):
    """Finalizar mandando el mismo material dos veces.
    Esperado: error 400 'Un material no puede repetirse'."""
    material = makeMaterial()
    order = makeOrder()

    with pytest.raises(HTTPException) as error:
        service.finalizePrintOrder(db, order.id, finalizeData((material.id, 10), (material.id, 20)))

    assert error.value.status_code == 400


def test_ped07_finalizarClienteSinCorreo(db, makeOrder, makeMaterial, sentEmails):
    """Finalizar el pedido de un cliente sin correo registrado.
    Esperado: el pedido se finaliza igual, no se envía correo y se devuelve un aviso."""
    material = makeMaterial()
    order = makeOrder(clientEmail="")

    result, warning = service.finalizePrintOrder(db, order.id, finalizeData((material.id, 50)))

    assert result.status == OrderStatus.finished.value
    assert warning == "El cliente no tiene correo registrado"
    assert sentEmails == []


def test_ped08_fallaElCorreoNoDeshaceElPedido(db, makeOrder, makeMaterial, monkeypatch):
    """Finalizar cuando el servidor de correo falla.
    Esperado: el pedido queda finalizado y se devuelve el aviso del fallo."""
    monkeypatch.setattr(
        notifications, "sendEmail", lambda to, subject, body: "No se pudo enviar el correo al cliente"
    )
    material = makeMaterial()
    order = makeOrder()

    result, warning = service.finalizePrintOrder(db, order.id, finalizeData((material.id, 50)))

    assert result.status == OrderStatus.finished.value
    assert warning == "No se pudo enviar el correo al cliente"


def test_ped09_pedidoFinalizadoNoSeModifica(db, makeOrder, sentEmails):
    """Intentar editar la fecha de un pedido ya finalizado.
    Esperado: error 400 'No se puede modificar un pedido finalizado o cancelado'."""
    order = makeOrder()
    service.finalizePrintOrder(db, order.id, PrintOrderFinalize())

    with pytest.raises(HTTPException) as error:
        service.updatePrintOrder(
            db, order.id, PrintOrderUpdate(estimatedDeliveryDate=date(2027, 1, 1))
        )

    assert error.value.status_code == 400

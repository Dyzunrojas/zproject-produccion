from datetime import date
from decimal import Decimal
from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.modules.order import notifications
from app.modules.order.enums import OrderStatus
from app.modules.order.schemas import OrderStatusUpdate
from app.modules.payment.models import Payment
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


# ---------- Archivos STL, objetos, estados y montos ----------

@pytest.fixture()
def uploadDir(tmp_path, monkeypatch):
    """Los STL de las pruebas se guardan en una carpeta temporal, no en uploads/."""
    monkeypatch.setattr(settings, "uploadDir", str(tmp_path))
    return tmp_path


def makeStl(name="pieza.stl", content=b"solid test"):
    return UploadFile(file=BytesIO(content), filename=name)


def test_ped10_subirStlValido(db, makeOrder, uploadDir):
    """Subir un archivo .stl a un objeto del pedido.
    Esperado: el archivo se guarda en disco y el objeto queda con su ruta."""
    order = makeOrder()
    obj = order.objects[0]

    result = service.uploadStl(db, order.id, obj.id, makeStl())

    assert result.stlFilePath.endswith(f"{obj.id}.stl")
    assert Path(result.stlFilePath).read_bytes() == b"solid test"


def test_ped11_subirArchivoQueNoEsStl(db, makeOrder, uploadDir):
    """Subir un archivo con extensión distinta de .stl.
    Esperado: error 400 'El archivo debe ser .stl'."""
    order = makeOrder()

    with pytest.raises(HTTPException) as error:
        service.uploadStl(db, order.id, order.objects[0].id, makeStl(name="pieza.obj"))

    assert error.value.status_code == 400


def test_ped12_limiteDeTamanoDelStl(db, makeOrder, uploadDir, monkeypatch):
    """Subir un STL de exactamente el tamaño máximo permitido y otro de un byte más.
    Esperado: el del límite se acepta; el que lo supera da error 413."""
    monkeypatch.setattr(settings, "maxStlMb", 1)
    order = makeOrder()
    objectId = order.objects[0].id
    limit = 1024 * 1024

    accepted = service.uploadStl(db, order.id, objectId, makeStl(content=b"0" * limit))
    assert accepted.stlFilePath is not None

    with pytest.raises(HTTPException) as error:
        service.uploadStl(db, order.id, objectId, makeStl(content=b"0" * (limit + 1)))
    assert error.value.status_code == 413


def test_ped13_noSeSubeStlAPedidoFinalizado(db, makeOrder, uploadDir, sentEmails):
    """Subir un STL a un pedido que ya está finalizado.
    Esperado: error 400 'No se puede modificar un pedido finalizado o cancelado'."""
    order = makeOrder()
    service.finalizePrintOrder(db, order.id, PrintOrderFinalize())

    with pytest.raises(HTTPException) as error:
        service.uploadStl(db, order.id, order.objects[0].id, makeStl())

    assert error.value.status_code == 400


def test_ped14_descargarStlDeObjetoSinArchivo(db, makeOrder):
    """Pedir el STL de un objeto al que nunca se le subió archivo.
    Esperado: error 404 'Este objeto no tiene archivo STL'."""
    order = makeOrder()

    with pytest.raises(HTTPException) as error:
        service.getStlPath(db, order.id, order.objects[0].id)

    assert error.value.status_code == 404


def test_ped15_descargarStlSubido(db, makeOrder, uploadDir):
    """Subir un STL y luego pedirlo para descargarlo.
    Esperado: devuelve la ruta del archivo y el nombre '<objeto>.stl'."""
    order = makeOrder(objects=("Soporte",))
    obj = order.objects[0]
    service.uploadStl(db, order.id, obj.id, makeStl())

    path, filename = service.getStlPath(db, order.id, obj.id)

    assert path.exists()
    assert filename == "Soporte.stl"


def test_ped16_quitarObjetoBorraSuArchivo(db, makeOrder, uploadDir):
    """Quitar de un pedido un objeto que tiene STL subido.
    Esperado: el objeto desaparece del pedido y su archivo se borra del disco."""
    order = makeOrder(objects=("A", "B"))
    first = order.objects[0]
    stlPath = service.uploadStl(db, order.id, first.id, makeStl()).stlFilePath

    service.deleteObject(db, order.id, first.id)

    db.refresh(order)
    assert len(order.objects) == 1
    assert not Path(stlPath).exists()


def test_ped17_agregarObjetoAlPedido(db, makeOrder):
    """Agregar un objeto nuevo a un pedido pendiente.
    Esperado: el pedido pasa a tener 2 objetos."""
    order = makeOrder()

    added = service.addObject(db, order.id, Object3DCreate(name="Nuevo", description="Con detalles"))

    db.refresh(order)
    assert added.name == "Nuevo"
    assert len(order.objects) == 2


def test_ped18_noSeAgreganObjetosAPedidoCancelado(db, makeOrder):
    """Agregar un objeto a un pedido cancelado.
    Esperado: error 400 'No se puede modificar un pedido finalizado o cancelado'."""
    order = makeOrder()
    service.changeStatus(db, order.id, OrderStatusUpdate(status=OrderStatus.cancelled))

    with pytest.raises(HTTPException) as error:
        service.addObject(db, order.id, Object3DCreate(name="Nuevo"))

    assert error.value.status_code == 400


def test_ped19_iniciarPedido(db, makeOrder):
    """Pasar un pedido pendiente a 'en proceso'.
    Esperado: el estado cambia a inProgress."""
    order = makeOrder()

    result = service.changeStatus(db, order.id, OrderStatusUpdate(status=OrderStatus.inProgress))

    assert result.status == OrderStatus.inProgress.value


def test_ped20_finalizarSoloConLaAccionDeFinalizar(db, makeOrder):
    """Intentar marcar un pedido como finalizado cambiando solo el estado.
    Esperado: error 400 'Para finalizar usa la acción de finalizar' y el pedido sigue pendiente."""
    order = makeOrder()

    with pytest.raises(HTTPException) as error:
        service.changeStatus(db, order.id, OrderStatusUpdate(status=OrderStatus.finished))

    db.refresh(order)
    assert error.value.status_code == 400
    assert order.status == OrderStatus.pending.value


def test_ped21_pedidoCanceladoNoCambiaDeEstado(db, makeOrder):
    """Intentar iniciar un pedido que ya fue cancelado.
    Esperado: error 400 y el pedido sigue cancelado."""
    order = makeOrder()
    service.changeStatus(db, order.id, OrderStatusUpdate(status=OrderStatus.cancelled))

    with pytest.raises(HTTPException) as error:
        service.changeStatus(db, order.id, OrderStatusUpdate(status=OrderStatus.inProgress))

    db.refresh(order)
    assert error.value.status_code == 400
    assert order.status == OrderStatus.cancelled.value


def test_ped22_montoNoPuedeQuedarBajoLoYaAbonado(db, makeOrder):
    """Bajar el monto total de un pedido a menos de lo que el cliente ya pagó, y luego justo a lo pagado.
    Esperado: menos de lo pagado da error 400; igual a lo pagado se acepta (caso límite)."""
    order = makeOrder()
    service.updatePrintOrder(db, order.id, PrintOrderUpdate(totalAmount=10000))
    db.add(
        Payment(
            orderId=order.id,
            amountPaid=Decimal("5000"),
            paymentMethod="efectivo",
            paymentDate=date.today(),
            note="",
            isCancelled=False,
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as error:
        service.updatePrintOrder(db, order.id, PrintOrderUpdate(totalAmount=3000))
    assert error.value.status_code == 400

    updated = service.updatePrintOrder(db, order.id, PrintOrderUpdate(totalAmount=5000))
    assert float(updated.totalAmount) == 5000


def test_ped23_apiCrearYListarPedidosExigePermiso(client, makeUser, authHeader, makeClient):
    """Crear y consultar pedidos por la API sin permiso y con permiso.
    Esperado: 403 sin permiso; con permiso se crea (201, pendiente, saldo igual al monto) y aparece en la lista."""
    sinPermiso = makeUser(username="sin", codes=["clients:read"])
    conPermiso = makeUser(
        username="con", codes=["print_orders:read", "print_orders:create"]
    )
    cliente = makeClient()
    body = {
        "clientId": cliente.id,
        "estimatedDeliveryDate": "2026-12-01",
        "totalAmount": 15000,
        "objects": [{"name": "Soporte"}],
    }

    denegado = client.post("/printOrders", json=body, headers=authHeader(sinPermiso))
    creado = client.post("/printOrders", json=body, headers=authHeader(conPermiso))
    listado = client.get("/printOrders", headers=authHeader(conPermiso))
    detalle = client.get(f"/printOrders/{creado.json()['id']}", headers=authHeader(conPermiso))

    assert denegado.status_code == 403
    assert creado.status_code == 201
    assert creado.json()["status"] == "pending"
    assert creado.json()["balance"] == 15000
    assert len(listado.json()) == 1
    assert detalle.status_code == 200


def test_ped24_apiSubirYDescargarStl(client, makeUser, authHeader, makeOrder, uploadDir):
    """Subir un STL y descargarlo por la API.
    Esperado: la subida responde 200 y la descarga devuelve el mismo contenido."""
    user = makeUser(codes=["print_orders:read", "print_orders:update"])
    order = makeOrder()
    objectId = order.objects[0].id
    url = f"/printOrders/{order.id}/objects/{objectId}/stl"

    subida = client.post(
        url, files={"file": ("pieza.stl", b"solid test", "model/stl")}, headers=authHeader(user)
    )
    descarga = client.get(url, headers=authHeader(user))

    assert subida.status_code == 200
    assert descarga.status_code == 200
    assert descarga.content == b"solid test"

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core.dependencies import getDb
from app.modules.client import service
from app.modules.client.router import router as clientRouter
from app.modules.client.schemas import ClientCreate, ClientUpdate


@pytest.fixture()
def clientApi(db):
    """App mínima con solo el router de clientes y la BD de pruebas."""
    app = FastAPI()
    app.include_router(clientRouter)
    app.dependency_overrides[getDb] = lambda: db
    return TestClient(app)


def test_cli01_registrarClienteValido(db):
    """Registrar un cliente con nombre, teléfono y correo válidos.
    Esperado: se guarda con id, activo y con los datos indicados."""
    data = ClientCreate(name="Ana Rojas", phone="8888-8888", email="ana@correo.com")

    client = service.createClient(db, data)

    assert client.id is not None
    assert client.isActive is True
    assert (client.name, client.phone, client.email) == ("Ana Rojas", "8888-8888", "ana@correo.com")


def test_cli02_nombreVacioEsInvalido():
    """Registrar un cliente con el nombre vacío o solo espacios.
    Esperado: la validación lo rechaza (no se crea el cliente)."""
    for name in ("", "   "):
        with pytest.raises(ValidationError):
            ClientCreate(name=name)


def test_cli03_correoConFormatoInvalido():
    """Registrar un cliente con un correo mal formado.
    Esperado: la validación rechaza el correo."""
    with pytest.raises(ValidationError):
        ClientCreate(name="Ana", email="correo-sin-arroba")


def test_cli04_modificarSoloUnCampo(db, makeClient):
    """Modificar únicamente el teléfono de un cliente.
    Esperado: cambia el teléfono y el nombre y el correo se mantienen."""
    client = makeClient(name="Ana", email="ana@correo.com")

    updated = service.updateClient(db, client.id, ClientUpdate(phone="7777-7777"))

    assert updated.phone == "7777-7777"
    assert updated.name == "Ana"
    assert updated.email == "ana@correo.com"


def test_cli05_consultarClienteInexistente(db):
    """Consultar un cliente con un id que no existe.
    Esperado: error 404 'Cliente no encontrado'."""
    with pytest.raises(HTTPException) as error:
        service.getClient(db, 9999)

    assert error.value.status_code == 404


def test_cli06_eliminarEsBorradoLogico(db, makeClient):
    """Eliminar un cliente.
    Esperado: queda inactivo en la BD, ya no se lista y consultarlo da 404."""
    client = makeClient()

    service.deleteClient(db, client.id)

    db.refresh(client)
    assert client.isActive is False
    assert service.getClients(db) == []
    with pytest.raises(HTTPException) as error:
        service.getClient(db, client.id)
    assert error.value.status_code == 404


def test_cli07_endpointSinPermisoDevuelve403(clientApi, makeUser, authHeader):
    """Listar clientes con un usuario sin el permiso clients:read.
    Esperado: 403; con el permiso, 200."""
    sinPermiso = makeUser(username="sinpermiso", codes=["materials:read"])
    conPermiso = makeUser(username="conpermiso", codes=["clients:read"])

    denegado = clientApi.get("/clients", headers=authHeader(sinPermiso))
    permitido = clientApi.get("/clients", headers=authHeader(conPermiso))

    assert denegado.status_code == 403
    assert permitido.status_code == 200
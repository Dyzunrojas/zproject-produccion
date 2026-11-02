import pytest
from fastapi import HTTPException

from app.modules.material import service
from app.modules.material.schemas import MaterialCreate, MaterialPurchase, MaterialUpdate


def test_mat01_crearMaterial(db):
    """Crear un material con datos válidos.
    Esperado: se guarda activo y con el stock indicado."""
    data = MaterialCreate(type="PLA", color="Rojo", diameter=1.75, stockGrams=500)

    material = service.createMaterial(db, data)

    assert material.id is not None
    assert material.isActive is True
    assert float(material.stockGrams) == 500


def test_mat02_actualizarSoloUnCampo(db, makeMaterial):
    """Actualizar solo el color de un material.
    Esperado: cambia el color y el resto de campos se mantiene."""
    material = makeMaterial(type="PETG", color="Negro", stockGrams=300)

    updated = service.updateMaterial(db, material.id, MaterialUpdate(color="Azul"))

    assert updated.color == "Azul"
    assert updated.type == "PETG"
    assert float(updated.stockGrams) == 300


def test_mat03_eliminarEsBorradoLogico(db, makeMaterial):
    """Eliminar un material.
    Esperado: queda inactivo en la BD y ya no se encuentra (404)."""
    material = makeMaterial()

    service.deleteMaterial(db, material.id)

    db.refresh(material)
    assert material.isActive is False
    with pytest.raises(HTTPException) as error:
        service.getMaterial(db, material.id)
    assert error.value.status_code == 404


def test_mat04_comprarSumaStock(db, makeMaterial):
    """Registrar una compra de 250 g sobre un material con 1000 g.
    Esperado: el stock queda en 1250 g."""
    material = makeMaterial(stockGrams=1000)

    updated = service.purchaseMaterial(db, material.id, MaterialPurchase(grams=250))

    assert float(updated.stockGrams) == 1250


def test_mat05_endpointSinPermisoDevuelve403(client, makeUser, authHeader):
    """Listar materiales con un usuario sin el permiso materials:read.
    Esperado: 403; con el permiso, 200."""
    sinPermiso = makeUser(username="sinpermiso", codes=["clients:read"])
    conPermiso = makeUser(username="conpermiso", codes=["materials:read"])

    denegado = client.get("/materials", headers=authHeader(sinPermiso))
    permitido = client.get("/materials", headers=authHeader(conPermiso))

    assert denegado.status_code == 403
    assert permitido.status_code == 200

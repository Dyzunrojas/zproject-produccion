import pytest
from fastapi import HTTPException

from app.core.security import decodeAccessToken
from app.modules.auth import service
from app.modules.auth.schemas import ChangePasswordRequest, LoginRequest, RoleCreate


def test_auth01_loginCorrecto(db, makeUser):
    """Login con usuario y contraseña correctos.
    Esperado: devuelve un token JWT que corresponde al usuario."""
    user = makeUser()

    result = service.login(db, LoginRequest(username="kenneth", password="clave12345"))

    assert result.accessToken
    assert decodeAccessToken(result.accessToken) == user.id


def test_auth02_loginContrasenaIncorrecta(db, makeUser):
    """Login con contraseña incorrecta.
    Esperado: error 401 'Usuario o contraseña incorrectos'."""
    makeUser()

    with pytest.raises(HTTPException) as error:
        service.login(db, LoginRequest(username="kenneth", password="otraClave123"))

    assert error.value.status_code == 401


def test_auth03_loginUsuarioInactivo(db, makeUser):
    """Login de un usuario desactivado.
    Esperado: error 403 'Usuario inactivo'."""
    makeUser(isActive=False)

    with pytest.raises(HTTPException) as error:
        service.login(db, LoginRequest(username="kenneth", password="clave12345"))

    assert error.value.status_code == 403


def test_auth04_cambiarContrasenaActualIncorrecta(db, makeUser):
    """Cambiar contraseña indicando mal la contraseña actual.
    Esperado: error 400 y la contraseña no cambia."""
    user = makeUser()
    data = ChangePasswordRequest(currentPassword="mala-clave-1", newPassword="nuevaClave123")

    with pytest.raises(HTTPException) as error:
        service.changePassword(db, user, data)

    assert error.value.status_code == 400
    # la contraseña original sigue funcionando
    assert service.login(db, LoginRequest(username="kenneth", password="clave12345"))


def test_auth05_crearRolDuplicado(db, makeUser):
    """Crear un rol con un nombre que ya existe.
    Esperado: error 409 'Ya existe un rol con ese nombre'."""
    makeUser(codes=["materials:read"])  # crea el rol 'rol-kenneth'

    with pytest.raises(HTTPException) as error:
        service.createRole(db, RoleCreate(name="rol-kenneth", permissionCodes=["materials:read"]))

    assert error.value.status_code == 409


def test_auth06_meConTokenValidoEInvalido(client, makeUser, authHeader):
    """Consultar /auth/me con token válido y con token inválido.
    Esperado: 200 con el rol y los permisos; 401 con token inválido."""
    user = makeUser(codes=["materials:read", "clients:read"])

    ok = client.get("/auth/me", headers=authHeader(user))
    bad = client.get("/auth/me", headers={"Authorization": "Bearer token-falso"})

    assert ok.status_code == 200
    assert ok.json()["username"] == "kenneth"
    assert ok.json()["permissions"] == ["clients:read", "materials:read"]
    assert bad.status_code == 401

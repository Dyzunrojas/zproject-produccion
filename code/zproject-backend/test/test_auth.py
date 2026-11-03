import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.core.security import decodeAccessToken
from app.modules.auth import service
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    RoleCreate,
    RoleUpdate,
    UserCreate,
    UserUpdate,
)


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


def test_auth07_loginUsuarioInexistente(db):
    """Login con un usuario que no existe.
    Esperado: error 401 con el mismo mensaje que una contraseña incorrecta (no revela cuál falló)."""
    with pytest.raises(HTTPException) as error:
        service.login(db, LoginRequest(username="fantasma", password="clave12345"))

    assert error.value.status_code == 401
    assert error.value.detail == "Usuario o contraseña incorrectos"


def test_auth08_cambiarContrasenaCorrectamente(db, makeUser):
    """Cambiar la contraseña indicando bien la actual.
    Esperado: la nueva contraseña permite entrar y la anterior ya no."""
    user = makeUser()

    service.changePassword(
        db, user, ChangePasswordRequest(currentPassword="clave12345", newPassword="nuevaClave123")
    )

    assert service.login(db, LoginRequest(username="kenneth", password="nuevaClave123"))
    with pytest.raises(HTTPException) as error:
        service.login(db, LoginRequest(username="kenneth", password="clave12345"))
    assert error.value.status_code == 401


def test_auth09_nuevaContrasenaIgualALaActual(db, makeUser):
    """Cambiar la contraseña por la misma que ya tiene.
    Esperado: error 400 'La nueva contraseña debe ser distinta a la actual'."""
    user = makeUser()
    data = ChangePasswordRequest(currentPassword="clave12345", newPassword="clave12345")

    with pytest.raises(HTTPException) as error:
        service.changePassword(db, user, data)

    assert error.value.status_code == 400


def test_auth10_limitesDeLongitudDeContrasena():
    """Contraseña nueva en los límites de longitud (8 y 72 caracteres) y fuera de ellos (7 y 73).
    Esperado: 8 y 72 se aceptan; 7 y 73 se rechazan por validación."""
    ChangePasswordRequest(currentPassword="x", newPassword="a" * 8)
    ChangePasswordRequest(currentPassword="x", newPassword="a" * 72)

    for size in (7, 73):
        with pytest.raises(ValidationError):
            ChangePasswordRequest(currentPassword="x", newPassword="a" * size)


def test_auth11_crearRol(db, makeUser):
    """Crear un rol nuevo con dos permisos que existen.
    Esperado: el rol queda guardado con exactamente esos permisos."""
    makeUser(codes=["payments:read", "payments:create"])

    role = service.createRole(
        db, RoleCreate(name="Cajero", permissionCodes=["payments:read", "payments:create"])
    )

    assert role.name == "Cajero"
    assert {permission.code for permission in role.permissions} == {
        "payments:read",
        "payments:create",
    }


def test_auth12_crearRolConPermisoInexistente(db, makeUser):
    """Crear un rol con un código de permiso que no existe.
    Esperado: error 400 que nombra el permiso inexistente."""
    makeUser(codes=["payments:read"])

    with pytest.raises(HTTPException) as error:
        service.createRole(
            db, RoleCreate(name="Raro", permissionCodes=["payments:read", "no:existe"])
        )

    assert error.value.status_code == 400
    assert "no:existe" in error.value.detail


def test_auth13_editarRolCambiaNombreYPermisos(db, makeUser):
    """Un administrador edita el rol de otro usuario (nombre y permisos).
    Esperado: el rol queda con el nombre y los permisos nuevos."""
    admin = makeUser(username="admin", codes=["clients:read", "materials:read"])
    other = makeUser(username="otro", codes=["clients:read"])

    role = service.updateRole(
        db,
        admin,
        other.roleId,
        RoleUpdate(name="Operador", permissionCodes=["clients:read", "materials:read"]),
    )

    assert role.name == "Operador"
    assert {permission.code for permission in role.permissions} == {"clients:read", "materials:read"}


def test_auth14_editarRolInexistente(db, makeUser):
    """Editar un rol que no existe.
    Esperado: error 404 'Rol no encontrado'."""
    admin = makeUser(codes=["clients:read"])

    with pytest.raises(HTTPException) as error:
        service.updateRole(db, admin, 999, RoleUpdate(name="X", permissionCodes=["clients:read"]))

    assert error.value.status_code == 404


def test_auth15_editarRolConNombreDeOtroRol(db, makeUser):
    """Renombrar un rol con el nombre de otro rol que ya existe.
    Esperado: error 409 'Ya existe un rol con ese nombre'."""
    first = makeUser(username="a", codes=["clients:read"])
    second = makeUser(username="b", codes=["clients:read"])

    with pytest.raises(HTTPException) as error:
        service.updateRole(
            db, first, second.roleId, RoleUpdate(name="rol-a", permissionCodes=["clients:read"])
        )

    assert error.value.status_code == 409


def test_auth16_adminNoPuedeQuitarseSuPropioAcceso(db, makeUser):
    """Un administrador intenta quitarle a su propio rol los permisos de administración.
    Esperado: error 400 y el rol conserva sus permisos."""
    admin = makeUser(codes=["auth:manageUsers", "auth:manageRoles", "clients:read"])

    with pytest.raises(HTTPException) as error:
        service.updateRole(
            db, admin, admin.roleId, RoleUpdate(name="rol-kenneth", permissionCodes=["clients:read"])
        )

    db.refresh(admin)
    assert error.value.status_code == 400
    assert len(admin.role.permissions) == 3


def test_auth17_crearUsuario(db, makeUser):
    """Crear un usuario nuevo con un rol existente.
    Esperado: queda activo, con el rol indicado, y puede iniciar sesión."""
    base = makeUser(codes=["clients:read"])

    created = service.createUser(
        db, UserCreate(username="nuevo", password="clave12345", roleId=base.roleId)
    )

    assert created.username == "nuevo"
    assert created.isActive is True
    assert created.roleId == base.roleId
    assert service.login(db, LoginRequest(username="nuevo", password="clave12345"))


def test_auth18_crearUsuarioDuplicadoOConRolInexistente(db, makeUser):
    """Crear un usuario con un nombre repetido y otro con un rol que no existe.
    Esperado: error 409 por el nombre repetido y error 404 por el rol."""
    base = makeUser(codes=["clients:read"])

    with pytest.raises(HTTPException) as duplicate:
        service.createUser(
            db, UserCreate(username="kenneth", password="clave12345", roleId=base.roleId)
        )
    with pytest.raises(HTTPException) as noRole:
        service.createUser(db, UserCreate(username="otro", password="clave12345", roleId=999))

    assert duplicate.value.status_code == 409
    assert noRole.value.status_code == 404


def test_auth19_validacionDeCamposAlCrearUsuario():
    """Crear un usuario con nombre de 2 caracteres (mínimo 3) o contraseña de 7 (mínimo 8).
    Esperado: la validación rechaza ambos casos y acepta los mínimos (3 y 8)."""
    UserCreate(username="abc", password="a" * 8, roleId=1)

    with pytest.raises(ValidationError):
        UserCreate(username="ab", password="a" * 8, roleId=1)
    with pytest.raises(ValidationError):
        UserCreate(username="abc", password="a" * 7, roleId=1)


def test_auth20_desactivarUsuarioLeImpideEntrar(db, makeUser):
    """Un administrador desactiva a otro usuario.
    Esperado: el otro usuario ya no puede iniciar sesión (403 'Usuario inactivo')."""
    admin = makeUser(username="admin")
    other = makeUser(username="otro")

    updated = service.updateUser(db, admin, other.id, UserUpdate(isActive=False))

    assert updated.isActive is False
    with pytest.raises(HTTPException) as error:
        service.login(db, LoginRequest(username="otro", password="clave12345"))
    assert error.value.status_code == 403


def test_auth21_adminNoPuedeDesactivarseNiCambiarseElRol(db, makeUser):
    """Un administrador intenta desactivarse a sí mismo y cambiarse su propio rol.
    Esperado: ambos intentos dan error 400."""
    admin = makeUser(username="admin")
    makeUser(username="otro")

    with pytest.raises(HTTPException) as deactivate:
        service.updateUser(db, admin, admin.id, UserUpdate(isActive=False))
    with pytest.raises(HTTPException) as changeRole:
        service.updateUser(db, admin, admin.id, UserUpdate(roleId=admin.roleId + 1))

    assert deactivate.value.status_code == 400
    assert changeRole.value.status_code == 400


def test_auth22_cambiarRolDeUsuario(db, makeUser):
    """Un administrador le cambia el rol a otro usuario, primero a uno que existe y luego a uno que no.
    Esperado: el primer cambio se guarda; el segundo da error 404."""
    admin = makeUser(username="admin")
    other = makeUser(username="otro")

    updated = service.updateUser(db, admin, other.id, UserUpdate(roleId=admin.roleId))
    assert updated.roleId == admin.roleId

    with pytest.raises(HTTPException) as error:
        service.updateUser(db, admin, other.id, UserUpdate(roleId=999))
    assert error.value.status_code == 404


def test_auth23_editarUsuarioInexistente(db, makeUser):
    """Editar un usuario que no existe.
    Esperado: error 404 'Usuario no encontrado'."""
    admin = makeUser()

    with pytest.raises(HTTPException) as error:
        service.updateUser(db, admin, 999, UserUpdate(isActive=True))

    assert error.value.status_code == 404


def test_auth24_restablecerContrasena(db, makeUser):
    """Un administrador restablece la contraseña de un usuario, y luego de uno que no existe.
    Esperado: el usuario entra con la nueva contraseña; el inexistente da error 404."""
    user = makeUser()

    service.resetPassword(db, user.id, ResetPasswordRequest(newPassword="otraClave456"))

    assert service.login(db, LoginRequest(username="kenneth", password="otraClave456"))
    with pytest.raises(HTTPException) as error:
        service.resetPassword(db, 999, ResetPasswordRequest(newPassword="otraClave456"))
    assert error.value.status_code == 404


def test_auth25_apiUsuariosExigePermisoYFunciona(client, makeUser, authHeader):
    """Usar la API de usuarios sin permiso y con permiso (crear, cambiar contraseña, entrar, desactivar).
    Esperado: 403 sin permiso; con permiso todo funciona y el usuario desactivado ya no entra (403)."""
    simple = makeUser(username="simple", codes=["clients:read"])
    admin = makeUser(username="admin", codes=["auth:manageUsers"])

    denied = client.get("/auth/users", headers=authHeader(simple))
    listed = client.get("/auth/users", headers=authHeader(admin))
    created = client.post(
        "/auth/users",
        json={"username": "nuevo", "password": "clave12345", "roleId": admin.roleId},
        headers=authHeader(admin),
    )
    newId = created.json()["id"]
    reset = client.put(
        f"/auth/users/{newId}/password",
        json={"newPassword": "otraClave456"},
        headers=authHeader(admin),
    )
    loginOk = client.post("/auth/login", json={"username": "nuevo", "password": "otraClave456"})
    disabled = client.patch(
        f"/auth/users/{newId}", json={"isActive": False}, headers=authHeader(admin)
    )
    loginBlocked = client.post("/auth/login", json={"username": "nuevo", "password": "otraClave456"})

    assert denied.status_code == 403
    assert listed.status_code == 200
    assert created.status_code == 201
    assert reset.status_code == 204
    assert loginOk.status_code == 200
    assert disabled.status_code == 200
    assert disabled.json()["isActive"] is False
    assert loginBlocked.status_code == 403


def test_auth26_apiRolesYPermisos(client, makeUser, authHeader):
    """Usar la API de roles: listar permisos, crear un rol, listar roles y editarlo.
    Esperado: crear responde 201, los listados 200 e incluyen el rol, y editar cambia el nombre."""
    admin = makeUser(username="admin", codes=["auth:manageRoles", "clients:read"])
    headers = authHeader(admin)

    permissions = client.get("/auth/permissions", headers=headers)
    created = client.post(
        "/auth/roles", json={"name": "Lector", "permissionCodes": ["clients:read"]}, headers=headers
    )
    roles = client.get("/auth/roles", headers=headers)
    edited = client.put(
        f"/auth/roles/{created.json()['id']}",
        json={"name": "Lector 2", "permissionCodes": ["clients:read"]},
        headers=headers,
    )

    assert permissions.status_code == 200
    assert {item["code"] for item in permissions.json()} >= {"auth:manageRoles", "clients:read"}
    assert created.status_code == 201
    assert "Lector" in {role["name"] for role in roles.json()}
    assert edited.status_code == 200
    assert edited.json()["name"] == "Lector 2"

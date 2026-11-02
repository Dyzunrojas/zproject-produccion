"""Crea la base de datos de ZProject en MySQL si todavia no existe.

Lee DATABASE_URL del .env. Uso (desde la carpeta del backend):
    python -m scripts.createDatabase
"""
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError

from app.core.config import settings


def createDatabase() -> None:
    url = make_url(settings.databaseUrl)
    databaseName = url.database
    if not databaseName:
        raise SystemExit("DATABASE_URL no tiene el nombre de la base de datos")

    # Se conecta al servidor MySQL sin elegir base, porque todavia puede no existir
    engine = create_engine(url.set(database=None), isolation_level="AUTOCOMMIT")
    try:
        with engine.connect() as connection:
            connection.execute(
                text(
                    f"CREATE DATABASE IF NOT EXISTS `{databaseName}` "
                    "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                )
            )
    except OperationalError as error:
        raise SystemExit(
            "No se pudo conectar a MySQL. Revisa que este encendido y que el usuario y la "
            f"contrasena de DATABASE_URL en .env sean correctos.\n{error.orig}"
        )
    finally:
        engine.dispose()

    print(f"Base de datos '{databaseName}' lista")


if __name__ == "__main__":
    createDatabase()

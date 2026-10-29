from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    databaseUrl: str = Field(alias="DATABASE_URL")
    secretKey: str = Field(alias="SECRET_KEY")
    algorithm: str = "HS256"
    accessTokenMinutes: int = 60
    uploadDir: str = "uploads"
    maxStlMb: int = 50

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
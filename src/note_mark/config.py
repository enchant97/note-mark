from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    DB_URL: str
    DATA_PATH: Optional[Path] = Path("data/")
    SECRET_KEY: str
    ADMIN_PASSWORD: str
    ALLOW_ACCOUNT_CREATION: Optional[bool] = True
    AUTH_COOKIE_SECURE: Optional[bool] = False
    ADMIN_LOGIN_ALLOWED = True

    LOG_LEVEL: Optional[str] = "WARNING"
    BASE_URL: Optional[str] = ""
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    MAX_QUEUE_SIZE: int = -1

    class Config:
        case_sensitive = True
        env_file = '.env'
        env_file_encoding = 'utf-8'
        secrets_dir = "/run/secrets"


@lru_cache()
def get_settings():
    """
    returns the Settings obj
    """
    return Settings()

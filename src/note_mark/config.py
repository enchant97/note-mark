from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import BaseSettings


class Settings(BaseSettings):
    DB_URL: str
    DATA_PATH: Optional[Path] = Path("data/")
    SECRET_KEY: str
    ALLOW_ACCOUNT_CREATION: Optional[bool] = True
    AUTH_COOKIE_SECURE: Optional[bool] = False

    LOG_LEVEL: Optional[str] = "INFO"
    BASE_URL: Optional[str] = ""
    BINDS: Optional[List[str]] = ["127.0.0.1:8000"]

    MAX_QUEUE_SIZE: int = -1

    class Config:
        case_sensitive = True
        env_file = '.env'
        env_file_encoding = 'utf-8'


@lru_cache()
def get_settings():
    """
    returns the Settings obj
    """
    return Settings()

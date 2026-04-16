from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="PORTAL_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Shougang Knowledge Portal Backend"
    app_env: str = "development"
    bisheng_base_url: AnyHttpUrl = Field(default="http://localhost:7860")
    bisheng_timeout_seconds: float = 30.0
    bisheng_api_token: Optional[str] = None
    bisheng_default_model: Optional[str] = None
    bisheng_page_size_limit: int = 100
    bisheng_runtime_config_path: Path = Field(
        default=Path(__file__).resolve().parent / "config" / "data" / "bisheng_runtime.json"
    )
    portal_config_path: Path = Field(
        default=Path(__file__).resolve().parent / "config" / "data" / "portal_config.json"
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

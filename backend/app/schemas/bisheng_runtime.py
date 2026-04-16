from pydantic import AnyHttpUrl, BaseModel, Field, SecretStr, field_validator


class BishengRuntimeConfig(BaseModel):
    base_url: AnyHttpUrl
    username: str = ""
    timeout_seconds: float = 30.0
    api_token: str = ""
    last_auth_at: str = ""

    @field_validator("timeout_seconds")
    @classmethod
    def validate_timeout(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("timeout_seconds must be positive")
        return value


class BishengRuntimeConfigView(BaseModel):
    base_url: AnyHttpUrl
    username: str = ""
    timeout_seconds: float = 30.0
    has_token: bool = False
    last_auth_at: str = ""


class BishengRuntimeConfigUpdate(BaseModel):
    base_url: AnyHttpUrl
    username: str = ""
    password: SecretStr | None = None
    timeout_seconds: float = 30.0

    @field_validator("timeout_seconds")
    @classmethod
    def validate_timeout(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("timeout_seconds must be positive")
        return value


class BishengRuntimeStatus(BaseModel):
    connected: bool = False
    message: str = ""

import asyncio
from pathlib import Path

from app.schemas.bisheng_runtime import BishengRuntimeConfigUpdate
from app.services.bisheng_runtime_service import BishengRuntimeService


class FakeRuntimeBishengClient:
    def __init__(self, base_url: str, timeout_seconds: float, api_token: str | None = None):
        self.base_url = base_url
        self.timeout_seconds = timeout_seconds
        self.api_token = api_token

    async def get_json(self, path: str, params=None):
        if path == "/api/v1/user/get_captcha":
            return {
                "status_code": 200,
                "status_message": "SUCCESS",
                "data": {
                    "captcha_key": "cap-demo",
                    "user_capthca": False,
                    "captcha": "",
                },
            }
        if path == "/api/v1/user/public_key":
            return {
                "status_code": 200,
                "status_message": "SUCCESS",
                "data": {"public_key": "fake-public-key"},
            }
        raise AssertionError(f"Unexpected path: {path}")

    async def post_json(self, path: str, json=None):
        if path == "/api/v1/user/login":
            assert json["user_name"] == "portal-admin"
            assert json["password"] == "encrypted-password"
            return {
                "status_code": 200,
                "status_message": "SUCCESS",
                "data": {"access_token": "runtime-token"},
            }
        raise AssertionError(f"Unexpected path: {path}")

    async def aclose(self):
        return None


def create_runtime_service(config_path: Path) -> BishengRuntimeService:
    return BishengRuntimeService(
        config_path=config_path,
        default_base_url="http://example.com",
        default_timeout_seconds=30.0,
        default_api_token="",
        client_factory=FakeRuntimeBishengClient,
        password_encryptor=lambda _public_key, _password: "encrypted-password",
    )


def test_runtime_service_logs_in_and_persists_token_without_password(tmp_path: Path):
    config_path = tmp_path / "bisheng_runtime.json"
    service = create_runtime_service(config_path)

    asyncio.run(service.initialize())
    result = asyncio.run(
        service.update_config(
            BishengRuntimeConfigUpdate(
                base_url="http://example.com",
                username="portal-admin",
                password="super-secret",
                timeout_seconds=45.0,
            )
        )
    )

    saved = config_path.read_text(encoding="utf-8")
    reloaded = create_runtime_service(config_path).get_public_config()

    assert result.username == "portal-admin"
    assert result.has_token is True
    assert "runtime-token" in saved
    assert "super-secret" not in saved
    assert reloaded.username == "portal-admin"
    assert reloaded.has_token is True


def test_runtime_service_requires_password_when_endpoint_changes(tmp_path: Path):
    config_path = tmp_path / "bisheng_runtime.json"
    service = create_runtime_service(config_path)

    asyncio.run(service.initialize())

    try:
        asyncio.run(
            service.update_config(
                BishengRuntimeConfigUpdate(
                    base_url="http://changed.example.com",
                    username="portal-admin",
                    password="",
                    timeout_seconds=30.0,
                )
            )
        )
    except ValueError as err:
        assert "必须重新输入密码" in str(err)
    else:
        raise AssertionError("Expected ValueError when changing endpoint without password")

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.portal_config import SpacesConfigUpdate
from app.services.bisheng_runtime_service import BishengRuntimeService
from app.services.portal_config_service import PortalConfigService


class FakeBishengClient:
    async def get_json(self, path: str, params=None):
        if path == "/api/v1/workstation/config/daily":
            return {
                "data": {
                    "models": [
                        {
                            "key": "daily-1",
                            "id": "1",
                            "name": "",
                            "displayName": "日常模型 1",
                            "visual": False,
                        }
                    ]
                }
            }
        if path.startswith("/api/v1/knowledge/space/") and path.endswith("/info"):
            space_id = int(path.split("/")[5])
            return {
                "data": {
                    "id": space_id,
                    "name": f"空间{space_id}",
                    "file_num": space_id + 1,
                }
            }
        if path == "/api/v1/knowledge":
            return {
                "data": {
                    "data": [
                        {
                            "id": 19,
                            "name": "知识空间测试",
                            "description": "测试空间",
                            "type": 3,
                        }
                    ]
                }
            }
        if path == "/api/v1/knowledge/file_list/19":
            return {
                "data": {
                    "data": [
                        {
                            "id": 101,
                            "file_name": "操作手册.pdf",
                        },
                        {
                            "id": 102,
                            "file_name": "点检标准.docx",
                        },
                    ]
                }
            }
        raise AssertionError(f"Unexpected path: {path}")

    async def aclose(self):
        return None


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
                "data": {"captcha_key": "cap", "user_capthca": False, "captcha": ""},
            }
        if path == "/api/v1/user/public_key":
            return {
                "status_code": 200,
                "status_message": "SUCCESS",
                "data": {"public_key": "fake-public-key"},
            }
        raise AssertionError(f"Unexpected runtime path: {path}")

    async def post_json(self, path: str, json=None):
        if path == "/api/v1/user/login":
            return {
                "status_code": 200,
                "status_message": "SUCCESS",
                "data": {"access_token": "runtime-token"},
            }
        raise AssertionError(f"Unexpected runtime path: {path}")

    async def aclose(self):
        return None


def create_runtime_service(tmp_path: Path) -> BishengRuntimeService:
    return BishengRuntimeService(
        config_path=tmp_path / "bisheng_runtime.json",
        default_base_url="http://example.com",
        default_timeout_seconds=30.0,
        default_api_token="",
        client_factory=FakeRuntimeBishengClient,
        password_encryptor=lambda _public_key, _password: "encrypted-password",
    )


def test_get_admin_config_uses_portal_config_service(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    service.update_spaces(
        SpacesConfigUpdate(
            spaces=[
                {"id": 12, "name": "占位", "file_count": 0, "tag_count": 0, "enabled": True},
            ]
        )
    )
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_client = FakeBishengClient()
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.get("/api/v1/admin/config")

    assert response.status_code == 200
    body = response.json()
    assert body["status_code"] == 200
    assert "spaces" in body["data"]
    assert "domains" in body["data"]
    assert "panel_title" in body["data"]["qa"]
    assert "welcome_message" in body["data"]["qa"]
    assert "ai_search_system_prompt" in body["data"]["qa"]
    assert "qa_system_prompt" in body["data"]["qa"]
    assert "selected_model" in body["data"]["qa"]
    assert body["data"]["spaces"][0]["name"] == "空间12"
    assert body["data"]["spaces"][0]["file_count"] == 13


def test_put_admin_domains_updates_persisted_config(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.put(
            "/api/v1/admin/config/domains",
            json={
                "domains": [
                    {
                        "name": "炼钢",
                        "space_ids": [25],
                        "color": "#111111",
                        "bg": "#eeeeee",
                        "icon": "Factory",
                        "background_image": "/steel.png",
                        "enabled": True,
                    }
                ]
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["domains"][0]["name"] == "炼钢"
    assert body["data"]["domains"][0]["background_image"] == "/steel.png"
    assert service.get_config().domains[0].name == "炼钢"


def test_put_admin_qa_updates_prompt_fields(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.put(
            "/api/v1/admin/config/qa",
            json={
                "knowledge_space_ids": [12, 18],
                "panel_title": "技术问答·设备专家",
                "welcome_message": "你好，我是首钢设备诊断助手，请问有什么可以帮您？",
                "hot_questions": ["振动纹通常如何排查？"],
                "ai_search_system_prompt": "搜索提示词",
                "qa_system_prompt": "问答提示词",
                "selected_model": "1",
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["panel_title"] == "技术问答·设备专家"
    assert body["data"]["welcome_message"] == "你好，我是首钢设备诊断助手，请问有什么可以帮您？"
    assert body["data"]["ai_search_system_prompt"] == "搜索提示词"
    assert body["data"]["qa_system_prompt"] == "问答提示词"
    assert body["data"]["selected_model"] == "1"
    assert service.get_config().qa.panel_title == "技术问答·设备专家"
    assert service.get_config().qa.welcome_message == "你好，我是首钢设备诊断助手，请问有什么可以帮您？"
    assert service.get_config().qa.ai_search_system_prompt == "搜索提示词"
    assert service.get_config().qa.qa_system_prompt == "问答提示词"
    assert service.get_config().qa.selected_model == "1"


def test_put_admin_sections_persists_icon_and_color_fields(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.put(
            "/api/v1/admin/config/sections",
            json={
                "sections": [
                    {
                        "title": "知识推荐 · 最新精选",
                        "tag": "最新精选",
                        "link": "/list?tag=%E6%9C%80%E6%96%B0%E7%B2%BE%E9%80%89",
                        "icon": "Star",
                        "color": "#2563eb",
                        "bg": "#eff6ff",
                        "enabled": True,
                    }
                ]
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["sections"][0]["icon"] == "Star"
    assert body["data"]["sections"][0]["color"] == "#2563eb"
    assert body["data"]["sections"][0]["bg"] == "#eff6ff"
    assert service.get_config().sections[0].color == "#2563eb"
    assert service.get_config().sections[0].bg == "#eff6ff"


def test_get_admin_qa_model_options_uses_bisheng_daily_config(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)
    service.update_qa(
        service.get_config().qa.model_copy(
            update={"selected_model": "1"}
        )
    )

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_client = FakeBishengClient()
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.get("/api/v1/admin/config/qa/model-options")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["selected_model"] == "1"
    assert body["models"] == [
        {
            "key": "daily-1",
            "id": "1",
            "name": "",
            "display_name": "日常模型 1",
            "visual": False,
        }
    ]


def test_get_admin_space_options_uses_bisheng_knowledge_list(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_client = FakeBishengClient()
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.get("/api/v1/admin/config/space-options")

    assert response.status_code == 200
    assert response.json()["data"] == {
        "options": [
            {
                "id": 19,
                "name": "空间19",
                "description": "测试空间",
                "file_count": 20,
            }
        ]
    }


def test_get_admin_space_files_uses_bisheng_file_list(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_client = FakeBishengClient()
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.get("/api/v1/admin/config/spaces/19/files")

    assert response.status_code == 200
    assert response.json()["data"] == {
        "space_id": 19,
        "files": [
            {"id": 101, "name": "操作手册.pdf"},
            {"id": 102, "name": "点检标准.docx"},
        ],
    }


def test_admin_config_endpoints_fail_soft_when_bisheng_is_unauthorized(tmp_path: Path):
    class UnauthorizedBishengClient(FakeBishengClient):
        async def get_json(self, path: str, params=None):
            if path in {
                "/api/v1/knowledge",
                "/api/v1/workstation/config/daily",
                "/api/v1/knowledge/file_list/19",
            }:
                raise RuntimeError("401 Unauthorized")
            return await super().get_json(path, params=params)

    service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        client.app.state.bisheng_client = UnauthorizedBishengClient()
        client.app.state.bisheng_runtime_service = runtime_service
        space_options_response = client.get("/api/v1/admin/config/space-options")
        model_options_response = client.get("/api/v1/admin/config/qa/model-options")
        space_files_response = client.get("/api/v1/admin/config/spaces/19/files")

    assert space_options_response.status_code == 200
    assert space_options_response.json()["data"]["options"] == []

    assert model_options_response.status_code == 200
    model_options = model_options_response.json()["data"]
    assert model_options["models"] == []
    assert model_options["selected_model"] == service.get_config().qa.selected_model

    assert space_files_response.status_code == 200
    assert space_files_response.json()["data"]["files"] == []


def test_put_admin_bisheng_config_updates_runtime_without_echoing_secret(tmp_path: Path):
    runtime_service = create_runtime_service(tmp_path)

    with TestClient(app) as client:
        client.app.state.bisheng_runtime_service = runtime_service
        response = client.put(
            "/api/v1/admin/config/bisheng",
            json={
                "base_url": "http://example.com",
                "username": "portal-admin",
                "password": "super-secret",
                "timeout_seconds": 45,
            },
        )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["base_url"] == "http://example.com/"
    assert body["username"] == "portal-admin"
    assert body["has_token"] is True
    assert "password" not in body

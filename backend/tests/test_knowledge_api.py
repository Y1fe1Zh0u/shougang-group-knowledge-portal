from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.portal_config_service import PortalConfigService


class FakeBishengClient:
    def __init__(self):
        self.chat_payload = None

    def resolve_url(self, path_or_url: str) -> str:
        return path_or_url

    async def get_json(self, path: str, params=None):
        params = params or {}
        if path == "/api/v1/knowledge/space/12/search":
            keyword = params.get("keyword")
            if keyword == "振动纹":
                return {
                    "data": {
                        "data": [
                            {
                                "id": 1580,
                                "knowledge_id": 12,
                                "file_name": "热轧1580产线精轧机振动纹治理实践.pdf",
                                "abstract": "振动纹治理实践摘要",
                                "file_type": 1,
                                "status": 2,
                                "update_time": "2026-04-13T10:30:00",
                                "tags": [{"id": 101, "name": "热轧"}, {"id": 103, "name": "振动纹"}],
                            }
                        ],
                        "total": 1,
                    }
                }
            return {
                "data": {
                    "data": [
                        {
                            "id": 1580,
                            "knowledge_id": 12,
                            "file_name": "热轧1580产线精轧机振动纹治理实践.pdf",
                            "abstract": "振动纹治理实践摘要",
                            "file_type": 1,
                            "status": 2,
                            "update_time": "2026-04-13T10:30:00",
                            "tags": [{"id": 101, "name": "热轧"}, {"id": 103, "name": "振动纹"}],
                        },
                        {
                            "id": 1590,
                            "knowledge_id": 12,
                            "file_name": "热轧加热炉温度控制.docx",
                            "abstract": "温度控制摘要",
                            "file_type": 1,
                            "status": 2,
                            "update_time": "2026-04-10T08:00:00",
                            "tags": [{"id": 101, "name": "热轧"}],
                        },
                    ],
                    "total": 2,
                }
            }
        if path == "/api/v1/knowledge/space/18/search":
            return {
                "data": {
                    "data": [
                        {
                            "id": 1801,
                            "knowledge_id": 18,
                            "file_name": "冷轧板面缺陷处理.pdf",
                            "abstract": "板面缺陷摘要",
                            "file_type": 1,
                            "status": 2,
                            "update_time": "2026-04-11T09:00:00",
                            "tags": [{"id": 205, "name": "板面缺陷"}],
                        }
                    ],
                    "total": 1,
                }
            }
        if path == "/api/v1/knowledge/space/12/tag":
            return {"data": [{"id": 101, "name": "热轧"}, {"id": 103, "name": "振动纹"}]}
        if path == "/api/v1/knowledge/space/18/tag":
            return {"data": [{"id": 205, "name": "板面缺陷"}]}
        if path == "/api/v1/knowledge/file/info/1580":
            return {
                "data": {
                    "id": 1580,
                    "knowledge_id": 12,
                    "file_name": "热轧1580产线精轧机振动纹治理实践.pdf",
                    "abstract": "振动纹治理实践摘要",
                    "update_time": "2026-04-13T10:30:00",
                }
            }
        if path == "/api/v1/knowledge/space/12/files/1580/preview":
            return {
                "data": {
                    "original_url": "https://example.com/original/1580.pdf",
                    "preview_url": "https://example.com/preview/1580.pdf",
                }
            }
        if path == "/api/v1/knowledge/chunk":
            assert params == {"knowledge_id": 12, "file_ids": [1580], "page": 1, "limit": 100}
            return {
                "data": {
                    "data": [
                        {
                            "text": "第一段内容",
                            "metadata": {"chunk_index": 1},
                        },
                        {
                            "text": "第二段内容",
                            "metadata": {"chunk_index": 2},
                        },
                    ],
                    "total": 2,
                }
            }
        raise AssertionError(f"Unexpected path: {path}")

    async def stream_post(self, path: str, json=None):
        self.chat_payload = {"path": path, "json": json}
        yield b"event: message\n"
        yield b"data: {\"ok\":true}\n\n"

    async def aclose(self):
        return None


def make_client(tmp_path: Path):
    config_service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    fake_bisheng = FakeBishengClient()
    with TestClient(app) as client:
        client.app.state.portal_config_service = config_service
        client.app.state.bisheng_client = fake_bisheng
        yield client, config_service, fake_bisheng


def test_list_space_files_maps_bisheng_results(tmp_path: Path):
    for client, _, _ in make_client(tmp_path):
        response = client.get("/api/v1/knowledge/space/12/files?page=1&page_size=10")

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["total"] == 2
    assert body["data"][0]["space_id"] == 12
    assert body["data"][0]["title"] == "热轧1580产线精轧机振动纹治理实践"
    assert body["data"][0]["file_ext"] == "pdf"


def test_get_file_detail_and_preview(tmp_path: Path):
    for client, _, _ in make_client(tmp_path):
        detail_response = client.get("/api/v1/knowledge/space/12/files/1580")
        preview_response = client.get("/api/v1/knowledge/space/12/files/1580/preview")

    assert detail_response.status_code == 200
    detail = detail_response.json()["data"]
    assert detail["space"]["id"] == 12
    assert detail["tags"] == ["热轧", "振动纹"]

    assert preview_response.status_code == 200
    preview = preview_response.json()["data"]
    assert preview["preview_url"] == "https://example.com/preview/1580.pdf"


def test_get_file_preview_normalizes_relative_urls(tmp_path: Path):
    class RelativePreviewBishengClient(FakeBishengClient):
        async def get_json(self, path: str, params=None):
            if path == "/api/v1/knowledge/space/12/files/1580/preview":
                return {
                    "data": {
                        "original_url": "/bisheng/original/1580.pdf?signature=demo",
                        "preview_url": "",
                    }
                }
            return await super().get_json(path, params=params)

        def resolve_url(self, path_or_url: str) -> str:
            return f"https://bisheng.example.com{path_or_url}" if path_or_url.startswith("/") else path_or_url

    config_service = PortalConfigService(config_path=tmp_path / "portal_config.json")
    fake_bisheng = RelativePreviewBishengClient()
    with TestClient(app) as client:
        client.app.state.portal_config_service = config_service
        client.app.state.bisheng_client = fake_bisheng
        preview_response = client.get("/api/v1/knowledge/space/12/files/1580/preview")

    assert preview_response.status_code == 200
    preview = preview_response.json()["data"]
    assert preview["original_url"] == "https://bisheng.example.com/bisheng/original/1580.pdf?signature=demo"
    assert preview["preview_url"] == ""


def test_get_file_chunks_returns_sorted_chunk_text(tmp_path: Path):
    for client, _, _ in make_client(tmp_path):
        response = client.get("/api/v1/knowledge/space/12/files/1580/chunks")

    assert response.status_code == 200
    chunks = response.json()["data"]
    assert chunks == [
        {"chunk_index": 1, "text": "第一段内容"},
        {"chunk_index": 2, "text": "第二段内容"},
    ]


def test_chat_proxy_uses_portal_prompt_and_whitelisted_spaces(tmp_path: Path):
    for client, config_service, fake_bisheng in make_client(tmp_path):
        qa_config = config_service.get_config().qa.model_copy(
            update={
                "knowledge_space_ids": [12, 18, 999],
                "ai_search_system_prompt": "搜索提示词",
                "qa_system_prompt": "问答提示词",
            }
        )
        config_service.update_qa(qa_config)

        response = client.post(
            "/api/v1/workstation/chat/completions",
            json={
                "clientTimestamp": "2026-04-15T10:00:00",
                "model": "demo-model",
                "scene": "search",
                "text": "振动纹如何排查？",
                "search_enabled": False,
            },
        )

    assert response.status_code == 200
    assert fake_bisheng.chat_payload is not None
    assert fake_bisheng.chat_payload["path"] == "/api/v1/workstation/chat/completions"
    assert "搜索提示词" in fake_bisheng.chat_payload["json"]["text"]
    assert fake_bisheng.chat_payload["json"]["use_knowledge_base"]["knowledge_space_ids"] == [12, 18]


def test_chat_proxy_falls_back_to_selected_qa_model(tmp_path: Path):
    for client, config_service, fake_bisheng in make_client(tmp_path):
        qa_config = config_service.get_config().qa.model_copy(
            update={"selected_model": "1"}
        )
        config_service.update_qa(qa_config)

        response = client.post(
            "/api/v1/workstation/chat/completions",
            json={
                "clientTimestamp": "2026-04-15T10:00:00",
                "model": "",
                "scene": "qa",
                "text": "振动纹如何排查？",
            },
        )

    assert response.status_code == 200
    assert fake_bisheng.chat_payload is not None
    assert fake_bisheng.chat_payload["json"]["model"] == "1"


def test_get_tags_aggregates_enabled_spaces(tmp_path: Path):
    for client, _, _ in make_client(tmp_path):
        response = client.get("/api/v1/knowledge/tags?space_ids=12&space_ids=18&space_ids=999")

    assert response.status_code == 200
    assert response.json()["data"] == ["振动纹", "板面缺陷", "热轧"]

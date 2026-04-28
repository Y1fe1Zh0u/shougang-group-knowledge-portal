import asyncio

import httpx

from app.clients.bisheng import BishengClient


class RecordingAsyncClient:
    def __init__(self, label: str):
        self.label = label
        self.calls: list[tuple[str, dict | None]] = []

    async def get(self, url: str, params=None):
        self.calls.append((url, params))
        return httpx.Response(
            200,
            request=httpx.Request("GET", url),
            headers={"content-type": "application/octet-stream"},
            content=self.label.encode("utf-8"),
        )

    async def aclose(self):
        return None


def test_get_preview_asset_uses_plain_client_for_presigned_urls():
    client = BishengClient("https://bisheng.example.com", 5, api_token="secret")
    original_client = client._client
    original_plain_client = client._plain_client
    asyncio.run(original_client.aclose())
    asyncio.run(original_plain_client.aclose())

    authed_client = RecordingAsyncClient("authed")
    plain_client = RecordingAsyncClient("plain")
    client._client = authed_client
    client._plain_client = plain_client

    presigned_url = (
        "https://files.example.com/demo.docx"
        "?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=demo"
    )
    try:
        response = asyncio.run(client.get_preview_asset(presigned_url))
    finally:
        asyncio.run(client.aclose())

    assert response.content == b"plain"
    assert plain_client.calls == [(presigned_url, None)]
    assert authed_client.calls == []


def test_resolve_asset_url_uses_asset_base_url_for_relative_paths():
    client = BishengClient(
        "https://bisheng.example.com",
        5,
        api_token="secret",
        asset_base_url="https://nginx.example.com:3002",
    )
    try:
        assert (
            client.resolve_asset_url("/bisheng/original/86139.pdf?signature=demo")
            == "https://nginx.example.com:3002/bisheng/original/86139.pdf?signature=demo"
        )
        # 已经是绝对 URL 时保持不变
        absolute = "https://other.example.com/foo.pdf?token=1"
        assert client.resolve_asset_url(absolute) == absolute
        # 空字符串返回空
        assert client.resolve_asset_url("") == ""
    finally:
        asyncio.run(client.aclose())


def test_resolve_asset_url_falls_back_to_base_url_when_asset_not_set():
    client = BishengClient("https://bisheng.example.com", 5)
    try:
        assert (
            client.resolve_asset_url("/bisheng/original/1.pdf?x=1")
            == "https://bisheng.example.com/bisheng/original/1.pdf?x=1"
        )
    finally:
        asyncio.run(client.aclose())


def test_get_preview_asset_keeps_authenticated_client_for_regular_urls():
    client = BishengClient("https://bisheng.example.com", 5, api_token="secret")
    original_client = client._client
    original_plain_client = client._plain_client
    asyncio.run(original_client.aclose())
    asyncio.run(original_plain_client.aclose())

    authed_client = RecordingAsyncClient("authed")
    plain_client = RecordingAsyncClient("plain")
    client._client = authed_client
    client._plain_client = plain_client

    url = "https://bisheng.example.com/api/v1/knowledge/file/info/1580"
    try:
        response = asyncio.run(client.get_preview_asset(url))
    finally:
        asyncio.run(client.aclose())

    assert response.content == b"authed"
    assert authed_client.calls == [(url, None)]
    assert plain_client.calls == []

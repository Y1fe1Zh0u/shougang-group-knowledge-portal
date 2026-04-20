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

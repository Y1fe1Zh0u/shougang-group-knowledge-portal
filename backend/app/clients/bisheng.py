from collections.abc import AsyncIterator
from typing import Optional

import httpx


class BishengClient:
    def __init__(self, base_url: str, timeout_seconds: float, api_token: Optional[str] = None):
        headers: dict[str, str] = {}
        if api_token:
            headers["Authorization"] = f"Bearer {api_token}"
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"),
            timeout=timeout_seconds,
            headers=headers,
        )

    async def get(self, path: str, params: Optional[dict] = None) -> httpx.Response:
        response = await self._client.get(path, params=params)
        response.raise_for_status()
        return response

    async def post(self, path: str, json: Optional[dict] = None) -> httpx.Response:
        response = await self._client.post(path, json=json)
        response.raise_for_status()
        return response

    async def stream_post(self, path: str, json: Optional[dict] = None) -> AsyncIterator[str]:
        async with self._client.stream("POST", path, json=json) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line:
                    yield line

    async def aclose(self) -> None:
        await self._client.aclose()

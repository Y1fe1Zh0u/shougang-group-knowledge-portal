import asyncio
import base64
import os
from datetime import UTC, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Callable

import httpx

from app.clients.bisheng import BishengClient
from app.schemas.bisheng_runtime import (
    BishengRuntimeConfig,
    BishengRuntimeConfigUpdate,
    BishengRuntimeConfigView,
)


def encrypt_bisheng_password(public_key_pem: str, password: str) -> str:
    modulus, exponent = _parse_rsa_public_key(public_key_pem)
    return _encrypt_pkcs1_v1_5(modulus, exponent, password.encode("utf-8"))


class BishengRuntimeService:
    def __init__(
        self,
        config_path: Path,
        default_base_url: str,
        default_timeout_seconds: float,
        default_api_token: str | None = None,
        client_factory: Callable[[str, float, str | None], BishengClient] = BishengClient,
        password_encryptor: Callable[[str, str], str] = encrypt_bisheng_password,
    ):
        self._config_path = config_path
        self._default_base_url = default_base_url
        self._default_timeout_seconds = default_timeout_seconds
        self._default_api_token = default_api_token or ""
        self._client_factory = client_factory
        self._password_encryptor = password_encryptor
        self._lock = asyncio.Lock()
        self._client: BishengClient | None = None
        self._ensure_seeded()

    async def initialize(self) -> None:
        async with self._lock:
            await self._replace_client(self._read_config())

    async def aclose(self) -> None:
        client = self._client
        self._client = None
        if client is not None:
            await client.aclose()

    def get_client(self) -> BishengClient:
        if self._client is None:
            raise RuntimeError("BiSheng client is not initialized")
        return self._client

    def get_public_config(self) -> BishengRuntimeConfigView:
        return self._to_public_view(self._read_config())

    async def update_config(self, payload: BishengRuntimeConfigUpdate) -> BishengRuntimeConfigView:
        async with self._lock:
            current = self._read_config()
            password = payload.password.get_secret_value().strip() if payload.password else ""
            next_base_url = str(payload.base_url)
            next_username = payload.username.strip()
            next_timeout = float(payload.timeout_seconds)

            requires_reauth = (
                bool(password)
                or next_base_url != str(current.base_url)
                or next_username != current.username
                or not current.api_token
            )

            next_token = current.api_token
            last_auth_at = current.last_auth_at
            if requires_reauth:
                if not next_username:
                    raise ValueError("请输入 BiSheng 登录账号")
                if not password:
                    raise ValueError("修改地址或账号时，必须重新输入密码以换取共享令牌")
                next_token = await self._login_and_get_token(
                    base_url=next_base_url,
                    username=next_username,
                    password=password,
                    timeout_seconds=next_timeout,
                )
                last_auth_at = _utc_now()

            updated = BishengRuntimeConfig(
                base_url=payload.base_url,
                username=next_username,
                timeout_seconds=next_timeout,
                api_token=next_token,
                last_auth_at=last_auth_at,
            )
            self._write_config(updated)
            await self._replace_client(updated)
            return self._to_public_view(updated)

    async def _login_and_get_token(
        self,
        *,
        base_url: str,
        username: str,
        password: str,
        timeout_seconds: float,
    ) -> str:
        client = self._client_factory(base_url, timeout_seconds, None)
        try:
            captcha_response = await client.get_json("/api/v1/user/get_captcha")
            captcha_data = _unwrap_bisheng_payload(captcha_response)
            if captcha_data.get("user_capthca"):
                raise ValueError("当前 BiSheng 环境启用了验证码，门户后台暂不支持自动登录")

            public_key_response = await client.get_json("/api/v1/user/public_key")
            public_key = str(_unwrap_bisheng_payload(public_key_response).get("public_key") or "").strip()
            if not public_key:
                raise ValueError("未获取到 BiSheng 登录公钥")

            encrypted_password = self._password_encryptor(public_key, password)
            login_response = await client.post_json(
                "/api/v1/user/login",
                json={
                    "user_name": username,
                    "password": encrypted_password,
                    "captcha_key": str(captcha_data.get("captcha_key") or ""),
                    "captcha": "",
                },
            )
            login_data = _unwrap_bisheng_payload(login_response)
            access_token = str(login_data.get("access_token") or "").strip()
            if not access_token:
                raise ValueError("BiSheng 登录成功，但未返回 access_token")
            return access_token
        except httpx.HTTPStatusError as err:
            raise ValueError(f"BiSheng 登录失败：HTTP {err.response.status_code}") from err
        except httpx.HTTPError as err:
            raise ValueError(f"连接 BiSheng 失败：{err}") from err
        finally:
            await client.aclose()

    def _ensure_seeded(self) -> None:
        if self._config_path.exists():
            return
        seeded = BishengRuntimeConfig(
            base_url=self._default_base_url,
            username="",
            timeout_seconds=self._default_timeout_seconds,
            api_token=self._default_api_token,
            last_auth_at="",
        )
        self._write_config(seeded)

    def _read_config(self) -> BishengRuntimeConfig:
        return BishengRuntimeConfig.model_validate_json(self._config_path.read_text(encoding="utf-8"))

    def _write_config(self, config: BishengRuntimeConfig) -> None:
        self._config_path.parent.mkdir(parents=True, exist_ok=True)
        with NamedTemporaryFile("w", encoding="utf-8", dir=self._config_path.parent, delete=False) as tmp:
            tmp.write(config.model_dump_json(indent=2))
            tmp.write("\n")
            tmp_path = Path(tmp.name)
        os.chmod(tmp_path, 0o600)
        tmp_path.replace(self._config_path)
        os.chmod(self._config_path, 0o600)

    async def _replace_client(self, config: BishengRuntimeConfig) -> None:
        next_client = self._client_factory(str(config.base_url), config.timeout_seconds, config.api_token or None)
        previous = self._client
        self._client = next_client
        if previous is not None:
            await previous.aclose()

    @staticmethod
    def _to_public_view(config: BishengRuntimeConfig) -> BishengRuntimeConfigView:
        return BishengRuntimeConfigView(
            base_url=config.base_url,
            username=config.username,
            timeout_seconds=config.timeout_seconds,
            has_token=bool(config.api_token),
            last_auth_at=config.last_auth_at,
        )


def _unwrap_bisheng_payload(response: dict) -> dict:
    if response.get("status_code") == 200:
        data = response.get("data")
        return data if isinstance(data, dict) else {}
    raise ValueError(str(response.get("status_message") or "BiSheng 请求失败"))


def _utc_now() -> str:
    return datetime.now(UTC).isoformat()


def _parse_rsa_public_key(public_key_pem: str) -> tuple[int, int]:
    body = "".join(
        line.strip()
        for line in public_key_pem.splitlines()
        if "BEGIN" not in line and "END" not in line
    )
    der = base64.b64decode(body)
    sequence, _ = _read_tlv(der, 0, 0x30)
    modulus_bytes, offset = _read_tlv(sequence, 0, 0x02)
    exponent_bytes, _ = _read_tlv(sequence, offset, 0x02)
    modulus = int.from_bytes(_strip_leading_zero(modulus_bytes), "big")
    exponent = int.from_bytes(_strip_leading_zero(exponent_bytes), "big")
    return modulus, exponent


def _encrypt_pkcs1_v1_5(modulus: int, exponent: int, message: bytes) -> str:
    key_size = (modulus.bit_length() + 7) // 8
    if len(message) > key_size - 11:
        raise ValueError("密码长度超出 RSA 加密限制")

    padding_length = key_size - len(message) - 3
    padding = bytearray()
    while len(padding) < padding_length:
        chunk = os.urandom(padding_length - len(padding))
        padding.extend(byte for byte in chunk if byte != 0)
    encoded_message = b"\x00\x02" + bytes(padding[:padding_length]) + b"\x00" + message
    cipher_int = pow(int.from_bytes(encoded_message, "big"), exponent, modulus)
    cipher_bytes = cipher_int.to_bytes(key_size, "big")
    return base64.b64encode(cipher_bytes).decode("ascii")


def _read_tlv(data: bytes, offset: int, expected_tag: int) -> tuple[bytes, int]:
    if data[offset] != expected_tag:
        raise ValueError("Unexpected RSA public key format")
    length, cursor = _read_length(data, offset + 1)
    end = cursor + length
    return data[cursor:end], end


def _read_length(data: bytes, offset: int) -> tuple[int, int]:
    length = data[offset]
    if length < 0x80:
        return length, offset + 1
    length_size = length & 0x7F
    start = offset + 1
    end = start + length_size
    return int.from_bytes(data[start:end], "big"), end


def _strip_leading_zero(raw: bytes) -> bytes:
    return raw[1:] if raw and raw[0] == 0 else raw

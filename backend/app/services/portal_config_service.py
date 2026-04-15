import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import Lock
from typing import Any

from app.config.portal_config import DEFAULT_PORTAL_CONFIG
from app.schemas.portal_config import (
    AppsConfigUpdate,
    DomainsConfigUpdate,
    PortalConfig,
    QAConfig,
    RecommendationConfig,
    SectionsConfigUpdate,
    SpacesConfigUpdate,
    DisplayConfig,
)


class PortalConfigService:
    def __init__(self, config_path: Path):
        self._config_path = config_path
        self._lock = Lock()
        self._ensure_seeded()

    def get_config(self) -> PortalConfig:
        return PortalConfig.model_validate(self._read_data())

    def replace_config(self, payload: PortalConfig) -> PortalConfig:
        return self._write_config(payload)

    def update_spaces(self, payload: SpacesConfigUpdate) -> PortalConfig:
        data = self.get_config().model_dump()
        data["spaces"] = payload.model_dump()["spaces"]
        return self._write_config(PortalConfig.model_validate(data))

    def update_domains(self, payload: DomainsConfigUpdate) -> PortalConfig:
        data = self.get_config().model_dump()
        data["domains"] = payload.model_dump()["domains"]
        return self._write_config(PortalConfig.model_validate(data))

    def update_sections(self, payload: SectionsConfigUpdate) -> PortalConfig:
        data = self.get_config().model_dump()
        data["sections"] = payload.model_dump()["sections"]
        return self._write_config(PortalConfig.model_validate(data))

    def update_qa(self, payload: QAConfig) -> PortalConfig:
        data = self.get_config().model_dump()
        data["qa"] = payload.model_dump()
        return self._write_config(PortalConfig.model_validate(data))

    def update_recommendation(self, payload: RecommendationConfig) -> PortalConfig:
        data = self.get_config().model_dump()
        data["recommendation"] = payload.model_dump()
        return self._write_config(PortalConfig.model_validate(data))

    def update_display(self, payload: DisplayConfig) -> PortalConfig:
        data = self.get_config().model_dump()
        data["display"] = payload.model_dump()
        return self._write_config(PortalConfig.model_validate(data))

    def update_apps(self, payload: AppsConfigUpdate) -> PortalConfig:
        data = self.get_config().model_dump()
        data["apps"] = payload.model_dump()["apps"]
        return self._write_config(PortalConfig.model_validate(data))

    def _ensure_seeded(self) -> None:
        if self._config_path.exists():
            return
        self._config_path.parent.mkdir(parents=True, exist_ok=True)
        self._atomic_write(DEFAULT_PORTAL_CONFIG)

    def _read_data(self) -> dict[str, Any]:
        with self._config_path.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def _write_config(self, payload: PortalConfig) -> PortalConfig:
        data = payload.model_dump(mode="json")
        self._atomic_write(data)
        return PortalConfig.model_validate(data)

    def _atomic_write(self, data: dict[str, Any]) -> None:
        self._config_path.parent.mkdir(parents=True, exist_ok=True)
        with self._lock:
            with NamedTemporaryFile("w", encoding="utf-8", dir=self._config_path.parent, delete=False) as tmp:
                json.dump(data, tmp, ensure_ascii=False, indent=2)
                tmp.write("\n")
                tmp_path = Path(tmp.name)
            tmp_path.replace(self._config_path)

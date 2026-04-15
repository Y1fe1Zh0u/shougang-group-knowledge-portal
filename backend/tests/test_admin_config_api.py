from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.services.portal_config_service import PortalConfigService


def test_get_admin_config_uses_portal_config_service(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
        response = client.get("/api/v1/admin/config")

    assert response.status_code == 200
    body = response.json()
    assert body["status_code"] == 200
    assert "spaces" in body["data"]
    assert "domains" in body["data"]


def test_put_admin_domains_updates_persisted_config(tmp_path: Path):
    service = PortalConfigService(config_path=tmp_path / "portal_config.json")

    with TestClient(app) as client:
        client.app.state.portal_config_service = service
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

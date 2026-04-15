from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_check_returns_unified_response():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status_code": 200,
        "status_message": "SUCCESS",
        "data": {
            "service": "knowledge-portal-backend",
            "status": "ok",
        },
    }

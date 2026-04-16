from fastapi import Request

from app.clients.bisheng import BishengClient
from app.services.bisheng_runtime_service import BishengRuntimeService
from app.services.portal_config_service import PortalConfigService


def get_portal_config_service(request: Request) -> PortalConfigService:
    return request.app.state.portal_config_service


def get_bisheng_runtime_service(request: Request) -> BishengRuntimeService:
    return request.app.state.bisheng_runtime_service


def get_bisheng_client(request: Request) -> BishengClient:
    if hasattr(request.app.state, "bisheng_client"):
        return request.app.state.bisheng_client
    return request.app.state.bisheng_runtime_service.get_client()

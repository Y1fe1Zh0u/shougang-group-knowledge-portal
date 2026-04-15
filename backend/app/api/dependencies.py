from fastapi import Request

from app.clients.bisheng import BishengClient
from app.services.portal_config_service import PortalConfigService


def get_portal_config_service(request: Request) -> PortalConfigService:
    return request.app.state.portal_config_service


def get_bisheng_client(request: Request) -> BishengClient:
    return request.app.state.bisheng_client

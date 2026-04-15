from fastapi import Request

from app.services.portal_config_service import PortalConfigService


def get_portal_config_service(request: Request) -> PortalConfigService:
    return request.app.state.portal_config_service

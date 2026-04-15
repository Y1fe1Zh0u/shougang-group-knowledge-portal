from fastapi import APIRouter, Depends

from app.api.dependencies import get_portal_config_service
from app.schemas.common import response_ok
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
from app.services.portal_config_service import PortalConfigService

router = APIRouter(prefix="/api/v1/admin/config", tags=["admin-config"])


@router.get("")
async def get_portal_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.get_config())


@router.put("")
async def replace_portal_config(
    payload: PortalConfig,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.replace_config(payload))


@router.get("/spaces")
async def get_spaces_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"spaces": service.get_config().spaces})


@router.put("/spaces")
async def update_spaces_config(
    payload: SpacesConfigUpdate,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"spaces": service.update_spaces(payload).spaces})


@router.get("/domains")
async def get_domains_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"domains": service.get_config().domains})


@router.put("/domains")
async def update_domains_config(
    payload: DomainsConfigUpdate,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"domains": service.update_domains(payload).domains})


@router.get("/sections")
async def get_sections_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"sections": service.get_config().sections})


@router.put("/sections")
async def update_sections_config(
    payload: SectionsConfigUpdate,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"sections": service.update_sections(payload).sections})


@router.get("/qa")
async def get_qa_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.get_config().qa)


@router.put("/qa")
async def update_qa_config(
    payload: QAConfig,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.update_qa(payload).qa)


@router.get("/recommendation")
async def get_recommendation_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.get_config().recommendation)


@router.put("/recommendation")
async def update_recommendation_config(
    payload: RecommendationConfig,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.update_recommendation(payload).recommendation)


@router.get("/display")
async def get_display_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.get_config().display)


@router.put("/display")
async def update_display_config(
    payload: DisplayConfig,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok(service.update_display(payload).display)


@router.get("/apps")
async def get_apps_config(
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"apps": service.get_config().apps})


@router.put("/apps")
async def update_apps_config(
    payload: AppsConfigUpdate,
    service: PortalConfigService = Depends(get_portal_config_service),
):
    return response_ok({"apps": service.update_apps(payload).apps})

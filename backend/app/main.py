from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.services.bisheng_runtime_service import BishengRuntimeService
from app.services.portal_auth_service import PortalAuthService
from app.services.portal_config_service import PortalConfigService
from app.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.bisheng_runtime_service = BishengRuntimeService(
        config_path=settings.bisheng_runtime_config_path,
        default_base_url=str(settings.bisheng_base_url),
        default_timeout_seconds=settings.bisheng_timeout_seconds,
        default_api_token=settings.bisheng_api_token,
        default_username=settings.bisheng_username,
        default_password=(
            settings.bisheng_password.get_secret_value() if settings.bisheng_password else None
        ),
        default_asset_base_url=settings.bisheng_asset_base_url,
    )
    await app.state.bisheng_runtime_service.initialize()
    app.state.portal_auth_service = PortalAuthService(
        runtime_service=app.state.bisheng_runtime_service,
        cookie_name=settings.portal_session_cookie_name,
        ttl_seconds=settings.portal_session_ttl_seconds,
        cookie_secure=settings.portal_session_cookie_secure,
    )
    app.state.portal_config_service = PortalConfigService(
        config_path=settings.portal_config_path,
    )
    yield
    await app.state.bisheng_runtime_service.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
    )
    app.include_router(api_router)
    return app


app = create_app()

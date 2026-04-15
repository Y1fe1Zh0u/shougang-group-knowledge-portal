from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.clients.bisheng import BishengClient
from app.services.portal_config_service import PortalConfigService
from app.settings import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.bisheng_client = BishengClient(
        base_url=str(settings.bisheng_base_url),
        timeout_seconds=settings.bisheng_timeout_seconds,
        api_token=settings.bisheng_api_token,
    )
    app.state.portal_config_service = PortalConfigService(
        config_path=settings.portal_config_path,
    )
    yield
    await app.state.bisheng_client.aclose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        lifespan=lifespan,
    )
    app.include_router(api_router)
    return app


app = create_app()

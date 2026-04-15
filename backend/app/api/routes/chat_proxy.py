from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.api.dependencies import get_bisheng_client, get_portal_config_service
from app.clients.bisheng import BishengClient
from app.schemas.chat import PortalChatCompletionRequest
from app.services.chat_proxy_service import ChatProxyService
from app.services.portal_config_service import PortalConfigService

router = APIRouter(prefix="/api/v1/workstation", tags=["chat-proxy"])


def get_chat_proxy_service(
    bisheng_client: BishengClient = Depends(get_bisheng_client),
    portal_config_service: PortalConfigService = Depends(get_portal_config_service),
) -> ChatProxyService:
    return ChatProxyService(
        bisheng_client=bisheng_client,
        portal_config_service=portal_config_service,
        default_model=get_settings().bisheng_default_model,
    )


@router.post("/chat/completions")
async def chat_completions(
    payload: PortalChatCompletionRequest,
    service: ChatProxyService = Depends(get_chat_proxy_service),
):
    async def stream():
        async for chunk in service.stream_chat_completion(payload):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream")
from app.settings import get_settings

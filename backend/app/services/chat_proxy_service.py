from collections.abc import AsyncIterator

from app.clients.bisheng import BishengClient
from app.schemas.chat import PortalChatCompletionRequest, UseKnowledgeBaseParam
from app.services.portal_config_service import PortalConfigService


class ChatProxyService:
    def __init__(
        self,
        bisheng_client: BishengClient,
        portal_config_service: PortalConfigService,
        default_model: str | None = None,
    ):
        self._bisheng = bisheng_client
        self._config_service = portal_config_service
        self._default_model = default_model or ""

    async def stream_chat_completion(self, payload: PortalChatCompletionRequest) -> AsyncIterator[bytes]:
        config = self._config_service.get_config()
        enabled_space_ids = {space.id for space in config.spaces if space.enabled}
        allowed_knowledge_space_ids = [
            space_id
            for space_id in config.qa.knowledge_space_ids
            if space_id in enabled_space_ids
        ]
        scene = payload.scene if payload.scene in {"search", "qa"} else "qa"
        system_prompt = (
            config.qa.ai_search_system_prompt
            if scene == "search"
            else config.qa.qa_system_prompt
        )
        selected_model = payload.model or config.qa.selected_model or self._default_model
        use_knowledge_base = payload.use_knowledge_base or UseKnowledgeBaseParam()
        request_body = payload.model_dump(exclude={"scene"}, mode="json")
        request_body["model"] = selected_model
        request_body["text"] = self._build_final_prompt(system_prompt, payload.text)
        request_body["use_knowledge_base"] = {
            "personal_knowledge_enabled": use_knowledge_base.personal_knowledge_enabled,
            "organization_knowledge_ids": use_knowledge_base.organization_knowledge_ids,
            "knowledge_space_ids": allowed_knowledge_space_ids,
        }
        async for chunk in self._bisheng.stream_post(
            "/api/v1/workstation/chat/completions",
            json=request_body,
        ):
            yield chunk

    @staticmethod
    def _build_final_prompt(system_prompt: str, user_text: str) -> str:
        if not system_prompt.strip():
            return user_text
        return f"{system_prompt.strip()}\n\n用户问题：\n{user_text.strip()}"

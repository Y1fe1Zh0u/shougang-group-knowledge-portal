from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_bisheng_client, get_portal_config_service
from app.schemas.common import response_ok
from app.services.knowledge_service import KnowledgeService
from app.services.portal_config_service import PortalConfigService
from app.clients.bisheng import BishengClient

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


def get_knowledge_service(
    bisheng_client: BishengClient = Depends(get_bisheng_client),
    portal_config_service: PortalConfigService = Depends(get_portal_config_service),
) -> KnowledgeService:
    return KnowledgeService(
        bisheng_client=bisheng_client,
        portal_config_service=portal_config_service,
    )


@router.get("/files")
async def search_files(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    space_ids: Annotated[Optional[list[int]], Query()] = None,
    file_ext: Optional[str] = None,
    sort: str = "updated_at",
    page: int = 1,
    page_size: int = 20,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    return response_ok(
        await service.search_files(
            q=q,
            tag=tag,
            requested_space_ids=space_ids,
            file_ext=file_ext,
            sort=sort,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/tags")
async def get_aggregated_tags(
    space_ids: Annotated[Optional[list[int]], Query()] = None,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    return response_ok(await service.get_aggregated_tags(requested_space_ids=space_ids))


@router.get("/space/{space_id}/files")
async def list_space_files(
    space_id: int,
    file_ext: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    return response_ok(
        await service.list_space_files(
            space_id=space_id,
            file_ext=file_ext,
            tag=tag,
            page=page,
            page_size=page_size,
        )
    )


@router.get("/space/{space_id}/tags")
async def get_space_tags(
    space_id: int,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    return response_ok(await service.get_space_tags(space_id))


@router.get("/space/{space_id}/files/{file_id}")
async def get_file_detail(
    space_id: int,
    file_id: int,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    detail = await service.get_file_detail(space_id=space_id, file_id=file_id)
    return response_ok(detail)


@router.get("/space/{space_id}/files/{file_id}/preview")
async def get_file_preview(
    space_id: int,
    file_id: int,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    preview = await service.get_file_preview(space_id=space_id, file_id=file_id)
    return response_ok(preview)


@router.get("/space/{space_id}/files/{file_id}/chunks")
async def get_file_chunks(
    space_id: int,
    file_id: int,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    chunks = await service.get_file_chunks(space_id=space_id, file_id=file_id)
    return response_ok(chunks)


@router.get("/space/{space_id}/files/{file_id}/related")
async def get_related_files(
    space_id: int,
    file_id: int,
    limit: int = 3,
    service: KnowledgeService = Depends(get_knowledge_service),
):
    return response_ok(
        await service.get_related_files(
            space_id=space_id,
            file_id=file_id,
            limit=limit,
        )
    )

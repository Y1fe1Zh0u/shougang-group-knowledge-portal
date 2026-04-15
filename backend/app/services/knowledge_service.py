import asyncio
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from app.clients.bisheng import BishengClient
from app.schemas.knowledge import (
    FilePreviewData,
    KnowledgeFileDetail,
    KnowledgeFileItem,
    KnowledgeFileSpace,
    PagedKnowledgeFileData,
    RelatedKnowledgeFileData,
)
from app.services.portal_config_service import PortalConfigService

SUCCESS_STATUS = 2
FILE_TYPE = 1


@dataclass
class SpaceSearchResult:
    items: list[dict[str, Any]]
    total: int


class KnowledgeService:
    def __init__(
        self,
        bisheng_client: BishengClient,
        portal_config_service: PortalConfigService,
        page_size_limit: int = 100,
    ):
        self._bisheng = bisheng_client
        self._config_service = portal_config_service
        self._page_size_limit = page_size_limit

    def get_enabled_space_ids(self) -> list[int]:
        config = self._config_service.get_config()
        return [space.id for space in config.spaces if space.enabled]

    def get_space_name_map(self) -> dict[int, str]:
        config = self._config_service.get_config()
        return {space.id: space.name for space in config.spaces}

    async def get_space_tags(self, space_id: int) -> list[str]:
        if space_id not in self.get_enabled_space_ids():
            return []
        tag_lookup = await self._get_space_tag_lookup(space_id)
        return sorted(tag_lookup.keys())

    async def get_aggregated_tags(self, requested_space_ids: Optional[list[int]] = None) -> list[str]:
        space_ids = self.resolve_requested_space_ids(requested_space_ids)
        if not space_ids:
            return []
        lookups = await asyncio.gather(*[self._get_space_tag_lookup(space_id) for space_id in space_ids])
        tags = {tag_name for lookup in lookups for tag_name in lookup.keys()}
        return sorted(tags)

    def resolve_requested_space_ids(self, requested_space_ids: Optional[list[int]] = None) -> list[int]:
        enabled_space_ids = set(self.get_enabled_space_ids())
        if requested_space_ids:
            return sorted(enabled_space_ids.intersection(requested_space_ids))
        return sorted(enabled_space_ids)

    async def list_space_files(
        self,
        space_id: int,
        file_ext: Optional[str],
        tag: Optional[str],
        page: int,
        page_size: int,
    ) -> PagedKnowledgeFileData:
        if space_id not in self.get_enabled_space_ids():
            return PagedKnowledgeFileData(data=[], total=0, page=page, page_size=page_size)

        search_result = await self._fetch_space_files(space_id=space_id, keyword=None, tag_name=tag)
        filtered = self._filter_items(
            items=search_result.items,
            allowed_space_ids={space_id},
            file_ext=file_ext,
        )
        sorted_items = self._sort_items(filtered, sort="updated_at", keyword=None)
        mapped = self._map_items(sorted_items)
        return self._paginate(mapped, page=page, page_size=page_size)

    async def search_files(
        self,
        q: Optional[str],
        tag: Optional[str],
        requested_space_ids: Optional[list[int]],
        file_ext: Optional[str],
        sort: str,
        page: int,
        page_size: int,
    ) -> PagedKnowledgeFileData:
        if not q and not tag:
            return PagedKnowledgeFileData(data=[], total=0, page=page, page_size=page_size)

        space_ids = self.resolve_requested_space_ids(requested_space_ids)
        if not space_ids:
            return PagedKnowledgeFileData(data=[], total=0, page=page, page_size=page_size)

        results = await asyncio.gather(
            *[
                self._fetch_space_files(space_id=space_id, keyword=q, tag_name=tag)
                for space_id in space_ids
            ]
        )
        merged_items = [item for result in results for item in result.items]
        filtered = self._filter_items(
            items=merged_items,
            allowed_space_ids=set(space_ids),
            file_ext=file_ext,
        )
        sorted_items = self._sort_items(filtered, sort=sort, keyword=q)
        mapped = self._map_items(sorted_items)
        return self._paginate(mapped, page=page, page_size=page_size)

    async def get_file_detail(self, space_id: int, file_id: int) -> Optional[KnowledgeFileDetail]:
        if space_id not in self.get_enabled_space_ids():
            return None

        file_info_resp = await self._bisheng.get_json(f"/api/v1/knowledge/file/info/{file_id}")
        file_info = file_info_resp.get("data") or {}
        if not file_info or int(file_info.get("knowledge_id", 0)) != space_id:
            return None

        tags = await self._get_file_tags(space_id=space_id, file_id=file_id, file_name=file_info.get("file_name", ""))
        source = self.get_space_name_map().get(space_id, str(space_id))
        return KnowledgeFileDetail(
            id=file_id,
            space_id=space_id,
            title=self._clean_title(file_info.get("file_name", "")),
            summary=file_info.get("abstract") or "",
            source=source,
            updated_at=self._serialize_datetime(file_info.get("update_time")),
            tags=tags,
            file_ext=self._get_file_ext(file_info.get("file_name", "")),
            space=KnowledgeFileSpace(id=space_id, name=source),
        )

    async def get_file_preview(self, space_id: int, file_id: int) -> Optional[FilePreviewData]:
        detail = await self.get_file_detail(space_id=space_id, file_id=file_id)
        if detail is None:
            return None
        preview_resp = await self._bisheng.get_json(f"/api/v1/knowledge/space/{space_id}/files/{file_id}/preview")
        data = preview_resp.get("data") or {}
        if not data:
            return None
        return FilePreviewData.model_validate(data)

    async def get_related_files(
        self,
        space_id: int,
        file_id: int,
        limit: int,
    ) -> RelatedKnowledgeFileData:
        detail = await self.get_file_detail(space_id=space_id, file_id=file_id)
        if detail is None or not detail.tags:
            return RelatedKnowledgeFileData(data=[], total=0)

        candidate_map: dict[int, dict[str, Any]] = {}
        for tag_name in detail.tags:
            search_result = await self.search_files(
                q=None,
                tag=tag_name,
                requested_space_ids=None,
                file_ext=None,
                sort="updated_at",
                page=1,
                page_size=self._page_size_limit,
            )
            for item in search_result.data:
                if item.id == file_id:
                    continue
                entry = candidate_map.setdefault(
                    item.id,
                    {"item": item, "score": 0},
                )
                entry["score"] += 1

        sorted_candidates = sorted(
            candidate_map.values(),
            key=lambda value: (
                -value["score"],
                value["item"].updated_at,
            ),
        )
        data = [value["item"] for value in sorted_candidates[:limit]]
        return RelatedKnowledgeFileData(data=data[:limit], total=len(data[:limit]))

    async def _fetch_space_files(
        self,
        space_id: int,
        keyword: Optional[str],
        tag_name: Optional[str],
    ) -> SpaceSearchResult:
        tag_ids = None
        if tag_name:
            tag_lookup = await self._get_space_tag_lookup(space_id)
            tag_id = tag_lookup.get(tag_name)
            if tag_id is None:
                return SpaceSearchResult(items=[], total=0)
            tag_ids = [tag_id]

        page = 1
        page_size = self._page_size_limit
        all_items: list[dict[str, Any]] = []
        total = 0
        while True:
            params: dict[str, Any] = {
                "page": page,
                "page_size": page_size,
                "file_status": SUCCESS_STATUS,
            }
            if keyword:
                params["keyword"] = keyword
            if tag_ids:
                params["tag_ids"] = tag_ids
            response = await self._bisheng.get_json(f"/api/v1/knowledge/space/{space_id}/search", params=params)
            data = response.get("data") or {}
            batch = data.get("data") or []
            total = int(data.get("total") or 0)
            all_items.extend(batch)
            if len(all_items) >= total or not batch:
                break
            page += 1
        return SpaceSearchResult(items=all_items, total=total)

    async def _get_space_tag_lookup(self, space_id: int) -> dict[str, int]:
        response = await self._bisheng.get_json(f"/api/v1/knowledge/space/{space_id}/tag")
        tags = response.get("data") or []
        return {tag["name"]: int(tag["id"]) for tag in tags if "name" in tag and "id" in tag}

    async def _get_file_tags(self, space_id: int, file_id: int, file_name: str) -> list[str]:
        search_result = await self._fetch_space_files(space_id=space_id, keyword=file_name or None, tag_name=None)
        for item in search_result.items:
            if int(item.get("id", 0)) == file_id:
                return self._extract_tag_names(item)
        return []

    def _filter_items(
        self,
        items: list[dict[str, Any]],
        allowed_space_ids: set[int],
        file_ext: Optional[str],
    ) -> list[dict[str, Any]]:
        filtered: list[dict[str, Any]] = []
        for item in items:
            if int(item.get("knowledge_id", 0)) not in allowed_space_ids:
                continue
            if int(item.get("file_type", -1)) != FILE_TYPE:
                continue
            if int(item.get("status", -1)) != SUCCESS_STATUS:
                continue
            file_name = item.get("file_name") or ""
            if file_ext and self._get_file_ext(file_name) != file_ext:
                continue
            filtered.append(item)
        return filtered

    def _sort_items(self, items: list[dict[str, Any]], sort: str, keyword: Optional[str]) -> list[dict[str, Any]]:
        if sort == "updated_at" or not keyword:
            return sorted(items, key=lambda item: self._serialize_datetime(item.get("update_time")), reverse=True)

        keyword_lower = keyword.lower()

        def score(item: dict[str, Any]) -> tuple[int, str]:
            title = (item.get("file_name") or "").lower()
            summary = (item.get("abstract") or "").lower()
            tags = [tag.lower() for tag in self._extract_tag_names(item)]
            hit_score = 0
            if title == keyword_lower:
                hit_score += 4
            if keyword_lower in title:
                hit_score += 3
            if keyword_lower in summary:
                hit_score += 2
            if any(keyword_lower in tag for tag in tags):
                hit_score += 1
            return hit_score, self._serialize_datetime(item.get("update_time"))

        return sorted(items, key=score, reverse=True)

    def _map_items(self, items: list[dict[str, Any]]) -> list[KnowledgeFileItem]:
        space_name_map = self.get_space_name_map()
        mapped: list[KnowledgeFileItem] = []
        for item in items:
            space_id = int(item.get("knowledge_id", 0))
            file_name = item.get("file_name") or ""
            mapped.append(
                KnowledgeFileItem(
                    id=int(item.get("id", 0)),
                    space_id=space_id,
                    title=self._clean_title(file_name),
                    summary=item.get("abstract") or "",
                    source=space_name_map.get(space_id, str(space_id)),
                    updated_at=self._serialize_datetime(item.get("update_time")),
                    tags=self._extract_tag_names(item),
                    file_ext=self._get_file_ext(file_name),
                )
            )
        return mapped

    def _paginate(
        self,
        items: list[KnowledgeFileItem],
        page: int,
        page_size: int,
    ) -> PagedKnowledgeFileData:
        start = max(page - 1, 0) * page_size
        end = start + page_size
        return PagedKnowledgeFileData(
            data=items[start:end],
            total=len(items),
            page=page,
            page_size=page_size,
        )

    @staticmethod
    def _extract_tag_names(item: dict[str, Any]) -> list[str]:
        tags = item.get("tags") or []
        names: list[str] = []
        for tag in tags:
            if isinstance(tag, dict) and tag.get("name"):
                names.append(tag["name"])
        return names

    @staticmethod
    def _clean_title(file_name: str) -> str:
        path = Path(file_name)
        return path.stem or file_name

    @staticmethod
    def _get_file_ext(file_name: str) -> str:
        suffix = Path(file_name).suffix.lower()
        return suffix[1:] if suffix.startswith(".") else suffix

    @staticmethod
    def _serialize_datetime(value: Any) -> str:
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, str):
            return value
        return ""

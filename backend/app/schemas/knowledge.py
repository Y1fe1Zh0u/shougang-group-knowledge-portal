from pydantic import BaseModel, Field


class KnowledgeFileItem(BaseModel):
    id: int
    space_id: int
    title: str
    summary: str
    source: str
    updated_at: str
    tags: list[str] = Field(default_factory=list)
    file_ext: str = ""


class KnowledgeFileSpace(BaseModel):
    id: int
    name: str


class KnowledgeFileDetail(KnowledgeFileItem):
    space: KnowledgeFileSpace


class PagedKnowledgeFileData(BaseModel):
    data: list[KnowledgeFileItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20


class RelatedKnowledgeFileData(BaseModel):
    data: list[KnowledgeFileItem] = Field(default_factory=list)
    total: int = 0


class FilePreviewData(BaseModel):
    original_url: str
    preview_url: str

from pydantic import BaseModel, Field, field_validator


class SpaceConfig(BaseModel):
    id: int
    name: str
    file_count: int = 0
    tag_count: int = 0
    enabled: bool = True


class DomainConfig(BaseModel):
    name: str
    space_ids: list[int] = Field(default_factory=list)
    color: str
    bg: str
    icon: str
    background_image: str = ""
    enabled: bool = True

    @field_validator("space_ids")
    @classmethod
    def validate_space_ids(cls, value: list[int]) -> list[int]:
        if not value:
            raise ValueError("space_ids cannot be empty")
        return value


class SectionConfig(BaseModel):
    title: str
    tag: str
    link: str
    icon: str
    color: str = "#2563eb"
    bg: str = "#eff6ff"
    enabled: bool = True


class QAConfig(BaseModel):
    knowledge_space_ids: list[int] = Field(default_factory=list)
    panel_title: str = "技术问答·专家在线"
    welcome_message: str = "你好，我是首钢知库智能助手，请问有什么可以帮您？"
    hot_questions: list[str] = Field(default_factory=list)
    ai_search_system_prompt: str = ""
    qa_system_prompt: str = ""
    selected_model: str = ""


class QAModelOption(BaseModel):
    key: str = ""
    id: str
    name: str = ""
    display_name: str = ""
    visual: bool = False


class QAModelOptionsResponse(BaseModel):
    selected_model: str = ""
    models: list[QAModelOption] = Field(default_factory=list)


class SpaceOption(BaseModel):
    id: int
    name: str
    description: str = ""
    file_count: int = 0


class SpaceOptionsResponse(BaseModel):
    options: list[SpaceOption] = Field(default_factory=list)


class SpaceFileItem(BaseModel):
    id: int
    name: str


class SpaceFilesResponse(BaseModel):
    space_id: int
    files: list[SpaceFileItem] = Field(default_factory=list)


class RecommendationConfig(BaseModel):
    provider: str
    home_strategy: str
    detail_strategy: str


class DisplayHomeConfig(BaseModel):
    section_page_size: int = 6
    hot_tags_count: int = 8
    qa_hot_count: int = 4
    domain_count: int = 6
    spaces_count: int = 6
    apps_count: int = 6


class DisplayListConfig(BaseModel):
    page_size: int = 10
    visible_tag_count: int = 2


class DisplaySearchConfig(BaseModel):
    page_size: int = 10
    visible_tag_count: int = 2


class DisplayDetailConfig(BaseModel):
    related_files_count: int = 3
    visible_tag_count: int = 2


class DisplayConfig(BaseModel):
    home: DisplayHomeConfig
    list: DisplayListConfig
    search: DisplaySearchConfig
    detail: DisplayDetailConfig


class AppConfig(BaseModel):
    id: int
    name: str
    icon: str
    desc: str
    color: str
    bg: str
    url: str = ""
    enabled: bool = True


class PortalConfig(BaseModel):
    spaces: list[SpaceConfig] = Field(default_factory=list)
    domains: list[DomainConfig] = Field(default_factory=list)
    sections: list[SectionConfig] = Field(default_factory=list)
    qa: QAConfig
    recommendation: RecommendationConfig
    display: DisplayConfig
    apps: list[AppConfig] = Field(default_factory=list)


class SpacesConfigUpdate(BaseModel):
    spaces: list[SpaceConfig]


class DomainsConfigUpdate(BaseModel):
    domains: list[DomainConfig]


class SectionsConfigUpdate(BaseModel):
    sections: list[SectionConfig]


class AppsConfigUpdate(BaseModel):
    apps: list[AppConfig]

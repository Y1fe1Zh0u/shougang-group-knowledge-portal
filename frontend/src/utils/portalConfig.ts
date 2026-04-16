import type { AppConfig, DisplayConfig, DomainConfig, SectionConfig, SpaceConfig } from '../api/adminConfig';
import { DISPLAY_CONFIG } from '../config/display';

export interface RuntimeDisplayConfig {
  home: {
    sectionPageSize: number;
    hotTagsCount: number;
    qaHotCount: number;
    domainCount: number;
    spacesCount: number;
    appsCount: number;
  };
  list: {
    pageSize: number;
    visibleTagCount: number;
  };
  search: {
    pageSize: number;
    visibleTagCount: number;
  };
  detail: {
    relatedFilesCount: number;
    visibleTagCount: number;
  };
}

export function toRuntimeDisplayConfig(display?: DisplayConfig): RuntimeDisplayConfig {
  if (!display) return DISPLAY_CONFIG;
  return {
    home: {
      sectionPageSize: display.home.section_page_size,
      hotTagsCount: display.home.hot_tags_count,
      qaHotCount: display.home.qa_hot_count,
      domainCount: display.home.domain_count,
      spacesCount: display.home.spaces_count,
      appsCount: display.home.apps_count,
    },
    list: {
      pageSize: display.list.page_size,
      visibleTagCount: display.list.visible_tag_count,
    },
    search: {
      pageSize: display.search.page_size,
      visibleTagCount: display.search.visible_tag_count,
    },
    detail: {
      relatedFilesCount: display.detail.related_files_count,
      visibleTagCount: display.detail.visible_tag_count,
    },
  };
}

export function getEnabledSpaces(spaces: SpaceConfig[]): SpaceConfig[] {
  return spaces.filter((space) => space.enabled);
}

export function getEnabledDomains(domains: DomainConfig[], spaces?: SpaceConfig[]): DomainConfig[] {
  const enabledSpaceIds = spaces ? new Set(getEnabledSpaces(spaces).map((space) => space.id)) : null;
  return domains.filter((domain) => {
    if (!domain.enabled || !domain.space_ids.length) return false;
    if (!enabledSpaceIds) return true;
    return domain.space_ids.some((spaceId) => enabledSpaceIds.has(spaceId));
  });
}

export function getEnabledSections(sections: SectionConfig[]): SectionConfig[] {
  return sections.filter((section) => section.enabled);
}

export function getEnabledApps(apps: AppConfig[]): AppConfig[] {
  return apps.filter((app) => app.enabled);
}

export function getPrimarySpaceId(spaceIds: number[]): number | undefined {
  return spaceIds.find((spaceId) => Number.isFinite(spaceId));
}

import type { AppConfig, BannerSlide, DisplayConfig, DomainConfig, SectionConfig, SpaceConfig } from '../api/adminConfig';
import { DISPLAY_CONFIG } from '../config/display';

export interface RuntimeBanner {
  label: string;
  title: string;
  desc: string;
  imageUrl: string;
  linkUrl: string;
}

export const FALLBACK_HOME_BANNERS: RuntimeBanner[] = [
  {
    label: '平台概览',
    title: '首钢知库 — 钢铁行业知识共享平台',
    desc: '汇聚设备、轧线、冷轧、能源全域知识，助力技术传承与创新',
    imageUrl: '/banner-hero-1.jpg',
    linkUrl: '',
  },
  {
    label: '专题推荐',
    title: '典型案例·事故分析专题上线',
    desc: '从实践中学习，从案例中成长，构建安全生产知识体系',
    imageUrl: '/banner-hero-2.jpg',
    linkUrl: '',
  },
  {
    label: '能力升级',
    title: '技术问答全新升级',
    desc: 'AI 驱动的智能问答系统，快速定位知识、精准解答技术难题',
    imageUrl: '/banner-hero-3.jpg',
    linkUrl: '',
  },
];

export function resolveHomeBanners(banners?: BannerSlide[]): RuntimeBanner[] {
  const portalBanners = (banners ?? [])
    .filter((banner) => banner.enabled && banner.image_url)
    .map<RuntimeBanner>((banner) => ({
      label: banner.label ?? '',
      title: banner.title ?? '',
      desc: banner.desc ?? '',
      imageUrl: banner.image_url,
      linkUrl: banner.link_url ?? '',
    }));
  return portalBanners.length ? portalBanners : FALLBACK_HOME_BANNERS;
}

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

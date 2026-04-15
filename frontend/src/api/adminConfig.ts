export interface SpaceConfig {
  id: number;
  name: string;
  file_count: number;
  tag_count: number;
  enabled: boolean;
}

export interface DomainConfig {
  name: string;
  space_ids: number[];
  color: string;
  bg: string;
  icon: string;
  background_image: string;
  enabled: boolean;
}

export interface SectionConfig {
  title: string;
  tag: string;
  link: string;
  icon: string;
  enabled: boolean;
}

export interface QAConfig {
  knowledge_space_ids: number[];
  hot_questions: string[];
  ai_search_system_prompt: string;
  qa_system_prompt: string;
}

export interface RecommendationConfig {
  provider: string;
  home_strategy: string;
  detail_strategy: string;
}

export interface DisplayHomeConfig {
  section_page_size: number;
  hot_tags_count: number;
  qa_hot_count: number;
  domain_count: number;
  spaces_count: number;
  apps_count: number;
}

export interface DisplayListConfig {
  page_size: number;
  visible_tag_count: number;
}

export interface DisplaySearchConfig {
  page_size: number;
  visible_tag_count: number;
}

export interface DisplayDetailConfig {
  related_files_count: number;
  visible_tag_count: number;
}

export interface DisplayConfig {
  home: DisplayHomeConfig;
  list: DisplayListConfig;
  search: DisplaySearchConfig;
  detail: DisplayDetailConfig;
}

export interface AppConfig {
  id: number;
  name: string;
  icon: string;
  desc: string;
  color: string;
  bg: string;
  url: string;
  enabled: boolean;
}

export interface PortalConfig {
  spaces: SpaceConfig[];
  domains: DomainConfig[];
  sections: SectionConfig[];
  qa: QAConfig;
  recommendation: RecommendationConfig;
  display: DisplayConfig;
  apps: AppConfig[];
}

interface ApiEnvelope<T> {
  status_code: number;
  status_message: string;
  data: T;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload?.status_message || '请求失败');
  }
  return payload.data;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  return parseResponse<T>(response);
}

export function fetchAdminConfig() {
  return request<PortalConfig>('/api/v1/admin/config');
}

export function updateSpacesConfig(spaces: SpaceConfig[]) {
  return request<{ spaces: SpaceConfig[] }>('/api/v1/admin/config/spaces', {
    method: 'PUT',
    body: JSON.stringify({ spaces }),
  });
}

export function updateDomainsConfig(domains: DomainConfig[]) {
  return request<{ domains: DomainConfig[] }>('/api/v1/admin/config/domains', {
    method: 'PUT',
    body: JSON.stringify({ domains }),
  });
}

export function updateSectionsConfig(sections: SectionConfig[]) {
  return request<{ sections: SectionConfig[] }>('/api/v1/admin/config/sections', {
    method: 'PUT',
    body: JSON.stringify({ sections }),
  });
}

export function updateQaConfig(qa: QAConfig) {
  return request<QAConfig>('/api/v1/admin/config/qa', {
    method: 'PUT',
    body: JSON.stringify(qa),
  });
}

export function updateRecommendationConfig(recommendation: RecommendationConfig) {
  return request<RecommendationConfig>('/api/v1/admin/config/recommendation', {
    method: 'PUT',
    body: JSON.stringify(recommendation),
  });
}

export function updateDisplayConfig(display: DisplayConfig) {
  return request<DisplayConfig>('/api/v1/admin/config/display', {
    method: 'PUT',
    body: JSON.stringify(display),
  });
}

export function updateAppsConfig(apps: AppConfig[]) {
  return request<{ apps: AppConfig[] }>('/api/v1/admin/config/apps', {
    method: 'PUT',
    body: JSON.stringify({ apps }),
  });
}

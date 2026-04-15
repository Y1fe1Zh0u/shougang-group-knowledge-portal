import { fetchAdminConfig, type PortalConfig } from './adminConfig';

export interface FileItem {
  id: number;
  spaceId: number;
  title: string;
  summary: string;
  source: string;
  date: string;
  tags: string[];
  ext: string;
}

export interface FileDetail extends FileItem {
  space: { id: number; name: string };
}

export interface FilePreviewData {
  originalUrl: string;
  previewUrl: string;
}

interface ApiEnvelope<T> {
  status_code: number;
  status_message: string;
  data: T;
}

interface KnowledgeFileItemDto {
  id: number;
  space_id: number;
  title: string;
  summary: string;
  source: string;
  updated_at: string;
  tags: string[];
  file_ext?: string;
}

interface KnowledgeFileDetailDto extends KnowledgeFileItemDto {
  space: { id: number; name: string };
}

interface PagedKnowledgeFileDataDto {
  data: KnowledgeFileItemDto[];
  total: number;
  page: number;
  page_size: number;
}

interface RelatedKnowledgeFileDataDto {
  data: KnowledgeFileItemDto[];
  total: number;
}

interface FilePreviewDataDto {
  original_url: string;
  preview_url: string;
}

export function mapKnowledgeFileItem(dto: KnowledgeFileItemDto): FileItem {
  return {
    id: dto.id,
    spaceId: dto.space_id,
    title: dto.title,
    summary: dto.summary,
    source: dto.source,
    date: dto.updated_at,
    tags: dto.tags ?? [],
    ext: dto.file_ext ?? '',
  };
}

function mapKnowledgeFileDetail(dto: KnowledgeFileDetailDto): FileDetail {
  return {
    ...mapKnowledgeFileItem(dto),
    space: dto.space,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload?.status_message || '请求失败');
  }
  return payload.data;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  return parseResponse<T>(response);
}

export async function fetchPortalContentConfig(): Promise<PortalConfig> {
  return fetchAdminConfig();
}

export async function fetchAggregatedTags(spaceIds?: number[]): Promise<string[]> {
  const params = new URLSearchParams();
  spaceIds?.forEach((id) => params.append('space_ids', String(id)));
  const query = params.toString();
  return request<string[]>(`/api/v1/knowledge/tags${query ? `?${query}` : ''}`);
}

export async function fetchSpaceTags(spaceId: number): Promise<string[]> {
  return request<string[]>(`/api/v1/knowledge/space/${spaceId}/tags`);
}

export async function searchFiles(params: {
  q?: string;
  tag?: string;
  spaceIds?: number[];
  fileExt?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: FileItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.tag) query.set('tag', params.tag);
  if (params.fileExt) query.set('file_ext', params.fileExt);
  if (params.sort) query.set('sort', params.sort);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('page_size', String(params.pageSize));
  params.spaceIds?.forEach((id) => query.append('space_ids', String(id)));

  const data = await request<PagedKnowledgeFileDataDto>(`/api/v1/knowledge/files?${query.toString()}`);
  return {
    data: data.data.map(mapKnowledgeFileItem),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  };
}

export async function fetchSpaceFiles(params: {
  spaceId: number;
  tag?: string;
  fileExt?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ data: FileItem[]; total: number; page: number; pageSize: number }> {
  const query = new URLSearchParams();
  if (params.tag) query.set('tag', params.tag);
  if (params.fileExt) query.set('file_ext', params.fileExt);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('page_size', String(params.pageSize));

  const data = await request<PagedKnowledgeFileDataDto>(
    `/api/v1/knowledge/space/${params.spaceId}/files?${query.toString()}`,
  );
  return {
    data: data.data.map(mapKnowledgeFileItem),
    total: data.total,
    page: data.page,
    pageSize: data.page_size,
  };
}

export async function fetchFileDetail(spaceId: number, fileId: number): Promise<FileDetail | null> {
  const data = await request<KnowledgeFileDetailDto | null>(`/api/v1/knowledge/space/${spaceId}/files/${fileId}`);
  return data ? mapKnowledgeFileDetail(data) : null;
}

export async function fetchFilePreview(spaceId: number, fileId: number): Promise<FilePreviewData | null> {
  const data = await request<FilePreviewDataDto | null>(`/api/v1/knowledge/space/${spaceId}/files/${fileId}/preview`);
  if (!data) return null;
  return {
    originalUrl: data.original_url,
    previewUrl: data.preview_url,
  };
}

export async function fetchRelatedFiles(spaceId: number, fileId: number, limit: number): Promise<FileItem[]> {
  const data = await request<RelatedKnowledgeFileDataDto>(
    `/api/v1/knowledge/space/${spaceId}/files/${fileId}/related?limit=${limit}`,
  );
  return data.data.map(mapKnowledgeFileItem);
}

export async function streamChatCompletion(params: {
  scene: 'search' | 'qa';
  text: string;
  knowledgeSpaceIds: number[];
  model?: string;
  onFinalText: (text: string) => void;
}): Promise<void> {
  const response = await fetch('/api/v1/workstation/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientTimestamp: new Date().toISOString(),
      model: params.model ?? '',
      scene: params.scene,
      text: params.text,
      use_knowledge_base: {
        personal_knowledge_enabled: false,
        organization_knowledge_ids: [],
        knowledge_space_ids: params.knowledgeSpaceIds,
      },
      files: [],
    }),
  });
  if (!response.ok || !response.body) {
    throw new Error('问答请求失败');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const line = event.split('\n').find((item) => item.startsWith('data: '));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as {
          final?: boolean;
          responseMessage?: { text?: string };
        };
        if (payload.final && payload.responseMessage?.text) {
          params.onFinalText(payload.responseMessage.text);
        }
      } catch {
        // Ignore non-final events during the current phase.
      }
    }
  }
}

import type { FilePreviewData } from '../api/content';

const IMAGE_EXTENSIONS = new Set(['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const UNSUPPORTED_EXTENSIONS = new Set(['doc', 'ppt', 'pptx']);

export type FilePreviewMode = 'frame' | 'image' | 'unsupported' | 'missing';

export interface ResolvedFilePreview {
  downloadUrl: string;
  mode: FilePreviewMode;
  reason: string;
  src: string;
  usesOriginalFallback: boolean;
}

export function resolveFilePreview(ext: string, preview: FilePreviewData | null): ResolvedFilePreview {
  const normalizedExt = ext.trim().toLowerCase();
  const previewUrl = preview?.previewUrl?.trim() ?? '';
  const originalUrl = preview?.originalUrl?.trim() ?? '';
  const usesOriginalFallback = false;

  if (!previewUrl && !originalUrl) {
    return {
      downloadUrl: originalUrl,
      mode: 'missing',
      reason: '当前文件没有可用的预览地址。',
      src: '',
      usesOriginalFallback: false,
    };
  }

  if (UNSUPPORTED_EXTENSIONS.has(normalizedExt)) {
    return {
      downloadUrl: originalUrl,
      mode: 'unsupported',
      reason: '当前文件类型暂不支持在线预览，请下载原文件查看。',
      src: '',
      usesOriginalFallback,
    };
  }

  if (IMAGE_EXTENSIONS.has(normalizedExt)) {
    return {
      downloadUrl: originalUrl,
      mode: 'image',
      reason: '',
      src: previewUrl || originalUrl,
      usesOriginalFallback,
    };
  }

  if (!previewUrl) {
    return {
      downloadUrl: originalUrl,
      mode: 'missing',
      reason: '当前文件暂未生成可直接预览的地址。',
      src: '',
      usesOriginalFallback,
    };
  }

  return {
    downloadUrl: originalUrl,
    mode: 'frame',
    reason: '',
    src: previewUrl,
    usesOriginalFallback,
  };
}

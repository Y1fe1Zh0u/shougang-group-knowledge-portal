import type { DomainConfig } from '../api/adminConfig';

export interface DomainVisualPreset {
  backgroundImage?: string;
}

function normalizeImagePath(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith('http://')
    || trimmed.startsWith('https://')
    || trimmed.startsWith('//')
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}

export function getDomainVisualPreset(domain: Pick<DomainConfig, 'name' | 'background_image'>): DomainVisualPreset {
  const backgroundImage = normalizeImagePath(domain.background_image);
  return backgroundImage ? { backgroundImage } : {};
}

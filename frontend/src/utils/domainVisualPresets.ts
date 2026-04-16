import type { DomainConfig } from '../api/adminConfig';

export interface DomainVisualPreset {
  backgroundImage?: string;
  logoImage?: string;
}

const DOMAIN_VISUAL_PRESETS: Record<string, DomainVisualPreset> = {
  库1: {
    backgroundImage: '/rolling-domain-bg.jpg',
  },
  库2: {
    backgroundImage: '/cold-domain-bg.jpg',
  },
  库3: {
    logoImage: '/site-logo.png',
  },
  库4: {
    logoImage: '/shougang-stock-logo.png',
  },
};

export function getDomainVisualPreset(domain: Pick<DomainConfig, 'name' | 'background_image'>): DomainVisualPreset {
  const configuredBackground = domain.background_image.trim();
  if (configuredBackground) {
    return {
      backgroundImage: configuredBackground,
    };
  }
  return DOMAIN_VISUAL_PRESETS[domain.name] ?? {};
}

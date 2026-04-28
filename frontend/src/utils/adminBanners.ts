import type { BannerSlide } from '../api/adminConfig';

export interface BannerDraft {
  id: string;
  label: string;
  title: string;
  desc: string;
  image_url: string;
  link_url: string;
  enabled: boolean;
}

export function createBannerDraft(current?: BannerSlide, existing: BannerSlide[] = []): BannerDraft {
  if (current) {
    return {
      id: String(current.id),
      label: current.label ?? '',
      title: current.title ?? '',
      desc: current.desc ?? '',
      image_url: current.image_url ?? '',
      link_url: current.link_url ?? '',
      enabled: current.enabled ?? true,
    };
  }
  const nextId = existing.length
    ? Math.max(0, ...existing.map((banner) => banner.id)) + 1
    : 1;
  return {
    id: String(nextId),
    label: '',
    title: '',
    desc: '',
    image_url: '',
    link_url: '',
    enabled: true,
  };
}

export function validateBannerDraft(draft: BannerDraft): { banner?: BannerSlide; error?: string } {
  const id = Number(draft.id.trim());
  if (!Number.isFinite(id) || id <= 0) return { error: '请输入有效的 Banner ID' };

  const title = draft.title.trim();
  if (!title) return { error: '请输入主标题' };

  const image_url = draft.image_url.trim();
  if (!image_url) return { error: '请上传图片或填写图片地址' };
  if (!/^(https?:\/\/|\/)/i.test(image_url)) {
    return { error: '图片地址必须以 http(s):// 开头，或以 / 开头的相对路径' };
  }

  const link_url = draft.link_url.trim();
  if (link_url && !/^https?:\/\//i.test(link_url)) {
    return { error: '跳转 URL 只接受以 http:// 或 https:// 开头的地址' };
  }

  return {
    banner: {
      id,
      label: draft.label.trim(),
      title,
      desc: draft.desc.trim(),
      image_url,
      link_url,
      enabled: draft.enabled,
    },
  };
}

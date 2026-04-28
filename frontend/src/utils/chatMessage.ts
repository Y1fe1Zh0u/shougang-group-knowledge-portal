import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { Citation } from '../api/content';

const OPEN = '\\ue200';
const SEP = '\\ue201';
const CLOSE = '\\ue202';
const PLACEHOLDER_RE = /\\ue200([\s\S]+?)\\ue202/g;
const SENTINEL_RE = /@@CITE_(\d+)@@/g;
const CODE_BLOCK_RE = /<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi;

const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
  ADD_ATTR: ['data-cite-key', 'data-cite-ordinal', 'target', 'rel'],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function stripUnclosedPlaceholders(text: string): string {
  if (!text) return text;
  const lastOpen = text.lastIndexOf(OPEN);
  if (lastOpen < 0) return text;
  if (text.indexOf(CLOSE, lastOpen) >= 0) return text;
  return text.slice(0, lastOpen);
}

interface SentinelBuild {
  markdown: string;
  sentinelKeys: string[][];
  ordinals: Map<string, number>;
}

function buildSentinelMarkdown(text: string, citationByKey: Map<string, Citation>): SentinelBuild {
  const sentinelKeys: string[][] = [];
  const ordinals = new Map<string, number>();
  const markdown = text.replace(PLACEHOLDER_RE, (_match, group: string) => {
    const keys = group
      .split(SEP)
      .map((k) => k.trim())
      .filter((k) => k && citationByKey.has(k));
    if (keys.length === 0) return '';
    keys.forEach((k) => {
      if (!ordinals.has(k)) ordinals.set(k, ordinals.size + 1);
    });
    const idx = sentinelKeys.length;
    sentinelKeys.push(keys);
    return `@@CITE_${idx}@@`;
  });
  return { markdown, sentinelKeys, ordinals };
}

function injectCitationLinks(
  cleanHtml: string,
  sentinelKeys: string[][],
  citationByKey: Map<string, Citation>,
  ordinals: Map<string, number>,
): string {
  const stripped = cleanHtml.replace(CODE_BLOCK_RE, (block) => block.replace(SENTINEL_RE, ''));
  return stripped.replace(SENTINEL_RE, (_match, idxStr: string) => {
    const idx = Number(idxStr);
    const keys = sentinelKeys[idx];
    if (!keys || keys.length === 0) return '';
    const links = keys.map((key) => {
      const citation = citationByKey.get(key);
      const sp = citation?.sourcePayload ?? {};
      const ordinal = ordinals.get(key) ?? 0;
      const href = sp.knowledgeId && sp.documentId
        ? `/space/${sp.knowledgeId}/file/${sp.documentId}`
        : '#';
      const title = escapeHtml(sp.documentName || key);
      const safeKey = escapeHtml(key);
      return `<a class="citationLink" data-cite-key="${safeKey}" data-cite-ordinal="${ordinal}" href="${href}" title="${title}">${ordinal}</a>`;
    });
    return `<sup class="citationRef">${links.join('<span class="citationSep">,</span>')}</sup>`;
  });
}

export function renderChatMarkdownWithSanitizer(
  text: string,
  citations: Citation[],
  sanitize: (html: string) => string,
): string {
  if (!text) return '';
  const safeInput = stripUnclosedPlaceholders(text);
  const citationByKey = new Map(citations.map((c) => [c.key, c]));
  const { markdown, sentinelKeys, ordinals } = buildSentinelMarkdown(safeInput, citationByKey);
  const rendered = marked.parse(markdown, { async: false }) as string;
  const clean = sanitize(rendered);
  return injectCitationLinks(clean, sentinelKeys, citationByKey, ordinals);
}

export function renderChatMarkdown(text: string, citations: Citation[]): string {
  return renderChatMarkdownWithSanitizer(text, citations, (html) =>
    DOMPurify.sanitize(html, SANITIZE_OPTIONS),
  );
}

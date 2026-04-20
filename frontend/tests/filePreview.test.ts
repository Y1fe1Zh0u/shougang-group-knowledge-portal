import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFilePreview } from '../src/utils/filePreview';

test('resolveFilePreview keeps backend-selected pdf manifest', () => {
  const resolved = resolveFilePreview({
    downloadUrl: 'https://example.com/original.pdf',
    mode: 'pdf',
    reason: '',
    sourceKind: 'preview_url',
    supportsChunksFallback: true,
    viewerUrl: '/api/v1/knowledge/space/12/files/1580/preview/content?source_kind=preview_url',
  });

  assert.equal(resolved.mode, 'pdf');
  assert.equal(resolved.viewerUrl, '/api/v1/knowledge/space/12/files/1580/preview/content?source_kind=preview_url');
  assert.equal(resolved.prefersChunks, false);
});

test('resolveFilePreview preserves spreadsheet and download metadata', () => {
  const resolved = resolveFilePreview({
    downloadUrl: 'https://example.com/original.xlsx',
    mode: 'spreadsheet',
    reason: '',
    sourceKind: 'original_url',
    supportsChunksFallback: true,
    viewerUrl: '/api/v1/knowledge/space/12/files/1590/preview/content?source_kind=original_url',
  });

  assert.equal(resolved.mode, 'spreadsheet');
  assert.equal(resolved.downloadUrl, 'https://example.com/original.xlsx');
  assert.equal(resolved.sourceKind, 'original_url');
});

test('resolveFilePreview marks chunk manifests as chunk-first', () => {
  const resolved = resolveFilePreview({
    downloadUrl: '',
    mode: 'chunks',
    reason: '当前文件暂未生成可直接预览的资源，已回退到正文分段内容。',
    sourceKind: 'none',
    supportsChunksFallback: true,
    viewerUrl: '',
  });

  assert.equal(resolved.mode, 'chunks');
  assert.equal(resolved.prefersChunks, true);
  assert.equal(resolved.reason, '当前文件暂未生成可直接预览的资源，已回退到正文分段内容。');
});

test('resolveFilePreview preserves unsupported mode and reason', () => {
  const resolved = resolveFilePreview({
    downloadUrl: 'https://example.com/original.pptx',
    mode: 'unsupported',
    reason: '当前文件类型暂不支持在线预览，请下载原文件查看。',
    sourceKind: 'none',
    supportsChunksFallback: false,
    viewerUrl: '',
  });

  assert.equal(resolved.mode, 'unsupported');
  assert.equal(resolved.downloadUrl, 'https://example.com/original.pptx');
  assert.equal(resolved.supportsChunksFallback, false);
});

test('resolveFilePreview falls back to chunks when preview manifest is missing', () => {
  const resolved = resolveFilePreview(null);

  assert.equal(resolved.mode, 'chunks');
  assert.equal(resolved.prefersChunks, true);
  assert.equal(resolved.viewerUrl, '');
});

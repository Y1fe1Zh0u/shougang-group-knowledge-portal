import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveFilePreview } from '../src/utils/filePreview';

test('resolveFilePreview prefers preview_url when available', () => {
  const resolved = resolveFilePreview('pdf', {
    originalUrl: 'https://example.com/original.pdf',
    previewUrl: 'https://example.com/preview.pdf',
  });

  assert.equal(resolved.mode, 'frame');
  assert.equal(resolved.src, 'https://example.com/preview.pdf');
  assert.equal(resolved.usesOriginalFallback, false);
});

test('resolveFilePreview falls back to original_url for standard preview types', () => {
  const resolved = resolveFilePreview('docx', {
    originalUrl: 'https://example.com/original.docx',
    previewUrl: '',
  });

  assert.equal(resolved.mode, 'missing');
  assert.equal(resolved.src, '');
  assert.equal(resolved.downloadUrl, 'https://example.com/original.docx');
  assert.equal(resolved.usesOriginalFallback, false);
});

test('resolveFilePreview marks images for direct image rendering', () => {
  const resolved = resolveFilePreview('png', {
    originalUrl: 'https://example.com/original.png',
    previewUrl: '',
  });

  assert.equal(resolved.mode, 'image');
  assert.equal(resolved.src, 'https://example.com/original.png');
});

test('resolveFilePreview treats doc and powerpoint as unsupported online previews', () => {
  assert.equal(resolveFilePreview('doc', {
    originalUrl: 'https://example.com/original.doc',
    previewUrl: '',
  }).mode, 'unsupported');

  assert.equal(resolveFilePreview('pptx', {
    originalUrl: 'https://example.com/original.pptx',
    previewUrl: 'https://example.com/preview.pptx',
  }).mode, 'unsupported');
});

test('resolveFilePreview fails closed when neither preview nor original urls exist', () => {
  const resolved = resolveFilePreview('pdf', {
    originalUrl: '',
    previewUrl: '',
  });

  assert.equal(resolved.mode, 'missing');
  assert.equal(resolved.src, '');
});

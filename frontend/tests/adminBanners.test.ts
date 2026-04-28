import test from 'node:test';
import assert from 'node:assert/strict';
import { createBannerDraft, validateBannerDraft } from '../src/utils/adminBanners';

test('createBannerDraft for new entry chooses next id from existing list', () => {
  const draft = createBannerDraft(undefined, [
    { id: 1, label: '', title: 'a', desc: '', image_url: '/a.jpg', link_url: '', enabled: true },
    { id: 4, label: '', title: 'b', desc: '', image_url: '/b.jpg', link_url: '', enabled: true },
  ]);
  assert.equal(draft.id, '5');
  assert.equal(draft.title, '');
  assert.equal(draft.enabled, true);
});

test('createBannerDraft returns id "1" when existing list is empty', () => {
  const draft = createBannerDraft();
  assert.equal(draft.id, '1');
});

test('createBannerDraft for editing copies all fields from current banner', () => {
  const draft = createBannerDraft({
    id: 9,
    label: '小标签',
    title: '主标题',
    desc: '副标题',
    image_url: '/uploads/banners/abc.jpg',
    link_url: 'https://example.com',
    enabled: false,
  });
  assert.equal(draft.id, '9');
  assert.equal(draft.label, '小标签');
  assert.equal(draft.image_url, '/uploads/banners/abc.jpg');
  assert.equal(draft.enabled, false);
});

test('validateBannerDraft rejects missing title', () => {
  const result = validateBannerDraft({
    id: '1', label: '', title: '   ', desc: '', image_url: '/a.jpg', link_url: '', enabled: true,
  });
  assert.equal(result.banner, undefined);
  assert.match(result.error || '', /标题/);
});

test('validateBannerDraft rejects missing image_url', () => {
  const result = validateBannerDraft({
    id: '1', label: '', title: '主标题', desc: '', image_url: '', link_url: '', enabled: true,
  });
  assert.equal(result.banner, undefined);
  assert.match(result.error || '', /图片/);
});

test('validateBannerDraft rejects malformed image_url (not http or absolute)', () => {
  const result = validateBannerDraft({
    id: '1', label: '', title: '主标题', desc: '', image_url: 'banner.jpg', link_url: '', enabled: true,
  });
  assert.equal(result.banner, undefined);
});

test('validateBannerDraft rejects link_url without scheme', () => {
  const result = validateBannerDraft({
    id: '1', label: '', title: '主标题', desc: '', image_url: '/a.jpg', link_url: 'example.com', enabled: true,
  });
  assert.equal(result.banner, undefined);
});

test('validateBannerDraft accepts valid uploads-prefixed image and external link', () => {
  const result = validateBannerDraft({
    id: '4', label: '春季活动', title: '主标题', desc: '副标题', image_url: '/uploads/banners/abc.jpg', link_url: 'https://example.com/spring', enabled: true,
  });
  assert.deepEqual(result.banner, {
    id: 4,
    label: '春季活动',
    title: '主标题',
    desc: '副标题',
    image_url: '/uploads/banners/abc.jpg',
    link_url: 'https://example.com/spring',
    enabled: true,
  });
});

test('validateBannerDraft rejects non-positive id', () => {
  const result = validateBannerDraft({
    id: '0', label: '', title: '主标题', desc: '', image_url: '/a.jpg', link_url: '', enabled: true,
  });
  assert.equal(result.banner, undefined);
  assert.match(result.error || '', /ID/);
});

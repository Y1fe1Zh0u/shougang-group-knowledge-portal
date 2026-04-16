import test from 'node:test';
import assert from 'node:assert/strict';
import { getEnabledApps, getEnabledDomains, getEnabledSections, getEnabledSpaces, getPrimarySpaceId, toRuntimeDisplayConfig } from '../src/utils/portalConfig';

test('toRuntimeDisplayConfig maps API display config fields to runtime keys', () => {
  const runtime = toRuntimeDisplayConfig({
    home: {
      section_page_size: 7,
      hot_tags_count: 9,
      qa_hot_count: 5,
      domain_count: 4,
      spaces_count: 3,
      apps_count: 2,
    },
    list: {
      page_size: 11,
      visible_tag_count: 6,
    },
    search: {
      page_size: 12,
      visible_tag_count: 7,
    },
    detail: {
      related_files_count: 8,
      visible_tag_count: 4,
    },
  });

  assert.deepEqual(runtime, {
    home: {
      sectionPageSize: 7,
      hotTagsCount: 9,
      qaHotCount: 5,
      domainCount: 4,
      spacesCount: 3,
      appsCount: 2,
    },
    list: {
      pageSize: 11,
      visibleTagCount: 6,
    },
    search: {
      pageSize: 12,
      visibleTagCount: 7,
    },
    detail: {
      relatedFilesCount: 8,
      visibleTagCount: 4,
    },
  });
});

test('enabled helpers filter disabled records and orphaned domains', () => {
  const spaces = getEnabledSpaces([
    { id: 12, name: '轧线', file_count: 1, tag_count: 1, enabled: true },
    { id: 18, name: '冷轧', file_count: 1, tag_count: 1, enabled: false },
  ]);
  const domains = getEnabledDomains([
    { name: '设备', space_ids: [12], color: '#111', bg: '#eee', icon: 'Factory', background_image: '', enabled: true },
    { name: '冷轧', space_ids: [18], color: '#111', bg: '#eee', icon: 'Snowflake', background_image: '', enabled: true },
    { name: '安全', space_ids: [12], color: '#111', bg: '#eee', icon: 'Shield', background_image: '', enabled: false },
  ], spaces);
  const sections = getEnabledSections([
    { title: '精选', tag: '最新精选', link: '/list?tag=最新精选', icon: 'Star', enabled: true },
    { title: '案例', tag: '典型案例', link: '/list?tag=典型案例', icon: 'AlertTriangle', enabled: false },
  ]);
  const apps = getEnabledApps([
    { id: 1, name: '检索', icon: 'Search', desc: 'desc', color: '#111', bg: '#eee', url: '/search', enabled: true },
    { id: 2, name: '报告', icon: 'FileText', desc: 'desc', color: '#111', bg: '#eee', url: '/report', enabled: false },
  ]);

  assert.deepEqual(spaces.map((space) => space.id), [12]);
  assert.deepEqual(domains.map((domain) => domain.name), ['设备']);
  assert.deepEqual(sections.map((section) => section.tag), ['最新精选']);
  assert.deepEqual(apps.map((app) => app.id), [1]);
});

test('getPrimarySpaceId returns the first valid space id', () => {
  assert.equal(getPrimarySpaceId([]), undefined);
  assert.equal(getPrimarySpaceId([25, 30]), 25);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { FILE_EXT_OPTIONS } from '../src/constants/fileTypes';
import { FILES, allTags, getFileDetail, getFilePreview, getRelatedFiles, queryFiles, spaceFiles } from '../src/data/mock';
import { getPaginationPages } from '../src/utils/pagination';
import { resolveListPageContext } from '../src/utils/listPage';
import { resolveDetailBackTarget } from '../src/utils/detailPage';
import { getVisibleRange, parsePageParam } from '../src/utils/listControls';

test('file extension options stay aligned with the documented frontend filter set', () => {
  assert.deepEqual([...FILE_EXT_OPTIONS], ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'html']);
});

test('queryFiles paginates tag-driven lists consistently across pages', () => {
  const page1 = queryFiles({ tag: '最新精选', page: 1, pageSize: 10 });
  const page2 = queryFiles({ tag: '最新精选', page: 2, pageSize: 10 });

  assert.equal(page1.total, 11);
  assert.equal(page1.data.length, 10);
  assert.equal(page2.data.length, 1);
  assert.notEqual(page1.data[0]?.id, page2.data[0]?.id);
});

test('queryFiles returns an empty list for page overflow instead of wrapping data', () => {
  const result = queryFiles({ tag: '最新精选', page: 99, pageSize: 10 });

  assert.equal(result.total, 11);
  assert.deepEqual(result.data, []);
});

test('queryFiles combines space, tag, and file extension filters without leaking other records', () => {
  const result = queryFiles({ sids: [12], tag: '热轧', ext: 'pdf', page: 1, pageSize: 20 });

  assert.ok(result.total > 0);
  assert.ok(result.data.every((file) => file.spaceId === 12 && file.ext === 'pdf' && file.tags.includes('热轧')));
});

test('queryFiles oldest sort reverses the default updated-first ordering', () => {
  const newestFirst = queryFiles({ tag: '典型案例', page: 1, pageSize: 20 });
  const oldestFirst = queryFiles({ tag: '典型案例', sort: 'oldest', page: 1, pageSize: 20 });

  assert.ok(newestFirst.data.length > 1);
  assert.equal(newestFirst.data[0]?.date >= newestFirst.data[1]?.date, true);
  assert.equal(oldestFirst.data[0]?.date <= oldestFirst.data[1]?.date, true);
});

test('spaceFiles keeps domain-backed space filtering scoped to the target space', () => {
  const result = spaceFiles({ sid: 25, page: 1, pageSize: 10 });

  assert.ok(result.total > 0);
  assert.ok(result.data.every((file) => file.spaceId === 25));
});

test('spaceFiles supports combined file extension and tag filtering', () => {
  const result = spaceFiles({ sid: 25, ext: 'pdf', tag: '故障诊断', page: 1, pageSize: 20 });

  assert.ok(result.total > 0);
  assert.ok(result.data.every((file) => file.spaceId === 25 && file.ext === 'pdf' && file.tags.includes('故障诊断')));
});

test('allTags stays alphabetically sorted and strips meta tags from the merged tag set', () => {
  const tags = allTags();

  assert.ok(tags.length > 0);
  assert.ok(!tags.includes('最新精选'));
  assert.ok(!tags.includes('典型案例'));
  assert.deepEqual(tags, [...tags].sort());
});

test('parsePageParam clamps invalid values back to the first page', () => {
  assert.equal(parsePageParam(undefined), 1);
  assert.equal(parsePageParam(null), 1);
  assert.equal(parsePageParam('abc'), 1);
  assert.equal(parsePageParam('0'), 1);
  assert.equal(parsePageParam('-4'), 1);
  assert.equal(parsePageParam('2.5'), 1);
  assert.equal(parsePageParam('3'), 3);
});

test('getVisibleRange reports the correct list slice for sparse last pages', () => {
  assert.deepEqual(getVisibleRange(11, 2, 10, 1), { start: 11, end: 11 });
  assert.deepEqual(getVisibleRange(14, 1, 10, 10), { start: 1, end: 10 });
  assert.deepEqual(getVisibleRange(0, 1, 10, 0), { start: 0, end: 0 });
});

test('getPaginationPages expands edge windows and center windows predictably', () => {
  assert.deepEqual(getPaginationPages(1, 2), [1, 2]);
  assert.deepEqual(getPaginationPages(1, 8), [1, 2, 3, 4, '...', 8]);
  assert.deepEqual(getPaginationPages(4, 8), [1, '...', 3, 4, 5, '...', 8]);
  assert.deepEqual(getPaginationPages(8, 8), [1, '...', 5, 6, 7, 8]);
});

test('resolveListPageContext prefers domain identity over backing space name', () => {
  const context = resolveListPageContext({ domainName: '设备', spaceIdParam: '25', tagParam: '' });

  assert.equal(context.spaceId, 25);
  assert.equal(context.pageTitle, '设备');
  assert.ok(context.availableTags.includes('轴承'));
});

test('resolveListPageContext falls back to section title for tag pages', () => {
  const context = resolveListPageContext({ tagParam: '典型案例' });

  assert.equal(context.pageTitle, '典型案例 · 事故分析');
  assert.ok(context.availableTags.includes('热轧'));
  assert.ok(!context.availableTags.includes('最新精选'));
});

test('resolveListPageContext handles unknown routes without leaking stale titles or tags', () => {
  const context = resolveListPageContext({ domainName: '不存在的业务域', tagParam: '不存在的标签' });

  assert.equal(context.spaceId, undefined);
  assert.equal(context.pageTitle, '不存在的标签');
  assert.deepEqual(context.availableTags, allTags());
});

test('resolveDetailBackTarget falls back to the owning space when no return context exists', () => {
  assert.equal(resolveDetailBackTarget('/list?tag=典型案例', '12'), '/list?tag=典型案例');
  assert.equal(resolveDetailBackTarget(undefined, '12'), '/space/12');
});

test('getFileDetail resolves owning space metadata and fails closed for missing files', () => {
  const detail = getFileDetail(1580);

  assert.ok(detail);
  assert.equal(detail.space.id, 12);
  assert.equal(detail.space.name, '轧线技术案例库');
  assert.equal(getFileDetail(999999), null);
});

test('getFilePreview returns separate preview and download urls for detail pages', () => {
  const preview = getFilePreview(1580);

  assert.ok(preview);
  assert.match(preview.previewUrl, /^data:text\/html/);
  assert.match(preview.originalUrl, /^data:text\/plain/);
  assert.match(decodeURIComponent(preview.originalUrl), /热轧1580产线精轧机振动纹治理实践/);
});

test('getFilePreview escapes html-sensitive mock content before embedding it into the preview html', () => {
  FILES.push({
    id: 999001,
    spaceId: 12,
    title: '<script>alert(1)</script>',
    summary: 'summary with <b>tag</b>',
    source: 'source <unsafe>',
    date: '2026-04-15',
    tags: ['热轧'],
    ext: 'pdf',
  });

  try {
    const preview = getFilePreview(999001);

    assert.ok(preview);
    const decoded = decodeURIComponent(preview.previewUrl);
    assert.match(decoded, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.match(decoded, /summary with &lt;b&gt;tag&lt;\/b&gt;/);
    assert.match(decoded, /source &lt;unsafe&gt;/);
  } finally {
    FILES.pop();
  }
});

test('getFilePreview and related helpers fail closed for missing records', () => {
  assert.equal(getFilePreview(999999), null);
  assert.deepEqual(getRelatedFiles(999999, 3), []);
});

test('getRelatedFiles excludes the anchor file, respects limits, and returns scored matches only', () => {
  const related = getRelatedFiles(1580, 2);

  assert.equal(related.length, 2);
  assert.ok(related.every((file) => file.id !== 1580));
  assert.ok(related.every((file) => file.tags.some((tag) => ['热轧', '精轧机', '振动纹'].includes(tag))));
});

test('getRelatedFiles returns an empty list when the anchor file has no non-meta tags', () => {
  FILES.push({
    id: 999002,
    spaceId: 12,
    title: 'meta-only',
    summary: 'meta-only summary',
    source: 'test source',
    date: '2026-04-15',
    tags: ['最新精选', '典型案例'],
    ext: 'pdf',
  });

  try {
    assert.deepEqual(getRelatedFiles(999002, 3), []);
  } finally {
    FILES.pop();
  }
});

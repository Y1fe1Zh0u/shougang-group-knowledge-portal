import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageShell from '../components/PageShell';
import FileListItem from '../components/FileListItem';
import Pagination from '../components/Pagination';
import { queryFiles, spaceFiles, allTags, SPACES, SPACE_TAGS, CFG } from '../data/mock';
import { DISPLAY_CONFIG } from '../config/display';
import { FILE_EXT_OPTIONS } from '../constants/fileTypes';
import { getVisibleRange, useListControls } from '../hooks/useListControls';
import type { FileItem } from '../data/mock';
import s from './ListPage.module.css';

export default function ListPage() {
  const { spaceId: spaceIdStr, domainName } = useParams<{ spaceId?: string; domainName?: string }>();
  const { params, page, resultsTopRef, setFilter } = useListControls();
  const navigate = useNavigate();
  const location = useLocation();

  const matchedDomain = domainName ? CFG.domains.find((item) => item.name === domainName) : undefined;
  const spaceId = matchedDomain ? matchedDomain.spaceId : spaceIdStr ? Number(spaceIdStr) : undefined;
  const tagParam = params.get('tag') || '';
  const fileExt = params.get('file_ext') || '';

  /* Resolve page title and available tags */
  let pageTitle = '';
  let availableTags: string[] = [];

  if (spaceId) {
    const space = SPACES.find((sp) => sp.id === spaceId);
    pageTitle = matchedDomain?.name || space?.name || '知识空间';
    const spaceTags = SPACE_TAGS[spaceId];
    availableTags = spaceTags ? spaceTags.map((t) => t.name) : [];
  } else if (tagParam) {
    const sec = CFG.sections.find((ss) => ss.tag === tagParam);
    pageTitle = sec?.title || tagParam;
    availableTags = allTags();
  }

  /* Query */
  let files: FileItem[] = [];
  let total = 0;
  let pageSize: number = DISPLAY_CONFIG.list.pageSize;

  if (spaceId) {
    const result = spaceFiles({
      sid: spaceId,
      ext: fileExt || undefined,
      tag: tagParam || undefined,
      page,
      pageSize: DISPLAY_CONFIG.list.pageSize,
    });
    files = result.data;
    total = result.total;
    pageSize = result.pageSize;
  } else {
    const result = queryFiles({
      tag: tagParam || undefined,
      ext: fileExt || undefined,
      page,
      pageSize: DISPLAY_CONFIG.list.pageSize,
    });
    files = result.data;
    total = result.total;
    pageSize = result.pageSize;
  }

  const visibleRange = getVisibleRange(total, page, pageSize, files.length);

  return (
    <PageShell>
      <div className={s.container}>
        <div ref={resultsTopRef} />
        <Link to="/" className={s.backLink}>
          <ArrowLeft size={16} />
          返回首页
        </Link>

        <h1 className={s.pageTitle}>{pageTitle}</h1>

        {/* Filters */}
        <div className={s.filterBar}>
          <select className={s.filterSelect} value={fileExt} onChange={(e) => setFilter('file_ext', e.target.value)}>
            <option value="">文件格式</option>
            {FILE_EXT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={s.filterSelect} value={tagParam} onChange={(e) => setFilter('tag', e.target.value)}>
            <option value="">标签</option>
            {availableTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={s.fileCount}>
          共 {total} 篇文档
          {total > 0 ? `，当前显示 ${visibleRange.start}-${visibleRange.end} 篇` : ''}
        </div>

        {/* File list */}
        {files.map((f) => (
          <FileListItem
            key={f.id}
            file={f}
            visibleTagCount={DISPLAY_CONFIG.list.visibleTagCount}
            onClick={() =>
              navigate(`/space/${f.spaceId}/file/${f.id}`, {
                state: { returnTo: `${location.pathname}${location.search}` },
              })}
          />
        ))}

        {/* Pagination */}
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          onChange={(nextPage) => setFilter('page', String(nextPage), false)}
        />
      </div>
    </PageShell>
  );
}

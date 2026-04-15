import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TagPill from '../components/TagPill';
import { queryFiles, spaceFiles, allTags, SPACES, SPACE_TAGS, CFG } from '../data/mock';
import { DISPLAY_CONFIG } from '../config/display';
import type { FileItem } from '../data/mock';
import s from './ListPage.module.css';

export default function ListPage() {
  const { spaceId: spaceIdStr } = useParams<{ spaceId: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const spaceId = spaceIdStr ? Number(spaceIdStr) : undefined;
  const tagParam = params.get('tag') || '';
  const fileExt = params.get('file_ext') || '';
  const page = Number(params.get('page') || '1');

  /* Resolve page title and available tags */
  let pageTitle = '';
  let availableTags: string[] = [];

  if (spaceId) {
    const space = SPACES.find((sp) => sp.id === spaceId);
    pageTitle = space?.name || '知识空间';
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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  return (
    <>
      <Header />
      <div className={s.container}>
        <Link to="/" className={s.backLink}>
          <ArrowLeft size={16} />
          返回首页
        </Link>

        <h1 className={s.pageTitle}>{pageTitle}</h1>

        {/* Filters */}
        <div className={s.filterBar}>
          <select className={s.filterSelect} value={fileExt} onChange={(e) => setFilter('file_ext', e.target.value)}>
            <option value="">文件格式</option>
            {['pdf', 'docx', 'xlsx', 'pptx'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={s.filterSelect} value={tagParam} onChange={(e) => setFilter('tag', e.target.value)}>
            <option value="">标签</option>
            {availableTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={s.fileCount}>共 {total} 篇文档</div>

        {/* File list */}
        {files.map((f) => (
          <FileListItem key={f.id} file={f} onClick={() => navigate(`/space/${f.spaceId}/file/${f.id}`)} />
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={s.pagination}>
            {page > 1 && (
              <button className={s.pageBtn} onClick={() => setFilter('page', String(page - 1))}>
                &lsaquo;
              </button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ''}`}
                onClick={() => setFilter('page', String(p))}
              >
                {p}
              </button>
            ))}
            {page < totalPages && (
              <button className={s.pageBtn} onClick={() => setFilter('page', String(page + 1))}>
                &rsaquo;
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

function FileListItem({ file, onClick }: { file: FileItem; onClick: () => void }) {
  const META_TAGS = ['最新精选', '典型案例'];
  const displayTags = file.tags.filter((t) => !META_TAGS.includes(t));
  return (
    <div className={s.fileItem} onClick={onClick}>
      <div className={s.fileIcon}>
        <FileText size={20} />
      </div>
      <div className={s.fileBody}>
        <div className={s.fileTitle}>{file.title}</div>
        <div className={s.fileSummary}>{file.summary}</div>
        <div className={s.fileMeta}>
          <span className={s.fileSource}>{file.source}</span>
          {displayTags.slice(0, DISPLAY_CONFIG.list.visibleTagCount).map((t) => (
            <TagPill key={t} name={t} />
          ))}
          <span className={s.fileDate}>{file.date}</span>
        </div>
      </div>
    </div>
  );
}

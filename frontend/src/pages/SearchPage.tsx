import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TagPill from '../components/TagPill';
import { queryFiles, getAIResponse, allTags, CFG } from '../data/mock';
import { DISPLAY_CONFIG } from '../config/display';
import type { FileItem } from '../data/mock';
import s from './SearchPage.module.css';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') || '';
  const domain = params.get('domain') || '';
  const fileExt = params.get('file_ext') || '';
  const tag = params.get('tag') || '';
  const sort = params.get('sort') || 'relevance';
  const page = Number(params.get('page') || '1');

  /* Resolve domain to space IDs */
  const sids = domain
    ? CFG.domains.filter((d) => d.name === domain).map((d) => d.spaceId)
    : undefined;

  /* Query */
  const { data: files, total, pageSize } = queryFiles({
    q: q || undefined,
    tag: tag || undefined,
    sids,
    ext: fileExt || undefined,
    sort,
    page,
    pageSize: DISPLAY_CONFIG.search.pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  /* AI streaming */
  const [aiText, setAiText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const fullText = useRef('');

  useEffect(() => {
    if (!q) return;
    fullText.current = getAIResponse(q);
    setAiText('');
    setStreaming(true);
    let idx = 0;
    const timer = setInterval(() => {
      idx++;
      setAiText(fullText.current.slice(0, idx));
      if (idx >= fullText.current.length) {
        clearInterval(timer);
        setStreaming(false);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [q]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setParams(next);
  };

  const tags = allTags();

  return (
    <>
      <Header />
      <div className={s.container}>
        <div className={s.resultCount}>
          搜索 &ldquo;<strong>{q}</strong>&rdquo; 共 {total} 条结果
        </div>

        {/* Filters */}
        <div className={s.filterBar}>
          <select className={s.filterSelect} value={domain} onChange={(e) => setFilter('domain', e.target.value)}>
            <option value="">业务域</option>
            {CFG.domains.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <select className={s.filterSelect} value={fileExt} onChange={(e) => setFilter('file_ext', e.target.value)}>
            <option value="">文档类型</option>
            {['pdf', 'docx', 'xlsx', 'pptx'].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className={s.filterSelect} value={tag} onChange={(e) => setFilter('tag', e.target.value)}>
            <option value="">标签</option>
            {tags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className={s.sortWrap}>
            排序：
            <select className={s.filterSelect} value={sort} onChange={(e) => setFilter('sort', e.target.value)}>
              <option value="relevance">相关性优先</option>
              <option value="updated_at">最近更新</option>
            </select>
          </div>
        </div>

        {/* AI Overview */}
        {q && (
          <div className={s.aiOverview}>
            <div className={s.aiBadge}>
              <Search size={12} />
              AI Overview
            </div>
            <div className={s.aiText}>
              {aiText}
              {streaming && <span className={s.aiCursor} />}
            </div>
          </div>
        )}

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
      <div className={s.fileBody}>
        <div className={s.fileTitle}>{file.title}</div>
        <div className={s.fileSummary}>{file.summary}</div>
        <div className={s.fileMeta}>
          <span className={s.fileSource}>{file.source}</span>
          {displayTags.slice(0, DISPLAY_CONFIG.search.visibleTagCount).map((t) => (
            <TagPill key={t} name={t} neutral />
          ))}
          <span className={s.fileDate}>{file.date}</span>
        </div>
      </div>
    </div>
  );
}

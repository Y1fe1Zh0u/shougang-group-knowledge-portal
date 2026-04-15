import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../components/PageShell';
import FileListItem from '../components/FileListItem';
import Pagination from '../components/Pagination';
import {
  fetchAggregatedTags,
  fetchPortalContentConfig,
  searchFiles,
  streamChatCompletion,
  type FileItem,
} from '../api/content';
import { DISPLAY_CONFIG } from '../config/display';
import { FILE_EXT_OPTIONS } from '../constants/fileTypes';
import { useListControls } from '../hooks/useListControls';
import { getVisibleRange } from '../utils/listControls';
import s from './SearchPage.module.css';

type DomainOption = {
  name: string;
  spaceIds: number[];
};

export default function SearchPage() {
  const { params, page, resultsTopRef, setFilter, setParams } = useListControls();
  const navigate = useNavigate();
  const location = useLocation();
  const q = params.get('q') || '';
  const [draft, setDraft] = useState(q);
  const domain = params.get('domain') || '';
  const fileExt = params.get('file_ext') || '';
  const tag = params.get('tag') || '';
  const sort = params.get('sort') || 'relevance';
  const hasSearch = Boolean(q.trim());
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DISPLAY_CONFIG.search.pageSize);
  const [tags, setTags] = useState<string[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [qaSpaceIds, setQaSpaceIds] = useState<number[]>([]);
  const [aiText, setAiText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestSeq = useRef(0);

  const selectedDomain = domains.find((item) => item.name === domain);
  const sids = selectedDomain?.spaceIds;
  const visibleRange = getVisibleRange(total, page, pageSize, files.length);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const config = await fetchPortalContentConfig();
        if (!active) return;
        setDomains(
          config.domains
            .filter((item) => item.enabled)
            .map((item) => ({ name: item.name, spaceIds: item.space_ids })),
        );
        setQaSpaceIds(config.qa.knowledge_space_ids);
      } catch {
        // Keep page usable even if config fetch fails.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!hasSearch) {
      setFiles([]);
      setTotal(0);
      setAiText('');
      setTags([]);
      return;
    }

    setLoading(true);
    setError('');
    void (async () => {
      try {
        const [result, loadedTags] = await Promise.all([
          searchFiles({
            q: q || undefined,
            tag: tag || undefined,
            spaceIds: sids,
            fileExt: fileExt || undefined,
            sort,
            page,
            pageSize: DISPLAY_CONFIG.search.pageSize,
          }),
          fetchAggregatedTags(sids),
        ]);
        if (!active) return;
        setFiles(result.data);
        setTotal(result.total);
        setPageSize(result.pageSize);
        setTags(loadedTags);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '搜索失败');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [fileExt, hasSearch, page, q, sids, sort, tag]);

  useEffect(() => {
    if (!q) return;
    const currentRequest = ++requestSeq.current;
    setAiText('');
    setStreaming(true);
    void streamChatCompletion({
      scene: 'search',
      text: q,
      knowledgeSpaceIds: qaSpaceIds,
      onFinalText(text) {
        if (requestSeq.current !== currentRequest) return;
        setAiText(text);
      },
    }).finally(() => {
      if (requestSeq.current === currentRequest) {
        setStreaming(false);
      }
    });
  }, [q, qaSpaceIds]);

  const submitSearch = () => {
    const keyword = draft.trim();
    const next = new URLSearchParams(params);
    if (keyword) next.set('q', keyword);
    else next.delete('q');
    next.delete('page');
    setParams(next);
  };

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.searchHero}>
          <div ref={resultsTopRef} />
          <div className={s.searchHeroInputWrap}>
            <Search size={18} className={s.searchHeroIcon} />
            <input
              className={s.searchHeroInput}
              placeholder="请输入关键词开始搜索"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitSearch();
              }}
              autoFocus
            />
            <button className={s.searchHeroBtn} onClick={submitSearch}>搜索</button>
          </div>
          {!hasSearch ? (
            <div className={s.emptyState}>
              <div className={s.emptyTitle}>输入关键词开始搜索</div>
              <div className={s.emptyDesc}>
                支持按设备、工艺、质量、安全等主题检索知识文档。
              </div>
            </div>
          ) : (
            <div className={s.resultCount}>
              搜索 &ldquo;<strong>{q}</strong>&rdquo; 共 {total} 条结果
              {total > 0 ? `，当前显示 ${visibleRange.start}-${visibleRange.end} 条` : ''}
            </div>
          )}
        </div>

        {hasSearch && (
          <div className={s.filterBar}>
            <select className={s.filterSelect} value={domain} onChange={(e) => setFilter('domain', e.target.value)}>
              <option value="">业务域</option>
              {domains.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
            <select className={s.filterSelect} value={fileExt} onChange={(e) => setFilter('file_ext', e.target.value)}>
              <option value="">文档类型</option>
              {FILE_EXT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className={s.filterSelect} value={tag} onChange={(e) => setFilter('tag', e.target.value)}>
              <option value="">标签</option>
              {tags.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <div className={s.sortWrap}>
              排序：
              <select className={s.filterSelect} value={sort} onChange={(e) => setFilter('sort', e.target.value)}>
                <option value="relevance">相关性优先</option>
                <option value="updated_at">最近更新</option>
              </select>
            </div>
          </div>
        )}

        {hasSearch && (
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

        {error ? (
          <div className={s.emptyState}>
            <div className={s.emptyTitle}>搜索失败</div>
            <div className={s.emptyDesc}>{error}</div>
          </div>
        ) : null}

        {hasSearch && loading ? (
          <div className={s.emptyState}>
            <div className={s.emptyTitle}>正在加载搜索结果</div>
          </div>
        ) : null}

        {hasSearch && !loading && files.map((f) => (
          <FileListItem
            key={f.id}
            file={f}
            visibleTagCount={DISPLAY_CONFIG.search.visibleTagCount}
            onClick={() =>
              navigate(`/space/${f.spaceId}/file/${f.id}`, {
                state: { returnTo: `${location.pathname}${location.search}` },
              })}
          />
        ))}

        {hasSearch && (
          <Pagination
            page={page}
            total={total}
            pageSize={pageSize}
            onChange={(nextPage) => setFilter('page', String(nextPage), false)}
          />
        )}
      </div>
    </PageShell>
  );
}

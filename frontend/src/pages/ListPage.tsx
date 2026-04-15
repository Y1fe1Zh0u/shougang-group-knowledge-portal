import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageShell from '../components/PageShell';
import FileListItem from '../components/FileListItem';
import Pagination from '../components/Pagination';
import {
  fetchAggregatedTags,
  fetchPortalContentConfig,
  fetchSpaceFiles,
  fetchSpaceTags,
  searchFiles,
  type FileItem,
} from '../api/content';
import type { PortalConfig } from '../api/adminConfig';
import { DISPLAY_CONFIG } from '../config/display';
import { FILE_EXT_OPTIONS } from '../constants/fileTypes';
import { useListControls } from '../hooks/useListControls';
import { getVisibleRange } from '../utils/listControls';
import s from './ListPage.module.css';

function resolveListContext(config: PortalConfig, domainName?: string, spaceIdParam?: string, tagParam?: string) {
  const matchedDomain = domainName ? config.domains.find((item) => item.name === domainName) : undefined;
  const parsedSpaceId = spaceIdParam ? Number(spaceIdParam) : undefined;
  const spaceId = matchedDomain ? matchedDomain.space_ids[0] : parsedSpaceId;

  let pageTitle = '';
  if (spaceId) {
    const space = config.spaces.find((item) => item.id === spaceId);
    pageTitle = matchedDomain?.name || space?.name || '知识空间';
  } else if (tagParam) {
    const sec = config.sections.find((item) => item.tag === tagParam);
    pageTitle = sec?.title || tagParam;
  } else {
    pageTitle = '知识列表';
  }

  return {
    spaceId,
    pageTitle,
  };
}

export default function ListPage() {
  const { spaceId: spaceIdStr, domainName } = useParams<{ spaceId?: string; domainName?: string }>();
  const { params, page, resultsTopRef, setFilter } = useListControls();
  const navigate = useNavigate();
  const location = useLocation();
  const tagParam = params.get('tag') || '';
  const fileExt = params.get('file_ext') || '';
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [spaceId, setSpaceId] = useState<number | undefined>();
  const [pageTitle, setPageTitle] = useState('知识列表');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState<number>(DISPLAY_CONFIG.list.pageSize);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const loadedConfig = await fetchPortalContentConfig();
        if (!active) return;
        setConfig(loadedConfig);
        const context = resolveListContext(loadedConfig, domainName, spaceIdStr, tagParam);
        setSpaceId(context.spaceId);
        setPageTitle(context.pageTitle);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : '配置加载失败');
      }
    })();
    return () => {
      active = false;
    };
  }, [domainName, spaceIdStr, tagParam]);

  useEffect(() => {
    let active = true;
    if (!config) return;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        if (spaceId) {
          const [result, tags] = await Promise.all([
            fetchSpaceFiles({
              spaceId,
              fileExt: fileExt || undefined,
              tag: tagParam || undefined,
              page,
              pageSize: DISPLAY_CONFIG.list.pageSize,
            }),
            fetchSpaceTags(spaceId),
          ]);
          if (!active) return;
          setFiles(result.data);
          setTotal(result.total);
          setPageSize(result.pageSize);
          setAvailableTags(tags);
        } else {
          const [result, tags] = await Promise.all([
            searchFiles({
              tag: tagParam || undefined,
              fileExt: fileExt || undefined,
              page,
              pageSize: DISPLAY_CONFIG.list.pageSize,
            }),
            fetchAggregatedTags(config.spaces.filter((item) => item.enabled).map((item) => item.id)),
          ]);
          if (!active) return;
          setFiles(result.data);
          setTotal(result.total);
          setPageSize(result.pageSize);
          setAvailableTags(tags);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '列表加载失败');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [config, fileExt, page, spaceId, tagParam]);

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

        {error ? <div className={s.fileCount}>{error}</div> : null}
        {loading ? <div className={s.fileCount}>正在加载列表...</div> : null}

        {!loading && files.map((f) => (
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

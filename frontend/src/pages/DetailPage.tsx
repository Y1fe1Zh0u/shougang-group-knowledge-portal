import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Sparkles, Star } from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { fetchFileChunks, fetchFileDetail, fetchFilePreview, fetchRelatedFiles, type FileChunkItem, type FileDetail, type FileItem, type FilePreviewData } from '../api/content';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { resolveDetailBackTarget } from '../utils/detailPage';
import { formatDisplayDateTime } from '../utils/dateTime';
import { resolveFilePreview } from '../utils/filePreview';
import { toRuntimeDisplayConfig } from '../utils/portalConfig';
import s from './DetailPage.module.css';

export default function DetailPage() {
  const { spaceId: spaceIdStr = '', fileId: fileIdStr = '' } = useParams<{ spaceId: string; fileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = usePortalConfig();
  const displayConfig = toRuntimeDisplayConfig(config?.display);
  const [detail, setDetail] = useState<FileDetail | null>(null);
  const [preview, setPreview] = useState<FilePreviewData | null>(null);
  const [chunks, setChunks] = useState<FileChunkItem[]>([]);
  const [related, setRelated] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fileId = Number(fileIdStr);
  const spaceId = Number(spaceIdStr);
  const backTarget = resolveDetailBackTarget(location.state?.returnTo, spaceIdStr);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const [detailResult, previewResult, relatedResult] = await Promise.all([
          fetchFileDetail(spaceId, fileId),
          fetchFilePreview(spaceId, fileId),
          fetchRelatedFiles(spaceId, fileId, displayConfig.detail.relatedFilesCount),
        ]);
        if (!active) return;
        const chunkResult = (!previewResult?.previewUrl && detailResult)
          ? await fetchFileChunks(spaceId, fileId)
          : [];
        if (!active) return;
        setDetail(detailResult);
        setPreview(previewResult);
        setChunks(chunkResult);
        setRelated(relatedResult);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : '详情加载失败');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [displayConfig.detail.relatedFilesCount, fileId, spaceId]);

  if (loading) {
    return (
      <PageShell>
        <div className={s.container}>
          <p style={{ padding: '48px 0', textAlign: 'center', color: 'var(--neutral-400)' }}>
            正在加载文档详情...
          </p>
        </div>
      </PageShell>
    );
  }

  if (error || !detail) {
    return (
      <PageShell>
        <div className={s.container}>
          <p style={{ padding: '48px 0', textAlign: 'center', color: 'var(--neutral-400)' }}>
            {error || '文档不存在'}
          </p>
        </div>
      </PageShell>
    );
  }

  const META_TAGS = ['最新精选', '典型案例'];
  const displayTags = detail.tags.filter((t) => !META_TAGS.includes(t));
  const resolvedPreview = resolveFilePreview(detail.ext, preview);

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.topBar}>
          <Link to={backTarget} className={s.backLink}>
            <ArrowLeft size={16} />
            返回列表
          </Link>
          <span className={s.sourceLabel}>来源：{detail.space.name}</span>
        </div>

        <div className={s.card}>
          <h1 className={s.title}>{detail.title}</h1>
          <div className={s.meta}>
            <div className={s.tags}>
              {displayTags.map((t) => <TagPill key={t} name={t} neutral />)}
            </div>
            <span className={s.updateDate}>更新于 {formatDisplayDateTime(detail.date)}</span>
          </div>
          <div className={s.divider} />
          <div className={s.summaryBlock}>
            <div className={s.summaryHeader}>
              <div className={s.summaryIcon}>
                <Sparkles size={14} />
              </div>
              <span className={s.summaryTitle}>AI概览</span>
            </div>
            <div className={s.summaryText}>{detail.summary}</div>
          </div>
          <div className={s.previewArea}>
            {resolvedPreview.mode === 'image' ? (
              <img
                className={s.previewImage}
                src={resolvedPreview.src}
                alt={`${detail.title} 预览`}
              />
            ) : resolvedPreview.mode === 'frame' ? (
              <iframe
                className={s.previewFrame}
                title={`${detail.title} 预览`}
                src={resolvedPreview.src}
              />
            ) : (
              chunks.length > 0 ? (
                <div className={s.previewTextContent}>
                  {chunks.map((chunk) => (
                    <section key={chunk.chunkIndex} className={s.previewTextBlock}>
                      <h3 className={s.previewTextTitle}>第 {chunk.chunkIndex + 1} 段</h3>
                      <pre className={s.previewTextBody}>{chunk.text}</pre>
                    </section>
                  ))}
                </div>
              ) : (
                <div className={s.previewFallback}>
                  <strong>暂不支持在线预览</strong>
                  <span>{resolvedPreview.reason}</span>
                </div>
              )
            )}
          </div>
          <div className={s.downloadBar}>
            <a
              className={s.downloadBtn}
              href={resolvedPreview.downloadUrl}
              download={resolvedPreview.downloadUrl ? `${detail.title}.${detail.ext}` : undefined}
              target={resolvedPreview.downloadUrl ? '_blank' : undefined}
              rel={resolvedPreview.downloadUrl ? 'noreferrer' : undefined}
              aria-disabled={!resolvedPreview.downloadUrl}
            >
              <Download size={16} />
              下载原文件
            </a>
          </div>
        </div>

        {related.length > 0 && (
          <div className={s.relatedSection}>
            <SectionHeader icon={Star} title="相关推荐" />
            <div className={s.relatedGrid}>
              {related.map((f) => {
                const rTags = f.tags.filter((t) => !META_TAGS.includes(t));
                return (
                  <div
                    key={f.id}
                    className={s.relatedCard}
                    onClick={() =>
                      navigate(`/space/${f.spaceId}/file/${f.id}`, {
                        state: { returnTo: `${location.pathname}${location.search}` },
                      })}
                  >
                    <div className={s.relatedTitle}>{f.title}</div>
                    <div className={s.relatedSummary}>{f.summary}</div>
                    <div className={s.relatedTags}>
                      {rTags.map((t) => <TagPill key={t} name={t} neutral />)}
                    </div>
                    <div className={s.relatedMeta}>
                      <span className={s.relatedSource}>{f.source}</span>
                      <span className={s.relatedDate}>{formatDisplayDateTime(f.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

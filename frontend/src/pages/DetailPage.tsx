import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Download, Sparkles, Star } from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { getFileDetail, getFilePreview, getRelatedFiles } from '../data/mock';
import { DISPLAY_CONFIG } from '../config/display';
import s from './DetailPage.module.css';

export default function DetailPage() {
  const { spaceId: spaceIdStr = '', fileId: fileIdStr = '' } = useParams<{ spaceId: string; fileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const fileId = Number(fileIdStr);
  const detail = getFileDetail(fileId);
  const preview = getFilePreview(fileId);
  const related = getRelatedFiles(fileId, DISPLAY_CONFIG.detail.relatedFilesCount);
  const backTarget = typeof location.state?.returnTo === 'string' ? location.state.returnTo : `/space/${spaceIdStr}`;

  if (!detail) {
    return (
      <PageShell>
        <div className={s.container}>
          <p style={{ padding: '48px 0', textAlign: 'center', color: 'var(--neutral-400)' }}>
            文档不存在
          </p>
        </div>
      </PageShell>
    );
  }

  const META_TAGS = ['最新精选', '典型案例'];
  const displayTags = detail.tags.filter((t) => !META_TAGS.includes(t));

  return (
    <PageShell>
      <div className={s.container}>
        {/* Top bar */}
        <div className={s.topBar}>
          <Link to={backTarget} className={s.backLink}>
            <ArrowLeft size={16} />
            返回列表
          </Link>
          <span className={s.sourceLabel}>来源：{detail.space.name}</span>
        </div>

        {/* Content card */}
        <div className={s.card}>
          <h1 className={s.title}>{detail.title}</h1>
          <div className={s.meta}>
            <div className={s.tags}>
              {displayTags.map((t) => <TagPill key={t} name={t} neutral />)}
            </div>
            <span className={s.updateDate}>更新于 {detail.date}</span>
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
            {preview ? (
              <iframe
                className={s.previewFrame}
                title={`${detail.title} 预览`}
                src={preview.previewUrl}
              />
            ) : (
              <div className={s.previewFallback}>文件预览区域</div>
            )}
          </div>
          <div className={s.downloadBar}>
            <a
              className={s.downloadBtn}
              href={preview?.originalUrl}
              download={`${detail.title}.${detail.ext}`}
            >
              <Download size={16} />
              下载原文件
            </a>
          </div>
        </div>

        {/* Related */}
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
                      <span className={s.relatedDate}>{f.date}</span>
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

import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Star } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { getFileDetail, getRelatedFiles } from '../data/mock';
import { DISPLAY_CONFIG } from '../config/display';
import s from './DetailPage.module.css';

export default function DetailPage() {
  const { spaceId: spaceIdStr = '', fileId: fileIdStr = '' } = useParams<{ spaceId: string; fileId: string }>();
  const navigate = useNavigate();

  const fileId = Number(fileIdStr);
  const detail = getFileDetail(fileId);
  const related = getRelatedFiles(fileId, DISPLAY_CONFIG.detail.relatedFilesCount);

  if (!detail) {
    return (
      <>
        <Header />
        <div className={s.container}>
          <p style={{ padding: '48px 0', textAlign: 'center', color: 'var(--neutral-400)' }}>
            文档不存在
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const META_TAGS = ['最新精选', '典型案例'];
  const displayTags = detail.tags.filter((t) => !META_TAGS.includes(t));

  return (
    <>
      <Header />
      <div className={s.container}>
        {/* Top bar */}
        <div className={s.topBar}>
          <Link to={`/space/${spaceIdStr}`} className={s.backLink}>
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
              {displayTags.map((t) => <TagPill key={t} name={t} />)}
            </div>
            <span className={s.updateDate}>更新于 {detail.date}</span>
          </div>
          <div className={s.divider} />
          <div className={s.summaryBlock}>{detail.summary}</div>
          <div className={s.previewArea}>文件预览区域</div>
          <div className={s.downloadBar}>
            <button className={s.downloadBtn}>
              <Download size={16} />
              下载原文件
            </button>
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
                    onClick={() => navigate(`/space/${f.spaceId}/file/${f.id}`)}
                  >
                    <div className={s.relatedTitle}>{f.title}</div>
                    <div className={s.relatedTags}>
                      {rTags.slice(0, DISPLAY_CONFIG.detail.visibleTagCount).map((t) => <TagPill key={t} name={t} />)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

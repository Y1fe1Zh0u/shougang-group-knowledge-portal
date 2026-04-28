import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import PageShell from '../components/PageShell';
import { getWikiEntry, WIKI_ENTRIES } from '../data/wikiData';
import s from './WikiDetailPage.module.css';

export default function WikiDetailPage() {
  const { wikiId } = useParams<{ wikiId: string }>();
  const entry = useMemo(() => getWikiEntry(wikiId) ?? WIKI_ENTRIES[0], [wikiId]);

  const bodyHtml = useMemo(() => {
    const raw = marked.parse(entry.body, { async: false }) as string;
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
    });
  }, [entry.body]);

  return (
    <PageShell>
      <div className={s.container}>
        <div className={s.crumbs}>
          <Link to="/">首页</Link>
          <span className={s.sep}>/</span>
          <Link to="/wiki">股份百科</Link>
          <span className={s.sep}>/</span>
          <span>{entry.name}</span>
        </div>

        <Link to="/wiki" className={s.back}>
          <ArrowLeft size={14} />
          返回百科列表
        </Link>

        <section className={s.titleBlock}>
          <div className={s.tagRow}>
            <span className={s.domainBadge}>{entry.domain}</span>
          </div>
          <h1 className={s.entryTitle}>{entry.name}</h1>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div className={s.panelIcon}>
              <BookOpen size={14} />
            </div>
            <div className={s.panelTitle}>基本内容</div>
          </div>
          <div className={s.prose} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </section>

        {entry.references.length ? (
          <section className={s.panel}>
            <div className={s.panelHead}>
              <div className={`${s.panelIcon} ${s.panelIconBlue}`}>
                <FileText size={14} />
              </div>
              <div className={s.panelTitle}>引用文档</div>
            </div>
            <div className={s.refList}>
              {entry.references.map((ref, i) => (
                <a key={i} className={s.refRow}>
                  <FileText size={20} className={s.refIcon} />
                  <span className={s.refTitle}>{ref}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}

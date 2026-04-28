import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, FileText, User } from 'lucide-react';
import PageShell from '../components/PageShell';
import { getWikiEntry, WIKI_ENTRIES } from '../data/wikiMock';
import s from './WikiDetailPage.module.css';

export default function WikiDetailPage() {
  const { wikiId } = useParams<{ wikiId: string }>();
  const entry = useMemo(() => getWikiEntry(wikiId) ?? WIKI_ENTRIES[0], [wikiId]);

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
            <span className={s.kindBadge}>{entry.kind}</span>
            <span className={s.domainBadge}>{entry.domain}</span>
          </div>
          <h1 className={s.entryTitle}>{entry.name}</h1>
          <div className={s.metaRow}>
            <span className={s.metaItem}>
              <User size={13} />
              主编 <b>{entry.editor}</b> · {entry.editorDept}
            </span>
            <span className={s.metaItem}>
              <Calendar size={13} />
              {entry.updatedAt} 更新
            </span>
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div className={s.panelIcon}>
              <BookOpen size={14} />
            </div>
            <div className={s.panelTitle}>基本内容</div>
          </div>
          <div className={s.prose}>
            {entry.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {entry.applications.length ? (
              <>
                <h3>主要应用</h3>
                <ul>
                  {entry.applications.map((app) => (
                    <li key={app.title}>
                      <b>{app.title}</b> — {app.desc}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </section>

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
                <span className={s.refTitle}>{ref.title}</span>
                <span className={s.refMeta}>
                  {ref.format} · {ref.date}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

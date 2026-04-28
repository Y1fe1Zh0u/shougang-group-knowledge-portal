import { Link } from 'react-router-dom';
import { BookOpen, Package } from 'lucide-react';
import PageShell from '../components/PageShell';
import { WIKI_LIST_ITEMS } from '../data/wikiMock';
import s from './WikiPage.module.css';

export default function WikiPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <header className={s.head}>
          <div className={s.headLeft}>
            <div className={s.headIcon}>
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className={s.title}>股份百科</h1>
              <p className={s.subtitle}>
                沉淀首钢股份的工艺词条与知识产品，按业务域归档，支持检索与引用。
              </p>
            </div>
          </div>
        </header>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>全部词条</span>
            <span className={s.panelCount}>{WIKI_LIST_ITEMS.length} 条</span>
          </div>
          <div className={s.list}>
            {WIKI_LIST_ITEMS.map((item) => (
              <Link key={item.id} to={`/wiki/${item.id}`} className={s.row}>
                <Package size={22} className={s.rowIcon} />
                <span className={s.rowName}>{item.name}</span>
                <span className={s.catTag}>{item.domain}</span>
                <span className={s.rowKind}>{item.kind}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

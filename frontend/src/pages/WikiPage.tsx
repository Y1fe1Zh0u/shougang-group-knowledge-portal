import { useMemo, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Search } from 'lucide-react';
import PageShell from '../components/PageShell';
import { WIKI_ENTRIES } from '../data/wikiData';
import s from './WikiPage.module.css';

type GlyphTone = 'default' | 'purple' | 'amber' | 'green' | 'cyan';

const DOMAIN_TONE: Record<string, GlyphTone> = {
  质量: 'default',
  生产: 'amber',
  安全: 'amber',
  设备: 'cyan',
  研发: 'purple',
  能源: 'green',
};

const TONE_CLASS: Record<GlyphTone, string> = {
  default: s.glyphDefault,
  purple: s.glyphPurple,
  amber: s.glyphAmber,
  green: s.glyphGreen,
  cyan: s.glyphCyan,
};

function deriveSummary(body: string): string {
  const firstPara = body.split('\n\n').find((p) => !p.startsWith('## ') && !p.startsWith('-')) ?? '';
  const plain = firstPara.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  return plain.length > 96 ? `${plain.slice(0, 96)}…` : plain;
}

function deriveGlyph(name: string): string {
  return name.slice(0, 1);
}

export default function WikiPage() {
  const navigate = useNavigate();
  const [activeDomain, setActiveDomain] = useState<string>('all');
  const [query, setQuery] = useState('');

  const domainCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of WIKI_ENTRIES) m.set(e.domain, (m.get(e.domain) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    if (activeDomain === 'all') return WIKI_ENTRIES;
    return WIKI_ENTRIES.filter((e) => e.domain === activeDomain);
  }, [activeDomain]);

  const totalRefs = useMemo(
    () => WIKI_ENTRIES.reduce((sum, e) => sum + e.references.length, 0),
    [],
  );

  const handleSearchKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <PageShell>
      <section className={s.pageHeader}>
        <div className={s.pageHeaderInner}>
          <div className={s.crumbs}>
            <Link to="/">首页</Link>
            <span className={s.sep}>/</span>
            <span className={s.cur}>股份百科</span>
          </div>

          <div className={s.titleRow}>
            <div className={s.titleBlock}>
              <div className={s.titleMark}>
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className={s.pageTitle}>股份百科 · 知识词条总览</h1>
                <p className={s.pageLead}>
                  面向首钢股份的结构化工艺词条与知识产品集合，按业务域归档，支持检索与引用。
                </p>
              </div>
            </div>
            <div className={s.pageStats}>
              <div className={s.pageStat}>
                <div className={s.pageStatNum}>{WIKI_ENTRIES.length}</div>
                <div className={s.pageStatLabel}>收录词条</div>
              </div>
              <div className={s.pageStat}>
                <div className={s.pageStatNum}>{domainCounts.length}</div>
                <div className={s.pageStatLabel}>覆盖业务域</div>
              </div>
              <div className={s.pageStat}>
                <div className={s.pageStatNum}>{totalRefs}</div>
                <div className={s.pageStatLabel}>引用文档</div>
              </div>
            </div>
          </div>

          <div className={s.searchRow}>
            <div className={s.searchBox}>
              <span className={s.ic}>
                <Search size={16} />
              </span>
              <input
                placeholder="搜索词条名称或定义关键词…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>
            <span className={s.searchHint}>
              <kbd>Enter</kbd> 跳转全局搜索
            </span>
          </div>
        </div>
      </section>

      <div className={s.mainGrid}>
        <aside className={s.sidebar}>
          <div className={s.filterCard}>
            <div className={s.filterTitle}>业务域</div>
            <div className={s.filterList}>
              <button
                type="button"
                className={`${s.filterItem} ${activeDomain === 'all' ? s.filterItemActive : ''}`}
                onClick={() => setActiveDomain('all')}
              >
                <span className={s.dot} />
                全部业务域
                <span className={s.count}>{WIKI_ENTRIES.length}</span>
              </button>
              {domainCounts.map(([domain, count]) => (
                <button
                  key={domain}
                  type="button"
                  className={`${s.filterItem} ${activeDomain === domain ? s.filterItemActive : ''}`}
                  onClick={() => setActiveDomain(domain)}
                >
                  <span className={s.dot} />
                  {domain}
                  <span className={s.count}>{count}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className={s.listColumn}>
          <div className={s.listHead}>
            <div className={s.listCount}>
              共 <b>{filtered.length}</b> 条
              {activeDomain !== 'all' && (
                <>
                  <span className={s.dotSep}>·</span>
                  业务域 <span className={s.tagInline}>{activeDomain}</span>
                </>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className={s.empty}>暂无匹配的词条</div>
          ) : (
            <div className={s.entryList}>
              {filtered.map((entry) => {
                const tone = DOMAIN_TONE[entry.domain] ?? 'default';
                return (
                  <Link key={entry.id} to={`/wiki/${entry.id}`} className={s.entry}>
                    <div className={`${s.entryGlyph} ${TONE_CLASS[tone]}`}>
                      {deriveGlyph(entry.name)}
                    </div>
                    <div className={s.entryBody}>
                      <div className={s.entryHead}>
                        <span className={s.entryName}>{entry.name}</span>
                        <span className={s.entryDomain}>{entry.domain}</span>
                      </div>
                      <div className={s.entrySummary}>{deriveSummary(entry.body)}</div>
                      <div className={s.entryMeta}>
                        <span className={s.metaItem}>
                          <FileText size={12} />
                          引用 <b>{entry.references.length}</b> 份文档
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

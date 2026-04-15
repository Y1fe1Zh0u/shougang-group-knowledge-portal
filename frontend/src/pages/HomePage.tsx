import { useState, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Building, Star, AlertTriangle, FolderOpen, LayoutGrid,
  BarChart3, Bot, ChevronRight, FileText, Tag,
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle,
  PenLine, MessageSquare, Globe, Network,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { CFG, SPACES, FILES, queryFiles } from '../data/mock';
import type { FileItem } from '../data/mock';
import s from './HomePage.module.css';

const DOMAIN_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle,
};

const APP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PenLine, Search, MessageSquare, Globe, BarChart3, Network, FileText, Bot,
};

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Star, AlertTriangle,
};

const DOT_COLORS = ['#2563eb', '#f59e0b', '#22c55e', '#ef4444'];
const HERO_IMAGE_URLS = [
  '/banner-hero-1.jpg',
  '/banner-hero-2.jpg',
  '/banner-hero-3.jpg',
] as const;

const BANNER_BACKGROUNDS = [
  `linear-gradient(120deg, rgba(6, 18, 42, 0.55) 0%, rgba(12, 38, 84, 0.36) 38%, rgba(18, 50, 108, 0.15) 100%), radial-gradient(circle at 78% 28%, rgba(97, 150, 255, 0.15) 0%, rgba(97, 150, 255, 0) 26%), url("${HERO_IMAGE_URLS[0]}")`,
  `linear-gradient(120deg, rgba(11, 24, 26, 0.53) 0%, rgba(12, 53, 42, 0.39) 42%, rgba(12, 53, 42, 0.13) 100%), radial-gradient(circle at 74% 22%, rgba(104, 211, 145, 0.12) 0%, rgba(104, 211, 145, 0) 25%), url("${HERO_IMAGE_URLS[1]}")`,
  `linear-gradient(120deg, rgba(21, 14, 38, 0.55) 0%, rgba(45, 26, 76, 0.39) 44%, rgba(45, 26, 76, 0.13) 100%), radial-gradient(circle at 76% 24%, rgba(168, 85, 247, 0.11) 0%, rgba(168, 85, 247, 0) 24%), url("${HERO_IMAGE_URLS[2]}")`,
] as const;

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);

  /* Banner auto-play */
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % CFG.banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, navigate]);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  /* Data for sections */
  const sectionData: Record<string, FileItem[]> = {};
  for (const sec of CFG.sections) {
    sectionData[sec.tag] = queryFiles({ tag: sec.tag, pageSize: 6 }).data;
  }

  /* Stats */
  const totalFiles = SPACES.reduce((a, sp) => a + sp.fileCount, 0);
  const caseCount = FILES.filter((f) => f.tags.includes('典型案例')).length;
  const tagCount = new Set(FILES.flatMap((f) => f.tags)).size;
  const spaceCount = SPACES.length;
  const activeBanner = CFG.banners[bannerIdx];
  const activeBannerBackground = BANNER_BACKGROUNDS[bannerIdx % BANNER_BACKGROUNDS.length];

  return (
    <>
      <Header />

      {/* Hero */}
      <section className={s.hero}>
        <div
          className={s.heroBanner}
          style={{ backgroundImage: activeBannerBackground }}
          onClick={() => {
            const link = activeBanner.link;
            if (link) navigate(link);
          }}
        >
          <div className={s.heroGlow} />
          <div className={s.heroInner}>
            <span className={s.bannerLabel}>{activeBanner.label}</span>
            <h1 className={s.heroTitle}>{activeBanner.title}</h1>
            <p className={s.heroSub}>{activeBanner.desc}</p>
          </div>
          <div className={s.heroSearchPanel}>
            <div className={s.searchBox}>
              <input
                className={s.searchInput}
                placeholder="输入关键词搜索知识文档..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
              />
              <button className={s.searchBtn} onClick={handleSearch}>
                <Search size={18} />
              </button>
            </div>
            <div className={s.hotTags}>
              <span className={s.hotLabel}>热门搜索：</span>
              {CFG.hot.map((t) => (
                <button key={t} className={s.hotTag} onClick={() => navigate(`/search?q=${encodeURIComponent(t)}`)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className={s.heroStatsWrap}>
            <div className={s.statsPanel}>
              <div className={s.statsGrid}>
                <div className={s.statCard}>
                  <FileText size={24} className={s.statIcon} />
                  <div className={s.statNumber}>{totalFiles}</div>
                  <div className={s.statLabel}>知识文档</div>
                </div>
                <div className={s.statCard}>
                  <AlertTriangle size={24} className={s.statIcon} />
                  <div className={s.statNumber}>{caseCount}</div>
                  <div className={s.statLabel}>技术案例</div>
                </div>
                <div className={s.statCard}>
                  <Tag size={24} className={s.statIcon} />
                  <div className={s.statNumber}>{tagCount}</div>
                  <div className={s.statLabel}>业务标签</div>
                </div>
                <div className={s.statCard}>
                  <FolderOpen size={24} className={s.statIcon} />
                  <div className={s.statNumber}>{spaceCount}</div>
                  <div className={s.statLabel}>知识空间</div>
                </div>
              </div>
            </div>
          </div>
          <div className={s.bannerDots}>
            {CFG.banners.map((_, i) => (
              <button
                key={i}
                className={`${s.dot} ${i === bannerIdx ? s.dotActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setBannerIdx(i);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className={s.container}>
        {/* Domain navigation */}
        <div className={s.section}>
          <SectionHeader icon={Building} title="业务域导航" />
          <div className={s.domainGrid}>
            {CFG.domains.map((d) => {
              const Icon = DOMAIN_ICONS[d.icon] || Settings;
              const usesBannerThumb = d.name === '设备';
              return (
                <div
                  key={d.name}
                  className={`${s.domainCard} ${usesBannerThumb ? s.domainCardImage : ''}`}
                  style={usesBannerThumb ? { backgroundImage: `url("${HERO_IMAGE_URLS[2]}")` } : undefined}
                  onClick={() => navigate(`/space/${d.spaceId}`)}
                >
                  {usesBannerThumb ? null : (
                    <div className={s.domainIcon} style={{ background: d.bg, color: d.color }}>
                      <Icon size={24} />
                    </div>
                  )}
                  <div className={s.domainName}>{d.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two-column layout */}
        <div className={s.columns}>
          {/* Left: knowledge list panels */}
          <div>
            {CFG.sections.map((sec) => {
              const Icon = SECTION_ICONS[sec.icon] || Star;
              const items = sectionData[sec.tag] || [];
              return (
                <div key={sec.tag} className={s.panel}>
                  <div className={s.panelHeader}>
                    <div className={s.panelHeaderLeft}>
                      <div className={s.panelIcon}><Icon size={14} /></div>
                      <span className={s.panelTitle}>{sec.title}</span>
                    </div>
                    <Link to={sec.link} className={s.panelMore}>
                      更多 <ChevronRight size={14} />
                    </Link>
                  </div>
                  {items.map((f, i) => (
                    <div
                      key={f.id}
                      className={s.listItem}
                      onClick={() => navigate(`/space/${f.spaceId}/file/${f.id}`)}
                    >
                      <span
                        className={s.itemDot}
                        style={{ background: DOT_COLORS[i % 4] }}
                      />
                      <span className={s.itemTitle}>{f.title}</span>
                      <div className={s.itemMeta}>
                        {f.tags.filter((t) => t !== '最新精选' && t !== '典型案例')[0] && (
                          <TagPill name={f.tags.filter((t) => t !== '最新精选' && t !== '典型案例')[0]} />
                        )}
                        <span className={s.itemDate}>{f.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div>
            {/* QA */}
            <div className={s.qaPanel}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={s.panelIcon}><Bot size={14} /></div>
                  <span className={s.panelTitle}>技术问答·专家在线</span>
                </div>
                <Link to="/qa" className={s.panelMore}>
                  提问 <ChevronRight size={14} />
                </Link>
              </div>
              {CFG.qaHot.slice(0, 4).map((q, i) => (
                <div
                  key={i}
                  className={s.qaItem}
                  onClick={() => navigate('/qa')}
                >
                  <span className={s.qaBadge}>Q</span>
                  <span className={s.qaText}>{q}</span>
                </div>
              ))}
              <div className={s.qaFooter}>本周活跃专家：12人</div>
            </div>
          </div>
        </div>

        {/* Knowledge square */}
        <div className={s.section}>
          <SectionHeader icon={FolderOpen} title="知识广场" />
          <div className={s.squareGrid}>
            {SPACES.map((sp) => (
              <div
                key={sp.id}
                className={s.squareCard}
                onClick={() => navigate(`/space/${sp.id}`)}
              >
                <span className={s.squareName}>{sp.name}</span>
                <span className={s.squareCount}>
                  <span className={s.squareNum}>{sp.fileCount}</span>
                  <span className={s.squareUnit}>篇</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* App market */}
        <div className={s.section}>
          <SectionHeader icon={LayoutGrid} title="应用市场" moreLink="/apps" moreText="全部应用" />
          <div className={s.appGrid}>
            {CFG.apps.map((app) => {
              const Icon = APP_ICONS[app.icon] || FileText;
              return (
                <div key={app.id} className={s.appCard}>
                  <div className={s.appIcon} style={{ background: app.color }}>
                    <Icon size={22} />
                  </div>
                  <div className={s.appName}>{app.name}</div>
                  <div className={s.appDesc}>{app.desc}</div>
                  <button className={s.appBtn}>打开</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.bottomPad} />
      </div>

      <Footer />
    </>
  );
}

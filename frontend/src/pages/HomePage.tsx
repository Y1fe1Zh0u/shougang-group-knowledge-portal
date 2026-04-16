import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Building, Star, AlertTriangle, FolderOpen, LayoutGrid,
  BarChart3, Bot, ChevronRight, FileText, Tag,
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle,
  PenLine, MessageSquare, Globe, Network, User, Leaf, Truck, Wrench, GraduationCap,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { fetchAggregatedTags, searchFiles, type FileItem } from '../api/content';
import { CFG } from '../data/mock';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { getDomainVisualPreset } from '../utils/domainVisualPresets';
import { getEnabledApps, getEnabledDomains, getEnabledSections, getEnabledSpaces, toRuntimeDisplayConfig } from '../utils/portalConfig';
import s from './HomePage.module.css';

const DOMAIN_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle, Leaf, Truck, Network, Wrench, GraduationCap,
};

const APP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PenLine, Search, MessageSquare, Globe, BarChart3, Network, FileText, Bot,
};

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Star, AlertTriangle,
};

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

function getPrimaryTag(file: FileItem) {
  return file.tags.find((t) => t !== '最新精选' && t !== '典型案例');
}

export default function HomePage() {
  const navigate = useNavigate();
  const { config, error } = usePortalConfig();
  const displayConfig = toRuntimeDisplayConfig(config?.display);
  const [query, setQuery] = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, FileItem[]>>({});
  const [hotTags, setHotTags] = useState<string[]>([]);
  const [caseCount, setCaseCount] = useState(0);
  const [loadError, setLoadError] = useState('');

  const navigateToTop = useCallback((path: string) => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    navigate(path);
    requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });
  }, [navigate]);

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

  const enabledSpaces = useMemo(() => (config ? getEnabledSpaces(config.spaces) : []), [config]);
  const enabledDomains = useMemo(() => (config ? getEnabledDomains(config.domains, config.spaces) : []), [config]);
  const enabledSections = useMemo(() => (config ? getEnabledSections(config.sections) : []), [config]);
  const enabledApps = useMemo(() => (config ? getEnabledApps(config.apps) : []), [config]);
  const enabledSpaceIds = useMemo(() => enabledSpaces.map((space) => space.id), [enabledSpaces]);

  useEffect(() => {
    let active = true;
    if (!config) return () => {
      active = false;
    };

    void (async () => {
      try {
        const [sectionResults, tagResults, caseResult] = await Promise.all([
          Promise.all(
            enabledSections.map(async (section) => [
              section.tag,
              await searchFiles({
                tag: section.tag,
                spaceIds: enabledSpaceIds,
                pageSize: displayConfig.home.sectionPageSize,
              }),
            ] as const),
          ),
          fetchAggregatedTags(enabledSpaceIds),
          searchFiles({
            tag: '典型案例',
            spaceIds: enabledSpaceIds,
            pageSize: 1,
          }),
        ]);
        if (!active) return;
        setSectionData(
          Object.fromEntries(sectionResults.map(([tag, result]) => [tag, result.data])),
        );
        setHotTags(tagResults);
        setCaseCount(caseResult.total);
        setLoadError('');
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : '首页数据加载失败');
      }
    })();

    return () => {
      active = false;
    };
  }, [config, displayConfig.home.sectionPageSize, enabledSections, enabledSpaceIds]);

  /* Stats */
  const totalFiles = enabledSpaces.reduce((total, space) => total + space.file_count, 0);
  const tagCount = hotTags.length;
  const spaceCount = enabledSpaces.length;
  const activeBanner = CFG.banners[bannerIdx];
  const activeBannerBackground = BANNER_BACKGROUNDS[bannerIdx % BANNER_BACKGROUNDS.length];
  const homeDomains = enabledDomains.slice(0, displayConfig.home.domainCount);
  const rankedHotTags = hotTags.slice(0, displayConfig.home.hotTagsCount);

  return (
    <PageShell>
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
              {rankedHotTags.map((t) => (
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
        <div className={`${s.section} ${s.domainSection}`}>
          <SectionHeader icon={Building} title="业务域导航" moreLink="/domains" moreText="全部业务域" size="large" />
          <div className={s.domainGrid}>
            {homeDomains.map((d) => {
              const Icon = DOMAIN_ICONS[d.icon] || Settings;
              const visualPreset = getDomainVisualPreset(d);
              const domainBackground = visualPreset.backgroundImage;
              const usesBannerThumb = Boolean(domainBackground);
              return (
                <div
                  key={d.name}
                  className={`${s.domainCard} ${usesBannerThumb ? s.domainCardImage : ''}`}
                  style={usesBannerThumb ? { backgroundImage: `url("${domainBackground}")` } : undefined}
                  onClick={() => navigateToTop(`/domain/${encodeURIComponent(d.name)}`)}
                >
                  {usesBannerThumb ? null : (
                    <div className={s.domainIcon} style={{ background: d.bg, color: d.color }}>
                      {visualPreset.logoImage ? (
                        <img src={visualPreset.logoImage} alt={`${d.name} logo`} className={s.domainLogoImage} />
                      ) : (
                        <Icon size={24} />
                      )}
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
            {enabledSections.map((sec) => {
              const Icon = SECTION_ICONS[sec.icon] || Star;
              const items = sectionData[sec.tag] || [];
              const showSummary = sec.tag === '最新精选' || sec.tag === '典型案例';
              const featuredItem = sec.tag === '最新精选' ? items[0] : null;
              const listItems = sec.tag === '最新精选' ? items.slice(1) : items;
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
                  {featuredItem ? (
                    <div
                      className={s.featuredItem}
                      onClick={() =>
                        navigate(`/space/${featuredItem.spaceId}/file/${featuredItem.id}`, {
                          state: { returnTo: sec.link },
                        })}
                    >
                      <div className={s.featuredTitle}>{featuredItem.title}</div>
                      <div className={s.featuredSummary}>{featuredItem.summary}</div>
                      <div className={s.featuredMeta}>
                        {getPrimaryTag(featuredItem) ? (
                          <TagPill name={getPrimaryTag(featuredItem)!} neutral />
                        ) : null}
                        <span className={s.featuredDate}>{featuredItem.date}</span>
                      </div>
                    </div>
                  ) : null}
                  {listItems.map((f) => (
                    <div
                      key={f.id}
                      className={s.listItem}
                      onClick={() =>
                        navigate(`/space/${f.spaceId}/file/${f.id}`, {
                          state: { returnTo: sec.link },
                        })}
                    >
                      <div className={s.itemBody}>
                        <span className={s.itemTitle}>{f.title}</span>
                        {showSummary ? (
                          <div className={s.itemSummary}>{f.summary}</div>
                        ) : null}
                        <div className={s.itemMeta}>
                          {getPrimaryTag(f) ? (
                            <TagPill name={getPrimaryTag(f)!} neutral />
                          ) : null}
                          <span className={s.itemDate}>{f.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className={s.sideColumn}>
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
              <div className={s.qaComposerWrap}>
                <div className={s.qaPreview} onClick={() => navigate('/qa')}>
                  <div className={s.qaPreviewRow}>
                    <div className={s.qaComposerAvatar}>
                      <Bot size={16} />
                    </div>
                    <div className={s.qaComposerBubble}>
                      你好，我是首钢知库智能助手，请问有什么可以帮您？
                    </div>
                  </div>
                    <div className={`${s.qaPreviewRow} ${s.qaPreviewRowUser}`}>
                      <div className={s.qaUserBubble}>振动纹通常如何排查？</div>
                      <div className={`${s.qaComposerAvatar} ${s.qaComposerAvatarUser}`}>
                        <User size={16} />
                      </div>
                    </div>
                </div>
                <button
                  type="button"
                  className={s.qaComposerButton}
                  onClick={() => navigate('/qa')}
                >
                  进入智能问答
                </button>
              </div>
              {(config?.qa.hot_questions || []).slice(0, displayConfig.home.qaHotCount).map((q, i) => (
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

            <div className={`${s.qaPanel} ${s.rankPanel}`}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={s.panelIcon}><Tag size={14} /></div>
                  <span className={s.panelTitle}>热门标签</span>
                </div>
              </div>
              <div className={s.tagRankGrid}>
                {rankedHotTags.map((tagName, index) => (
                  <button
                    key={tagName}
                    type="button"
                    className={s.tagRankItem}
                    onClick={() => navigate(`/list?tag=${encodeURIComponent(tagName)}`)}
                  >
                    <span className={s.tagRankIndex}>#{index + 1}</span>
                    <span className={s.tagRankName}>{tagName}</span>
                    <span className={s.tagRankCount}>标签</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={s.qaPanel}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={s.panelIcon}><FolderOpen size={14} /></div>
                  <span className={s.panelTitle}>知识广场</span>
                </div>
              </div>
              <div className={s.squareGrid}>
                {enabledSpaces.slice(0, displayConfig.home.spacesCount).map((sp) => (
                  <div
                    key={sp.id}
                    className={s.squareCard}
                    onClick={() => navigate(`/space/${sp.id}`)}
                  >
                    <span className={s.squareName}>{sp.name}</span>
                    <span className={s.squareCount}>
                      <span className={s.squareNum}>{sp.file_count}</span>
                      <span className={s.squareUnit}>篇</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {error || loadError ? <div className={s.bottomPad}>{error || loadError}</div> : null}

        {/* App market */}
        <div className={s.section}>
          <SectionHeader icon={LayoutGrid} title="应用市场" moreLink="/apps" moreText="全部应用" size="large" />
          <div className={s.appGrid}>
            {enabledApps.slice(0, displayConfig.home.appsCount).map((app) => {
              const Icon = APP_ICONS[app.icon] || FileText;
              return (
                <div key={app.id} className={s.appCard}>
                  <div className={s.appIcon} style={{ background: app.color }}>
                    <Icon size={22} />
                  </div>
                  <div className={s.appName}>{app.name}</div>
                  <div className={s.appDesc}>{app.desc}</div>
                  <button className={s.appBtn} onClick={() => app.url && window.open(app.url, '_blank', 'noopener,noreferrer')} disabled={!app.url}>
                    {app.url ? '打开' : '未配置地址'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={s.bottomPad} />
      </div>
    </PageShell>
  );
}

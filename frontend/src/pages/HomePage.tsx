import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Building, Star, AlertTriangle, FolderOpen, LayoutGrid,
  BarChart3, Bot, ChevronRight, FileText, Tag,
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle,
  PenLine, MessageSquare, Globe, Network, User, Leaf, Truck, Wrench, GraduationCap,
  Award, MessageSquarePlus, Sparkles, FolderLock, Lock,
  BookOpen, Package, Video, Flame, Briefcase, Users,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import TagPill from '../components/TagPill';
import { fetchAggregatedTags, searchFiles, type FileItem } from '../api/content';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { useAuth } from '../hooks/useAuth';
import { resolveSectionVisual } from '../utils/adminSections';
import { formatDisplayDateTime } from '../utils/dateTime';
import { getDomainVisualPreset } from '../utils/domainVisualPresets';
import { getEnabledApps, getEnabledDomains, getEnabledSections, getEnabledSpaces, resolveHomeBanners, toRuntimeDisplayConfig } from '../utils/portalConfig';
import { WIKI_LIST_ITEMS } from '../data/wikiData';
import { COURSE_LIST_ITEMS } from '../data/courseMock';
import s from './HomePage.module.css';

const DOMAIN_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Settings, Factory, Snowflake, Zap, Shield, CheckCircle, Leaf, Truck, Network, Wrench, GraduationCap,
  Briefcase, Users,
};

const APP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PenLine, Search, MessageSquare, Globe, BarChart3, Network, FileText, Bot,
};

const SECTION_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  Star, AlertTriangle,
};

const BANNER_OVERLAY_GRADIENT =
  'linear-gradient(180deg, rgba(43, 118, 246, 0.52) 0%, rgba(59, 143, 246, 0.36) 38%, rgba(22, 98, 178, 0.34) 100%), linear-gradient(90deg, rgba(37, 99, 235, 0.18) 0%, rgba(37, 99, 235, 0.04) 46%, rgba(37, 99, 235, 0.16) 100%)';

function buildBannerBackground(imageUrl: string): string {
  return `${BANNER_OVERLAY_GRADIENT}, url("${imageUrl}")`;
}

const APP_ENTRY_DEFAULTS = [
  { id: 'app-write', name: '智能写作', desc: '辅助生成报告', iconBg: '#eff6ff', iconColor: '#2563eb', icon: 'PenLine' as const },
  { id: 'app-search', name: '全域检索', desc: '跨空间定位', iconBg: '#ecfeff', iconColor: '#0891b2', icon: 'Search' as const },
  { id: 'app-qa', name: '智能问答', desc: 'AI 即时解答', iconBg: '#f5f3ff', iconColor: '#7c3aed', icon: 'MessageSquare' as const },
  { id: 'app-bi', name: '数据看板', desc: '关键指标可视化', iconBg: '#ecfdf5', iconColor: '#059669', icon: 'BarChart3' as const },
];

function getPrimaryTag(file: FileItem) {
  return file.tags.find((t) => t !== '最新精选' && t !== '典型案例');
}

function getWelcomeMessage(welcomeMessage?: string) {
  return welcomeMessage?.trim() || '你好，我是首钢知库智能助手，请问有什么可以帮您？';
}

export default function HomePage() {
  const navigate = useNavigate();
  const { config, error } = usePortalConfig();
  const { user } = useAuth();
  const displayConfig = toRuntimeDisplayConfig(config?.display);
  const [query, setQuery] = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);
  const [sectionData, setSectionData] = useState<Record<string, FileItem[]>>({});
  const [hotTags, setHotTags] = useState<string[]>([]);
  const [loadError, setLoadError] = useState('');
  const [welcomeToast, setWelcomeToast] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      const flag = window.sessionStorage.getItem('sg_just_logged_in');
      if (!flag) return '';
      window.sessionStorage.removeItem('sg_just_logged_in');
      const raw = window.localStorage.getItem('sg_portal_user');
      if (!raw) return '';
      const parsed = JSON.parse(raw) as { name?: string };
      return parsed.name ? `欢迎回来，${parsed.name}` : '';
    } catch {
      return '';
    }
  });

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

  const homeBanners = useMemo(() => resolveHomeBanners(config?.banners), [config?.banners]);

  const safeBannerIdx = homeBanners.length ? bannerIdx % homeBanners.length : 0;

  /* Banner auto-play */
  useEffect(() => {
    if (homeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIdx((i) => (i + 1) % homeBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [homeBanners.length]);

  useEffect(() => {
    if (!welcomeToast) return;
    const timer = window.setTimeout(() => setWelcomeToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [welcomeToast]);

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
        const [sectionResults, tagResults] = await Promise.all([
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
        ]);
        if (!active) return;
        setSectionData(
          Object.fromEntries(sectionResults.map(([tag, result]) => [tag, result.data])),
        );
        setHotTags(tagResults);
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
  const spaceCount = enabledSpaces.length;
  const activeBanner = homeBanners[safeBannerIdx] ?? homeBanners[0];
  const activeBannerBackground = buildBannerBackground(activeBanner.imageUrl);
  const homeDomains = enabledDomains.slice(0, displayConfig.home.domainCount);
  const domainColumns = Math.max(homeDomains.length || 1, 1);
  const rankedHotTags = hotTags.slice(0, displayConfig.home.hotTagsCount);
  const tagRankList = rankedHotTags.slice(0, 6);
  const homeSpaces = enabledSpaces.slice(0, displayConfig.home.spacesCount);
  const homeApps = enabledApps.slice(0, displayConfig.home.appsCount);
  const assistantGreeting = getWelcomeMessage(config?.qa.welcome_message);
  const qaHotQuestions = (config?.qa.hot_questions || []).map((question) => question.trim()).filter(Boolean);
  const primaryQaQuestion = qaHotQuestions[0] || '振动纹通常如何排查？';

  const expertHotQuestions = qaHotQuestions.length
    ? qaHotQuestions.slice(0, 3)
    : [
        '连铸坯角部裂纹有哪些常见判定标准？',
        '高炉煤气含氧量超标可能由哪些原因引起？',
        '轧机液压系统压力波动如何诊断？',
      ];

  const appEntryItems = homeApps.length > 0
    ? homeApps.slice(0, 4).map((app) => ({
      id: String(app.id),
      name: app.name,
      desc: app.desc,
      iconKey: app.icon,
      iconBg: app.color,
      iconColor: '#fff',
      url: app.url,
    }))
    : APP_ENTRY_DEFAULTS.map((entry) => ({
      id: entry.id,
      name: entry.name,
      desc: entry.desc,
      iconKey: entry.icon,
      iconBg: entry.iconBg,
      iconColor: entry.iconColor,
      url: undefined as string | undefined,
    }));
  const heroStats = [
    { value: '2877万', label: '篇文档' },
    { value: '1.17亿', label: '次阅读' },
    { value: '163万', label: '次点赞' },
    { value: '1101万', label: '条评论' },
  ];

  return (
    <PageShell>
      {welcomeToast ? (
        <div className={s.welcomeToast} role="status">
          <CheckCircle size={14} />
          <span>{welcomeToast}</span>
        </div>
      ) : null}

      {/* Hero */}
      <section className={s.hero}>
        <div
          className={s.heroBanner}
          style={{ backgroundImage: activeBannerBackground, cursor: activeBanner.linkUrl ? 'pointer' : 'default' }}
          onClick={() => {
            const link = activeBanner.linkUrl;
            if (!link) return;
            if (/^https?:\/\//i.test(link)) {
              window.open(link, '_blank', 'noopener,noreferrer');
            } else {
              navigate(link);
            }
          }}
        >
          <div className={s.heroGlow} />
          <div className={s.heroInner}>
            <div className={s.heroTitleRow}>
              <span className={s.bannerLabel}>{activeBanner.label}</span>
              <h1 className={s.heroTitle}>{activeBanner.title}</h1>
            </div>
            <p className={s.heroSub}>{activeBanner.desc}</p>
          </div>
          <div className={s.heroSearchPanel} onClick={(event) => event.stopPropagation()}>
            <div className={s.searchBox}>
              <button type="button" className={s.searchModeBtn}>
                <Flame size={13} />
                <span>热门搜索</span>
                <ChevronRight size={12} />
              </button>
              <input
                className={s.searchInput}
                placeholder="输入关键词搜索知识文档"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                type="button"
                className={s.searchBtn}
                onClick={(event) => {
                  event.stopPropagation();
                  handleSearch();
                }}
              >
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className={s.heroBottomRow} onClick={(event) => event.stopPropagation()}>
            <div className={s.appShortcutList}>
              {appEntryItems.map((app) => {
                const AppIcon = APP_ICONS[app.iconKey] || Bot;
                return (
                  <button
                    key={app.id}
                    type="button"
                    className={s.appShortcut}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (app.url) {
                        window.open(app.url, '_blank', 'noopener,noreferrer');
                      } else {
                        navigate('/apps');
                      }
                    }}
                  >
                    <span className={s.appShortcutIcon}>
                      <AppIcon size={13} />
                    </span>
                    <span className={s.appShortcutText}>{app.name}</span>
                  </button>
                );
              })}
            </div>
            <div className={s.heroStatsPanel}>
              <div className={s.statsGrid}>
                {heroStats.map((stat) => (
                  <div key={`${stat.value}-${stat.label}`} className={s.statCard}>
                    <span className={s.statNumber}>{stat.value}</span>
                    <span className={s.statLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className={s.bannerDots}>
            {homeBanners.map((_, i) => (
              <button
                key={i}
                className={`${s.dot} ${i === safeBannerIdx ? s.dotActive : ''}`}
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
          <div
            className={s.domainGrid}
            style={{ gridTemplateColumns: `repeat(${domainColumns}, minmax(0, 1fr))` }}
          >
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
                      <Icon size={22} />
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
          <div className={s.leftColumn}>
            {enabledSections.map((sec) => {
              const Icon = SECTION_ICONS[sec.icon] || Star;
              const visual = resolveSectionVisual(sec);
              const items = sectionData[sec.tag] || [];
              const showSummary = sec.tag === '最新精选' || sec.tag === '典型案例';
              const featuredItem = sec.tag === '最新精选' ? items[0] : null;
              const listItems = sec.tag === '最新精选' ? items.slice(1) : items;
              return (
                <div key={sec.tag} className={s.panel}>
                  <div className={s.panelHeader}>
                    <div className={s.panelHeaderLeft}>
                      <div className={s.panelIcon} style={{ background: visual.bg, color: visual.color }}><Icon size={14} /></div>
                      <span className={s.panelTitle}>{sec.title}</span>
                    </div>
                    <Link
                      to={`${sec.link}${sec.link.includes('?') ? '&' : '?'}title=${encodeURIComponent(sec.title)}`}
                      className={s.panelMore}
                    >
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
                        <span className={s.featuredDate}>{formatDisplayDateTime(featuredItem.date)}</span>
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
                          <span className={s.itemDate}>{formatDisplayDateTime(f.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* 专业课程 · 岗位赋能 */}
            <div className={s.panel}>
              <div className={s.panelHeader}>
                <div className={s.panelHeaderLeft}>
                  <div className={`${s.panelIcon} ${s.panelIconCourse}`}>
                    <GraduationCap size={14} />
                  </div>
                  <span className={s.panelTitle}>专业课程 · 岗位赋能</span>
                </div>
                <Link to="/course" className={s.panelMore}>
                  全部课程 <ChevronRight size={14} />
                </Link>
              </div>
              <div className={s.courseList}>
                {COURSE_LIST_ITEMS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={s.courseRow}
                    onClick={() => navigate(`/course/${c.id}`)}
                  >
                    <Video size={22} className={s.courseRowIcon} />
                    <span className={s.courseRowTitle}>{c.title}</span>
                    {c.hot ? (
                      <span className={s.courseHotTag}>
                        <Flame size={10} />热门
                      </span>
                    ) : c.domain ? (
                      <span className={s.courseDomainTag}>{c.domain}</span>
                    ) : null}
                    <span className={s.courseRowDuration}>{c.duration}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 股份百科 · 知识产品 */}
            <div className={s.panel}>
              <div className={s.panelHeader}>
                <div className={s.panelHeaderLeft}>
                  <div className={`${s.panelIcon} ${s.panelIconWiki}`}>
                    <BookOpen size={14} />
                  </div>
                  <span className={s.panelTitle}>股份百科 · 知识产品</span>
                </div>
                <Link to="/wiki" className={s.panelMore}>
                  更多词条 <ChevronRight size={14} />
                </Link>
              </div>
              <div className={s.wikiList}>
                {WIKI_LIST_ITEMS.slice(0, 5).map((item) => (
                  <Link key={item.id} to={`/wiki/${item.id}`} className={s.wikiRow}>
                    <Package size={22} className={s.wikiRowIcon} />
                    <span className={s.wikiRowName}>{item.name}</span>
                    <span className={s.wikiCatTag}>{item.domain}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className={s.sideColumn}>
            {/* 智能问答 */}
            <div className={s.qaPanel}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={s.panelIcon}><Bot size={14} /></div>
                  <span className={s.panelTitle}>智能问答</span>
                </div>
                <Link to="/qa" className={s.panelMore}>
                  进入 <ChevronRight size={14} />
                </Link>
              </div>
              <div className={s.qaComposerWrap}>
                <div className={s.qaPreview} onClick={() => navigate('/qa')}>
                  <div className={s.qaPreviewRow}>
                    <div className={s.qaComposerAvatar}>
                      <Bot size={16} />
                    </div>
                    <div className={s.qaComposerBubble}>
                      {assistantGreeting}
                    </div>
                  </div>
                  <div className={`${s.qaPreviewRow} ${s.qaPreviewRowUser}`}>
                    <div className={s.qaUserBubble}>{primaryQaQuestion}</div>
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
                  与 Agent 对话
                </button>
              </div>
              <div className={s.qaCallout}>
                <Sparkles size={13} />
                <span>支持流式回复 · 引用知识库来源 · 多轮追问</span>
              </div>
            </div>

            {/* 专家问答 */}
            <div className={s.qaPanel}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={`${s.panelIcon} ${s.panelIconExpert}`}><Award size={14} /></div>
                  <span className={s.panelTitle}>专家问答</span>
                </div>
                <Link to="/expert-qa" className={s.panelMore}>
                  更多 <ChevronRight size={14} />
                </Link>
              </div>
              <Link to="/expert-qa" className={s.expertCta}>
                <MessageSquarePlus size={22} />
                <div className={s.expertCtaBody}>
                  <div className={s.expertCtaTitle}>向专家提问</div>
                  <div className={s.expertCtaDesc}>126 位认证专家在线 · 平均 4 小时响应</div>
                </div>
                <ChevronRight size={16} className={s.expertCtaCaret} />
              </Link>
              {expertHotQuestions.map((question, index) => (
                <div
                  key={index}
                  className={s.expertItem}
                  onClick={() => navigate('/expert-qa')}
                >
                  <span className={s.expertBadge}>Q</span>
                  <span className={s.expertText}>{question}</span>
                </div>
              ))}
              <div className={s.qaFooter}>本周活跃专家：12人</div>
            </div>

            {/* 热门标签 */}
            {tagRankList.length > 0 ? (
              <div className={`${s.qaPanel} ${s.rankPanel}`}>
                <div className={s.qaHeader}>
                  <div className={s.qaHeaderLeft}>
                    <div className={s.panelIcon}><Tag size={14} /></div>
                    <span className={s.panelTitle}>热门标签</span>
                  </div>
                </div>
                <div className={s.tagRankGrid}>
                  {tagRankList.map((tagName, index) => (
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
            ) : null}

            {/* 受控知识空间 — visible only for unauthenticated visitors */}
            {!user ? (
              <div className={s.qaPanel}>
                <div className={s.qaHeader}>
                  <div className={s.qaHeaderLeft}>
                    <div className={`${s.panelIcon} ${s.panelIconLock}`}><Lock size={14} /></div>
                    <span className={s.panelTitle}>受控知识空间</span>
                  </div>
                </div>
                <div className={s.lockBody}>
                  登录后可访问 <b>{spaceCount}</b> 个内部知识空间，含设备点检规范、内部事故复盘、部门技术分享等受控内容。
                </div>
                <div className={s.lockTeaser}>
                  <div className={s.lockIcon}>
                    <FolderLock size={18} />
                  </div>
                  <div className={s.lockBlock}>
                    <div className={s.lockTitle}>仅登录可见</div>
                    <div className={s.lockDesc}>含 12 篇本周新增受控文档</div>
                  </div>
                  <Link to="/login?redirect=%2F" className={s.lockBtn}>登录</Link>
                </div>
              </div>
            ) : null}

            {/* 知识广场 */}
            {homeSpaces.length > 0 ? (
              <div className={s.qaPanel}>
                <div className={s.qaHeader}>
                  <div className={s.qaHeaderLeft}>
                    <div className={s.panelIcon}><FolderOpen size={14} /></div>
                    <span className={s.panelTitle}>知识广场</span>
                  </div>
                </div>
                <div className={s.squareGrid}>
                  {homeSpaces.map((sp) => (
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
            ) : null}

            {/* 应用入口 */}
            <div className={s.qaPanel}>
              <div className={s.qaHeader}>
                <div className={s.qaHeaderLeft}>
                  <div className={s.panelIcon}><LayoutGrid size={14} /></div>
                  <span className={s.panelTitle}>应用入口</span>
                </div>
                <Link to="/apps" className={s.panelMore}>
                  全部 <ChevronRight size={14} />
                </Link>
              </div>
              <div className={s.appEntryGrid}>
                {appEntryItems.map((entry) => {
                  const Icon = APP_ICONS[entry.iconKey] || FileText;
                  const handleClick = () => {
                    if (entry.url) {
                      window.open(entry.url, '_blank', 'noopener,noreferrer');
                    } else {
                      navigate('/apps');
                    }
                  };
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={s.appEntryCard}
                      onClick={handleClick}
                    >
                      <span
                        className={s.appEntryIcon}
                        style={{ background: entry.iconBg, color: entry.iconColor }}
                      >
                        <Icon size={16} />
                      </span>
                      <span className={s.appEntryBody}>
                        <span className={s.appEntryName}>{entry.name}</span>
                        <span className={s.appEntryDesc}>{entry.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {error || loadError ? <div className={s.bottomPad}>{error || loadError}</div> : null}

        <div className={s.bottomPad} />
      </div>
    </PageShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Clock3,
  FolderLock,
  FolderOpen,
  Users,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import {
  ApiRequestError,
  fetchKnowledgeSpaces,
  type KnowledgeSpace,
} from '../api/content';
import s from './KnowledgeSpacesPage.module.css';

const ROLE_LABELS: Record<string, string> = {
  creator: '创建者',
  admin: '管理员',
  member: '成员',
};

const MOCK_SPACES: KnowledgeSpace[] = [
  {
    id: 7101,
    name: '冷轧设备故障复盘库',
    description: '沉淀冷轧产线设备异常、抢修记录与复盘结论。',
    authType: 'private',
    userRole: 'creator',
    spaceKind: 'normal',
    departmentName: '',
    fileCount: 38,
    memberCount: 6,
    isPinned: true,
    updatedAt: '2026-04-26T09:20:00',
    sources: ['mine', 'managed'],
  },
  {
    id: 7102,
    name: '质量异议处置工作组',
    description: '面向质量、销售、制造协同的异议案例与处置材料。',
    authType: 'approval',
    userRole: 'admin',
    spaceKind: 'normal',
    departmentName: '',
    fileCount: 24,
    memberCount: 11,
    isPinned: false,
    updatedAt: '2026-04-24T16:45:00',
    sources: ['joined', 'managed'],
  },
  {
    id: 7103,
    name: '设备管理部内部知识空间',
    description: '部门制度、点检模板、检修计划与供应商技术资料。',
    authType: 'private',
    userRole: 'member',
    spaceKind: 'department',
    departmentName: '设备管理部',
    fileCount: 57,
    memberCount: 29,
    isPinned: false,
    updatedAt: '2026-04-22T11:10:00',
    sources: ['department'],
  },
  {
    id: 7104,
    name: '高炉煤气安全专项',
    description: '专项检查、风险作业票、应急预案和整改闭环记录。',
    authType: 'approval',
    userRole: 'member',
    spaceKind: 'normal',
    departmentName: '',
    fileCount: 16,
    memberCount: 8,
    isPinned: false,
    updatedAt: '2026-04-18T14:30:00',
    sources: ['joined'],
  },
  {
    id: 7105,
    name: '公开制度库',
    description: '面向全员开放的制度文件、通知公告和标准模板。',
    authType: 'public',
    userRole: 'member',
    spaceKind: 'normal',
    departmentName: '',
    fileCount: 12,
    memberCount: 0,
    isPinned: false,
    updatedAt: '2026-04-20T09:20:00',
    sources: ['joined'],
  },
];

function formatDate(value: string) {
  if (!value) return '暂无更新';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function isCreatedSpace(space: KnowledgeSpace) {
  return space.sources.includes('mine') || space.userRole === 'creator';
}

function getSpaceSections(spaces: KnowledgeSpace[]) {
  const created = spaces.filter(isCreatedSpace);
  const joined = spaces.filter((space) => !isCreatedSpace(space));
  return [
    {
      key: 'created',
      title: '我创建的',
      desc: '由当前账号创建或拥有管理归属的知识空间',
      spaces: created,
      icon: FolderLock,
      tone: 'created',
    },
    {
      key: 'joined',
      title: '我加入的',
      desc: '当前账号加入、部门授权或被授予访问权限的知识空间',
      spaces: joined,
      icon: FolderOpen,
      tone: 'joined',
    },
  ];
}

export default function KnowledgeSpacesPage() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loginRequired, setLoginRequired] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchKnowledgeSpaces()
      .then((result) => {
        if (!active) return;
        setSpaces(result.data);
        setUsingMock(false);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          setLoginRequired(true);
          setSpaces([]);
          return;
        }
        setSpaces(MOCK_SPACES);
        setUsingMock(true);
        setError('');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const sections = useMemo(() => getSpaceSections(spaces), [spaces]);
  const stats = useMemo(() => {
    const fileCount = spaces.reduce((sum, space) => sum + space.fileCount, 0);
    return {
      createdCount: sections[0]?.spaces.length ?? 0,
      joinedCount: sections[1]?.spaces.length ?? 0,
      fileCount,
    };
  }, [sections, spaces]);

  const goLogin = () => {
    navigate(`/login?redirect=${encodeURIComponent('/knowledge-spaces')}`);
  };

  return (
    <PageShell>
      <div className={s.container}>
        <section className={s.head}>
          <div className={s.headMain}>
            <div className={s.headIcon}>
              <FolderLock size={22} />
            </div>
            <div>
              <h1 className={s.title}>我的知识空间</h1>
              <p className={s.subtitle}>展示当前账号可访问的知识空间。</p>
            </div>
          </div>
          <div className={s.stats}>
            <div className={s.statItem}>
              <span className={s.statValue}>{spaces.length}</span>
              <span className={s.statLabel}>空间</span>
            </div>
            <div className={s.statItem}>
              <span className={s.statValue}>{stats.fileCount}</span>
              <span className={s.statLabel}>文档</span>
            </div>
          </div>
        </section>

        <section className={s.summaryGrid} aria-label="知识空间概览">
          <div className={s.summaryItem}>
            <FolderLock size={18} />
            <span className={s.summaryText}>我创建的</span>
            <b>{stats.createdCount}</b>
          </div>
          <div className={s.summaryItem}>
            <FolderOpen size={18} />
            <span className={s.summaryText}>我加入的</span>
            <b>{stats.joinedCount}</b>
          </div>
          <div className={s.summaryItem}>
            <Building2 size={18} />
            <span className={s.summaryText}>全部文档</span>
            <b>{stats.fileCount}</b>
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <div>
              <div className={s.panelTitle}>空间分组</div>
              <div className={s.panelSub}>按归属关系区分空间，组内按置顶和更新时间排序</div>
            </div>
            <span className={s.panelCount}>{spaces.length} 个</span>
          </div>

          {!loading && usingMock ? (
            <div className={s.mockNotice}>后端聚合接口尚未接通，当前显示演示数据。</div>
          ) : null}

          {loading ? <div className={s.state}>正在加载知识空间...</div> : null}

          {!loading && loginRequired ? (
            <div className={s.emptyState}>
              <div className={s.emptyTitle}>需要登录</div>
              <p className={s.emptyDesc}>登录后可查看当前账号可见的知识空间。</p>
              <button type="button" className={s.primaryBtn} onClick={goLogin}>
                去登录
              </button>
            </div>
          ) : null}

          {!loading && error ? <div className={s.state}>{error}</div> : null}

          {!loading && !error && !loginRequired && spaces.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyTitle}>暂无可见的知识空间</div>
              <p className={s.emptyDesc}>当前账号暂时没有可访问的知识空间。</p>
            </div>
          ) : null}

          {!loading && !error && !loginRequired && spaces.length > 0 ? (
            <div className={s.sectionList}>
              {sections.map((section) => {
                const SectionIcon = section.icon;
                const documentCount = section.spaces.reduce((sum, space) => sum + space.fileCount, 0);
                return (
                  <section
                    key={section.key}
                    className={`${s.spaceSection} ${
                      section.tone === 'created' ? s.createdSection : s.joinedSection
                    }`}
                  >
                    <div className={s.sectionHead}>
                      <div className={s.sectionTitleWrap}>
                        <span className={s.sectionIcon}>
                          <SectionIcon size={16} />
                        </span>
                        <div>
                          <div className={s.sectionTitle}>{section.title}</div>
                          <div className={s.sectionDesc}>{section.desc}</div>
                        </div>
                      </div>
                      <span className={s.sectionCount}>
                        {section.spaces.length} 个空间 · {documentCount} 文档
                      </span>
                    </div>
                    {section.spaces.length ? (
                      <div className={s.list}>
                        {section.spaces.map((space) => (
                          <button
                            key={space.id}
                            type="button"
                            className={s.row}
                            onClick={() => navigate(`/space/${space.id}`)}
                          >
                            <span className={s.rowIcon}>
                              {space.spaceKind === 'department' ? <Building2 size={20} /> : <FolderLock size={20} />}
                            </span>
                            <span className={s.rowBody}>
                              <span className={s.rowTop}>
                                <span className={s.rowName}>{space.name}</span>
                              </span>
                              {space.description ? (
                                <span className={s.rowDesc}>{space.description}</span>
                              ) : null}
                              <span className={s.metaRow}>
                                <span><Users size={13} />{ROLE_LABELS[space.userRole] || space.userRole || '成员'}</span>
                                <span><Clock3 size={13} />{formatDate(space.updatedAt)}</span>
                                {space.departmentName ? <span><Building2 size={13} />{space.departmentName}</span> : null}
                              </span>
                            </span>
                            <span className={s.fileCount}>{space.fileCount} 文档</span>
                            <ChevronRight size={18} className={s.chevron} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={s.sectionEmpty}>暂无{section.title}知识空间</div>
                    )}
                  </section>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </PageShell>
  );
}

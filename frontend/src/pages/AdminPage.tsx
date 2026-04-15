import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import {
  FolderOpen, Building, Tag, Bot, Star, LayoutGrid, Plus, SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import Header from '../components/Header';
import {
  type AppConfig,
  type DisplayConfig,
  type DomainConfig,
  fetchAdminConfig,
  type PortalConfig,
  type RecommendationConfig,
  type SectionConfig,
  type SpaceConfig,
  type QAConfig,
  updateAppsConfig,
  updateDisplayConfig,
  updateDomainsConfig,
  updateQaConfig,
  updateRecommendationConfig,
  updateSectionsConfig,
  updateSpacesConfig,
} from '../api/adminConfig';
import s from './AdminPage.module.css';

const NAV_ITEMS = [
  { key: 'spaces', label: '知识空间', icon: FolderOpen },
  { key: 'domains', label: '业务域', icon: Building },
  { key: 'sections', label: '首页分区', icon: Tag },
  { key: 'qa', label: '问答配置', icon: Bot },
  { key: 'recommend', label: '推荐策略', icon: Star },
  { key: 'display', label: '展示配置', icon: SlidersHorizontal },
  { key: 'apps', label: '应用市场', icon: LayoutGrid },
];

type NavKey = typeof NAV_ITEMS[number]['key'];

type DisplayItem = {
  group: string;
  key: string;
  label: string;
  value: number;
};

export default function AdminPage() {
  const [active, setActive] = useState<NavKey>('spaces');
  const [config, setConfig] = useState<PortalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function loadConfig() {
    setLoading(true);
    setError('');
    try {
      const next = await fetchAdminConfig();
      setConfig(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '配置加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  async function runSave(task: () => Promise<void>) {
    setSaving(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  const displayItems = config ? getDisplayItems(config.display) : [];

  return (
    <>
      <Header />
      <div className={s.layout}>
        {/* Left nav */}
        <nav className={s.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`${s.navItem} ${active === item.key ? s.navItemActive : ''}`}
                onClick={() => setActive(item.key)}
              >
                <Icon size={16} />
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* Main */}
        <main className={s.main}>
          <div className={s.statusRow}>
            <div className={s.statusText}>
              {loading ? '正在加载配置...' : saving ? '正在保存配置...' : '配置已加载，可直接编辑并保存。'}
            </div>
            <button className={s.subtleBtn} onClick={() => void loadConfig()} disabled={loading || saving}>
              <RefreshCw size={14} />
              刷新
            </button>
          </div>
          {error ? <div className={s.errorBox}>{error}</div> : null}
          {!config && !loading ? (
            <div className={s.emptyState}>配置暂时不可用</div>
          ) : null}
          {config && active === 'spaces' && (
            <SpacesTable
              spaces={config.spaces}
              saving={saving}
              onAdd={() => void handleAddSpace(config.spaces, runSave, setConfig)}
              onEdit={(index) => void handleEditSpace(config.spaces, index, runSave, setConfig)}
              onDelete={(index) => void handleDeleteSpace(config.spaces, index, runSave, setConfig)}
            />
          )}
          {config && active === 'domains' && (
            <DomainsTable
              domains={config.domains}
              spaces={config.spaces}
              saving={saving}
              onAdd={() => void handleAddDomain(config.domains, config.spaces, runSave, setConfig)}
              onEdit={(index) => void handleEditDomain(config.domains, config.spaces, index, runSave, setConfig)}
              onDelete={(index) => void handleDeleteDomain(config.domains, index, runSave, setConfig)}
            />
          )}
          {config && active === 'sections' && (
            <SectionsTable
              sections={config.sections}
              saving={saving}
              onAdd={() => void handleAddSection(config.sections, runSave, setConfig)}
              onEdit={(index) => void handleEditSection(config.sections, index, runSave, setConfig)}
              onDelete={(index) => void handleDeleteSection(config.sections, index, runSave, setConfig)}
            />
          )}
          {config && active === 'qa' && (
            <QAConfigTable
              qa={config.qa}
              spaces={config.spaces}
              saving={saving}
              onEditSpaces={() => void handleEditQaSpaces(config.qa, runSave, setConfig)}
              onEditQuestions={() => void handleEditQaQuestions(config.qa, runSave, setConfig)}
              onEditSearchPrompt={() => void handleEditQaPrompt(config.qa, 'ai_search_system_prompt', runSave, setConfig)}
              onEditQaPrompt={() => void handleEditQaPrompt(config.qa, 'qa_system_prompt', runSave, setConfig)}
            />
          )}
          {config && active === 'recommend' && (
            <RecommendConfigTable
              recommendation={config.recommendation}
              saving={saving}
              onEditHome={() => void handleEditRecommendation(config.recommendation, 'home_strategy', runSave, setConfig)}
              onEditDetail={() => void handleEditRecommendation(config.recommendation, 'detail_strategy', runSave, setConfig)}
            />
          )}
          {config && active === 'display' && (
            <DisplayConfigTable
              items={displayItems}
              saving={saving}
              onEdit={(key) => void handleEditDisplay(config.display, key, runSave, setConfig)}
            />
          )}
          {config && active === 'apps' && (
            <AppsTable
              apps={config.apps}
              saving={saving}
              onAdd={() => void handleAddApp(config.apps, runSave, setConfig)}
              onEdit={(index) => void handleEditApp(config.apps, index, runSave, setConfig)}
              onDelete={(index) => void handleDeleteApp(config.apps, index, runSave, setConfig)}
            />
          )}
        </main>
      </div>
    </>
  );
}

function SpacesTable({
  spaces,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: {
  spaces: SpaceConfig[];
  saving: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>知识空间管理</h2>
        <button className={s.addBtn} onClick={onAdd} disabled={saving}><Plus size={14} /> 添加</button>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>空间名称</th>
            <th>标签数</th>
            <th>文件数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {spaces.map((sp, index) => (
            <tr key={sp.id}>
              <td>{sp.id}</td>
              <td>{sp.name}</td>
              <td>{sp.tag_count}</td>
              <td>{sp.file_count}</td>
              <td>
                <span className={s.editBtn} onClick={() => onEdit(index)}>编辑</span>
                <span className={s.deleteBtn} onClick={() => onDelete(index)}>删除</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function DomainsTable({
  domains,
  spaces,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: {
  domains: DomainConfig[];
  spaces: SpaceConfig[];
  saving: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>业务域管理</h2>
        <button className={s.addBtn} onClick={onAdd} disabled={saving}><Plus size={14} /> 添加</button>
      </div>
      {/* TODO: Confirm with product whether domain cards should use photo backgrounds, logo/icon cards, or support both as a configurable strategy. */}
      <p className={s.pageNote}>
        待与产品确认最终卡片策略：业务域卡片是采用“图片背景卡”还是“Logo/图标卡”，后台当前同时预留背景图和 Logo/图标 配置位。首页业务域导航当前按前端数组顺序取前 N 个展示。
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th>业务域名称</th>
            <th>Logo/图标</th>
            <th>背景图</th>
            <th>绑定空间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((d, index) => {
            const sp = spaces.find((ss) => ss.id === d.space_ids[0]);
            const backgroundImage = d.background_image;
            return (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.icon}</td>
                <td>{backgroundImage || '未配置'}</td>
                <td>{sp?.name || d.space_ids.join(', ')}</td>
                <td>
                  <span className={s.editBtn} onClick={() => onEdit(index)}>编辑</span>
                  <span className={s.deleteBtn} onClick={() => onDelete(index)}>删除</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function SectionsTable({
  sections,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: {
  sections: SectionConfig[];
  saving: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>首页分区管理</h2>
        <button className={s.addBtn} onClick={onAdd} disabled={saving}><Plus size={14} /> 添加</button>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>分区标题</th>
            <th>关联标签</th>
            <th>链接</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {sections.map((sec, index) => (
            <tr key={sec.tag}>
              <td>{sec.title}</td>
              <td>{sec.tag}</td>
              <td>{sec.link}</td>
              <td>
                <span className={s.editBtn} onClick={() => onEdit(index)}>编辑</span>
                <span className={s.deleteBtn} onClick={() => onDelete(index)}>删除</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function QAConfigTable({
  qa,
  spaces,
  saving,
  onEditSpaces,
  onEditQuestions,
  onEditSearchPrompt,
  onEditQaPrompt,
}: {
  qa: QAConfig;
  spaces: SpaceConfig[];
  saving: boolean;
  onEditSpaces: () => void;
  onEditQuestions: () => void;
  onEditSearchPrompt: () => void;
  onEditQaPrompt: () => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>问答配置</h2>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>配置项</th>
            <th>当前值</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>知识空间范围</td>
            <td>{qa.knowledge_space_ids.length ? `${qa.knowledge_space_ids.length} 个 (${qa.knowledge_space_ids.map((id) => spaces.find((sp) => sp.id === id)?.name || id).join('、')})` : '未配置'}</td>
            <td><span className={s.editBtn} onClick={onEditSpaces}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
          <tr>
            <td>热门问题</td>
            <td>{qa.hot_questions.length} 条</td>
            <td><span className={s.editBtn} onClick={onEditQuestions}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
          <tr>
            <td>AI 搜索 System Prompt</td>
            <td>{qa.ai_search_system_prompt ? truncateText(qa.ai_search_system_prompt, 72) : '未配置'}</td>
            <td><span className={s.editBtn} onClick={onEditSearchPrompt}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
          <tr>
            <td>技术问答 System Prompt</td>
            <td>{qa.qa_system_prompt ? truncateText(qa.qa_system_prompt, 72) : '未配置'}</td>
            <td><span className={s.editBtn} onClick={onEditQaPrompt}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function RecommendConfigTable({
  recommendation,
  saving,
  onEditHome,
  onEditDetail,
}: {
  recommendation: RecommendationConfig;
  saving: boolean;
  onEditHome: () => void;
  onEditDetail: () => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>推荐策略配置</h2>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>场景</th>
            <th>当前策略</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>首页分区推荐</td>
            <td>{recommendation.provider} ({recommendation.home_strategy})</td>
            <td><span className={s.editBtn} onClick={onEditHome}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
          <tr>
            <td>详情页相关推荐</td>
            <td>{recommendation.provider} ({recommendation.detail_strategy})</td>
            <td><span className={s.editBtn} onClick={onEditDetail}>{saving ? '保存中...' : '编辑'}</span></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function DisplayConfigTable({
  items,
  saving,
  onEdit,
}: {
  items: DisplayItem[];
  saving: boolean;
  onEdit: (key: string) => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>展示配置</h2>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>分组</th>
            <th>配置项</th>
            <th>键名</th>
            <th>当前值</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.key}>
              <td>{item.group}</td>
              <td>{item.label}</td>
              <td>{item.key}</td>
              <td>{item.value}</td>
              <td><span className={s.editBtn} onClick={() => onEdit(item.key)}>{saving ? '保存中...' : '编辑'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AppsTable({
  apps,
  saving,
  onAdd,
  onEdit,
  onDelete,
}: {
  apps: AppConfig[];
  saving: boolean;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>应用市场管理</h2>
        <button className={s.addBtn} onClick={onAdd} disabled={saving}><Plus size={14} /> 添加</button>
      </div>
      <table className={s.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>应用名称</th>
            <th>图标</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app, index) => (
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.name}</td>
              <td>{app.icon}</td>
              <td>{app.desc}</td>
              <td>
                <span className={s.editBtn} onClick={() => onEdit(index)}>编辑</span>
                <span className={s.deleteBtn} onClick={() => onDelete(index)}>删除</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function getDisplayItems(display: DisplayConfig): DisplayItem[] {
  return [
    { group: '首页', key: 'home.section_page_size', label: '知识推荐/典型案例条数', value: display.home.section_page_size },
    { group: '首页', key: 'home.hot_tags_count', label: '热门标签条数', value: display.home.hot_tags_count },
    { group: '首页', key: 'home.qa_hot_count', label: '技术问答热门问题条数', value: display.home.qa_hot_count },
    { group: '首页', key: 'home.domain_count', label: '业务域导航条数', value: display.home.domain_count },
    { group: '首页', key: 'home.spaces_count', label: '知识广场条数', value: display.home.spaces_count },
    { group: '首页', key: 'home.apps_count', label: '应用市场条数', value: display.home.apps_count },
    { group: '列表页', key: 'list.page_size', label: '列表页每页文档数', value: display.list.page_size },
    { group: '列表页', key: 'list.visible_tag_count', label: '列表页单条标签展示数', value: display.list.visible_tag_count },
    { group: '搜索页', key: 'search.page_size', label: '搜索页每页文档数', value: display.search.page_size },
    { group: '搜索页', key: 'search.visible_tag_count', label: '搜索页单条标签展示数', value: display.search.visible_tag_count },
    { group: '详情页', key: 'detail.related_files_count', label: '相关推荐条数', value: display.detail.related_files_count },
    { group: '详情页', key: 'detail.visible_tag_count', label: '相关推荐标签展示数', value: display.detail.visible_tag_count },
  ];
}

async function persistSpaces(spaces: SpaceConfig[], setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateSpacesConfig(spaces);
  setConfig((current) => (current ? { ...current, spaces: data.spaces } : current));
}

async function persistDomains(domains: DomainConfig[], setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateDomainsConfig(domains);
  setConfig((current) => (current ? { ...current, domains: data.domains } : current));
}

async function persistSections(sections: SectionConfig[], setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateSectionsConfig(sections);
  setConfig((current) => (current ? { ...current, sections: data.sections } : current));
}

async function persistQa(qa: QAConfig, setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateQaConfig(qa);
  setConfig((current) => (current ? { ...current, qa: data } : current));
}

async function persistRecommendation(recommendation: RecommendationConfig, setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateRecommendationConfig(recommendation);
  setConfig((current) => (current ? { ...current, recommendation: data } : current));
}

async function persistDisplay(display: DisplayConfig, setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateDisplayConfig(display);
  setConfig((current) => (current ? { ...current, display: data } : current));
}

async function persistApps(apps: AppConfig[], setConfig: Dispatch<SetStateAction<PortalConfig | null>>) {
  const data = await updateAppsConfig(apps);
  setConfig((current) => (current ? { ...current, apps: data.apps } : current));
}

type SaveRunner = (task: () => Promise<void>) => Promise<void>;
type ConfigSetter = Dispatch<SetStateAction<PortalConfig | null>>;

async function handleAddSpace(spaces: SpaceConfig[], runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptSpace();
  if (!next) return;
  await runSave(() => persistSpaces([...spaces, next], setConfig));
}

async function handleEditSpace(spaces: SpaceConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptSpace(spaces[index]);
  if (!next) return;
  const updated = [...spaces];
  updated[index] = next;
  await runSave(() => persistSpaces(updated, setConfig));
}

async function handleDeleteSpace(spaces: SpaceConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  if (!window.confirm(`确定删除知识空间“${spaces[index].name}”吗？`)) return;
  await runSave(() => persistSpaces(spaces.filter((_, i) => i !== index), setConfig));
}

async function handleAddDomain(domains: DomainConfig[], spaces: SpaceConfig[], runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptDomain(spaces);
  if (!next) return;
  await runSave(() => persistDomains([...domains, next], setConfig));
}

async function handleEditDomain(domains: DomainConfig[], spaces: SpaceConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptDomain(spaces, domains[index]);
  if (!next) return;
  const updated = [...domains];
  updated[index] = next;
  await runSave(() => persistDomains(updated, setConfig));
}

async function handleDeleteDomain(domains: DomainConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  if (!window.confirm(`确定删除业务域“${domains[index].name}”吗？`)) return;
  await runSave(() => persistDomains(domains.filter((_, i) => i !== index), setConfig));
}

async function handleAddSection(sections: SectionConfig[], runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptSection();
  if (!next) return;
  await runSave(() => persistSections([...sections, next], setConfig));
}

async function handleEditSection(sections: SectionConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptSection(sections[index]);
  if (!next) return;
  const updated = [...sections];
  updated[index] = next;
  await runSave(() => persistSections(updated, setConfig));
}

async function handleDeleteSection(sections: SectionConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  if (!window.confirm(`确定删除分区“${sections[index].title}”吗？`)) return;
  await runSave(() => persistSections(sections.filter((_, i) => i !== index), setConfig));
}

async function handleEditQaSpaces(qa: QAConfig, runSave: SaveRunner, setConfig: ConfigSetter) {
  const raw = window.prompt('请输入知识空间 ID，多个用英文逗号分隔', qa.knowledge_space_ids.join(','));
  if (raw === null) return;
  const knowledge_space_ids = raw.split(',').map((item) => Number(item.trim())).filter((value) => Number.isFinite(value) && value > 0);
  await runSave(() => persistQa({ ...qa, knowledge_space_ids }, setConfig));
}

async function handleEditQaQuestions(qa: QAConfig, runSave: SaveRunner, setConfig: ConfigSetter) {
  const raw = window.prompt('请输入热门问题，每行一条', qa.hot_questions.join('\n'));
  if (raw === null) return;
  const hot_questions = raw.split('\n').map((item) => item.trim()).filter(Boolean);
  await runSave(() => persistQa({ ...qa, hot_questions }, setConfig));
}

async function handleEditQaPrompt(
  qa: QAConfig,
  key: 'ai_search_system_prompt' | 'qa_system_prompt',
  runSave: SaveRunner,
  setConfig: ConfigSetter,
) {
  const raw = window.prompt('请输入 System Prompt', qa[key]);
  if (raw === null) return;
  await runSave(() => persistQa({ ...qa, [key]: raw.trim() }, setConfig));
}

async function handleEditRecommendation(
  recommendation: RecommendationConfig,
  key: 'home_strategy' | 'detail_strategy',
  runSave: SaveRunner,
  setConfig: ConfigSetter,
) {
  const raw = window.prompt('请输入推荐策略描述', recommendation[key]);
  if (raw === null) return;
  await runSave(() => persistRecommendation({ ...recommendation, [key]: raw.trim() || recommendation[key] }, setConfig));
}

async function handleEditDisplay(display: DisplayConfig, key: string, runSave: SaveRunner, setConfig: ConfigSetter) {
  const currentValue = getDisplayValue(display, key);
  const raw = window.prompt(`请输入 ${key} 的数值`, String(currentValue));
  if (raw === null) return;
  const nextValue = Number(raw.trim());
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    window.alert('请输入有效的非负数字');
    return;
  }
  await runSave(() => persistDisplay(setDisplayValue(display, key, nextValue), setConfig));
}

async function handleAddApp(apps: AppConfig[], runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptApp();
  if (!next) return;
  await runSave(() => persistApps([...apps, next], setConfig));
}

async function handleEditApp(apps: AppConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  const next = promptApp(apps[index]);
  if (!next) return;
  const updated = [...apps];
  updated[index] = next;
  await runSave(() => persistApps(updated, setConfig));
}

async function handleDeleteApp(apps: AppConfig[], index: number, runSave: SaveRunner, setConfig: ConfigSetter) {
  if (!window.confirm(`确定删除应用“${apps[index].name}”吗？`)) return;
  await runSave(() => persistApps(apps.filter((_, i) => i !== index), setConfig));
}

function promptSpace(current?: SpaceConfig): SpaceConfig | null {
  const id = promptNumber('知识空间 ID', current?.id);
  if (id === null) return null;
  const name = promptText('空间名称', current?.name || '');
  if (!name) return null;
  const tag_count = promptNumber('标签数', current?.tag_count ?? 0);
  if (tag_count === null) return null;
  const file_count = promptNumber('文件数', current?.file_count ?? 0);
  if (file_count === null) return null;
  return { id, name, tag_count, file_count, enabled: current?.enabled ?? true };
}

function promptDomain(spaces: SpaceConfig[], current?: DomainConfig): DomainConfig | null {
  const name = promptText('业务域名称', current?.name || '');
  if (!name) return null;
  const spaceId = promptNumber(
    `绑定空间 ID（可选：${spaces.map((space) => `${space.id}:${space.name}`).join(' / ')}）`,
    current?.space_ids[0],
  );
  if (spaceId === null) return null;
  const icon = promptText('图标名', current?.icon || 'Factory');
  if (!icon) return null;
  const background_image = promptOptionalText('背景图路径，可留空', current?.background_image || '');
  const color = promptText('主色值', current?.color || '#2563eb');
  if (!color) return null;
  const bg = promptText('背景色值', current?.bg || '#eff6ff');
  if (!bg) return null;
  return {
    name,
    space_ids: [spaceId],
    icon,
    background_image,
    color,
    bg,
    enabled: current?.enabled ?? true,
  };
}

function promptSection(current?: SectionConfig): SectionConfig | null {
  const title = promptText('分区标题', current?.title || '');
  if (!title) return null;
  const tag = promptText('关联标签', current?.tag || '');
  if (!tag) return null;
  const link = promptText('跳转链接', current?.link || '');
  if (!link) return null;
  const icon = promptText('图标名', current?.icon || 'Star');
  if (!icon) return null;
  return { title, tag, link, icon, enabled: current?.enabled ?? true };
}

function promptApp(current?: AppConfig): AppConfig | null {
  const id = promptNumber('应用 ID', current?.id);
  if (id === null) return null;
  const name = promptText('应用名称', current?.name || '');
  if (!name) return null;
  const icon = promptText('图标名', current?.icon || 'FileText');
  if (!icon) return null;
  const desc = promptText('应用描述', current?.desc || '');
  if (!desc) return null;
  const color = promptText('图标背景色', current?.color || '#2563eb');
  if (!color) return null;
  const bg = promptText('卡片背景色', current?.bg || '#eff6ff');
  if (!bg) return null;
  const url = promptOptionalText('跳转 URL，可留空', current?.url || '');
  return { id, name, icon, desc, color, bg, url, enabled: current?.enabled ?? true };
}

function promptText(label: string, current: string): string | null {
  const value = window.prompt(label, current);
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function promptOptionalText(label: string, current: string): string {
  const value = window.prompt(label, current);
  if (value === null) return current;
  return value.trim();
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function promptNumber(label: string, current?: number): number | null {
  const value = window.prompt(label, current === undefined ? '' : String(current));
  if (value === null) return null;
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    window.alert('请输入有效数字');
    return null;
  }
  return parsed;
}

function getDisplayValue(display: DisplayConfig, key: string): number {
  const [group, field] = key.split('.');
  switch (group) {
    case 'home':
      return display.home[field as keyof DisplayConfig['home']];
    case 'list':
      return display.list[field as keyof DisplayConfig['list']];
    case 'search':
      return display.search[field as keyof DisplayConfig['search']];
    case 'detail':
      return display.detail[field as keyof DisplayConfig['detail']];
    default:
      return 0;
  }
}

function setDisplayValue(display: DisplayConfig, key: string, value: number): DisplayConfig {
  const [group, field] = key.split('.');
  return {
    ...display,
    [group]: {
      ...display[group as keyof DisplayConfig],
      [field]: value,
    },
  };
}

import { useState } from 'react';
import {
  FolderOpen, Building, Tag, Bot, Star, LayoutGrid, Plus, SlidersHorizontal,
} from 'lucide-react';
import Header from '../components/Header';
import { SPACES, CFG } from '../data/mock';
import { DISPLAY_CONFIG_ITEMS } from '../config/display';
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

const DOMAIN_CARD_BACKGROUNDS: Record<string, string> = {
  设备: '/device-domain-bg.png',
  轧线: '/rolling-domain-bg.jpg',
  冷轧: '/cold-domain-bg.jpg',
  能源: '/energy-domain-bg.jpg',
};

export default function AdminPage() {
  const [active, setActive] = useState('spaces');

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
          {active === 'spaces' && <SpacesTable />}
          {active === 'domains' && <DomainsTable />}
          {active === 'sections' && <SectionsTable />}
          {active === 'qa' && <QAConfig />}
          {active === 'recommend' && <RecommendConfig />}
          {active === 'display' && <DisplayConfigTable />}
          {active === 'apps' && <AppsTable />}
        </main>
      </div>
    </>
  );
}

function SpacesTable() {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>知识空间管理</h2>
        <button className={s.addBtn}><Plus size={14} /> 添加</button>
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
          {SPACES.map((sp) => (
            <tr key={sp.id}>
              <td>{sp.id}</td>
              <td>{sp.name}</td>
              <td>{sp.tagCount}</td>
              <td>{sp.fileCount}</td>
              <td><span className={s.editBtn}>编辑</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function DomainsTable() {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>业务域管理</h2>
        <button className={s.addBtn}><Plus size={14} /> 添加</button>
      </div>
      {/* TODO: Confirm with product whether domain cards should use photo backgrounds, logo/icon cards, or support both as a configurable strategy. */}
      <p className={s.pageNote}>
        待与产品确认最终卡片策略：业务域卡片是采用“图片背景卡”还是“Logo/图标卡”，后台当前同时预留背景图和 Logo/图标 配置位。首页业务域导航则由“是否放首页”和“首页排序”两个字段控制。
      </p>
      <table className={s.table}>
        <thead>
          <tr>
            <th>业务域名称</th>
            <th>Logo/图标</th>
            <th>背景图</th>
            <th>放首页</th>
            <th>首页排序</th>
            <th>绑定空间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {CFG.domains.map((d) => {
            const sp = SPACES.find((ss) => ss.id === d.spaceId);
            const backgroundImage = DOMAIN_CARD_BACKGROUNDS[d.name];
            return (
              <tr key={d.name}>
                <td>{d.name}</td>
                <td>{d.icon}</td>
                <td>{backgroundImage || '未配置'}</td>
                <td>{d.showOnHome ? '是' : '否'}</td>
                <td>{d.homeOrder}</td>
                <td>{sp?.name || String(d.spaceId)}</td>
                <td><span className={s.editBtn}>编辑</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function SectionsTable() {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>首页分区管理</h2>
        <button className={s.addBtn}><Plus size={14} /> 添加</button>
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
          {CFG.sections.map((sec) => (
            <tr key={sec.tag}>
              <td>{sec.title}</td>
              <td>{sec.tag}</td>
              <td>{sec.link}</td>
              <td><span className={s.editBtn}>编辑</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function QAConfig() {
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
            <td>全部已绑定空间 ({SPACES.length} 个)</td>
            <td><span className={s.editBtn}>编辑</span></td>
          </tr>
          <tr>
            <td>热门问题</td>
            <td>{CFG.qaHot.length} 条</td>
            <td><span className={s.editBtn}>编辑</span></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function RecommendConfig() {
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
            <td>tag_feed (按标签 + 更新时间)</td>
            <td><span className={s.editBtn}>编辑</span></td>
          </tr>
          <tr>
            <td>详情页相关推荐</td>
            <td>tag_feed (同标签 + 最近更新)</td>
            <td><span className={s.editBtn}>编辑</span></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function DisplayConfigTable() {
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
          {DISPLAY_CONFIG_ITEMS.map((item) => (
            <tr key={item.key}>
              <td>{item.group}</td>
              <td>{item.label}</td>
              <td>{item.key}</td>
              <td>{item.value}</td>
              <td><span className={s.editBtn}>编辑</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function AppsTable() {
  return (
    <>
      <div className={s.titleBar}>
        <h2 className={s.pageTitle}>应用市场管理</h2>
        <button className={s.addBtn}><Plus size={14} /> 添加</button>
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
          {CFG.apps.map((app) => (
            <tr key={app.id}>
              <td>{app.id}</td>
              <td>{app.name}</td>
              <td>{app.icon}</td>
              <td>{app.desc}</td>
              <td><span className={s.editBtn}>编辑</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

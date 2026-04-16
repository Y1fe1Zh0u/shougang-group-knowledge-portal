import {
  LayoutGrid, FileText, Search, Bot, BarChart3,
  PenLine, MessageSquare, Globe, Network,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import { usePortalConfig } from '../hooks/usePortalConfig';
import { getEnabledApps } from '../utils/portalConfig';
import s from './AppsPage.module.css';

const APP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PenLine, Search, MessageSquare, Globe, BarChart3, Network, FileText, Bot,
};

export default function AppsPage() {
  const { config } = usePortalConfig();
  const apps = config ? getEnabledApps(config.apps) : [];

  return (
    <PageShell>
      <div className={s.container}>
        <SectionHeader icon={LayoutGrid} title="应用市场" />
        <div className={s.grid}>
          {apps.map((app) => {
            const Icon = APP_ICONS[app.icon] || FileText;
            return (
              <div key={app.id} className={s.card}>
                <div className={s.iconWrap} style={{ background: app.color }}>
                  <Icon size={28} />
                </div>
                <div className={s.name}>{app.name}</div>
                <div className={s.desc}>{app.desc}</div>
                <button
                  className={s.openBtn}
                  onClick={() => app.url && window.open(app.url, '_blank', 'noopener,noreferrer')}
                  disabled={!app.url}
                >
                  {app.url ? '打开' : '未配置地址'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

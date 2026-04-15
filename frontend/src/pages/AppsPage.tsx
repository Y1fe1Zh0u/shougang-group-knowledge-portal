import {
  LayoutGrid, FileText, Search, Bot, BarChart3,
  PenLine, MessageSquare, Globe, Network,
} from 'lucide-react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import { CFG } from '../data/mock';
import s from './AppsPage.module.css';

const APP_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  PenLine, Search, MessageSquare, Globe, BarChart3, Network, FileText, Bot,
};

export default function AppsPage() {
  return (
    <PageShell>
      <div className={s.container}>
        <SectionHeader icon={LayoutGrid} title="应用市场" />
        <div className={s.grid}>
          {CFG.apps.map((app) => {
            const Icon = APP_ICONS[app.icon] || FileText;
            return (
              <div key={app.id} className={s.card}>
                <div className={s.iconWrap} style={{ background: app.color }}>
                  <Icon size={28} />
                </div>
                <div className={s.name}>{app.name}</div>
                <div className={s.desc}>{app.desc}</div>
                <button className={s.openBtn}>打开</button>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

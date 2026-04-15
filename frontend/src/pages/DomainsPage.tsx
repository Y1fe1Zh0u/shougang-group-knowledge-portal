import { Building, CheckCircle, Factory, Settings, Shield, Snowflake, Zap, type LucideIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useCallback } from 'react';
import PageShell from '../components/PageShell';
import SectionHeader from '../components/SectionHeader';
import { CFG, SPACES } from '../data/mock';
import s from './DomainsPage.module.css';

const DOMAIN_ICONS: Record<string, LucideIcon> = {
  Settings,
  Factory,
  Snowflake,
  Zap,
  Shield,
  CheckCircle,
};

const DOMAIN_CARD_BACKGROUNDS: Record<string, string> = {
  设备: '/device-domain-bg.png',
  轧线: '/rolling-domain-bg.jpg',
  冷轧: '/cold-domain-bg.jpg',
  能源: '/energy-domain-bg.jpg',
};

export default function DomainsPage() {
  const navigate = useNavigate();
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

  return (
    <PageShell>
      <div className={s.container}>
        <Link to="/" className={s.backLink}>返回首页</Link>
        <SectionHeader icon={Building} title="全部业务域" size="large" />
        <p className={s.lead}>
          汇总首页业务域入口，点击后进入对应业务域的知识列表页。
        </p>
        <div className={s.grid}>
          {CFG.domains.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.icon] || Settings;
            const space = SPACES.find((item) => item.id === domain.spaceId);
            const domainBackground = DOMAIN_CARD_BACKGROUNDS[domain.name];
            const usesBannerThumb = Boolean(domainBackground);

            return (
              <button
                key={domain.name}
                type="button"
                className={`${s.card} ${usesBannerThumb ? s.cardImage : ''}`}
                style={usesBannerThumb ? { backgroundImage: `url("${domainBackground}")` } : undefined}
                onClick={() => navigateToTop(`/space/${domain.spaceId}`)}
              >
                {usesBannerThumb ? null : (
                  <div className={s.iconWrap} style={{ background: domain.bg, color: domain.color }}>
                    <Icon size={24} />
                  </div>
                )}
                <div className={s.cardBody}>
                  <div className={s.name}>{domain.name}</div>
                  <div className={s.meta}>{space?.name || `空间 ${domain.spaceId}`}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}

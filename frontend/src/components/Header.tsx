import { NavLink, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import s from './Header.module.css';

const NAV_ITEMS = [
  { label: '首页', to: '/' },
  { label: '技术问答', to: '/qa' },
  { label: '应用市场', to: '/apps' },
  { label: '后台管理', to: '/admin' },
];

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <div className={s.logo} onClick={() => navigate('/')}>
          <img
            className={s.logoImage}
            src="/shougang-stock-logo.png"
            alt="首钢股份"
          />
          <span>首钢知库</span>
        </div>

        <nav className={s.nav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `${s.navLink} ${isActive ? s.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className={s.searchFab}
          onClick={() => navigate('/search')}
          aria-label="搜索"
        >
          <Search size={16} />
        </button>

        <div className={s.avatar}>演</div>
      </div>
    </header>
  );
}

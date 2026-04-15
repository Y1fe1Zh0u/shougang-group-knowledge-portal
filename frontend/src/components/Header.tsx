import { useState, type KeyboardEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const [query, setQuery] = useState('');
  const isHome = location.pathname === '/';

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

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

        {!isHome ? (
          <div className={s.searchWrap} style={{ position: 'relative' }}>
            <Search size={14} className={s.searchIcon} />
            <input
              className={s.searchInput}
              placeholder="搜索知识文档..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        ) : null}

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

        {isHome ? (
          <button
            type="button"
            className={s.searchFab}
            onClick={() => {
              const heroInput = document.querySelector<HTMLInputElement>('input[placeholder="输入关键词搜索知识文档..."]');
              heroInput?.focus();
              heroInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            aria-label="搜索"
          >
            <Search size={16} />
          </button>
        ) : null}

        <div className={s.avatar}>演</div>
      </div>
    </header>
  );
}

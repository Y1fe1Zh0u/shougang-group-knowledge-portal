import { useState, type KeyboardEvent } from 'react';
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
  const [query, setQuery] = useState('');

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

        <div className={s.avatar}>演</div>
      </div>
    </header>
  );
}

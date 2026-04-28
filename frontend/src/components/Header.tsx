import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import s from './Header.module.css';

const NAV_ITEMS = [
  { label: '首页', to: '/' },
  { label: '我的知识空间', to: '/knowledge-spaces' },
  { label: 'AI 问答', to: '/qa' },
  { label: '专家问答', to: '/expert-qa' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuKey, setMenuKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuOpen = menuKey === location.pathname;

  useEffect(() => {
    if (!menuOpen) return;
    function handleAway(event: MouseEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuKey(null);
    }
    document.addEventListener('mousedown', handleAway);
    return () => document.removeEventListener('mousedown', handleAway);
  }, [menuOpen]);

  const closeMenu = useMemo(() => () => setMenuKey(null), []);

  const initial = user ? (user.initial || user.name.slice(0, 1)) : '';
  const role = user?.role || '内部员工';

  const goLogin = () => {
    const redirect = `${location.pathname}${location.search}`;
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
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

        <div className={s.spacer} />

        <button
          type="button"
          className={s.searchFab}
          onClick={() => navigate('/search')}
          aria-label="搜索"
        >
          <Search size={16} />
        </button>

        {user ? (
          <div className={s.userMenuWrap} ref={menuRef}>
            <button
              type="button"
              className={s.userTrigger}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuKey((current) => (current === location.pathname ? null : location.pathname))}
            >
              <span className={s.userTriggerAvatar}>{initial}</span>
              <span className={s.userTriggerName}>{user.name}</span>
              <ChevronDown size={12} className={s.userTriggerCaret} />
            </button>
            {menuOpen ? (
              <div className={s.userMenu} role="menu">
                <div className={s.userMenuHead}>
                  <div className={s.userMenuAvatar}>{initial}</div>
                  <div>
                    <div className={s.userMenuName}>{user.name}</div>
                    <div className={s.userMenuRole}>{role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className={s.userMenuItem}
                  onClick={() => {
                    closeMenu();
                    navigate('/admin');
                  }}
                >
                  <LayoutDashboard size={15} />
                  后台管理
                </button>
                <div className={s.userMenuDivider} />
                <button
                  type="button"
                  className={`${s.userMenuItem} ${s.userMenuItemDanger}`}
                  onClick={() => {
                    logout();
                    closeMenu();
                    navigate('/');
                  }}
                >
                  <LogOut size={15} />
                  退出登录
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button type="button" className={s.loginEntry} onClick={goLogin}>
            <LogIn size={14} />
            <span>登录</span>
          </button>
        )}
      </div>
    </header>
  );
}

import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import './MainLayout.css';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { admin, isLoading, logout } = useAuth();
  const { canAccess } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = admin
    ? (admin.username ?? admin.email).slice(0, 2).toUpperCase()
    : '??';

  const canSeePlatform = canAccess('platform', 'view')
    || admin?.role === 'super_admin'
    || admin?.role === 'admin';

  const shellClass = [
    'sw-shell',
    collapsed ? 'sw-shell--collapsed' : '',
    mobileNavOpen ? 'sw-shell--mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={shellClass}>
      <button
        type="button"
        className="sw-sidebar-backdrop"
        aria-label="Close navigation menu"
        onClick={() => setMobileNavOpen(false)}
        tabIndex={mobileNavOpen ? 0 : -1}
      />

      <aside className="sw-sidebar" aria-label="Sidebar navigation">
        <div className="sw-sidebar__brand">
          <span className="sw-sidebar__logo" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="url(#sw-logo-grad)" />
              <path d="M5 11h12M11 5v12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <defs>
                <linearGradient id="sw-logo-grad" x1="3" y1="3" x2="19" y2="19">
                  <stop stopColor="#9ed4a8" />
                  <stop offset="1" stopColor="#5a9e6f" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="sw-sidebar__brand-text">
            Signal<strong>Workflow</strong>
          </span>
          <button
            type="button"
            className="sw-sidebar__collapse-btn sw-sidebar__collapse-btn--desktop"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
          <button
            type="button"
            className="sw-sidebar__close-btn sw-sidebar__close-btn--mobile"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <nav className="sw-sidebar__nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sw-sidebar__link${isActive ? ' sw-sidebar__link--active' : ''}`
            }
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="sw-sidebar__link-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="sw-sidebar__link-label">Dashboard</span>
          </NavLink>

          {canSeePlatform && (
            <NavLink
              to="/platform-rbac"
              className={({ isActive }) =>
                `sw-sidebar__link${isActive ? ' sw-sidebar__link--active' : ''}`
              }
              onClick={() => setMobileNavOpen(false)}
            >
              <span className="sw-sidebar__link-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 15c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 7.5h3M14.5 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <span className="sw-sidebar__link-label">Platform Users</span>
            </NavLink>
          )}
        </nav>

        <div className="sw-sidebar__footer">
          <div className={`sw-sidebar__user${collapsed ? ' sw-sidebar__user--compact' : ''}`}>
            <div className="sw-sidebar__avatar" title={admin?.email}>{initials}</div>
            <div className="sw-sidebar__user-info">
              <span className="sw-sidebar__user-name">
                {isLoading ? '…' : (admin?.username ?? 'Admin')}
              </span>
              <span className="sw-sidebar__user-role">
                {admin?.role?.replace('_', ' ') ?? 'admin'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="sw-sidebar__logout-btn"
            onClick={() => void handleLogout()}
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="sw-main">
        <header className="sw-topbar">
          <div className="sw-topbar__left">
            <button
              type="button"
              className="sw-topbar__menu-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <span className="sw-topbar__badge">SignalWorkflow</span>
          </div>
          {admin && (
            <div className="sw-topbar__user" title={admin.email}>
              <span className="sw-topbar__user-avatar">{initials}</span>
              <div className="sw-topbar__user-meta">
                <span className="sw-topbar__user-name">{admin.username ?? admin.email}</span>
                <span className="sw-topbar__user-email">{admin.email}</span>
              </div>
            </div>
          )}
        </header>
        <main className="sw-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

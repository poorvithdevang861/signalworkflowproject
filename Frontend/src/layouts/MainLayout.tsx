import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionsContext';
import './MainLayout.css';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, isLoading, logout } = useAuth();
  const { canAccess } = usePermissions();
  const navigate = useNavigate();

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

  return (
    <div className={`sw-shell${collapsed ? ' sw-shell--collapsed' : ''}`}>
      <aside className="sw-sidebar">
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
          {!collapsed && (
            <span className="sw-sidebar__brand-text">
              Signal<strong>Workflow</strong>
            </span>
          )}
          <button
            type="button"
            className="sw-sidebar__collapse-btn"
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className="sw-sidebar__nav" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `sw-sidebar__link${isActive ? ' sw-sidebar__link--active' : ''}`
            }
            title={collapsed ? 'Dashboard' : undefined}
          >
            <span className="sw-sidebar__link-icon" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            {!collapsed && <span className="sw-sidebar__link-label">Dashboard</span>}
          </NavLink>

          {canSeePlatform && (
            <NavLink
              to="/platform-rbac"
              className={({ isActive }) =>
                `sw-sidebar__link${isActive ? ' sw-sidebar__link--active' : ''}`
              }
              title={collapsed ? 'Platform Users' : undefined}
            >
              <span className="sw-sidebar__link-icon" aria-hidden>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="7" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 15c0-2.5 2.2-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 7.5h3M14.5 6v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              {!collapsed && <span className="sw-sidebar__link-label">Platform Users</span>}
            </NavLink>
          )}
        </nav>

        <div className="sw-sidebar__footer">
          {!collapsed && (
            <div className="sw-sidebar__user">
              <div className="sw-sidebar__avatar">{initials}</div>
              <div className="sw-sidebar__user-info">
                <span className="sw-sidebar__user-name">
                  {isLoading ? '…' : (admin?.username ?? 'Admin')}
                </span>
                <span className="sw-sidebar__user-role">
                  {admin?.role?.replace('_', ' ') ?? 'admin'}
                </span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="sw-sidebar__logout-btn"
            onClick={() => void handleLogout()}
            title="Logout"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 2H3.5A1.5 1.5 0 002 3.5v9A1.5 1.5 0 003.5 14H6M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="sw-main">
        <header className="sw-topbar">
          <div className="sw-topbar__left">
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

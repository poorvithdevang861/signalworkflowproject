import { useAuth } from '../../context/AuthContext';
import './dashboard.css';

export default function Dashboard() {
  const { admin } = useAuth();
  const displayName = admin?.username ?? admin?.email?.split('@')[0] ?? 'there';

  return (
    <div className="sw-dashboard">
      <header className="sw-dashboard__hero">
        <div>
          <p className="sw-dashboard__eyebrow">Dashboard</p>
          <h1 className="sw-dashboard__title">
            Welcome back, <span>{displayName}</span>
          </h1>
          <p className="sw-dashboard__subtitle">
            Your workspace is ready. Modules will appear here as they are added.
          </p>
        </div>
        <div className="sw-dashboard__hero-badge" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="9" fill="url(#sw-dash-grad)" />
            <path d="M7 14h14M14 7v14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <defs>
              <linearGradient id="sw-dash-grad" x1="4" y1="4" x2="24" y2="24">
                <stop stopColor="#9ed4a8" />
                <stop offset="1" stopColor="#5a9e6f" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </header>

      <section className="sw-dashboard__grid" aria-label="Overview placeholders">
        {['Workflows', 'Tasks', 'Activity'].map(label => (
          <article key={label} className="sw-dashboard__card">
            <span className="sw-dashboard__card-label">{label}</span>
            <span className="sw-dashboard__card-value">—</span>
            <span className="sw-dashboard__card-hint">Coming soon</span>
          </article>
        ))}
      </section>

      <section className="sw-dashboard__empty" aria-label="Empty workspace">
        <div className="sw-dashboard__empty-icon" aria-hidden>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            <path
              d="M16 28c2.5-4 5-6 8-6s5.5 2 8 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="18" cy="20" r="2" fill="currentColor" opacity="0.5" />
            <circle cx="30" cy="20" r="2" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
        <h2 className="sw-dashboard__empty-title">Nothing here yet</h2>
        <p className="sw-dashboard__empty-text">
          This is your home screen. Use the sidebar to manage platform users when you need RBAC settings.
        </p>
      </section>
    </div>
  );
}

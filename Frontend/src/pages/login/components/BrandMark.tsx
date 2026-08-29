export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`sw-brand${compact ? ' sw-brand--compact' : ''}`}>
      <span className="sw-brand__mark" aria-hidden>
        <svg
          width={compact ? 20 : 24}
          height={compact ? 20 : 24}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      <span className="sw-brand__name">
        Signal<strong>Workflow</strong>
      </span>
    </div>
  );
}

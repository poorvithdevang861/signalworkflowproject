import type { ReactNode } from 'react';

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 6l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="4" y="8" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  action?: ReactNode;
  autoComplete?: string;
  icon?: 'mail' | 'lock';
}

export function AuthField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  action,
  autoComplete,
  icon,
}: AuthFieldProps) {
  const Icon = icon === 'mail' ? MailIcon : icon === 'lock' ? LockIcon : null;

  return (
    <div className="sw-field">
      <label className="sw-field__label" htmlFor={id}>{label}</label>
      <div className={`sw-field__control${Icon ? ' sw-field__control--icon' : ''}`}>
        {Icon && <span className="sw-field__icon"><Icon /></span>}
        <input
          id={id}
          className={`sw-field__input${action ? ' sw-field__input--has-action' : ''}${error ? ' sw-field__input--error' : ''}`}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={event => onChange(event.target.value)}
        />
        {action}
      </div>
      {error && <span className="sw-field__hint">{error}</span>}
    </div>
  );
}

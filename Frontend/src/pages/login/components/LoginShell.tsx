import type { ReactNode } from 'react';
import { BrandMark } from './BrandMark';

function LoginIcon() {
  return (
    <div className="sw-login__card-icon" aria-hidden>
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M8 11h8M13 8l3 3-3 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 6.5V15.5C5 16.88 6.12 18 7.5 18H14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function LoginShell({
  children,
  showIcon = true,
}: {
  children: ReactNode;
  showIcon?: boolean;
}) {
  return (
    <main className="sw-login">
      <div className="sw-login__bg" aria-hidden>
        <span className="sw-login__arc sw-login__arc--1" />
        <span className="sw-login__arc sw-login__arc--2" />
        <span className="sw-login__cloud sw-login__cloud--1" />
        <span className="sw-login__cloud sw-login__cloud--2" />
      </div>

      <div className="sw-login__center">
        <div className="sw-login__card">
          <header className="sw-login__card-brand">
            <BrandMark />
          </header>

          {showIcon && <LoginIcon />}

          <div className="sw-login__body">{children}</div>
        </div>
      </div>
    </main>
  );
}

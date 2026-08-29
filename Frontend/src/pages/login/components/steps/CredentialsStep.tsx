import { AuthField } from '../AuthField';
import { PrimaryButton } from '../PrimaryButton';

interface CredentialsStepProps {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function CredentialsStep({
  email,
  password,
  showPassword,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
}: CredentialsStepProps) {
  return (
    <form className="sw-form" onSubmit={onSubmit}>
      <AuthField
        id="email"
        label="Email"
        type="email"
        icon="mail"
        value={email}
        onChange={onEmailChange}
        placeholder="Email"
        autoComplete="email"
      />
      <AuthField
        id="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        icon="lock"
        value={password}
        onChange={onPasswordChange}
        placeholder="Password"
        autoComplete="current-password"
        action={
          <button
            className="sw-field__action"
            type="button"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M3 9s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.4" />
                <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M3 9s2.5-4 6-4 6 4 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                <path d="M13 5l2-2M5 13l-2 2M9 11a2 2 0 100-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        }
      />
      <div className="sw-login__forgot">
        <button type="button" className="sw-login__forgot-link" tabIndex={-1}>
          Forgot password?
        </button>
      </div>
      <PrimaryButton loading={loading} label="Sign in" />
    </form>
  );
}

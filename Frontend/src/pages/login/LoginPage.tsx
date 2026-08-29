import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import type { LoginStep } from './types';
import { useCountdown } from './hooks/useCountdown';
import { LoginShell } from './components/LoginShell';
import { StepIntro } from './components/StepIntro';
import { ErrorBanner } from './components/ErrorBanner';
import { GoogleSignIn } from './components/GoogleSignIn';
import { CredentialsStep } from './components/steps/CredentialsStep';
import { OtpStep } from './components/steps/OtpStep';
import { TwoFaSetupStep } from './components/steps/TwoFaSetupStep';
import { TwoFaVerifyStep } from './components/steps/TwoFaVerifyStep';
import './login.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, refreshProfile } = useAuth();

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [adminId, setAdminId] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendKey, setResendKey] = useState(0);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const countdown = useCountdown(60, resendKey);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    authService.getGoogleConfig()
      .then(config => {
        setGoogleEnabled(config.enabled);
        setGoogleClientId(config.client_id);
      })
      .catch(() => {
        setGoogleEnabled(false);
      });
  }, []);

  useEffect(() => {
    if (step === '2fa_setup' && totpUri && canvasRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(canvasRef.current!, totpUri, { width: 180, margin: 2 });
      }).catch(() => {});
    }
  }, [step, totpUri]);

  const clearError = () => setError('');

  const handleAuthResult = useCallback(async (message: string, result: {
    admin_id?: string;
    totp_uri?: string;
  }) => {
    if (message === 'success') {
      await refreshProfile();
      navigate('/', { replace: true });
      return;
    }
    if (message === '2fa_setup') {
      setTotpUri(result.totp_uri ?? '');
      setStep('2fa_setup');
      return;
    }
    if (message === '2fa_required') {
      setAdminId(result.admin_id ?? '');
      setStep('2fa_verify');
    }
  }, [navigate, refreshProfile]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      setAdminId(res.admin_id);
      setResendKey(key => key + 1);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleCredential = useCallback(async (credential: string) => {
    clearError();
    setLoading(true);
    try {
      const res = await authService.googleLogin(credential);
      if (res.admin_id) setAdminId(res.admin_id);
      await handleAuthResult(res.message, res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthResult]);

  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    if (otp.length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await authService.verifyOtp(adminId, otp);
      await handleAuthResult(res.message, res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    clearError();
    setLoading(true);
    try {
      await authService.resendOtp(adminId);
      setOtp('');
      setResendKey(key => key + 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2FA(event: React.FormEvent) {
    event.preventDefault();
    clearError();
    if (totpCode.length < 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await authService.verify2FA(adminId, totpCode);
      await refreshProfile();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoginShell showIcon={step === 'credentials'}>
      {error && <ErrorBanner message={error} />}

      {step === 'credentials' && (
        <>
          <StepIntro
            title="Sign in with email"
            subtitle="Use your platform account to continue."
          />
          <div className="sw-login__section">
            <CredentialsStep
              email={email}
              password={password}
              showPassword={showPassword}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onTogglePassword={() => setShowPassword(value => !value)}
              onSubmit={handleLogin}
            />
          </div>
          {googleEnabled && googleClientId && (
            <div className="sw-login__social">
              <div className="sw-login__divider">Or sign in with</div>
              <GoogleSignIn
                clientId={googleClientId}
                disabled={loading}
                onCredential={credential => void handleGoogleCredential(credential)}
                onError={setError}
              />
            </div>
          )}
        </>
      )}

      {step === 'otp' && (
        <>
          <StepIntro
            eyebrow="Verification"
            title="Verify your email"
            subtitle="Enter the 6-digit code sent to your inbox."
          />
          <OtpStep
            otp={otp}
            loading={loading}
            countdown={countdown}
            onOtpChange={setOtp}
            onSubmit={handleVerifyOtp}
            onResend={() => void handleResend()}
            onBack={() => { setStep('credentials'); setOtp(''); clearError(); }}
          />
        </>
      )}

      {step === '2fa_setup' && (
        <>
          <StepIntro title="Set up 2FA" subtitle="Scan the QR code, then enter the code from your app." />
          <TwoFaSetupStep
            canvasRef={canvasRef}
            totpCode={totpCode}
            loading={loading}
            onTotpChange={setTotpCode}
            onSubmit={handleVerify2FA}
          />
        </>
      )}

      {step === '2fa_verify' && (
        <>
          <StepIntro title="Authenticator code" subtitle="Enter the 6-digit code from your app." />
          <TwoFaVerifyStep
            totpCode={totpCode}
            loading={loading}
            onTotpChange={value => setTotpCode(value.replace(/\D/g, '').slice(0, 6))}
            onSubmit={handleVerify2FA}
            onBack={() => { setStep('otp'); setTotpCode(''); clearError(); }}
          />
        </>
      )}
    </LoginShell>
  );
}

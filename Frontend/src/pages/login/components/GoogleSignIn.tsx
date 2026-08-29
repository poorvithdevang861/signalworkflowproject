import { useEffect, useRef } from 'react';
import { loadGoogleScript } from '../utils/googleAuth';

interface GoogleSignInProps {
  clientId: string;
  disabled?: boolean;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}

export function GoogleSignIn({
  clientId,
  disabled = false,
  onCredential,
  onError,
}: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientId || disabled || !buttonRef.current) return;

    let cancelled = false;
    const container = buttonRef.current;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) {
          throw new Error('Google API unavailable');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              onCredential(response.credential);
            } else {
              onError?.('Google sign-in was cancelled.');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });

        container.innerHTML = '';
        const width = Math.min(Math.max(container.offsetWidth || 320, 240), 400);
        window.google.accounts.id.renderButton(container, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width,
          logo_alignment: 'left',
        });
      })
      .catch(() => {
        if (!cancelled) {
          onError?.('Could not load Google sign-in. Check your connection and try again.');
        }
      });

    return () => {
      cancelled = true;
      container.innerHTML = '';
    };
  }, [clientId, disabled, onCredential, onError]);

  return (
    <div className={`sw-google${disabled ? ' sw-google--disabled' : ''}`}>
      <div ref={buttonRef} className="sw-google__button" aria-label="Sign in with Google" />
    </div>
  );
}

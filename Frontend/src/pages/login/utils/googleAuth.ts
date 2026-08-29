let scriptPromise: Promise<void> | null = null;

function waitForGoogleApi(maxAttempts = 60): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tick = () => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Google Identity Services did not initialize'));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const finish = () => {
        waitForGoogleApi()
          .then(resolve)
          .catch(reject);
      };

      const existing = document.querySelector<HTMLScriptElement>('script[data-sw-google]');
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          finish();
          return;
        }
        existing.addEventListener('load', () => {
          existing.dataset.loaded = 'true';
          finish();
        }, { once: true });
        existing.addEventListener('error', () => reject(new Error('Google script failed')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.swGoogle = 'true';
      script.onload = () => {
        script.dataset.loaded = 'true';
        finish();
      };
      script.onerror = () => reject(new Error('Google script failed'));
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

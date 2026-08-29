import { useEffect, useState } from 'react';

export function useCountdown(seconds: number, resetKey = 0) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const timer = window.setInterval(() => {
      setRemaining(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [seconds, resetKey]);

  return remaining;
}

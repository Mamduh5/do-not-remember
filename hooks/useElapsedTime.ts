import { useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { formatElapsedTime } from '../utils/elapsedTime';

/** Recomputes while open and immediately after returning from the background. */
export function useElapsedTime(timestamp: string | null | undefined) {
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30_000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setNowMs(Date.now());
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return useMemo(() => formatElapsedTime(timestamp, nowMs), [timestamp, nowMs]);
}

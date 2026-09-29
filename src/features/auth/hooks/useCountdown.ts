import { useEffect, useState } from 'react';

export function useCountdown(seconds: number) {
  const [endsAt, setEndsAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return {
    secondsLeft: Math.max(0, Math.ceil((endsAt - now) / 1000)),
    restart: () => {
      setEndsAt(Date.now() + seconds * 1000);
      setNow(Date.now());
    },
  };
}

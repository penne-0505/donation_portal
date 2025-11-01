'use client';

import { useEffect } from 'react';

export function ConfettiCelebration() {
  useEffect(() => {
    let mounted = true;
    import('canvas-confetti')
      .then(({ default: confetti }) => {
        if (!mounted) {
          return;
        }
        void confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      })
      .catch(() => {
        // ignore failures; the thank-you message is still presented
      });

    return () => {
      mounted = false;
    };
  }, []);

  return null;
}

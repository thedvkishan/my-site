 "use client";

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiryTimestamp: number;
  onExpire: () => void;
  className?: string;
}

export function CountdownTimer({ expiryTimestamp, onExpire, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const intervalId = setInterval(() => {
      const newTimeLeft = expiryTimestamp - Date.now();
      if (newTimeLeft <= 0) {
        clearInterval(intervalId);
        setTimeLeft(0);
        onExpire();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [expiryTimestamp, onExpire, timeLeft]);

  const minutes = Math.floor(timeLeft / (1000 * 60));
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <div className={className}>
      {minutes}M:{String(seconds).padStart(2, '0')}S
    </div>
  );
}

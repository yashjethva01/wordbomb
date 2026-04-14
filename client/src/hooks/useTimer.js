import { useMemo } from 'react';
import { useGameState } from './useGameState';

export function useTimer() {
  const { state } = useGameState();
  const { timeLeft, timeLimit } = state;

  return useMemo(() => {
    const safeLimit = timeLimit > 0 ? timeLimit : 15;
    const pct       = Math.max(0, Math.min(1, timeLeft / safeLimit));

    let urgency = 'normal';
    if (timeLeft <= 3) urgency = 'critical';
    else if (timeLeft <= 6) urgency = 'warning';

    const circumference = 2 * Math.PI * 54;
    const dashOffset    = circumference * (1 - pct);

    return { displayTime: timeLeft, percentage: pct, urgency, circumference, dashOffset };
  }, [timeLeft, timeLimit]);
}

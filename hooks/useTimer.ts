import { useEffect, useRef, useCallback } from 'react';
import { useWorkoutStore } from '@/stores';

export function useTimer() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { timerSeconds, isRunning, tickTimer, resetTimer } = useWorkoutStore();

  const startTimer = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      tickTimer();
    }, 1000);
  }, [tickTimer]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopTimer();
    resetTimer();
  }, [stopTimer, resetTimer]);

  // Auto start/stop based on isRunning
  useEffect(() => {
    if (isRunning) {
      startTimer();
    } else {
      stopTimer();
    }

    return () => {
      stopTimer();
    };
  }, [isRunning, startTimer, stopTimer]);

  // Format time as MM:SS
  const formatTime = useCallback((totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    seconds: timerSeconds,
    formattedTime: formatTime(timerSeconds),
    isRunning,
    start: startTimer,
    stop: stopTimer,
    reset,
    formatTime,
  };
}

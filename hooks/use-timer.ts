import { useCallback, useEffect, useRef, useState } from "react";

export type TimerState = "idle" | "running" | "paused";

export interface UseTimerOptions {
  initialMinutes?: number;
  onComplete?: () => void;
}

export interface UseTimerReturn {
  timeRemaining: number; // en segundos
  progress: number; // 0 a 1
  state: TimerState;
  cyclesCompleted: number;
  totalCycles: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  formatTime: (seconds: number) => string;
}

const DEFAULT_DURATION = 25 * 60; // 25 minutos en segundos
const DEFAULT_CYCLES = 4;

export function useTimer({
  initialMinutes = 25,
  onComplete,
}: UseTimerOptions = {}): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialMinutes * 60);
  const [state, setState] = useState<TimerState>("idle");
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalCycles] = useState(DEFAULT_CYCLES);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeRef = useRef(initialMinutes * 60);

  useEffect(() => {
    initialTimeRef.current = initialMinutes * 60;
    setTimeRemaining(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    if (state === "running" && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setState("idle");
            setCyclesCompleted((prevCycles) => {
              const newCycles = prevCycles + 1;
              if (onComplete) {
                onComplete();
              }
              return newCycles;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state, timeRemaining, onComplete]);

  const start = useCallback(() => {
    setState("running");
  }, []);

  const pause = useCallback(() => {
    setState("paused");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTimeRemaining(initialTimeRef.current);
  }, []);

  const skip = useCallback(() => {
    setState("idle");
    setTimeRemaining(initialTimeRef.current);
    setCyclesCompleted((prev) => prev + 1);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const progress =
    initialTimeRef.current > 0 ? 1 - timeRemaining / initialTimeRef.current : 0;

  return {
    timeRemaining,
    progress,
    state,
    cyclesCompleted,
    totalCycles,
    start,
    pause,
    reset,
    skip,
    formatTime,
  };
}

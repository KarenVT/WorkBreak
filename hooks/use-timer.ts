import { useCallback, useEffect, useRef, useState } from "react";

export type TimerState = "idle" | "running" | "paused";
export type SessionType = "work" | "shortBreak" | "longBreak";

export interface PomodoroConfig {
  workInterval: number; // en minutos
  shortBreak: number; // en minutos
  longBreak: number; // en minutos
  longBreakAfter: number; // número de pomodoros antes del descanso largo
}

export interface UseTimerOptions {
  config: PomodoroConfig;
  onComplete?: () => void;
}

export interface UseTimerReturn {
  timeRemaining: number; // en segundos
  progress: number; // 0 a 1
  state: TimerState;
  sessionType: SessionType;
  cyclesCompleted: number;
  totalCycles: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setTimeRemaining: (seconds: number) => void;
  formatTime: (seconds: number) => string;
}

const DEFAULT_CYCLES = 4;

export function useTimer({
  config,
  onComplete,
}: UseTimerOptions): UseTimerReturn {
  const { workInterval, shortBreak, longBreak, longBreakAfter } = config;

  // Estado del temporizador
  const [timeRemaining, setTimeRemaining] = useState(workInterval * 60);
  const [state, setState] = useState<TimerState>("idle");
  const [sessionType, setSessionType] = useState<SessionType>("work");

  // Contadores de ciclos
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [pomodorosInCurrentCycle, setPomodorosInCurrentCycle] = useState(0);

  const totalCycles = DEFAULT_CYCLES;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialTimeRef = useRef(workInterval * 60);
  const transitionProcessedRef = useRef(false);

  // Actualizar tiempo inicial cuando cambia la configuración o el tipo de sesión
  useEffect(() => {
    let duration = 0;
    switch (sessionType) {
      case "work":
        duration = workInterval * 60;
        break;
      case "shortBreak":
        duration = shortBreak * 60;
        break;
      case "longBreak":
        duration = longBreak * 60;
        break;
    }
    initialTimeRef.current = duration;
    // Actualizar el tiempo cuando cambia la sesión (solo si está en idle o pausado)
    setTimeRemaining((prev) => {
      // Si el tiempo está en 0 o el estado es idle, actualizar con el nuevo tiempo
      if (prev === 0 || state === "idle") {
        transitionProcessedRef.current = false;
        return duration;
      }
      return prev;
    });
  }, [sessionType, workInterval, shortBreak, longBreak, state]);

  // Actualizar el tiempo cuando cambia la configuración y el temporizador está en idle
  useEffect(() => {
    if (state === "idle") {
      let duration = 0;
      switch (sessionType) {
        case "work":
          duration = workInterval * 60;
          break;
        case "shortBreak":
          duration = shortBreak * 60;
          break;
        case "longBreak":
          duration = longBreak * 60;
          break;
      }
      initialTimeRef.current = duration;
      setTimeRemaining(duration);
    }
  }, [workInterval, shortBreak, longBreak, state, sessionType]);

  // Lógica del temporizador
  useEffect(() => {
    if (state === "running" && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Tiempo completado, transicionar al siguiente estado
            setState("idle");
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
  }, [state, timeRemaining]);

  // Manejar la transición cuando el tiempo llega a 0
  useEffect(() => {
    if (
      timeRemaining === 0 &&
      state === "idle" &&
      !transitionProcessedRef.current
    ) {
      transitionProcessedRef.current = true;

      if (sessionType === "work") {
        setPomodorosInCurrentCycle((currentPomodoros) => {
          const newPomodorosCount = currentPomodoros + 1;

          // Si hemos completado los pomodoros necesarios para un descanso largo
          if (newPomodorosCount >= longBreakAfter) {
            // Completar el ciclo y pasar a descanso largo
            setCyclesCompleted((prev) => {
              const newCycles = prev + 1;
              if (onComplete && newCycles <= totalCycles) {
                onComplete();
              }
              return newCycles;
            });
            setSessionType("longBreak");
            return 0; // Reiniciar contador para el siguiente ciclo
          } else {
            // Pasar a descanso corto
            setSessionType("shortBreak");
            return newPomodorosCount;
          }
        });
      } else if (sessionType === "shortBreak") {
        // Después de un descanso corto, volver a trabajo
        setSessionType("work");
      } else if (sessionType === "longBreak") {
        // Después de un descanso largo, volver a trabajo si aún no hemos completado todos los ciclos
        setCyclesCompleted((prev) => {
          if (prev < totalCycles) {
            setSessionType("work");
          }
          return prev;
        });
      }
    } else if (timeRemaining > 0) {
      transitionProcessedRef.current = false;
    }
  }, [
    timeRemaining,
    state,
    sessionType,
    longBreakAfter,
    totalCycles,
    onComplete,
  ]);

  const start = useCallback(() => {
    setState("running");
  }, []);

  const pause = useCallback(() => {
    setState("paused");
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setSessionType("work");
    setCyclesCompleted(0);
    setPomodorosInCurrentCycle(0);
    setTimeRemaining(initialTimeRef.current);
    transitionProcessedRef.current = false;
  }, []);

  const skip = useCallback(() => {
    setState("idle");
    setTimeRemaining(0); // Esto activará el efecto de transición
  }, []);

  const updateTimeRemaining = useCallback((seconds: number) => {
    setTimeRemaining(seconds);
    // No actualizar initialTimeRef para mantener el progreso correcto
  }, []);

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
    sessionType,
    cyclesCompleted,
    totalCycles,
    start,
    pause,
    reset,
    skip,
    setTimeRemaining: updateTimeRemaining,
    formatTime,
  };
}

import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import ActiveBreakModal from "@/app/active-break";
import { ThemedText } from "@/components/themed-text";
import { CircularTimer } from "@/components/timer/circular-timer";
import { TimerButton } from "@/components/timer/timer-button";
import { TimerHeader } from "@/components/timer/timer-header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useExercisePreferences } from "@/hooks/use-exercise-preferences";
import { usePreferences } from "@/hooks/use-preferences";
import { useTimer } from "@/hooks/use-timer";
import {
  Exercise,
  getRandomExercise,
  getRandomExercises,
} from "@/services/exercises";
import {
  cancelAllNotifications,
  sendBreakStartNotification,
  sendPomodoroEndNotification,
} from "@/services/notifications";
import { statisticsDB } from "@/services/statistics-db";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { preferences, isLoading, reloadPreferences } = usePreferences();
  const {
    exercises: exercisePreferences,
    mode: exerciseMode,
    reloadExercisePreferences,
  } = useExercisePreferences();
  const [activeBreakVisible, setActiveBreakVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([]);
  const [breakDuration, setBreakDuration] = useState(0);
  const [previousSessionType, setPreviousSessionType] = useState<
    "work" | "shortBreak" | "longBreak"
  >("work");
  const [timerStateBeforeModal, setTimerStateBeforeModal] = useState<
    "idle" | "running" | "paused"
  >("idle");
  const previousEnabledTypesRef = useRef<string>("");

  // Recargar preferencias cuando la pantalla recibe foco (cuando vuelves de configuración)
  useFocusEffect(
    useCallback(() => {
      reloadPreferences();
      reloadExercisePreferences();
    }, [reloadPreferences, reloadExercisePreferences])
  );

  const {
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
    setTimeRemaining,
    formatTime,
  } = useTimer({
    config: {
      workInterval: preferences.workInterval,
      shortBreak: preferences.shortBreak,
      longBreak: preferences.longBreak,
      longBreakAfter: preferences.longBreakAfter,
    },
    onComplete: async () => {
      console.log("Ciclo completado");

      if (sessionType === "work") {
        try {
          const actual = await AsyncStorage.getItem("focusTime");
          const nuevo = actual
            ? parseInt(actual) + preferences.workInterval
            : preferences.workInterval;
          await AsyncStorage.setItem("focusTime", nuevo.toString());
          console.log("Tiempo de enfoque actualizado:", nuevo);
        } catch (error) {
          console.error("Error al guardar tiempo de enfoque:", error);
        }
      }
    },
    onSessionComplete: async (type, duration) => {
      // Registrar la sesión completada en las estadísticas
      try {
        await statisticsDB.init();
        await statisticsDB.addSession(type, duration);
        console.log(
          `Sesión ${type} completada y registrada:`,
          duration,
          "segundos"
        );
      } catch (error) {
        console.error("Error al registrar sesión en estadísticas:", error);
      }
    },
  });

  // Programar notificaciones 5 segundos antes de que termine/comience la sesión
  useEffect(() => {
    // Solo programar notificaciones si el timer está corriendo y quedan exactamente 5 segundos
    // Las notificaciones se enviarán inmediatamente pero con un pequeño delay para evitar conflictos
    if (state === "running" && timeRemaining === 5) {
      // Determinar qué tipo de notificaciones programar según el tipo de sesión actual
      if (sessionType === "work") {
        // Cuando está en trabajo y quedan 5 segundos, enviar notificación de fin de pomodoro
        // con un pequeño delay para evitar conflictos de sonido
        if (
          preferences.notificationsEnabled &&
          preferences.pomodoroEndNotification
        ) {
          // Enviar inmediatamente (0 segundos) pero programado para evitar conflictos
          sendPomodoroEndNotification(
            {
              notificationsEnabled: preferences.notificationsEnabled,
              pomodoroEndNotification: preferences.pomodoroEndNotification,
              breakStartNotification: preferences.breakStartNotification,
              alertSound: preferences.alertSound,
            },
            0 // Enviar inmediatamente
          ).catch((error) => {
            console.error(
              "Error enviando notificación de fin de pomodoro:",
              error
            );
          });
        }

        // También enviar notificación de inicio de descanso con un delay de 2 segundos
        // para evitar que se choquen con la notificación anterior
        const currentPomodoros = cyclesCompleted * preferences.longBreakAfter;
        const willBeLongBreak =
          (currentPomodoros + 1) % preferences.longBreakAfter === 0;
        const breakType = willBeLongBreak ? "longBreak" : "shortBreak";

        if (
          preferences.notificationsEnabled &&
          preferences.breakStartNotification
        ) {
          // Programar para 2 segundos después para evitar conflictos de sonido
          sendBreakStartNotification(
            {
              notificationsEnabled: preferences.notificationsEnabled,
              pomodoroEndNotification: preferences.pomodoroEndNotification,
              breakStartNotification: preferences.breakStartNotification,
              alertSound: preferences.alertSound,
            },
            breakType,
            2 // Enviar 2 segundos después para evitar conflictos
          ).catch((error) => {
            console.error(
              "Error programando notificación de inicio de descanso:",
              error
            );
          });
        }
      }
    }
  }, [
    timeRemaining,
    state,
    sessionType,
    preferences.notificationsEnabled,
    preferences.pomodoroEndNotification,
    preferences.breakStartNotification,
    preferences.alertSound,
    cyclesCompleted,
    preferences.longBreakAfter,
  ]);

  // Cancelar notificaciones programadas cuando se pausa o resetea el timer
  useEffect(() => {
    if (state === "paused" || (state === "idle" && timeRemaining > 0)) {
      cancelAllNotifications().catch((error) => {
        console.error("Error cancelando notificaciones:", error);
      });
    }
  }, [state, timeRemaining]);

  // Detectar cuando se entra en pausa corta o larga (para lógica adicional)
  useEffect(() => {
    const isBreak = sessionType === "shortBreak" || sessionType === "longBreak";
    const wasWork = previousSessionType === "work";
    const justStartedBreak = isBreak && wasWork && !activeBreakVisible;

    if (justStartedBreak) {
      // Obtener tipos de ejercicios habilitados
      const enabledTypes = exercisePreferences
        .filter((ex) => ex.enabled)
        .map((ex) => ex.id);

      if (enabledTypes.length > 0) {
        // Calcular la duración total de la pausa en segundos
        const breakDurationSeconds =
          sessionType === "shortBreak"
            ? preferences.shortBreak * 60
            : preferences.longBreak * 60;

        // Si el modo es "text" y la duración es mayor a 2 minutos (120 segundos),
        // calcular cuántos ejercicios se necesitan (cada ejercicio dura 60 segundos)
        const EXERCISE_DURATION_SECONDS = 60;
        const TWO_MINUTES_SECONDS = 120;

        if (
          exerciseMode === "text" &&
          breakDurationSeconds > TWO_MINUTES_SECONDS
        ) {
          // Calcular cantidad de ejercicios necesarios
          const exerciseCount = Math.floor(
            breakDurationSeconds / EXERCISE_DURATION_SECONDS
          );

          // Obtener múltiples ejercicios aleatorios
          getRandomExercises(enabledTypes, exerciseCount).then((exercises) => {
            // Guardar el estado del temporizador antes de abrir el modal
            setTimerStateBeforeModal(state);
            // Inicializar la referencia con los tipos habilitados actuales
            previousEnabledTypesRef.current = enabledTypes.sort().join(",");
            setCurrentExercises(exercises);
            setCurrentExercise(null); // Limpiar ejercicio único
            setBreakDuration(breakDurationSeconds);
            setActiveBreakVisible(true);
          });
        } else {
          // Obtener un ejercicio aleatorio de forma asíncrona (modo video o duración <= 2 min)
          getRandomExercise(enabledTypes).then((exercise) => {
            // Guardar el estado del temporizador antes de abrir el modal
            setTimerStateBeforeModal(state);
            // Inicializar la referencia con los tipos habilitados actuales
            previousEnabledTypesRef.current = enabledTypes.sort().join(",");
            setCurrentExercise(exercise);
            setCurrentExercises([]); // Limpiar array de ejercicios
            setBreakDuration(breakDurationSeconds);
            setActiveBreakVisible(true);
          });
        }
      }
    }

    setPreviousSessionType(sessionType);
  }, [
    sessionType,
    previousSessionType,
    activeBreakVisible,
    exercisePreferences,
    preferences.shortBreak,
    preferences.longBreak,
    preferences.notificationsEnabled,
    preferences.pomodoroEndNotification,
    preferences.breakStartNotification,
    state,
    exerciseMode,
  ]);

  // Actualizar la duración del break y recalcular ejercicios si cambian las preferencias mientras el modal está abierto
  useEffect(() => {
    if (
      activeBreakVisible &&
      (sessionType === "shortBreak" || sessionType === "longBreak")
    ) {
      const breakDurationSeconds =
        sessionType === "shortBreak"
          ? preferences.shortBreak * 60
          : preferences.longBreak * 60;

      setBreakDuration(breakDurationSeconds);

      // Recalcular ejercicios si el modo es texto y cambió la duración
      if (exerciseMode === "text") {
        const enabledTypes = exercisePreferences
          .filter((ex) => ex.enabled)
          .map((ex) => ex.id);

        if (enabledTypes.length > 0) {
          const EXERCISE_DURATION_SECONDS = 60;
          const TWO_MINUTES_SECONDS = 120;

          if (breakDurationSeconds > TWO_MINUTES_SECONDS) {
            const exerciseCount = Math.floor(
              breakDurationSeconds / EXERCISE_DURATION_SECONDS
            );
            getRandomExercises(enabledTypes, exerciseCount).then(
              (exercises) => {
                setCurrentExercises(exercises);
                setCurrentExercise(null);
              }
            );
          } else {
            getRandomExercise(enabledTypes).then((exercise) => {
              setCurrentExercise(exercise);
              setCurrentExercises([]);
            });
          }
        }
      }
    }
  }, [
    activeBreakVisible,
    sessionType,
    preferences.shortBreak,
    preferences.longBreak,
    exerciseMode,
    exercisePreferences,
  ]);

  // Actualizar el ejercicio cuando cambian las preferencias de ejercicio en modo texto
  useEffect(() => {
    if (
      activeBreakVisible &&
      exerciseMode === "text" &&
      (sessionType === "shortBreak" || sessionType === "longBreak")
    ) {
      // Obtener tipos de ejercicios habilitados
      const enabledTypes = exercisePreferences
        .filter((ex) => ex.enabled)
        .map((ex) => ex.id);

      // Crear una cadena para comparar con la anterior
      const enabledTypesString = enabledTypes.sort().join(",");

      // Solo actualizar si los tipos habilitados realmente cambiaron
      if (enabledTypesString !== previousEnabledTypesRef.current) {
        previousEnabledTypesRef.current = enabledTypesString;

        if (enabledTypes.length > 0) {
          // Recalcular ejercicios si la duración cambió
          const breakDurationSeconds =
            sessionType === "shortBreak"
              ? preferences.shortBreak * 60
              : preferences.longBreak * 60;

          const EXERCISE_DURATION_SECONDS = 60;
          const TWO_MINUTES_SECONDS = 120;

          if (breakDurationSeconds > TWO_MINUTES_SECONDS) {
            const exerciseCount = Math.floor(
              breakDurationSeconds / EXERCISE_DURATION_SECONDS
            );
            getRandomExercises(enabledTypes, exerciseCount).then(
              (exercises) => {
                setCurrentExercises(exercises);
                setCurrentExercise(null);
              }
            );
          } else {
            // Obtener un nuevo ejercicio aleatorio basado en los tipos habilitados
            getRandomExercise(enabledTypes).then((exercise) => {
              setCurrentExercise(exercise);
              setCurrentExercises([]);
            });
          }
        } else {
          // Si no hay ejercicios habilitados, cerrar el modal
          setActiveBreakVisible(false);
          setCurrentExercise(null);
          setCurrentExercises([]);
        }
      }
    } else if (!activeBreakVisible) {
      // Resetear la referencia cuando el modal se cierra
      previousEnabledTypesRef.current = "";
    }
  }, [
    activeBreakVisible,
    exerciseMode,
    exercisePreferences,
    sessionType,
    preferences.shortBreak,
    preferences.longBreak,
  ]);

  const handleActiveBreakClose = (remainingTime?: number) => {
    setActiveBreakVisible(false);
    setCurrentExercise(null);
    setCurrentExercises([]);
    // Sincronizar el temporizador principal con el tiempo restante del modal
    if (remainingTime !== undefined && remainingTime >= 0) {
      setTimeRemaining(remainingTime);
      // Asegurarse de que el temporizador continúe corriendo si estaba corriendo antes del modal
      // o si estamos en una pausa (debería estar corriendo)
      if (
        timerStateBeforeModal === "running" ||
        sessionType === "shortBreak" ||
        sessionType === "longBreak"
      ) {
        // Si el temporizador no está corriendo, iniciarlo
        if (state !== "running") {
          start();
        }
      }
    }
  };

  const handleActiveBreakComplete = () => {
    // Cerrar el modal
    setActiveBreakVisible(false);
    setCurrentExercise(null);
    setCurrentExercises([]);

    // Avanzar al siguiente estado (de pausa a trabajo)
    // skip() establece el estado a "idle" y el tiempo a 0, lo que activará
    // el efecto de transición en use-timer.ts, que llamará a onSessionComplete
    // para registrar las estadísticas correctamente
    skip();
  };

  const getTimerTitle = () => {
    switch (sessionType) {
      case "work":
        return "Tiempo de Enfocarse";
      case "shortBreak":
        return "Pausa Corta";
      case "longBreak":
        return "Pausa Larga";
      default:
        return "Tiempo de Enfocarse";
    }
  };

  const handleSettingsPress = () => {
    router.push("/preferences");
  };

  if (isLoading) {
    return null; // O un componente de carga
  }

  const handleMainButtonPress = () => {
    if (state === "running") {
      pause();
    } else {
      start();
    }
  };

  return (
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TimerHeader
            cyclesCompleted={cyclesCompleted}
            totalCycles={totalCycles}
            onSettingsPress={handleSettingsPress}
          />

          <View style={styles.timerSection}>
            <ThemedText
              type="subtitle"
              style={[styles.timerTitle, { color: colors.text }]}
            >
              {getTimerTitle()}
            </ThemedText>

            <View style={styles.timerContainer}>
              <CircularTimer
                timeRemaining={timeRemaining}
                progress={progress}
                formatTime={formatTime}
              />
            </View>

            <ThemedText
              style={[styles.motivationalText, { color: colors.textMedium }]}
            >
              ¡Tú puedes!
            </ThemedText>
          </View>

          <View style={styles.controlsSection}>
            <TimerButton
              label="Reiniciar"
              icon="arrow.clockwise"
              onPress={reset}
              variant="secondary"
            />
            <TimerButton
              label={state === "running" ? "Pausa" : "Iniciar"}
              icon={state === "running" ? "pause.fill" : "play.fill"}
              onPress={handleMainButtonPress}
              variant="primary"
            />
            <TimerButton
              label="Saltar"
              icon="forward.fill"
              onPress={skip}
              variant="secondary"
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      <ActiveBreakModal
        visible={activeBreakVisible}
        exercise={currentExercise}
        exercises={currentExercises}
        mode={exerciseMode}
        totalDuration={breakDuration}
        timeRemaining={timeRemaining}
        isPaused={state === "paused"}
        onClose={handleActiveBreakClose}
        onComplete={handleActiveBreakComplete}
        onPauseToggle={handleMainButtonPress}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 10,
  },
  timerSection: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  timerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  timerContainer: {
    marginVertical: 0,
  },
  motivationalText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 20,
  },
  controlsSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 40,
    paddingHorizontal: 30,
    marginTop: 20,
  },
});

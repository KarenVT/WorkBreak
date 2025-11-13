import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { Exercise, getRandomExercise } from "@/services/exercises";

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
    onComplete: () => {
      // Aquí puedes agregar lógica adicional cuando se complete un ciclo
      console.log("Ciclo completado");
    },
  });

  // Detectar cuando se entra en pausa corta o larga
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

        // Obtener un ejercicio aleatorio de forma asíncrona
        getRandomExercise(enabledTypes).then((exercise) => {
          // Guardar el estado del temporizador antes de abrir el modal
          setTimerStateBeforeModal(state);
          // Inicializar la referencia con los tipos habilitados actuales
          previousEnabledTypesRef.current = enabledTypes.sort().join(",");
          setCurrentExercise(exercise);
          setBreakDuration(breakDurationSeconds);
          setActiveBreakVisible(true);
        });
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
    state,
  ]);

  // Actualizar la duración del break si cambian las preferencias mientras el modal está abierto
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
    }
  }, [
    activeBreakVisible,
    sessionType,
    preferences.shortBreak,
    preferences.longBreak,
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
          // Obtener un nuevo ejercicio aleatorio basado en los tipos habilitados
          getRandomExercise(enabledTypes).then((exercise) => {
            setCurrentExercise(exercise);
          });
        } else {
          // Si no hay ejercicios habilitados, cerrar el modal
          setActiveBreakVisible(false);
          setCurrentExercise(null);
        }
      }
    } else if (!activeBreakVisible) {
      // Resetear la referencia cuando el modal se cierra
      previousEnabledTypesRef.current = "";
    }
  }, [activeBreakVisible, exerciseMode, exercisePreferences, sessionType]);

  const handleActiveBreakClose = (remainingTime?: number) => {
    setActiveBreakVisible(false);
    setCurrentExercise(null);
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
    setActiveBreakVisible(false);
    setCurrentExercise(null);
    // El temporizador continúa normalmente
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

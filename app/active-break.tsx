import { ExerciseMode } from "@/components/preferences/preference-mode-selector";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Exercise } from "@/services/exercises";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ActiveBreakModalProps {
  visible: boolean;
  exercise: Exercise | null;
  exercises: Exercise[]; // Array de ejercicios para modo múltiple
  mode: ExerciseMode;
  totalDuration: number; // en segundos
  timeRemaining: number; // tiempo restante del temporizador principal
  isPaused: boolean; // estado de pausa del temporizador principal
  onClose: (remainingTime?: number) => void;
  onComplete: () => void;
  onPauseToggle: () => void;
}

export default function ActiveBreakModal({
  visible,
  exercise,
  exercises,
  mode,
  totalDuration,
  timeRemaining,
  isPaused,
  onClose,
  onComplete,
  onPauseToggle,
}: ActiveBreakModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Constantes para ejercicios múltiples
  const EXERCISE_DURATION_SECONDS = 60;

  // Determinar si estamos usando múltiples ejercicios (solo en modo texto)
  const isMultipleExercises = mode === "text" && exercises.length > 0;
  const exerciseList = isMultipleExercises
    ? exercises
    : exercise
    ? [exercise]
    : [];
  const totalExercises = exerciseList.length;

  // Estado para el ejercicio actual (índice)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Calcular la duración del ejercicio actual (solo para determinar cuándo cambiar ejercicios)
  const currentExerciseDuration = isMultipleExercises
    ? EXERCISE_DURATION_SECONDS
    : totalDuration;

  // El temporizador del modal siempre muestra el tiempo total restante de la pausa
  // No se reinicia por ejercicio, solo los ejercicios cambian automáticamente
  const [modalTimeRemaining, setModalTimeRemaining] = useState(totalDuration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Estado para controlar si el video está silenciado
  const [isMuted, setIsMuted] = useState(false);

  // Crear el reproductor de video (siempre se crea, pero solo se usa cuando mode === "video")
  const player = useVideoPlayer(
    require("@/assets/videos/Es_hora_de_la_pausa_activa.mp4"),
    (player) => {
      player.loop = true;
      player.pause(); // Iniciar pausado, se controlará con useEffect
      player.volume = 1.0; // Inicializar con volumen al máximo
    }
  );

  // Referencia para rastrear si es la primera vez que se abre el modal
  const isFirstOpenRef = useRef(true);
  const previousVisibleRef = useRef(false);

  // Inicializar el temporizador del modal cuando se abre por primera vez
  useEffect(() => {
    if (visible && totalDuration > 0) {
      // Si el modal acaba de abrirse (no estaba visible antes)
      if (!previousVisibleRef.current || isFirstOpenRef.current) {
        // Primera vez que se abre: inicializar con el tiempo total de la pausa
        setModalTimeRemaining(totalDuration);
        setCurrentExerciseIndex(0);
        isFirstOpenRef.current = false;

        // Inicializar referencias de seguimiento
        previousTotalDurationRef.current = totalDuration;
        previousExercisesLengthRef.current = exercises.length;
        previousExerciseIdRef.current = exercise?.id || null;
        previousIsMultipleRef.current = isMultipleExercises;
      }
      previousVisibleRef.current = true;
    } else if (!visible) {
      // Detener el temporizador cuando el modal se cierra
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Resetear al tiempo total cuando se cierra
      setModalTimeRemaining(totalDuration);
      setCurrentExerciseIndex(0);
      isFirstOpenRef.current = true; // Resetear para la próxima vez
      previousVisibleRef.current = false;

      // Resetear referencias cuando se cierra el modal
      previousTotalDurationRef.current = 0;
      previousExercisesLengthRef.current = 0;
      previousExerciseIdRef.current = null;
      previousIsMultipleRef.current = false;
    }
  }, [
    visible,
    totalDuration,
    isMultipleExercises,
    currentExerciseDuration,
    exercises.length,
    exercise?.id,
  ]);

  // Referencias para rastrear cambios
  const previousTotalDurationRef = useRef<number>(0);
  const previousExercisesLengthRef = useRef<number>(0);
  const previousExerciseIdRef = useRef<string | null>(null);
  const previousIsMultipleRef = useRef<boolean>(false);

  // Función helper para sincronizar el temporizador
  const syncTimer = useCallback(() => {
    if (
      !visible ||
      totalDuration === 0 ||
      isFirstOpenRef.current ||
      !previousVisibleRef.current
    ) {
      return;
    }

    // El modal ya estaba abierto, sincronizar con el tiempo restante del temporizador principal
    if (isMultipleExercises && totalExercises > 0) {
      // En modo múltiple, calcular en qué ejercicio estamos basado en el tiempo transcurrido
      const EXERCISE_DURATION_SECONDS = 60;

      // Calcular el tiempo transcurrido basado en el tiempo restante del temporizador principal
      // Si timeRemaining es mayor que totalDuration, significa que cambió la configuración
      // En ese caso, calcular proporcionalmente o usar el nuevo totalDuration
      let elapsedTime = 0;
      const previousDuration =
        previousTotalDurationRef.current || totalDuration;

      if (
        timeRemaining > totalDuration &&
        previousDuration > 0 &&
        previousDuration !== totalDuration
      ) {
        // La configuración cambió y el tiempo restante es mayor que la nueva duración
        // Calcular proporcionalmente basado en el tiempo transcurrido anterior
        const previousRemaining = Math.min(timeRemaining, previousDuration);
        const previousElapsed = previousDuration - previousRemaining;
        // Calcular proporción del tiempo transcurrido (0 a 1)
        const elapsedRatio = Math.max(
          0,
          Math.min(1, previousElapsed / previousDuration)
        );
        // Aplicar la misma proporción al nuevo totalDuration
        elapsedTime = Math.floor(totalDuration * elapsedRatio);
      } else if (timeRemaining <= totalDuration) {
        // Normal: calcular basado en la diferencia
        elapsedTime = totalDuration - timeRemaining;
      } else {
        // Caso especial: timeRemaining > totalDuration pero no hay previousDuration válido
        // Usar 0 como tiempo transcurrido (empezar desde el principio)
        elapsedTime = 0;
      }

      const exercisesCompleted = Math.floor(
        elapsedTime / EXERCISE_DURATION_SECONDS
      );
      const newIndex = Math.min(exercisesCompleted, totalExercises - 1);

      setCurrentExerciseIndex(Math.max(0, newIndex));
      // El temporizador siempre muestra el tiempo total restante, no por ejercicio
      setModalTimeRemaining(Math.max(0, timeRemaining));
    } else {
      // En modo único, sincronizar directamente con el tiempo restante del temporizador principal
      setCurrentExerciseIndex(0);
      setModalTimeRemaining(Math.max(0, timeRemaining));
    }
  }, [
    visible,
    totalDuration,
    isMultipleExercises,
    totalExercises,
    timeRemaining,
  ]);

  // Sincronizar cuando cambia totalDuration mientras el modal está abierto
  useEffect(() => {
    if (
      visible &&
      totalDuration > 0 &&
      !isFirstOpenRef.current &&
      previousVisibleRef.current
    ) {
      const durationChanged =
        previousTotalDurationRef.current !== totalDuration;

      if (durationChanged) {
        // En modo video, sincronizar inmediatamente
        // En modo texto, esperar a que los ejercicios se actualicen (se sincronizará en el otro useEffect)
        if (mode === "video") {
          syncTimer();
        }
        // Actualizar la referencia de duración
        previousTotalDurationRef.current = totalDuration;
      }
    }
  }, [visible, totalDuration, timeRemaining, syncTimer, mode]);

  // Sincronizar cuando cambian los ejercicios o la duración (en modo texto)
  useEffect(() => {
    if (
      visible &&
      totalDuration > 0 &&
      !isFirstOpenRef.current &&
      previousVisibleRef.current
    ) {
      const durationChanged =
        previousTotalDurationRef.current !== totalDuration;
      const exercisesLengthChanged =
        previousExercisesLengthRef.current !== exercises.length;
      const exerciseIdChanged = exercise?.id !== previousExerciseIdRef.current;
      const modeChanged = previousIsMultipleRef.current !== isMultipleExercises;

      // En modo texto: sincronizar cuando cambia la duración O cuando cambian los ejercicios
      // En modo video: solo sincronizar cuando cambian los ejercicios (la duración ya se maneja arriba)
      const shouldSync =
        mode === "text"
          ? durationChanged ||
            exercisesLengthChanged ||
            exerciseIdChanged ||
            modeChanged
          : exercisesLengthChanged || exerciseIdChanged || modeChanged;

      if (shouldSync) {
        syncTimer();

        // Actualizar todas las referencias
        if (durationChanged) {
          previousTotalDurationRef.current = totalDuration;
        }
        if (exercisesLengthChanged || exerciseIdChanged || modeChanged) {
          previousExercisesLengthRef.current = exercises.length;
          previousExerciseIdRef.current = exercise?.id || null;
          previousIsMultipleRef.current = isMultipleExercises;
        }
      }
    }
  }, [
    visible,
    isMultipleExercises,
    timeRemaining,
    totalExercises,
    exercises.length,
    exercise?.id,
    syncTimer,
    totalDuration,
    mode,
  ]);

  // Controlar el temporizador del modal (siempre muestra el tiempo total)
  useEffect(() => {
    if (visible && modalTimeRemaining > 0 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setModalTimeRemaining((prev) => {
          if (prev <= 1) {
            // Cuando llega a 0, completar la pausa
            setTimeout(() => {
              onComplete();
            }, 500);
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
        intervalRef.current = null;
      }
    };
  }, [visible, modalTimeRemaining, isPaused, onComplete]);

  // Cambiar ejercicios automáticamente cada 60 segundos (solo en modo múltiple)
  useEffect(() => {
    if (
      visible &&
      isMultipleExercises &&
      totalExercises > 1 &&
      !isPaused &&
      modalTimeRemaining > 0
    ) {
      const EXERCISE_DURATION_SECONDS = 60;
      const elapsedTime = totalDuration - modalTimeRemaining;
      const exercisesCompleted = Math.floor(
        elapsedTime / EXERCISE_DURATION_SECONDS
      );
      const expectedIndex = Math.min(exercisesCompleted, totalExercises - 1);

      // Cambiar al ejercicio correspondiente si es diferente al actual
      if (
        expectedIndex !== currentExerciseIndex &&
        expectedIndex < totalExercises
      ) {
        setCurrentExerciseIndex(expectedIndex);
      }
    }
  }, [
    visible,
    isMultipleExercises,
    totalExercises,
    modalTimeRemaining,
    totalDuration,
    isPaused,
    currentExerciseIndex,
  ]);

  // Controlar la reproducción del video según el estado de pausa y visibilidad
  useEffect(() => {
    if (mode === "video" && player) {
      if (!visible) {
        // Detener y reiniciar el video cuando el modal se cierra
        player.pause();
        player.currentTime = 0;
        // Resetear el estado de silencio cuando se cierra el modal
        setIsMuted(false);
        player.volume = 1.0;
      } else if (visible && !isPaused) {
        // Reproducir cuando el modal está visible y no está pausado
        player.play();
      } else if (isPaused) {
        // Pausar cuando está pausado
        player.pause();
      }
    }
  }, [isPaused, mode, visible, player]);

  // Controlar el volumen del video según el estado de silencio
  useEffect(() => {
    if (mode === "video" && player) {
      player.volume = isMuted ? 0 : 1.0;
    }
  }, [isMuted, mode, player]);

  // Función para alternar el estado de silencio
  const handleToggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Obtener el ejercicio actual
  const currentExerciseData = exerciseList[currentExerciseIndex];

  if (!currentExerciseData || totalDuration === 0) return null;

  // Calcular minutos y segundos del tiempo restante del modal
  const minutes = Math.floor(modalTimeRemaining / 60);
  const seconds = modalTimeRemaining % 60;

  // Calcular el progreso: cuanto tiempo ha pasado del tiempo total de la pausa
  // Asegurarse de que el progreso esté entre 0 y 1
  const elapsedTime = totalDuration - modalTimeRemaining;
  const progress = Math.max(0, Math.min(1, elapsedTime / totalDuration));

  const handlePrevious = () => {
    // El tiempo restante siempre es el tiempo total de la pausa
    // Cerrar el modal y pasar el tiempo restante para sincronizar el temporizador principal
    onClose(modalTimeRemaining);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handlePrevious}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          {mode === "video" && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleToggleMute}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"}
                size={24}
                color={colors.textMedium}
              />
            </TouchableOpacity>
          )}
          {mode !== "video" && <View style={styles.headerButton} />}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handlePrevious}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={24} color={colors.textMedium} />
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Título del ejercicio - solo mostrar en modo texto */}
          {mode === "text" && (
            <Text style={[styles.title, { color: colors.text }]}>
              {currentExerciseData.name}
            </Text>
          )}

          {/* Video o Descripción según el modo */}
          {mode === "video" ? (
            <View style={styles.videoContainer}>
              <VideoView
                player={player}
                style={[
                  styles.video,
                  { borderRadius: 12, borderWidth: 2, borderColor: "#ffffff" },
                ]}
                contentFit="contain"
                nativeControls={false}
                allowsFullscreen={false}
              />
            </View>
          ) : (
            <Text style={[styles.description, { color: colors.textMedium }]}>
              {currentExerciseData.description}
            </Text>
          )}

          {/* Información adicional para modo texto */}
          {mode === "text" && (
            <View style={styles.durationInfo}>
              <Text
                style={[styles.durationText, { color: colors.textMedium }]}
              ></Text>
            </View>
          )}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View
              style={[
                styles.timerCircle,
                { backgroundColor: colors.background },
                { borderColor: colors.tint },
              ]}
            >
              <Text style={[styles.timerNumber, { color: colors.text }]}>
                {minutes.toString().padStart(2, "0")}
              </Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View
              style={[
                styles.timerCircle,
                { backgroundColor: colors.backgroundSecondary },
                { borderColor: colors.tint },
              ]}
            >
              <Text
                style={[styles.timerNumberActive, { color: colors.textActive }]}
              >
                {seconds.toString().padStart(2, "0")}
              </Text>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressSection}>
            <Text
              style={[styles.exerciseCounter, { color: colors.textMedium }]}
            >
              Ejercicio {currentExerciseIndex + 1} de {totalExercises}
            </Text>
            <ProgressBar
              progress={progress}
              height={4}
              style={styles.progressBar}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 36,
    color: "#111827",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  videoContainer: {
    width: "100%",
    maxWidth: 400,
    height: "60%",
    marginBottom: 32,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  durationInfo: {
    marginBottom: 24,
  },
  durationText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  timerCircle: {
    width: 100,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timerCircleActive: {},
  timerNumber: {
    fontSize: 50,
    fontWeight: "600",
  },
  timerNumberActive: {
    fontSize: 50,
    fontWeight: "600",
  },
  timerSeparator: {
    fontSize: 50,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  progressSection: {
    width: "100%",
    marginBottom: 48,
  },
  exerciseCounter: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
  },
});

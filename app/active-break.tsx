import { ExerciseMode } from "@/components/preferences/preference-mode-selector";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Exercise } from "@/services/exercises";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

  // Calcular la duración del ejercicio actual
  const currentExerciseDuration = isMultipleExercises
    ? EXERCISE_DURATION_SECONDS
    : totalDuration;

  // Temporizador independiente para el modal
  const [modalTimeRemaining, setModalTimeRemaining] = useState(
    currentExerciseDuration
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Crear el reproductor de video (siempre se crea, pero solo se usa cuando mode === "video")
  const player = useVideoPlayer(
    require("@/assets/videos/Es_hora_de_la_pausa_activa.mp4"),
    (player) => {
      player.loop = true;
      player.pause(); // Iniciar pausado, se controlará con useEffect
    }
  );

  // Referencias para rastrear cambios
  const previousTotalDurationRef = useRef<number>(0);
  const previousIsMultipleRef = useRef<boolean>(false);
  const previousExercisesLengthRef = useRef<number>(0);

  // Inicializar el temporizador del modal cuando se abre o cambia la configuración
  useEffect(() => {
    if (visible && totalDuration > 0) {
      // Detectar si es la primera vez que se abre
      const isFirstOpen = previousTotalDurationRef.current === 0;
      // Detectar si cambió el modo (múltiple <-> único)
      const modeChanged = previousIsMultipleRef.current !== isMultipleExercises;
      // Detectar si cambió la cantidad de ejercicios (en modo múltiple)
      const exercisesChanged =
        isMultipleExercises &&
        previousExercisesLengthRef.current !== exercises.length;
      // Detectar si cambió la duración total
      const durationChanged =
        totalDuration !== previousTotalDurationRef.current;

      if (isFirstOpen || modeChanged || exercisesChanged) {
        // Resetear completamente cuando cambia el modo o los ejercicios
        const duration = isMultipleExercises
          ? currentExerciseDuration
          : totalDuration;
        setModalTimeRemaining(duration);
        setCurrentExerciseIndex(0);
        previousTotalDurationRef.current = totalDuration;
        previousIsMultipleRef.current = isMultipleExercises;
        previousExercisesLengthRef.current = exercises.length;
      } else if (durationChanged && !isMultipleExercises) {
        // Si solo cambió la duración en modo único, ajustar proporcionalmente
        const ratio = totalDuration / previousTotalDurationRef.current;
        setModalTimeRemaining((prev) =>
          Math.max(0, Math.min(totalDuration, Math.floor(prev * ratio)))
        );
        previousTotalDurationRef.current = totalDuration;
      } else if (durationChanged && isMultipleExercises) {
        // En modo múltiple, si cambió la duración, los ejercicios ya se recalculan arriba
        // Solo actualizar la referencia
        previousTotalDurationRef.current = totalDuration;
      }
    } else if (!visible) {
      // Detener el temporizador cuando el modal se cierra
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const duration = isMultipleExercises
        ? currentExerciseDuration
        : totalDuration;
      setModalTimeRemaining(duration);
      setCurrentExerciseIndex(0);
      previousTotalDurationRef.current = 0;
      previousIsMultipleRef.current = false;
      previousExercisesLengthRef.current = 0;
    }
  }, [
    visible,
    totalDuration,
    isMultipleExercises,
    currentExerciseDuration,
    exercises.length,
  ]);

  // Controlar el temporizador del modal
  useEffect(() => {
    if (visible && modalTimeRemaining > 0 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setModalTimeRemaining((prev) => {
          if (prev <= 1) {
            // Cuando llega a 0, verificar si hay más ejercicios
            if (
              isMultipleExercises &&
              currentExerciseIndex < totalExercises - 1
            ) {
              // Cambiar al siguiente ejercicio
              const nextIndex = currentExerciseIndex + 1;
              setCurrentExerciseIndex(nextIndex);
              return currentExerciseDuration; // Reiniciar con la duración del siguiente ejercicio
            } else {
              // Completar todos los ejercicios
              setTimeout(() => {
                onComplete();
              }, 500);
              return 0;
            }
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
  }, [
    visible,
    modalTimeRemaining,
    isPaused,
    onComplete,
    isMultipleExercises,
    currentExerciseIndex,
    totalExercises,
    currentExerciseDuration,
  ]);

  // Reiniciar el temporizador cuando cambia el ejercicio actual (solo para múltiples ejercicios)
  useEffect(() => {
    if (visible && isMultipleExercises && currentExerciseIndex > 0) {
      setModalTimeRemaining(currentExerciseDuration);
    }
  }, [
    visible,
    isMultipleExercises,
    currentExerciseIndex,
    currentExerciseDuration,
  ]);

  // Controlar la reproducción del video según el estado de pausa y visibilidad
  useEffect(() => {
    if (mode === "video" && player) {
      if (!visible) {
        // Detener y reiniciar el video cuando el modal se cierra
        player.pause();
        player.currentTime = 0;
      } else if (visible && !isPaused) {
        // Reproducir cuando el modal está visible y no está pausado
        player.play();
      } else if (isPaused) {
        // Pausar cuando está pausado
        player.pause();
      }
    }
  }, [isPaused, mode, visible, player]);

  // Obtener el ejercicio actual
  const currentExerciseData = exerciseList[currentExerciseIndex];

  if (!currentExerciseData || totalDuration === 0) return null;

  // Calcular minutos y segundos del tiempo restante del modal
  const minutes = Math.floor(modalTimeRemaining / 60);
  const seconds = modalTimeRemaining % 60;

  // Calcular el progreso: cuanto tiempo ha pasado del ejercicio actual
  // Asegurarse de que el progreso esté entre 0 y 1
  const elapsedTime = currentExerciseDuration - modalTimeRemaining;
  const progress = Math.max(
    0,
    Math.min(1, elapsedTime / currentExerciseDuration)
  );

  const handlePrevious = () => {
    // Calcular el tiempo restante total de la pausa
    let remainingTime = modalTimeRemaining;

    if (isMultipleExercises) {
      // Calcular tiempo restante de ejercicios pendientes
      const remainingExercises = totalExercises - currentExerciseIndex - 1;
      remainingTime =
        modalTimeRemaining + remainingExercises * EXERCISE_DURATION_SECONDS;
    }

    // Cerrar el modal y pasar el tiempo restante para sincronizar el temporizador principal
    onClose(remainingTime);
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
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="speaker.wave.2.fill"
              size={24}
              color={colors.textMedium}
            />
          </TouchableOpacity>
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

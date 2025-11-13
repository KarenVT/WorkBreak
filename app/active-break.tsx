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

  // Temporizador independiente para el modal
  const [modalTimeRemaining, setModalTimeRemaining] = useState(totalDuration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Crear el reproductor de video (siempre se crea, pero solo se usa cuando mode === "video")
  const player = useVideoPlayer(
    require("@/assets/videos/Es_hora_de_la_pausa_activa.mp4"),
    (player) => {
      player.loop = true;
      player.pause(); // Iniciar pausado, se controlará con useEffect
    }
  );

  // Inicializar el temporizador del modal cuando se abre
  useEffect(() => {
    if (visible && totalDuration > 0) {
      setModalTimeRemaining(totalDuration);
    } else if (!visible) {
      // Detener el temporizador cuando el modal se cierra
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setModalTimeRemaining(totalDuration);
    }
  }, [visible, totalDuration]);

  // Controlar el temporizador del modal
  useEffect(() => {
    if (visible && modalTimeRemaining > 0 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setModalTimeRemaining((prev) => {
          if (prev <= 1) {
            // Cuando llega a 0, completar automáticamente
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

  if (!exercise || totalDuration === 0) return null;

  // Calcular minutos y segundos del tiempo restante del modal
  const minutes = Math.floor(modalTimeRemaining / 60);
  const seconds = modalTimeRemaining % 60;

  // Calcular el progreso: cuanto tiempo ha pasado del total del modal
  // Asegurarse de que el progreso esté entre 0 y 1
  const elapsedTime = totalDuration - modalTimeRemaining;
  const progress = Math.max(0, Math.min(1, elapsedTime / totalDuration));

  const handlePrevious = () => {
    // Cerrar el modal y pasar el tiempo restante para sincronizar el temporizador principal
    onClose(modalTimeRemaining);
  };

  const handleNext = () => {
    // Completar el ejercicio actual
    onComplete();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => onClose(modalTimeRemaining)}
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
            onPress={() => onClose(modalTimeRemaining)}
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
              {exercise.name}
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
              {exercise.description}
            </Text>
          )}

          {/* Información adicional para modo texto */}
          {mode === "text" && (
            <View style={styles.durationInfo}>
              <Text style={[styles.durationText, { color: colors.textMedium }]}>
              </Text>
            </View>
          )}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle,
              { backgroundColor: colors.background },
              { borderColor: colors.tint }]}>
              <Text style={[styles.timerNumber,
                { color: colors.text }
              ]}>
                {minutes.toString().padStart(2, "0")}
              </Text>
            </View>
            <Text style={styles.timerSeparator}>:</Text>
            <View style={[styles.timerCircle, styles.timerCircleActive]}>
              <Text style={styles.timerNumberActive}>
                {seconds.toString().padStart(2, "0")}
              </Text>
              <Text style={styles.timerLabelActive}>SEG</Text>
            </View>
          </View>

          {/* Barra de progreso */}
          <View style={styles.progressSection}>
            <Text
              style={[styles.exerciseCounter, { color: colors.textMedium }]}
            >
              Ejercicio 1 de 1
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
  timerCircleActive: {
    backgroundColor: "#E8F5E9",
  },
  timerNumber: {
    fontSize: 50,
    fontWeight: "600",
  },
  timerNumberActive: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2b7e1f",
  },
  timerLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
    color: "#9ca3af",
  },
  timerLabelActive: {
    fontSize: 11,
    fontWeight: "500",
    color: "#2b7e1f",
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

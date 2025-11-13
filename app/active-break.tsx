import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Exercise } from "@/services/exercises";
import { useEffect } from "react";
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
  totalDuration: number; // en segundos
  timeRemaining: number; // tiempo restante del temporizador principal
  isPaused: boolean; // estado de pausa del temporizador principal
  onClose: () => void;
  onComplete: () => void;
  onPauseToggle: () => void;
}

export default function ActiveBreakModal({
  visible,
  exercise,
  totalDuration,
  timeRemaining,
  isPaused,
  onClose,
  onComplete,
  onPauseToggle,
}: ActiveBreakModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Cuando el tiempo llega a 0, completar automáticamente
  useEffect(() => {
    if (visible && timeRemaining === 0 && totalDuration > 0) {
      const timeout = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [timeRemaining, visible, totalDuration, onComplete]);

  if (!exercise || totalDuration === 0) return null;

  // Calcular minutos y segundos del tiempo restante
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Calcular el progreso: cuanto tiempo ha pasado del total
  // Asegurarse de que el progreso esté entre 0 y 1
  const elapsedTime = totalDuration - timeRemaining;
  const progress = Math.max(0, Math.min(1, elapsedTime / totalDuration));

  const handlePrevious = () => {
    // Por ahora, solo cerrar el modal
    onClose();
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
      onRequestClose={onClose}
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
            onPress={onClose}
            activeOpacity={0.7}
          >
            <IconSymbol name="xmark" size={24} color={colors.textMedium} />
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Título del ejercicio */}
          <Text style={[styles.title, { color: colors.text }]}>
            {exercise.name}
          </Text>

          {/* Descripción */}
          <Text style={[styles.description, { color: colors.textMedium }]}>
            {exercise.description}
          </Text>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>
                {minutes.toString().padStart(2, "0")}
              </Text>
              <Text style={styles.timerLabel}>MIN</Text>
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

          {/* Controles */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonSecondary]}
              onPress={handlePrevious}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="backward.fill"
                size={24}
                color={colors.textMedium}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                styles.controlButtonPrimary,
                { backgroundColor: colors.timerDarkGreen },
              ]}
              onPress={onPauseToggle}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={isPaused ? "play.fill" : "pause.fill"}
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonSecondary]}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <IconSymbol
                name="forward.fill"
                size={24}
                color={colors.textMedium}
              />
            </TouchableOpacity>
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
    marginBottom: 48,
    lineHeight: 24,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  timerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  timerCircleActive: {
    backgroundColor: "#E8F5E9",
  },
  timerNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#9ca3af",
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
    fontSize: 20,
    fontWeight: "600",
    marginHorizontal: 8,
    color: "#9ca3af",
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
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButtonPrimary: {
    backgroundColor: "#2b7e1f",
  },
  controlButtonSecondary: {
    backgroundColor: "#e5e7eb",
  },
});

import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { CircularTimer } from "@/components/timer/circular-timer";
import { TimerButton } from "@/components/timer/timer-button";
import { TimerHeader } from "@/components/timer/timer-header";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTimer } from "@/hooks/use-timer";

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const {
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
  } = useTimer({
    initialMinutes: 25,
    onComplete: () => {
      // Aquí puedes agregar lógica adicional cuando se complete un ciclo
      console.log("Ciclo completado");
    },
  });

  const handleSettingsPress = () => {
    router.push("/preferences");
  };

  const handleMainButtonPress = () => {
    if (state === "running") {
      pause();
    } else {
      start();
    }
  };

  return (
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
            Tiempo de Enfocarse
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

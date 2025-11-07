import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface CircularTimerProps {
  timeRemaining: number;
  progress: number;
  formatTime: (seconds: number) => string;
}

const SIZE = 260;
const STROKE_WIDTH = 20;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CircularTimer({
  timeRemaining,
  progress,
  formatTime,
}: CircularTimerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const progressOffset = CIRCUMFERENCE * (1 - progress);
  const rotation = -90; // Empezar desde arriba

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        {/* Círculo de fondo */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.timerLightBackground}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <G transform={`rotate(${rotation} ${SIZE / 2} ${SIZE / 2})`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.timerDarkGreen}
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.timeContainer}>
        <ThemedText style={[styles.timeText, { color: colors.text }]}>
          {formatTime(timeRemaining)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  timeContainer: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    padding: 20,
    fontSize: 60,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
});

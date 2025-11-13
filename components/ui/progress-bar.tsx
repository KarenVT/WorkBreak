import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface ProgressBarProps {
  progress: number; // Valor entre 0 y 1
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export function ProgressBar({ progress, style, height = 8 }: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.timerLightBackground,
          height,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: colors.timerDarkGreen,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: "hidden",
    width: "100%",
  },
  progress: {
    borderRadius: 4,
  },
});

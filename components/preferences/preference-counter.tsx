import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PreferenceCounterProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  unit?: string;
}

export function PreferenceCounter({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max = 60,
  unit = "min",
}: PreferenceCounterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onDecrease}
        disabled={!canDecrease}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            opacity: canDecrease ? 1 : 0.5,
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
      >
        <IconSymbol name="minus" size={20} color={colors.timerMediumGreen} />
      </TouchableOpacity>

      <View style={styles.valueContainer}>
        <ThemedText style={[styles.value, { color: colors.text }]}>
          {value}
        </ThemedText>
        {unit && (
          <ThemedText style={[styles.unit, { color: colors.text }]}>
            {unit}
          </ThemedText>
        )}
      </View>

      <TouchableOpacity
        onPress={onIncrease}
        disabled={!canIncrease}
        activeOpacity={0.7}
        style={[
          styles.button,
          {
            opacity: canIncrease ? 1 : 0.5,
            backgroundColor: colors.backgroundSecondary,
          },
        ]}
      >
        <IconSymbol name="plus" size={18} color={colors.timerMediumGreen} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 8,
  },
  button: {
    width: 42,
    height: 42,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
    minWidth: 40,
    justifyContent: "center",
  },
  value: {
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 4,
    marginTop: 4,
  },
});

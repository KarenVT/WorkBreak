import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface TimerHeaderProps {
  cyclesCompleted: number;
  totalCycles: number;
  onSettingsPress?: () => void;
}

export function TimerHeader({
  cyclesCompleted,
  totalCycles,
  onSettingsPress,
}: TimerHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.cyclesText, { color: colors.textLight }]}>
        {cyclesCompleted}/{totalCycles} Ciclos Completados
      </ThemedText>
      <TouchableOpacity
        onPress={onSettingsPress}
        activeOpacity={0.7}
        style={styles.settingsButton}
      >
        <IconSymbol name="gearshape.fill" size={24} color={colors.textMedium} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  cyclesText: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingsButton: {
    padding: 4,
  },
});

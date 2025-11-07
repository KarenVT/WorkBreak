import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { SymbolViewProps } from "expo-symbols";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface TimerButtonProps {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

export function TimerButton({
  label,
  icon,
  onPress,
  variant = "secondary",
}: TimerButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const isPrimary = variant === "primary";
  const backgroundColor = isPrimary
    ? colors.timerDarkGreen
    : colors.timerLightBackground;
  const iconColor = isPrimary ? "#FFFFFF" : colors.text;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <IconSymbol name={icon as SymbolViewProps["name"]} size={34} color={iconColor} />
      </TouchableOpacity>
      <ThemedText style={[styles.buttonText, { color: colors.textMedium }]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
  },
});

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Switch } from "react-native";
import { PreferenceRow } from "./preference-row";

interface PreferenceToggleProps {
  icon: string;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function PreferenceToggle({
  icon,
  title,
  value,
  onValueChange,
  disabled = false,
}: PreferenceToggleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <PreferenceRow
      icon={icon}
      title={title}
      disabled={disabled}
      rightElement={
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: colors.toggleInactive,
            true: colors.timerDarkGreen,
          }}
          thumbColor={colors.background || "#FFFFFF"}
          ios_backgroundColor={colors.toggleInactive}
        />
      }
    />
  );
}

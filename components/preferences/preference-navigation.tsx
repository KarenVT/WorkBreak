import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { PreferenceRow } from "./preference-row";

interface PreferenceNavigationProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

export function PreferenceNavigation({
  icon,
  title,
  subtitle,
  onPress,
}: PreferenceNavigationProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <PreferenceRow
      icon={icon}
      title={title}
      subtitle={subtitle}
      onPress={onPress}
      rightElement={
        <IconSymbol name="chevron.right" size={20} color={colors.textLight} />
      }
    />
  );
}

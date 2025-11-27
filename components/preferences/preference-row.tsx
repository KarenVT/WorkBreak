import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";

interface PreferenceRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

export function PreferenceRow({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  disabled = false,
}: PreferenceRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const content = (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}>
        <IconSymbol
          name={icon as any}
          size={20}
          color={colors.timerDarkGreen}
        />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    width: "100%",
    height: 60,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.1)",
      },
      default: {},
    }),
  },
  iconContainer: {
    width: 25,
    height: 25,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "#E8F5E9",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
  },
  subtitle: {
    fontSize: 12,
  },
  rightElement: {
    marginLeft: 8,
  },
});

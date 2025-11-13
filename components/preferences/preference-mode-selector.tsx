import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type ExerciseMode = "video" | "text";

interface PreferenceModeSelectorProps {
  selectedMode: ExerciseMode;
  onSelect: (mode: ExerciseMode) => void;
}

export function PreferenceModeSelector({
  selectedMode,
  onSelect,
}: PreferenceModeSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSelect = (mode: ExerciseMode) => {
    if (typeof onSelect === "function") {
      onSelect(mode);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => handleSelect("video")}
        activeOpacity={0.7}
        style={[
          styles.option,
          {
            backgroundColor:
              selectedMode === "video"
                ? colors.timerDarkGreen
                : colors.backgroundSecondary,
            borderColor: colors.timerDarkGreen,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.optionText,
            {
              color:
                selectedMode === "video" ? "#FFFFFF" : colors.timerDarkGreen,
            },
          ]}
        >
          Video
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => handleSelect("text")}
        activeOpacity={0.7}
        style={[
          styles.option,
          {
            backgroundColor:
              selectedMode === "text"
                ? colors.timerDarkGreen
                : colors.backgroundSecondary,
            borderColor: colors.timerDarkGreen,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.optionText,
            {
              color:
                selectedMode === "text" ? "#FFFFFF" : colors.timerDarkGreen,
            },
          ]}
        >
          Texto
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});


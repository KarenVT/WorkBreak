import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface PreferenceCycleSelectorProps {
  options: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  labelFormatter?: (value: number) => string;
}

export function PreferenceCycleSelector({
  options,
  selectedValue,
  onSelect,
  labelFormatter = (value) => `${value} ciclos`,
}: PreferenceCycleSelectorProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option === selectedValue;
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.timerDarkGreen : colors.backgroundSecondary,
                borderColor: colors.timerDarkGreen,
              },
            ]}
          >
            <View style={styles.optionContent}>
              <ThemedText
                style={[
                  styles.optionNumber,
                  {
                    color: isSelected ? "#FFFFFF" : colors.timerDarkGreen,
                  },
                ]}
              >
                {option}
              </ThemedText>
              <ThemedText
                style={[
                  styles.optionLabel,
                  {
                    color: isSelected ? "#FFFFFF" : colors.timerDarkGreen,
                  },
                ]}
              >
                ciclos
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  optionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

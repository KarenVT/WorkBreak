import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  PreferenceModeSelector,
  PreferenceToggle,
} from "@/components/preferences";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useExercisePreferences } from "@/hooks/use-exercise-preferences";

export default function ExerciseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const {
    exercises,
    mode,
    isLoading,
    hasChanges,
    toggleExercise,
    setExerciseMode,
    saveExercisePreferences,
  } = useExercisePreferences();

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleSaveChanges = async () => {
    const success = await saveExercisePreferences();
    if (success) {
      // Los cambios se guardaron exitosamente
      // El estado hasChanges se actualizará automáticamente
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.timerDarkGreen} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleBackPress}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Preferencias de Ejercicio
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.textLight }]}>
            Elige los tipos de ejercicios que quieras enfocar en tus clases
            actuales
          </ThemedText>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.modeSection}>
          <ThemedText
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Ejercicios guiados
          </ThemedText>
          <PreferenceModeSelector
            selectedMode={mode}
            onSelect={setExerciseMode}
          />
          {mode === "video" && (
            <ThemedText
              style={[styles.modeDescription, { color: colors.textLight }]}
            >
              Los ejercicios se mostrarán guiados por video por defecto
            </ThemedText>
          )}
          {mode === "text" && (
            <ThemedText
              style={[styles.modeDescription, { color: colors.textLight }]}
            >
              Presenta descripción breve y duración del ejercicio
            </ThemedText>
          )}
        </View>

        {mode === "text" && (
          <View style={styles.exercisesContainer}>
            <ThemedText
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Categorías de ejercicios
            </ThemedText>
            {exercises.map((exercise) => (
              <PreferenceToggle
                key={exercise.id}
                icon={exercise.icon}
                title={exercise.name}
                value={exercise.enabled}
                onValueChange={(value) => toggleExercise(exercise.id, value)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: hasChanges
                ? colors.timerDarkGreen
                : colors.toggleInactive,
            },
          ]}
          onPress={handleSaveChanges}
          disabled={!hasChanges}
          activeOpacity={0.8}
        >
          <ThemedText style={styles.saveButtonText}>Guardar Cambios</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 4,
    marginLeft: 12,
    width: 32,
    height: 32,
    alignSelf: "center",
  },

  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  subtitle: {
    padding: 0,
    fontSize: 12,
    textAlign: "center",
  },
  modeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  modeDescription: {
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  exercisesContainer: {
    gap: 0,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopColor: "#E5E5E5",
  },
  saveButton: {
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

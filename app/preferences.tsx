import {
  PreferenceNavigation,
  PreferenceToggle,
} from "@/components/preferences";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preferences";
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

export default function PreferencesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { preferences, isLoading, updatePreference } = usePreferences();

  const handleBackPress = () => {
    router.back();
  };

  const handleAboutPress = () => {
    // Aquí puedes navegar a una pantalla de "Acerca de" si la creas
    console.log("Acerca de presionado");
  };

  const handleSoundPress = () => {
    // Aquí puedes navegar a una pantalla de selección de sonidos si la creas
    console.log("Sonido de alerta presionado");
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
        <ThemedText
          type="title"
          style={[styles.headerTitle, { color: colors.text }]}
        >
          Preferencias
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Notificaciones
          </ThemedText>

          <PreferenceToggle
            icon="bell.fill"
            title="Activar Notificaciones"
            value={preferences.notificationsEnabled}
            onValueChange={(value) => {
              updatePreference("notificationsEnabled", value);
              // Si se desactivan las notificaciones, desactivar también las específicas
              if (!value) {
                updatePreference("pomodoroEndNotification", false);
                updatePreference("breakStartNotification", false);
              }
            }}
          />

          <PreferenceToggle
            icon="timer"
            title="Notificación de fin del Pomodoro"
            value={preferences.pomodoroEndNotification}
            onValueChange={(value) =>
              updatePreference("pomodoroEndNotification", value)
            }
            disabled={!preferences.notificationsEnabled}
          />

          <PreferenceToggle
            icon="hourglass"
            title="Notificación de inicio del descanso"
            value={preferences.breakStartNotification}
            onValueChange={(value) =>
              updatePreference("breakStartNotification", value)
            }
            disabled={!preferences.notificationsEnabled}
          />
        </View>

        <View style={styles.section}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Sonidos
          </ThemedText>

          <PreferenceNavigation
            icon="music.note"
            title="Sonido de Alerta"
            subtitle="Predeterminado"
            onPress={handleSoundPress}
          />
        </View>

        <View style={styles.section}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Pomodoro
          </ThemedText>

          <PreferenceNavigation
            icon="timer"
            title="Configuración Pomodoro"
            onPress={() => router.push("/pomodoro-config")}
          />
        </View>

        <View style={styles.section}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            General
          </ThemedText>

          <PreferenceNavigation
            icon="info.circle.fill"
            title="Acerca de"
            onPress={handleAboutPress}
          />
        </View>
      </ScrollView>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
});

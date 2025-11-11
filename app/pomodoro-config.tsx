import {
  PreferenceCounter,
  PreferenceCycleSelector,
} from "@/components/preferences";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preferences";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PomodoroConfigScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { preferences, isLoading, updatePreference, reloadPreferences } =
    usePreferences();

  const [localPreferences, setLocalPreferences] = useState({
    workInterval: preferences.workInterval,
    shortBreak: preferences.shortBreak,
    longBreak: preferences.longBreak,
    longBreakAfter: preferences.longBreakAfter,
  });

  React.useEffect(() => {
    if (!isLoading) {
      setLocalPreferences({
        workInterval: preferences.workInterval,
        shortBreak: preferences.shortBreak,
        longBreak: preferences.longBreak,
        longBreakAfter: preferences.longBreakAfter,
      });
    }
  }, [preferences, isLoading]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        updatePreference("workInterval", localPreferences.workInterval),
        updatePreference("shortBreak", localPreferences.shortBreak),
        updatePreference("longBreak", localPreferences.longBreak),
        updatePreference("longBreakAfter", localPreferences.longBreakAfter),
      ]);
      // Recargar las preferencias para asegurar que se actualicen en todas las pantallas
      await reloadPreferences();
      Alert.alert("Éxito", "Los cambios se han guardado correctamente");
      router.back();
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los cambios");
      console.error("Error guardando preferencias:", error);
    }
  };

  const handleRestoreDefaults = () => {
    const restoreDefaults = async () => {
      const defaults = {
        workInterval: 25,
        shortBreak: 5,
        longBreak: 15,
        longBreakAfter: 4,
      };
      setLocalPreferences(defaults);
      try {
        await Promise.all([
          updatePreference("workInterval", defaults.workInterval),
          updatePreference("shortBreak", defaults.shortBreak),
          updatePreference("longBreak", defaults.longBreak),
          updatePreference("longBreakAfter", defaults.longBreakAfter),
        ]);
        // Recargar las preferencias para asegurar que se actualicen en todas las pantallas
        await reloadPreferences();
        Alert.alert("Éxito", "Los valores por defecto se han restaurado");
      } catch (error) {
        Alert.alert("Error", "No se pudieron restaurar los valores por defecto");
        console.error("Error restaurando valores por defecto:", error);
      }
    };

    if (Platform.OS === "web") {
      // En web, usar window.confirm directamente
      if (
        typeof window !== "undefined" &&
        window.confirm(
          "¿Estás seguro de que quieres restaurar los valores por defecto?"
        )
      ) {
        restoreDefaults();
      }
    } else {
      // En móvil, usar Alert.alert
      Alert.alert(
        "Restaurar por Defecto",
        "¿Estás seguro de que quieres restaurar los valores por defecto?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Restaurar",
            style: "destructive",
            onPress: restoreDefaults,
          },
        ]
      );
    }
  };

  const handleWorkIntervalChange = (delta: number) => {
    setLocalPreferences((prev) => ({
      ...prev,
      workInterval: Math.max(1, Math.min(60, prev.workInterval + delta)),
    }));
  };

  const handleShortBreakChange = (delta: number) => {
    setLocalPreferences((prev) => ({
      ...prev,
      shortBreak: Math.max(1, Math.min(60, prev.shortBreak + delta)),
    }));
  };

  const handleLongBreakChange = (delta: number) => {
    setLocalPreferences((prev) => ({
      ...prev,
      longBreak: Math.max(1, Math.min(60, prev.longBreak + delta)),
    }));
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
      <View style={styles.header}>
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
          Configuración Pomodoro
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intervalo de Trabajo */}
        <View
          style={[
            styles.card,
            { backgroundColor: "#FFFFFF" },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[styles.cardTitle, { color: colors.text }, styles.cardTitle]}
          >
            Intervalo de Trabajo
          </ThemedText>
          <PreferenceCounter
            value={localPreferences.workInterval}
            onDecrease={() => handleWorkIntervalChange(-1)}
            onIncrease={() => handleWorkIntervalChange(1)}
            min={1}
            max={60}
            unit="min"
          />
        </View>

        {/* Pausa Corta y Pausa Larga */}
        <View style={styles.breaksContainer}>
          <View
            style={[
              styles.breakCard,
              { backgroundColor: "#FFFFFF" },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.cardTitle, { color: colors.text }, styles.cardTitle]}
            >
              Pausa Corta
            </ThemedText>
            <PreferenceCounter
              value={localPreferences.shortBreak}
              onDecrease={() => handleShortBreakChange(-1)}
              onIncrease={() => handleShortBreakChange(1)}
              min={1}
              max={60}
              unit="m"
            />
          </View>

          <View
            style={[
              styles.breakCard,
              { backgroundColor: "#FFFFFF" },
            ]}
          >
            <ThemedText
              type="subtitle"
              style={[styles.cardTitle, { color: colors.text }, styles.cardTitle]}
            >
              Pausa Larga
            </ThemedText>
            <PreferenceCounter
              value={localPreferences.longBreak}
              onDecrease={() => handleLongBreakChange(-1)}
              onIncrease={() => handleLongBreakChange(1)}
              min={1}
              max={60}
              unit="m"
            />
          </View>
        </View>

        {/* Pausa larga después de */}
        <View
          style={[
            styles.card,
            { backgroundColor: "#FFFFFF" },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={[styles.cardTitle, { color: colors.text }, styles.cardTitle]}
          >
            Pausa larga después de
          </ThemedText>
          <PreferenceCycleSelector
            options={[2, 3, 4, 5]}
            selectedValue={localPreferences.longBreakAfter}
            onSelect={(value) =>
              setLocalPreferences((prev) => ({
                ...prev,
                longBreakAfter: value,
              }))
            }
          />
        </View>
      </ScrollView>

      {/* Footer con botones */}
      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.8}
          style={[
            styles.saveButton,
            { backgroundColor: colors.timerDarkGreen },
          ]}
        >
          <Text style={styles.saveButtonText}>Guardar Cambios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRestoreDefaults}
          activeOpacity={0.7}
          style={styles.restoreButton}
        >
          <Text
            style={[styles.restoreButtonText, { color: colors.timerDarkGreen }]}
          >
            Restaurar por Defecto
          </Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
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
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  breaksContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  breakCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  restoreButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

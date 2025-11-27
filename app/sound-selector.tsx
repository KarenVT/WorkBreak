import { PreferenceRow } from "@/components/preferences/preference-row";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { usePreferences } from "@/hooks/use-preferences";
import { Audio } from "expo-av";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Lista de sonidos disponibles
export interface SystemSound {
  id: string;
  name: string;
  displayName: string;
  fileName?: string; // Nombre del archivo de sonido (sin extensión)
}

// Lista de sonidos disponibles (5 opciones personalizadas + Predeterminado)
export const SYSTEM_SOUNDS: SystemSound[] = [
  {
    id: "default",
    name: "Predeterminado",
    displayName: "Predeterminado",
    fileName: undefined, // Usa el sonido del sistema
  },
  {
    id: "bell",
    name: "Campana",
    displayName: "Campana",
    fileName: "bell",
  },
  {
    id: "chime",
    name: "Carillón",
    displayName: "Carillón",
    fileName: "chime",
  },
  {
    id: "alert",
    name: "Alerta",
    displayName: "Alerta",
    fileName: "alert",
  },
  {
    id: "notification",
    name: "Notificación",
    displayName: "Notificación",
    fileName: "notification",
  },
  {
    id: "ringtone",
    name: "Tono de llamada",
    displayName: "Tono de llamada",
    fileName: "ringtone",
  },
];

// Mapeo de sonidos a sus archivos
const SOUND_FILE_MAP: Record<string, any> = {
  bell: require("@/assets/sounds/bell.wav"),
  chime: require("@/assets/sounds/chime.mp3"),
  alert: require("@/assets/sounds/alert.mp3"),
  notification: require("@/assets/sounds/notification.wav"),
  ringtone: require("@/assets/sounds/ringtone.wav"),
};

export default function SoundSelectorScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { preferences, isLoading, updatePreference } = usePreferences();
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleBackPress = () => {
    router.back();
  };

  const playSound = async (soundId: string) => {
    try {
      // Detener cualquier sonido que esté reproduciéndose
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // Si es "default", no reproducir nada (usa sonido del sistema)
      if (soundId === "default") {
        return;
      }

      const soundFile = SOUND_FILE_MAP[soundId];
      if (!soundFile) {
        console.warn(`Archivo de sonido no encontrado para: ${soundId}`);
        return;
      }

      // Configurar modo de audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Cargar y reproducir el sonido
      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: 1.0,
      });

      soundRef.current = sound;

      // Limpiar cuando termine de reproducirse
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error("Error reproduciendo sonido:", error);
    }
  };

  const handleSoundSelect = async (soundId: string) => {
    // Reproducir el sonido antes de seleccionarlo
    await playSound(soundId);
    await updatePreference("alertSound", soundId);
    // No cerrar inmediatamente para que el usuario pueda escuchar el sonido
    setTimeout(() => {
      router.back();
    }, 500);
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
          Sonidos
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
            Sonido de Alerta
          </ThemedText>

          {SYSTEM_SOUNDS.map((sound) => {
            const isSelected = preferences.alertSound === sound.id;
            return (
              <TouchableOpacity
                key={sound.id}
                activeOpacity={0.7}
                onPress={() => handleSoundSelect(sound.id)}
                onLongPress={() => playSound(sound.id)}
              >
                <PreferenceRow
                  icon="music.note"
                  title={sound.displayName}
                  rightElement={
                    isSelected ? (
                      <IconSymbol
                        name="checkmark.circle"
                        size={24}
                        color={colors.timerDarkGreen}
                      />
                    ) : null
                  }
                />
              </TouchableOpacity>
            );
          })}
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

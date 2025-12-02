import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Constants from "expo-constants";
import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const appName = Constants.expoConfig?.name || "WorkBreak";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Icon Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/Designer.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* App Name */}
        <ThemedText
          type="title"
          style={[styles.appName, { color: colors.text }]}
        >
          {appName}
        </ThemedText>

        {/* Version */}
        <ThemedText
          type="default"
          style={[styles.version, { color: colors.textLight }]}
        >
          Versión {appVersion}
        </ThemedText>

        {/* Description Section */}
        <View style={styles.section}>
          <ThemedText
            type="default"
            style={[styles.description, { color: colors.text }]}
          >
            WorkBreak es una aplicación diseñada para ayudarte a mantener un
            equilibrio saludable entre trabajo y descanso mediante la técnica
            Pomodoro.
          </ThemedText>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <ThemedText
            type="subtitle"
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Características
          </ThemedText>

          <View style={styles.featureItem}>
            <IconSymbol
              name="timer"
              size={20}
              color={colors.timerDarkGreen}
              style={styles.featureIcon}
            />
            <ThemedText
              type="default"
              style={[styles.featureText, { color: colors.text }]}
            >
              Temporizador Pomodoro personalizable
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              name="figure.walk"
              size={20}
              color={colors.timerDarkGreen}
              style={styles.featureIcon}
            />
            <ThemedText
              type="default"
              style={[styles.featureText, { color: colors.text }]}
            >
              Ejercicios de pausa activa
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              name="bell.fill"
              size={20}
              color={colors.timerDarkGreen}
              style={styles.featureIcon}
            />
            <ThemedText
              type="default"
              style={[styles.featureText, { color: colors.text }]}
            >
              Notificaciones personalizables
            </ThemedText>
          </View>

          <View style={styles.featureItem}>
            <IconSymbol
              name="chart.bar.fill"
              size={20}
              color={colors.timerDarkGreen}
              style={styles.featureIcon}
            />
            <ThemedText
              type="default"
              style={[styles.featureText, { color: colors.text }]}
            >
              Estadísticas de productividad
            </ThemedText>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText
            type="default"
            style={[styles.footerText, { color: colors.textLight }]}
          >
            Desarrollado con ❤️ para mejorar tu productividad
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 24,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  version: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingLeft: 4,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
});

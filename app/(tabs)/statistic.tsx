import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { statisticsDB } from "@/services/statistics-db";

interface WeeklyActivity {
  breaks: number;
  percentageChange: number;
  dailyData: number[];
}

export default function StatisticScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [breaksToday, setBreaksToday] = useState(0);
  const [focusTime, setFocusTime] = useState(0); // en minutos
  const [streakDays, setStreakDays] = useState(0);
  const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivity>({
    breaks: 0,
    percentageChange: 0,
    dailyData: [0, 0, 0, 0, 0, 0, 0],
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true);
      await statisticsDB.init();
      const [breaks, focus, streak, weekly] = await Promise.all([
        statisticsDB.getBreaksToday(),
        statisticsDB.getTotalFocusTime(),
        statisticsDB.getCurrentStreak(),
        statisticsDB.getWeeklyActivity(),
      ]);
      
      setBreaksToday(breaks);
      setFocusTime(focus);
      setStreakDays(streak);
      setWeeklyActivity(weekly);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatistics();
    }, [loadStatistics])
  );

  const formatFocusTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleSettingsPress = () => {
    router.push("/preferences");
  };

  const handleStartSessionPress = () => {
    router.push("/");
  };

  const getMaxValue = (data: number[]): number => {
    const max = Math.max(...data);
    return max === 0 ? 1 : max; // Evitar división por cero
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

  const maxBarValue = getMaxValue(weeklyActivity.dailyData);
  const dayLabels = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.headerButton}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Mi Progreso
        </ThemedText>
        <TouchableOpacity
          onPress={handleSettingsPress}
          style={styles.headerButton}
        >
          <IconSymbol name="gearshape.fill" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Métricas principales */}
        <View style={styles.metricsContainer}>
          {/* Descansos Hoy */}
          <ThemedView
            style={[
              styles.metricCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1F1F1F" : "#FFFFFF",
              },
            ]}
          >
            <ThemedText style={styles.metricLabel}>Descansos Hoy:</ThemedText>
            <ThemedText style={[styles.metricValue, { color: colors.text }]}>
              {breaksToday}
            </ThemedText>
          </ThemedView>

          {/* Racha actual */}
          <ThemedView
            style={[
              styles.metricCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1F1F1F" : "#FFFFFF",
              },
            ]}
          >
            <ThemedText style={styles.metricLabel}>Racha actual:</ThemedText>
            <View style={styles.streakContainer}>
              <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                {streakDays} días
              </ThemedText>
              <ThemedText style={{ fontSize: 20 }}>🔥</ThemedText>
            </View>
          </ThemedView>

          {/* Tiempo Total de Enfoque */}
          <ThemedView
            style={[
              styles.metricCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1F1F1F" : "#FFFFFF",
              },
            ]}
          >
            <ThemedText style={styles.metricLabel}>
              Tiempo Total de Enfoque:
            </ThemedText>
            <ThemedText style={[styles.metricValue, { color: colors.text }]}>
              {formatFocusTime(focusTime)}
            </ThemedText>
          </ThemedView>
        </View>

        {/* Actividad semanal */}
        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <ThemedText type="subtitle" style={styles.weeklyTitle}>
              Actividad semanal
            </ThemedText>
            <View style={styles.weeklyStats}>
              <ThemedText style={styles.weeklyBreaks}>
                {weeklyActivity.breaks} pausas
              </ThemedText>
              {weeklyActivity.percentageChange !== 0 && (
                <ThemedText
                  style={[
                    styles.weeklyPercentage,
                    {
                      color:
                        weeklyActivity.percentageChange > 0
                          ? "#4CAF50"
                          : "#F44336",
                    },
                  ]}
                >
                  {weeklyActivity.percentageChange > 0 ? "+" : ""}
                  {weeklyActivity.percentageChange}%
                </ThemedText>
              )}
            </View>
          </View>

          {/* Gráfico de barras */}
          <View style={styles.chartContainer}>
            {weeklyActivity.dailyData.map((value, index) => {
              const barHeight = (value / maxBarValue) * 120; // Altura máxima 120
              return (
                <View key={index} style={styles.barWrapper}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(barHeight, 4), // Mínimo 4px para visibilidad
                          backgroundColor: colors.timerDarkGreen,
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.barLabel}>
                    {dayLabels[index]}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Botón de comenzar sesión */}
        <TouchableOpacity
          style={[
            styles.startButton,
            { backgroundColor: colors.timerDarkGreen },
          ]}
          onPress={handleStartSessionPress}
        >
          <ThemedText style={styles.startButtonText}>
            Comenzar Sección de Enfoque
          </ThemedText>
        </TouchableOpacity>
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
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  metricsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  metricCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 40,
    elevation: 5,
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.1)",
  },
  metricLabel: {
    fontSize: 16,
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeklySection: {
    marginBottom: 32,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  weeklyStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weeklyBreaks: {
    fontSize: 16,
  },
  weeklyPercentage: {
    fontSize: 16,
    fontWeight: "600",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 150,
    paddingVertical: 10,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  bar: {
    width: "70%",
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
  },
  startButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    boxShadow: "0px 2px 3.84px rgba(0, 0, 0, 0.25)",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

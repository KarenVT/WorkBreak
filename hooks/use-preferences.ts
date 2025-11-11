import { preferencesDB } from "@/services/preferences-db";
import { useCallback, useEffect, useState } from "react";

export interface PreferencesState {
  notificationsEnabled: boolean;
  pomodoroEndNotification: boolean;
  breakStartNotification: boolean;
  alertSound: string;
  workInterval: number;
  shortBreak: number;
  longBreak: number;
  longBreakAfter: number;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<PreferencesState>({
    notificationsEnabled: true,
    pomodoroEndNotification: true,
    breakStartNotification: true,
    alertSound: "default",
    workInterval: 25,
    shortBreak: 5,
    longBreak: 15,
    longBreakAfter: 4,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = useCallback(async () => {
    try {
      await preferencesDB.init();
      const [
        notificationsEnabled,
        pomodoroEndNotification,
        breakStartNotification,
        alertSound,
        workInterval,
        shortBreak,
        longBreak,
        longBreakAfter,
      ] = await Promise.all([
        preferencesDB.getBooleanPreference("notifications_enabled"),
        preferencesDB.getBooleanPreference("pomodoro_end_notification"),
        preferencesDB.getBooleanPreference("break_start_notification"),
        preferencesDB.getPreference("alert_sound"),
        preferencesDB.getNumberPreference("work_interval"),
        preferencesDB.getNumberPreference("short_break"),
        preferencesDB.getNumberPreference("long_break"),
        preferencesDB.getNumberPreference("long_break_after"),
      ]);

      setPreferences({
        notificationsEnabled,
        pomodoroEndNotification,
        breakStartNotification,
        alertSound: alertSound || "default",
        workInterval: workInterval || 25,
        shortBreak: shortBreak || 5,
        longBreak: longBreak || 15,
        longBreakAfter: longBreakAfter || 4,
      });
    } catch (error) {
      console.error("Error cargando preferencias:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreference = async <K extends keyof PreferencesState>(
    key: K,
    value: PreferencesState[K]
  ) => {
    try {
      setPreferences((prev) => ({ ...prev, [key]: value }));

      const dbKeyMap: Record<keyof PreferencesState, string> = {
        notificationsEnabled: "notifications_enabled",
        pomodoroEndNotification: "pomodoro_end_notification",
        breakStartNotification: "break_start_notification",
        alertSound: "alert_sound",
        workInterval: "work_interval",
        shortBreak: "short_break",
        longBreak: "long_break",
        longBreakAfter: "long_break_after",
      };

      const dbKey = dbKeyMap[key];
      if (typeof value === "boolean") {
        await preferencesDB.setBooleanPreference(dbKey, value);
      } else if (typeof value === "number") {
        await preferencesDB.setNumberPreference(dbKey, value);
      } else {
        await preferencesDB.setPreference(dbKey, value);
      }
    } catch (error) {
      console.error("Error actualizando preferencia:", error);
      // Revertir cambio en caso de error
      loadPreferences();
    }
  };

  return {
    preferences,
    isLoading,
    updatePreference,
    reloadPreferences: loadPreferences,
  };
}

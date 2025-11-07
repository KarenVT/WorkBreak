import { useEffect, useState } from "react";
import { preferencesDB } from "@/services/preferences-db";

export interface PreferencesState {
  notificationsEnabled: boolean;
  pomodoroEndNotification: boolean;
  breakStartNotification: boolean;
  alertSound: string;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<PreferencesState>({
    notificationsEnabled: true,
    pomodoroEndNotification: true,
    breakStartNotification: true,
    alertSound: "default",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      await preferencesDB.init();
      const [notificationsEnabled, pomodoroEndNotification, breakStartNotification, alertSound] =
        await Promise.all([
          preferencesDB.getBooleanPreference("notifications_enabled"),
          preferencesDB.getBooleanPreference("pomodoro_end_notification"),
          preferencesDB.getBooleanPreference("break_start_notification"),
          preferencesDB.getPreference("alert_sound"),
        ]);

      setPreferences({
        notificationsEnabled,
        pomodoroEndNotification,
        breakStartNotification,
        alertSound: alertSound || "default",
      });
    } catch (error) {
      console.error("Error cargando preferencias:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      };

      const dbKey = dbKeyMap[key];
      if (typeof value === "boolean") {
        await preferencesDB.setBooleanPreference(dbKey, value);
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


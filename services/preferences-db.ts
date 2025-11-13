import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCE_PREFIX = "@preferences:";

export interface Preferences {
  id: number;
  key: string;
  value: string;
}

class PreferencesDatabase {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.initializeDefaultsAsyncStorage();
      this.initialized = true;
    } catch (error) {
      console.error("Error inicializando base de datos:", error);
      throw error;
    }
  }

  private async initializeDefaultsAsyncStorage(): Promise<void> {
    const defaults = [
      { key: "notifications_enabled", value: "true" },
      { key: "pomodoro_end_notification", value: "true" },
      { key: "break_start_notification", value: "true" },
      { key: "alert_sound", value: "default" },
      { key: "work_interval", value: "25" },
      { key: "short_break", value: "5" },
      { key: "long_break", value: "15" },
      { key: "long_break_after", value: "4" },
      // Preferencias de ejercicios
      { key: "exercise_stretching", value: "true" },
      { key: "exercise_resistance", value: "true" },
      { key: "exercise_joint_mobility", value: "true" },
      { key: "exercise_visual", value: "true" },
      { key: "exercise_general_movement", value: "true" },
      { key: "exercise_mode", value: "text" },
    ];

    for (const pref of defaults) {
      const existing = await AsyncStorage.getItem(
        `${PREFERENCE_PREFIX}${pref.key}`
      );
      if (!existing) {
        await AsyncStorage.setItem(
          `${PREFERENCE_PREFIX}${pref.key}`,
          pref.value
        );
      }
    }
  }

  async getPreference(key: string): Promise<string | null> {
    if (!this.initialized) {
      await this.init();
    }

    return await AsyncStorage.getItem(`${PREFERENCE_PREFIX}${key}`);
  }

  async setPreference(key: string, value: string): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    await AsyncStorage.setItem(`${PREFERENCE_PREFIX}${key}`, value);
  }

  async getAllPreferences(): Promise<Record<string, string>> {
    if (!this.initialized) {
      await this.init();
    }

    const keys = await AsyncStorage.getAllKeys();
    const preferenceKeys = keys.filter((key) =>
      key.startsWith(PREFERENCE_PREFIX)
    );
    const entries = await AsyncStorage.multiGet(preferenceKeys);

    const preferences: Record<string, string> = {};
    entries.forEach(([key, value]) => {
      if (value) {
        const prefKey = key.replace(PREFERENCE_PREFIX, "");
        preferences[prefKey] = value;
      }
    });

    return preferences;
  }

  async getBooleanPreference(key: string): Promise<boolean> {
    const value = await this.getPreference(key);
    return value === "true";
  }

  async setBooleanPreference(key: string, value: boolean): Promise<void> {
    await this.setPreference(key, value ? "true" : "false");
  }

  async getNumberPreference(key: string): Promise<number> {
    const value = await this.getPreference(key);
    return value ? parseInt(value, 10) : 0;
  }

  async setNumberPreference(key: string, value: number): Promise<void> {
    await this.setPreference(key, value.toString());
  }
}

export const preferencesDB = new PreferencesDatabase();

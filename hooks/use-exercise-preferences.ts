import { ExerciseMode } from "@/components/preferences/preference-mode-selector";
import { exercisesDB } from "@/services/exercises-db";
import { preferencesDB } from "@/services/preferences-db";
import { useCallback, useEffect, useState } from "react";

export interface ExerciseType {
  id: string;
  key: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export interface ExercisePreferencesState {
  exercises: ExerciseType[];
}

const EXERCISE_TYPES: Omit<ExerciseType, "enabled">[] = [
  {
    id: "stretching",
    key: "exercise_stretching",
    name: "Estiramiento",
    icon: "figure.stretch",
  },
  {
    id: "resistance",
    key: "exercise_resistance",
    name: "Resistencia y Movilización",
    icon: "dumbbell.fill",
  },
  {
    id: "joint_mobility",
    key: "exercise_joint_mobility",
    name: "Movilidad Articular",
    icon: "figure.mobility",
  },
  {
    id: "visual",
    key: "exercise_visual",
    name: "Ejercicios Visuales",
    icon: "eye.fill",
  },
  {
    id: "general_movement",
    key: "exercise_general_movement",
    name: "Movimiento General",
    icon: "figure.walk",
  },
];

export function useExercisePreferences() {
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [mode, setMode] = useState<ExerciseMode>("text");
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  const loadExercisePreferences = useCallback(async () => {
    try {
      await preferencesDB.init();
      const exercisePreferences = await Promise.all(
        EXERCISE_TYPES.map(async (exercise) => {
          const enabled = await preferencesDB.getBooleanPreference(
            exercise.key
          );
          return {
            ...exercise,
            enabled,
          };
        })
      );

      const savedMode = await preferencesDB.getPreference("exercise_mode");
      const exerciseMode: ExerciseMode =
        savedMode === "video" || savedMode === "text" ? savedMode : "text";

      setExercises(exercisePreferences);
      setMode(exerciseMode);
      setHasChanges(false);
    } catch (error) {
      console.error("Error cargando preferencias de ejercicios:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercisePreferences();
  }, [loadExercisePreferences]);

  const toggleExercise = (id: string, enabled: boolean) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === id ? { ...exercise, enabled } : exercise
      )
    );
    setHasChanges(true);
  };

  const setExerciseMode = (newMode: ExerciseMode) => {
    setMode(newMode);
    setHasChanges(true);
  };

  const saveExercisePreferences = async () => {
    try {
      // Guardar preferencias en AsyncStorage
      await Promise.all(
        exercises.map((exercise) =>
          preferencesDB.setBooleanPreference(exercise.key, exercise.enabled)
        )
      );

      // Guardar modo de ejercicio
      await preferencesDB.setPreference("exercise_mode", mode);

      // Sincronizar estado de ejercicios en SQLite
      await exercisesDB.init();
      await Promise.all(
        exercises.map((exercise) =>
          exercisesDB.updateExerciseTypeEnabled(exercise.id, exercise.enabled)
        )
      );

      setHasChanges(false);
      return true;
    } catch (error) {
      console.error("Error guardando preferencias de ejercicios:", error);
      return false;
    }
  };

  return {
    exercises,
    mode,
    isLoading,
    hasChanges,
    toggleExercise,
    setExerciseMode,
    saveExercisePreferences,
    reloadExercisePreferences: loadExercisePreferences,
  };
}

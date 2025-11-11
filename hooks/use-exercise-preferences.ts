import { preferencesDB } from "@/services/preferences-db";
import { useEffect, useState } from "react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadExercisePreferences();
  }, []);

  const loadExercisePreferences = async () => {
    try {
      await preferencesDB.init();
      const exercisePreferences = await Promise.all(
        EXERCISE_TYPES.map(async (exercise) => {
          const enabled = await preferencesDB.getBooleanPreference(exercise.key);
          return {
            ...exercise,
            enabled,
          };
        })
      );

      setExercises(exercisePreferences);
      setHasChanges(false);
    } catch (error) {
      console.error("Error cargando preferencias de ejercicios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExercise = (id: string, enabled: boolean) => {
    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.id === id ? { ...exercise, enabled } : exercise
      )
    );
    setHasChanges(true);
  };

  const saveExercisePreferences = async () => {
    try {
      await Promise.all(
        exercises.map((exercise) =>
          preferencesDB.setBooleanPreference(exercise.key, exercise.enabled)
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
    isLoading,
    hasChanges,
    toggleExercise,
    saveExercisePreferences,
    reloadExercisePreferences: loadExercisePreferences,
  };
}


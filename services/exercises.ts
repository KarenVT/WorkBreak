import { exercisesDB } from "./exercises-db";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: string;
  duration: number; // en segundos
}

/**
 * Obtiene ejercicios aleatorios basados en los tipos habilitados
 * Usa la base de datos SQLite para obtener los ejercicios
 */
export async function getRandomExercises(
  enabledTypes: string[],
  count: number = 1
): Promise<Exercise[]> {
  try {
    await exercisesDB.init();
    const exercises = await exercisesDB.getRandomExercises(enabledTypes, count);

    if (exercises.length === 0) {
      // Si no hay ejercicios habilitados, usar uno por defecto
      return [
        {
          id: "default",
          name: "Estiramiento de Cuello",
          description:
            "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
          type: "stretching",
          duration: 30,
        },
      ];
    }

    return exercises;
  } catch (error) {
    console.error("Error obteniendo ejercicios aleatorios:", error);
    // Retornar ejercicio por defecto en caso de error
    return [
      {
        id: "default",
        name: "Estiramiento de Cuello",
        description:
          "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
        type: "stretching",
        duration: 30,
      },
    ];
  }
}

/**
 * Obtiene un ejercicio aleatorio basado en los tipos habilitados
 * Usa la base de datos SQLite para obtener el ejercicio
 */
export async function getRandomExercise(
  enabledTypes: string[]
): Promise<Exercise> {
  try {
    await exercisesDB.init();
    const exercise = await exercisesDB.getRandomExercise(enabledTypes);

    if (!exercise) {
      // Si no hay ejercicios habilitados, usar uno por defecto
      return {
        id: "default",
        name: "Estiramiento de Cuello",
        description:
          "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
        type: "stretching",
        duration: 30,
      };
    }

    return exercise;
  } catch (error) {
    console.error("Error obteniendo ejercicio aleatorio:", error);
    // Retornar ejercicio por defecto en caso de error
    return {
      id: "default",
      name: "Estiramiento de Cuello",
      description:
        "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
      type: "stretching",
      duration: 30,
    };
  }
}

/**
 * Obtiene todos los ejercicios de un tipo específico
 */
export async function getExercisesByType(type: string): Promise<Exercise[]> {
  try {
    await exercisesDB.init();
    return await exercisesDB.getExercisesByType(type);
  } catch (error) {
    console.error("Error obteniendo ejercicios por tipo:", error);
    return [];
  }
}

/**
 * Obtiene todos los ejercicios habilitados de los tipos especificados
 */
export async function getEnabledExercisesByTypes(
  types: string[]
): Promise<Exercise[]> {
  try {
    await exercisesDB.init();
    return await exercisesDB.getEnabledExercisesByTypes(types);
  } catch (error) {
    console.error("Error obteniendo ejercicios habilitados:", error);
    return [];
  }
}

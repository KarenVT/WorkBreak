import { useExercisePreferences } from "@/hooks/use-exercise-preferences";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  type: string;
  duration: number; // en segundos
}

// Base de datos de ejercicios por tipo
const EXERCISES_BY_TYPE: Record<string, Omit<Exercise, "type">[]> = {
  stretching: [
    {
      id: "neck_stretch",
      name: "Estiramiento de Cuello",
      description: "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
      duration: 30,
    },
    {
      id: "shoulder_stretch",
      name: "Estiramiento de Hombros",
      description: "Lleva un brazo por encima del pecho y tira suavemente con el otro brazo.",
      duration: 30,
    },
    {
      id: "back_stretch",
      name: "Estiramiento de Espalda",
      description: "Inclínate hacia adelante y deja que tu espalda se relaje completamente.",
      duration: 30,
    },
    {
      id: "wrist_stretch",
      name: "Estiramiento de Muñecas",
      description: "Estira el brazo y tira suavemente de los dedos hacia atrás.",
      duration: 20,
    },
  ],
  resistance: [
    {
      id: "wall_push",
      name: "Empuje de Pared",
      description: "Apoya las manos en la pared y realiza flexiones manteniendo el cuerpo recto.",
      duration: 30,
    },
    {
      id: "chair_squats",
      name: "Sentadillas en Silla",
      description: "Levántate y siéntate de la silla de forma controlada varias veces.",
      duration: 45,
    },
    {
      id: "calf_raises",
      name: "Elevaciones de Talón",
      description: "Ponte de puntillas y baja lentamente, repite el movimiento.",
      duration: 30,
    },
  ],
  joint_mobility: [
    {
      id: "neck_rotation",
      name: "Rotación de Cuello",
      description: "Rota la cabeza en círculos lentos, primero hacia un lado y luego al otro.",
      duration: 30,
    },
    {
      id: "shoulder_rolls",
      name: "Rotaciones de Hombros",
      description: "Rota los hombros hacia adelante y hacia atrás en círculos amplios.",
      duration: 30,
    },
    {
      id: "ankle_rotation",
      name: "Rotación de Tobillos",
      description: "Rota los tobillos en círculos, primero en un sentido y luego en el otro.",
      duration: 20,
    },
  ],
  visual: [
    {
      id: "eye_palming",
      name: "Palming",
      description: "Cubre tus ojos con las palmas de las manos y relájate durante unos segundos.",
      duration: 20,
    },
    {
      id: "eye_focus",
      name: "Cambio de Foco",
      description: "Mira un objeto cercano y luego uno lejano, alternando el enfoque.",
      duration: 30,
    },
    {
      id: "eye_rotation",
      name: "Rotación de Ojos",
      description: "Rota los ojos en círculos lentos, primero en un sentido y luego en el otro.",
      duration: 20,
    },
  ],
  general_movement: [
    {
      id: "walk_around",
      name: "Caminar",
      description: "Camina alrededor de tu espacio durante unos minutos.",
      duration: 60,
    },
    {
      id: "march_place",
      name: "Marcha en el Lugar",
      description: "Marcha en el lugar levantando las rodillas alternativamente.",
      duration: 30,
    },
    {
      id: "side_steps",
      name: "Pasos Laterales",
      description: "Da pasos laterales hacia un lado y luego hacia el otro.",
      duration: 30,
    },
  ],
};

/**
 * Obtiene ejercicios aleatorios basados en los tipos habilitados
 */
export function getRandomExercises(
  enabledTypes: string[],
  count: number = 1
): Exercise[] {
  const availableExercises: Exercise[] = [];

  // Recopilar todos los ejercicios de los tipos habilitados
  enabledTypes.forEach((type) => {
    const exercises = EXERCISES_BY_TYPE[type] || [];
    exercises.forEach((exercise) => {
      availableExercises.push({
        ...exercise,
        type,
      });
    });
  });

  if (availableExercises.length === 0) {
    // Si no hay ejercicios habilitados, usar uno por defecto
    return [
      {
        id: "default",
        name: "Estiramiento de Cuello",
        description: "Gira lentamente la cabeza de lado a lado, manteniendo la postura.",
        type: "stretching",
        duration: 30,
      },
    ];
  }

  // Mezclar y seleccionar ejercicios aleatorios
  const shuffled = [...availableExercises].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Obtiene un ejercicio aleatorio basado en los tipos habilitados
 */
export function getRandomExercise(enabledTypes: string[]): Exercise {
  const exercises = getRandomExercises(enabledTypes, 1);
  return exercises[0];
}


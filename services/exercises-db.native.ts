import * as SQLite from "expo-sqlite";
import { Exercise } from "./exercises";

interface ExerciseDB extends Exercise {
  enabled: boolean;
}

class ExercisesDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized && this.db) return;

    try {
      this.db = await SQLite.openDatabaseAsync("exercises.db");
      await this.createTables();
      await this.initializeDefaultExercises();
      this.initialized = true;
    } catch (error) {
      console.error("Error inicializando base de datos de ejercicios:", error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1
      );
      
      CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
      CREATE INDEX IF NOT EXISTS idx_exercises_enabled ON exercises(enabled);
    `);
  }

  private async initializeDefaultExercises(): Promise<void> {
    if (!this.db) throw new Error("Base de datos no inicializada");

    // Verificar si ya hay ejercicios en la base de datos
    const result = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM exercises"
    );

    if (result && result.count > 0) {
      // Ya hay ejercicios, no inicializar de nuevo
      return;
    }

    const defaultExercises = this.getDefaultExercises();

    // Insertar ejercicios por defecto
    for (const exercise of defaultExercises) {
      await this.db.runAsync(
        `INSERT OR IGNORE INTO exercises (id, name, description, type, duration, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          exercise.id,
          exercise.name,
          exercise.description,
          exercise.type,
          exercise.duration,
          1,
        ]
      );
    }
  }

  private getDefaultExercises(): Omit<Exercise, "enabled">[] {
    return [
      // Movimiento General
      {
        id: "marcha_dinamica",
        name: "Marcha dinámica",
        description: "Eleva rodillas y mueve brazos cruzados durante 1–2 min.",
        type: "general_movement",
        duration: 90,
      },
      {
        id: "balanceo_lateral",
        name: "Balanceo lateral",
        description: "Transfiere peso de un pie a otro suavemente.",
        type: "general_movement",
        duration: 60,
      },
      {
        id: "deslizamiento_punta_talon",
        name: "Deslizamiento punta-talón",
        description:
          "Alterna apoyo del talón y la punta para activar tobillos.",
        type: "general_movement",
        duration: 60,
      },
      {
        id: "giro_tronco",
        name: "Giro de tronco",
        description: "Rota el torso a ambos lados sin mover las caderas.",
        type: "general_movement",
        duration: 60,
      },
      {
        id: "flujo_corporal_3d",
        name: "Flujo corporal 3D",
        description:
          "Combina brazos y piernas en diagonales fluidas durante 2 min.",
        type: "general_movement",
        duration: 120,
      },
      // Ejercicios Visuales
      {
        id: "enfoque_alternado",
        name: "Enfoque alternado",
        description:
          "Mira tu dedo cercano y luego un objeto lejano varias veces.",
        type: "visual",
        duration: 60,
      },
      {
        id: "ocho_horizontal",
        name: "Ocho horizontal",
        description: 'Dibuja un "∞" con la vista sin mover la cabeza.',
        type: "visual",
        duration: 60,
      },
      {
        id: "barrido_visual",
        name: "Barrido visual",
        description: "Desplaza los ojos lentamente arriba-abajo y lado a lado.",
        type: "visual",
        duration: 60,
      },
      {
        id: "palmeo_relajante",
        name: "Palmeo relajante",
        description: "Cubre los ojos con las manos y respira profundo.",
        type: "visual",
        duration: 60,
      },
      {
        id: "cambio_distancia",
        name: "Cambio de distancia",
        description: "Enfoca rápido objetos a distintas distancias.",
        type: "visual",
        duration: 60,
      },
      // Movilidad Articular
      {
        id: "circulos_cuello",
        name: "Círculos de cuello",
        description: "Gira la cabeza suavemente en ambas direcciones.",
        type: "joint_mobility",
        duration: 60,
      },
      {
        id: "rotacion_hombros",
        name: "Rotación de hombros",
        description: "Haz círculos amplios hacia adelante y atrás.",
        type: "joint_mobility",
        duration: 60,
      },
      {
        id: "circulos_cadera",
        name: "Círculos de cadera",
        description: "Mueve la pelvis en círculos controlados.",
        type: "joint_mobility",
        duration: 60,
      },
      {
        id: "flexoextension_rodillas",
        name: "Flexoextensión de rodillas",
        description: "Dobla y estira suavemente las rodillas.",
        type: "joint_mobility",
        duration: 60,
      },
      {
        id: "cat_cow",
        name: "Cat-Cow",
        description: "Alterna arqueo y redondeo de espalda en cuadrupedia.",
        type: "joint_mobility",
        duration: 60,
      },
      // Resistencia y Movilización
      {
        id: "sentadilla_isometrica",
        name: "Sentadilla isométrica",
        description: "Baja y mantén 2 s en la posición más baja.",
        type: "resistance",
        duration: 30,
      },
      {
        id: "plancha_toque_hombro",
        name: "Plancha con toque de hombro",
        description: "Toca alternadamente cada hombro sin mover el tronco.",
        type: "resistance",
        duration: 60,
      },
      {
        id: "puente_gluteos",
        name: "Puente de glúteos",
        description: "Eleva la pelvis contrayendo glúteos.",
        type: "resistance",
        duration: 60,
      },
      {
        id: "flexion_inclinada",
        name: "Flexión inclinada",
        description: "Apoya manos en mesa o pared y realiza flexiones.",
        type: "resistance",
        duration: 60,
      },
      {
        id: "superman_dinamico",
        name: "Superman dinámico",
        description: "Eleva brazo y pierna opuestos alternadamente boca abajo.",
        type: "resistance",
        duration: 60,
      },
      // Estiramiento
      {
        id: "isquiotibiales",
        name: "Estiramiento de isquiotibiales",
        description:
          "Inclina el tronco hacia adelante con una pierna extendida.",
        type: "stretching",
        duration: 60,
      },
      {
        id: "apertura_pecho",
        name: "Apertura de pecho",
        description:
          "Apoya una mano en pared y gira el cuerpo en sentido contrario.",
        type: "stretching",
        duration: 60,
      },
      {
        id: "estiramiento_gluteos",
        name: "Estiramiento de glúteos",
        description:
          "Cruza una pierna sobre la otra y lleva las rodillas al pecho.",
        type: "stretching",
        duration: 60,
      },
      {
        id: "lateral_tronco",
        name: "Estiramiento lateral de tronco",
        description:
          "Eleva un brazo y flexiona el cuerpo hacia el lado opuesto.",
        type: "stretching",
        duration: 60,
      },
      {
        id: "postura_nino",
        name: "Postura del niño",
        description: "Siéntate sobre talones y estira brazos al frente.",
        type: "stretching",
        duration: 60,
      },
    ];
  }

  async getAllExercises(): Promise<Exercise[]> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.getAllAsync<Exercise>(
      "SELECT id, name, description, type, duration FROM exercises ORDER BY type, name"
    );
    return result;
  }

  async getExercisesByType(type: string): Promise<Exercise[]> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.getAllAsync<Exercise>(
      "SELECT id, name, description, type, duration FROM exercises WHERE type = ? AND enabled = 1 ORDER BY name",
      [type]
    );
    return result;
  }

  async getEnabledExercisesByTypes(types: string[]): Promise<Exercise[]> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    if (types.length === 0) {
      return [];
    }

    const placeholders = types.map(() => "?").join(",");
    const result = await this.db.getAllAsync<Exercise>(
      `SELECT id, name, description, type, duration FROM exercises 
       WHERE type IN (${placeholders}) AND enabled = 1 
       ORDER BY type, name`,
      types
    );
    return result;
  }

  async getRandomExercise(types: string[]): Promise<Exercise | null> {
    const exercises = await this.getEnabledExercisesByTypes(types);
    if (exercises.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * exercises.length);
    return exercises[randomIndex];
  }

  async getRandomExercises(
    types: string[],
    count: number = 1
  ): Promise<Exercise[]> {
    const exercises = await this.getEnabledExercisesByTypes(types);
    if (exercises.length === 0) {
      return [];
    }

    // Mezclar ejercicios
    const shuffled = [...exercises].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  async updateExerciseEnabled(id: string, enabled: boolean): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    await this.db.runAsync("UPDATE exercises SET enabled = ? WHERE id = ?", [
      enabled ? 1 : 0,
      id,
    ]);
  }

  async updateExerciseTypeEnabled(
    type: string,
    enabled: boolean
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    await this.db.runAsync("UPDATE exercises SET enabled = ? WHERE type = ?", [
      enabled ? 1 : 0,
      type,
    ]);
  }

  async getExerciseById(id: string): Promise<Exercise | null> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) throw new Error("Base de datos no inicializada");

    const result = await this.db.getFirstAsync<Exercise>(
      "SELECT id, name, description, type, duration FROM exercises WHERE id = ?",
      [id]
    );
    return result || null;
  }
}

export const exercisesDB = new ExercisesDatabase();


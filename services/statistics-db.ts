import AsyncStorage from "@react-native-async-storage/async-storage";

const STATISTICS_STORAGE_KEY = "@statistics:sessions";
const STATISTICS_INITIALIZED_KEY = "@statistics:initialized";

export interface SessionRecord {
  id: string;
  type: "work" | "shortBreak" | "longBreak";
  duration: number; // en segundos
  completedAt: string; // ISO date string
  date: string; // YYYY-MM-DD para agrupación fácil
}

class StatisticsDatabase {
  private initialized = false;
  private sessionsCache: SessionRecord[] | null = null;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const initialized = await AsyncStorage.getItem(STATISTICS_INITIALIZED_KEY);
      if (initialized !== "true") {
        await AsyncStorage.setItem(STATISTICS_INITIALIZED_KEY, "true");
      }
      this.initialized = true;
    } catch (error) {
      console.error("Error inicializando base de datos de estadísticas:", error);
      throw error;
    }
  }

  private async loadSessions(): Promise<SessionRecord[]> {
    if (this.sessionsCache) {
      return this.sessionsCache;
    }

    try {
      if (!this.initialized) {
        await this.init();
      }
      const data = await AsyncStorage.getItem(STATISTICS_STORAGE_KEY);
      if (data) {
        this.sessionsCache = JSON.parse(data);
        return this.sessionsCache || [];
      }
    } catch (error) {
      console.error("Error cargando sesiones:", error);
    }
    return [];
  }

  private async saveSessions(sessions: SessionRecord[]): Promise<void> {
    try {
      this.sessionsCache = sessions;
      await AsyncStorage.setItem(STATISTICS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error guardando sesiones:", error);
      throw error;
    }
  }

  async addSession(
    type: "work" | "shortBreak" | "longBreak",
    duration: number
  ): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }

    const sessions = await this.loadSessions();
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const newSession: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      duration,
      completedAt: now.toISOString(),
      date: dateStr,
    };

    sessions.push(newSession);
    await this.saveSessions(sessions);
  }

  async getBreaksToday(): Promise<number> {
    const sessions = await this.loadSessions();
    const today = new Date().toISOString().split("T")[0];
    return sessions.filter(
      (s) => s.date === today && (s.type === "shortBreak" || s.type === "longBreak")
    ).length;
  }

  async getTotalFocusTime(): Promise<number> {
    // Retorna el tiempo total en minutos
    const sessions = await this.loadSessions();
    const workSessions = sessions.filter((s) => s.type === "work");
    const totalSeconds = workSessions.reduce((sum, s) => sum + s.duration, 0);
    return Math.floor(totalSeconds / 60);
  }

  async getCurrentStreak(): Promise<number> {
    // Retorna la racha actual en días
    const sessions = await this.loadSessions();
    if (sessions.length === 0) return 0;

    // Agrupar sesiones por fecha
    const sessionsByDate = new Map<string, SessionRecord[]>();
    sessions.forEach((session) => {
      const dateSessions = sessionsByDate.get(session.date) || [];
      dateSessions.push(session);
      sessionsByDate.set(session.date, dateSessions);
    });

    // Obtener fechas únicas ordenadas
    const dates = Array.from(sessionsByDate.keys()).sort().reverse();

    if (dates.length === 0) return 0;

    // Verificar si hoy tiene actividad
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let streak = 0;
    let currentDate = new Date(today);

    // Si hoy tiene actividad, empezar desde hoy
    // Si no, empezar desde ayer
    if (!dates.includes(today)) {
      currentDate = new Date(yesterdayStr);
    }

    // Contar días consecutivos con actividad
    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split("T")[0];

      if (dates.includes(checkDateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  async getWeeklyActivity(): Promise<{
    breaks: number;
    percentageChange: number;
    dailyData: number[];
  }> {
    const sessions = await this.loadSessions();
    const today = new Date();
    
    // Obtener el inicio de la semana (lunes)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea día 1
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener el inicio de la semana pasada
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Filtrar sesiones de esta semana
    const thisWeekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= startOfWeek;
    });

    // Filtrar sesiones de la semana pasada
    const lastWeekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= startOfLastWeek && sessionDate < startOfWeek;
    });

    // Contar descansos de esta semana
    const thisWeekBreaks = thisWeekSessions.filter(
      (s) => s.type === "shortBreak" || s.type === "longBreak"
    ).length;

    // Contar descansos de la semana pasada
    const lastWeekBreaks = lastWeekSessions.filter(
      (s) => s.type === "shortBreak" || s.type === "longBreak"
    ).length;

    // Calcular porcentaje de cambio
    let percentageChange = 0;
    if (lastWeekBreaks > 0) {
      percentageChange = Math.round(
        ((thisWeekBreaks - lastWeekBreaks) / lastWeekBreaks) * 100
      );
    } else if (thisWeekBreaks > 0) {
      percentageChange = 100;
    }

    // Crear array de datos diarios (Lunes a Domingo)
    const dailyData: number[] = [0, 0, 0, 0, 0, 0, 0];
    
    thisWeekSessions.forEach((session) => {
      const sessionDate = new Date(session.completedAt);
      const dayOfWeek = sessionDate.getDay();
      // Convertir domingo (0) a 6, y ajustar otros días
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      if (session.type === "shortBreak" || session.type === "longBreak") {
        dailyData[index]++;
      }
    });

    return {
      breaks: thisWeekBreaks,
      percentageChange,
      dailyData,
    };
  }

  async getAllSessions(): Promise<SessionRecord[]> {
    if (!this.initialized) {
      await this.init();
    }
    return await this.loadSessions();
  }

  async clearAllStatistics(): Promise<void> {
    this.sessionsCache = null;
    await AsyncStorage.removeItem(STATISTICS_STORAGE_KEY);
    await AsyncStorage.removeItem(STATISTICS_INITIALIZED_KEY);
    this.initialized = false;
  }
}

export const statisticsDB = new StatisticsDatabase();


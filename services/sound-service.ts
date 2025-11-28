import { Platform } from "react-native";

/**
 * Servicio de sonido usando react-native-sound
 * 
 * Este servicio permite reproducir sonidos de notificación personalizados
 * cuando la aplicación está en primer plano o cuando se necesita reproducir
 * un sonido de forma programática.
 * 
 * IMPORTANTE: react-native-sound requiere builds personalizados de Expo
 * (no funciona con Expo Go). Los archivos de sonido deben estar en:
 * - Android: android/app/src/main/res/raw/
 * - iOS: Agregados al bundle de la aplicación en Xcode
 */

// Importación condicional de react-native-sound (solo en plataformas nativas)
let Sound: any = null;
if (Platform.OS !== "web") {
  try {
    Sound = require("react-native-sound").default;
    // Habilitar la reproducción en modo silencioso (iOS)
    Sound.setCategory("Playback", true);
  } catch (error) {
    console.warn("react-native-sound no está disponible:", error);
  }
}

// Mapeo de sonidos disponibles
const SOUND_MAP: Record<string, string> = {
  bell: "bell",
  chime: "chime",
  alert: "alert",
  notification: "notification",
  ringtone: "ringtone",
};

// Cache de instancias de sonido para evitar recrearlas constantemente
const soundCache: Map<string, any> = new Map();

/**
 * Carga un sonido desde el bundle de la aplicación
 * @param soundName - Nombre del sonido (sin extensión)
 * @returns Promise<Sound> - Instancia del sonido cargado
 */
function loadSound(soundName: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Si estamos en web o Sound no está disponible, rechazar
    if (Platform.OS === "web" || !Sound) {
      reject(new Error("react-native-sound no está disponible en esta plataforma"));
      return;
    }

    // Verificar si ya está en cache
    if (soundCache.has(soundName)) {
      const cachedSound = soundCache.get(soundName)!;
      // Verificar si el sonido está cargado correctamente
      if (cachedSound && cachedSound.isLoaded()) {
        resolve(cachedSound);
        return;
      } else {
        // Si está en cache pero no está cargado, removerlo
        soundCache.delete(soundName);
      }
    }

    // Determinar la ruta del sonido según la plataforma
    // En Android, los sonidos están en res/raw/ (sin extensión)
    // En iOS, deben estar en el bundle principal
    const soundPath = Platform.OS === "android" 
      ? soundName // Android busca en res/raw/ por nombre sin extensión
      : `${soundName}.wav`; // iOS puede necesitar la extensión

    // Crear nueva instancia de sonido
    const sound = new Sound(
      soundPath,
      Sound.MAIN_BUNDLE,
      (error: any) => {
        if (error) {
          console.error(`Error cargando sonido ${soundName}:`, error);
          reject(error);
          return;
        }

        console.log(`✅ Sonido ${soundName} cargado correctamente`);
        console.log(`   Duración: ${sound.getDuration()} segundos`);
        console.log(`   Canales: ${sound.getNumberOfChannels()}`);

        // Guardar en cache
        soundCache.set(soundName, sound);
        resolve(sound);
      }
    );
  });
}

/**
 * Reproduce un sonido de notificación
 * @param soundId - ID del sonido a reproducir ("bell", "chime", "alert", "notification", "ringtone", o "default")
 * @param volume - Volumen de reproducción (0.0 a 1.0, por defecto 1.0)
 * @returns Promise<boolean> - true si se reprodujo exitosamente, false en caso contrario
 */
export async function playNotificationSound(
  soundId: string = "default",
  volume: number = 1.0
): Promise<boolean> {
  // Si estamos en web, no hacer nada (las notificaciones web manejan su propio sonido)
  if (Platform.OS === "web") {
    return false;
  }

  // Si Sound no está disponible, no hacer nada
  if (!Sound) {
    console.warn("react-native-sound no está disponible");
    return false;
  }

  // Si es "default", no reproducir nada (el sistema manejará el sonido)
  if (soundId === "default") {
    console.log("Usando sonido predeterminado del sistema");
    return false;
  }

  // Verificar que el sonido existe en el mapeo
  const soundName = SOUND_MAP[soundId];
  if (!soundName) {
    console.warn(`Sonido no encontrado: ${soundId}`);
    return false;
  }

  try {
    // Cargar el sonido (usará cache si está disponible)
    const sound = await loadSound(soundName);

    // Configurar volumen
    sound.setVolume(volume);

    // Reproducir el sonido
    return new Promise((resolve) => {
      sound.play((success: boolean) => {
        if (success) {
          console.log(`✅ Sonido ${soundId} reproducido exitosamente`);
          resolve(true);
        } else {
          console.error(`❌ Error reproduciendo sonido ${soundId}`);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error(`Error en playNotificationSound para ${soundId}:`, error);
    return false;
  }
}

/**
 * Detiene la reproducción de un sonido específico
 * @param soundId - ID del sonido a detener
 */
export function stopSound(soundId: string): void {
  if (Platform.OS === "web" || !Sound) {
    return;
  }

  const soundName = SOUND_MAP[soundId];
  if (!soundName) {
    return;
  }

  const sound = soundCache.get(soundName);
  if (sound && sound.isPlaying()) {
    sound.stop();
    console.log(`Sonido ${soundId} detenido`);
  }
}

/**
 * Detiene todos los sonidos que están reproduciéndose
 */
export function stopAllSounds(): void {
  if (Platform.OS === "web" || !Sound) {
    return;
  }

  soundCache.forEach((sound, soundName) => {
    if (sound.isPlaying()) {
      sound.stop();
      console.log(`Sonido ${soundName} detenido`);
    }
  });
}

/**
 * Libera los recursos de un sonido específico
 * @param soundId - ID del sonido a liberar
 */
export function releaseSound(soundId: string): void {
  if (Platform.OS === "web" || !Sound) {
    return;
  }

  const soundName = SOUND_MAP[soundId];
  if (!soundName) {
    return;
  }

  const sound = soundCache.get(soundName);
  if (sound) {
    if (sound.isPlaying()) {
      sound.stop();
    }
    sound.release();
    soundCache.delete(soundName);
    console.log(`Recursos del sonido ${soundId} liberados`);
  }
}

/**
 * Libera todos los recursos de sonido
 */
export function releaseAllSounds(): void {
  if (Platform.OS === "web" || !Sound) {
    return;
  }

  soundCache.forEach((sound) => {
    if (sound.isPlaying()) {
      sound.stop();
    }
    sound.release();
  });
  soundCache.clear();
  console.log("Todos los recursos de sonido liberados");
}

/**
 * Pre-carga todos los sonidos disponibles para mejorar el rendimiento
 */
export async function preloadAllSounds(): Promise<void> {
  if (Platform.OS === "web" || !Sound) {
    console.log("Pre-carga de sonidos no disponible en esta plataforma");
    return;
  }

  console.log("Pre-cargando todos los sonidos...");
  const loadPromises = Object.keys(SOUND_MAP).map((soundId) =>
    loadSound(SOUND_MAP[soundId]).catch((error) => {
      console.warn(`No se pudo pre-cargar sonido ${soundId}:`, error);
    })
  );

  await Promise.all(loadPromises);
  console.log("✅ Pre-carga de sonidos completada");
}


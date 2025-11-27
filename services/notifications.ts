import { Platform } from "react-native";

/**
 * NOTA IMPORTANTE SOBRE EXPO GO Y SDK 53:
 *
 * En Expo SDK 53, las notificaciones push remotas fueron removidas de Expo Go.
 * Sin embargo, las NOTIFICACIONES LOCALES (local notifications) siguen funcionando
 * perfectamente en Expo Go.
 *
 * Usamos importación dinámica para evitar que el auto-registro de push tokens
 * se ejecute inmediatamente al importar el módulo, lo que causa el warning.
 * Las notificaciones locales funcionarán correctamente.
 *
 * NOTIFICACIONES WEB:
 * En web, usamos la Web Notifications API del navegador, que es diferente
 * a expo-notifications pero proporciona la misma funcionalidad.
 */

// ==================== DETECCIÓN DE PLATAFORMA ====================
const isWeb = Platform.OS === "web";

// ==================== IMPLEMENTACIÓN MÓVIL (expo-notifications) ====================
// Variable para cachear el módulo de notificaciones después de la primera carga
let NotificationsModule: typeof import("expo-notifications") | null = null;
let notificationHandlerConfigured = false;

/**
 * Obtiene el módulo de notificaciones de forma lazy (solo cuando se necesita)
 * Esto evita que el auto-registro de push tokens se ejecute al importar el archivo
 */
async function getNotificationsModule(): Promise<
  typeof import("expo-notifications")
> {
  if (!NotificationsModule) {
    NotificationsModule = await import("expo-notifications");

    // Configurar el handler ANTES de cualquier otra operación
    // Esto es CRÍTICO: Expo requiere que el handler esté configurado
    if (!notificationHandlerConfigured) {
      try {
        NotificationsModule.setNotificationHandler({
          handleNotification: async () => {
            console.log("Handler de notificaciones ejecutado");
            return {
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            };
          },
        });
        notificationHandlerConfigured = true;
        console.log("Handler de notificaciones configurado correctamente");
      } catch (error) {
        console.error("Error configurando handler de notificaciones:", error);
      }
    }
  }
  return NotificationsModule;
}

export interface NotificationPreferences {
  notificationsEnabled: boolean;
  pomodoroEndNotification: boolean;
  breakStartNotification: boolean;
  alertSound?: string;
}

// ==================== IMPLEMENTACIÓN WEB (Web Notifications API) ====================

/**
 * Verifica si las notificaciones web están disponibles en el navegador
 */
function isWebNotificationSupported(): boolean {
  if (!isWeb) return false;
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Solicita permisos de notificaciones web
 */
async function requestWebNotificationPermissions(): Promise<boolean> {
  if (!isWebNotificationSupported()) {
    console.warn(
      "Las notificaciones web no están disponibles en este navegador"
    );
    return false;
  }

  try {
    let permission = Notification.permission;

    if (permission === "default") {
      console.log("Solicitando permisos de notificaciones web...");
      permission = await Notification.requestPermission();
      console.log("Resultado de solicitud de permisos web:", permission);
    }

    if (permission !== "granted") {
      console.warn(
        "Permisos de notificaciones web NO concedidos. Estado:",
        permission
      );
      return false;
    }

    console.log("Permisos de notificaciones web concedidos ✓");
    return true;
  } catch (error) {
    console.error("Error solicitando permisos de notificaciones web:", error);
    return false;
  }
}

/**
 * Opciones extendidas para notificaciones web
 */
interface WebNotificationOptions extends NotificationOptions {
  sound?: boolean;
  data?: Record<string, any>;
}

/**
 * Envía una notificación web
 */
async function sendWebNotification(
  title: string,
  body: string,
  options?: WebNotificationOptions
): Promise<void> {
  if (!isWebNotificationSupported()) {
    console.warn("Las notificaciones web no están disponibles");
    return;
  }

  try {
    const permission = await requestWebNotificationPermissions();
    if (!permission) {
      return;
    }

    const { sound = true, data, ...notificationOptions } = options || {};

    const notification = new Notification(title, {
      body,
      icon: "/favicon.png", // Usar el favicon como icono
      badge: "/favicon.png",
      tag: "workbreak-notification", // Tag para agrupar notificaciones similares
      requireInteraction: false,
      silent: false,
      ...notificationOptions,
    });

    // Agregar datos personalizados si se proporcionan
    if (data) {
      (notification as any).data = data;
    }

    // Reproducir sonido (si está habilitado)
    if (sound) {
      // Crear y reproducir un sonido de notificación simple usando Web Audio API
      try {
        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (audioError) {
        console.log(
          "No se pudo reproducir sonido de notificación:",
          audioError
        );
      }
    }

    // Cerrar la notificación después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);

    console.log("Notificación web enviada:", title);
  } catch (error) {
    console.error("Error enviando notificación web:", error);
  }
}

// ==================== IMPLEMENTACIÓN MÓVIL ====================

/**
 * Solicita permisos de notificaciones móviles
 */
async function requestMobileNotificationPermissions(): Promise<boolean> {
  try {
    // Primero cargar el módulo y configurar el handler
    const Notifications = await getNotificationsModule();

    // Verificar permisos existentes
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("Estado de permisos actual:", existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("Solicitando permisos de notificaciones...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("Resultado de solicitud de permisos:", status);
    }

    if (finalStatus !== "granted") {
      console.warn(
        "Permisos de notificaciones NO concedidos. Estado:",
        finalStatus
      );
      return false;
    }

    console.log("Permisos de notificaciones concedidos ✓");

    // En Android, también necesitamos configurar el canal de notificaciones
    if (Platform.OS === "android") {
      try {
        // El sonido se configurará dinámicamente en cada notificación
        await Notifications.setNotificationChannelAsync("default", {
          name: "Notificaciones de WorkBreak",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#4CAF50",
          sound: "default",
          enableVibrate: true,
        });
        console.log("Canal de notificaciones Android configurado ✓");
      } catch (error) {
        console.error("Error configurando canal de notificaciones:", error);
      }
    }

    return true;
  } catch (error) {
    console.error("Error solicitando permisos de notificaciones:", error);
    return false;
  }
}

// ==================== FUNCIÓN UNIFICADA DE PERMISOS ====================

/**
 * Solicita permisos de notificaciones al usuario (web o móvil)
 * Esta función se llama automáticamente cuando se intenta enviar una notificación
 */
async function requestNotificationPermissions(): Promise<boolean> {
  if (isWeb) {
    return await requestWebNotificationPermissions();
  } else {
    return await requestMobileNotificationPermissions();
  }
}

/**
 * Envía una notificación cuando termina el pomodoro (web o móvil)
 * @param preferences - Preferencias de notificación
 * @param secondsFromNow - Segundos desde ahora para programar la notificación (por defecto: inmediatamente)
 */
export async function sendPomodoroEndNotification(
  preferences: NotificationPreferences,
  secondsFromNow: number = 0
): Promise<void> {
  if (
    !preferences.notificationsEnabled ||
    !preferences.pomodoroEndNotification
  ) {
    return;
  }

  try {
    console.log("Intentando enviar notificación de fin de pomodoro...");

    // Solicitar permisos primero (solo si no están concedidos)
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.warn(
        "No se pueden enviar notificaciones: permisos no concedidos"
      );
      return;
    }

    const title = "¡Pomodoro Completado! 🎉";
    const body = "Es hora de tomar un descanso. ¡Buen trabajo!";

    if (isWeb) {
      // Usar notificaciones web
      await sendWebNotification(title, body, {
        tag: "pomodoro-end",
        data: { type: "pomodoro_end" },
      });
    } else {
      // Usar notificaciones móviles
      const Notifications = await getNotificationsModule();
      const soundName = preferences.alertSound || "default";

      // Determinar el sonido a usar
      let sound: string | boolean = true; // Por defecto usa el sonido del sistema

      // Variable para almacenar el channelId si se crea un canal personalizado
      let customChannelId: string | null = null;

      // Mapear sonidos personalizados
      // En Android, el canal puede necesitar el nombre con extensión
      const soundFileMap: Record<string, { base: string; withExt: string }> = {
        bell: { base: "bell", withExt: "bell.wav" },
        chime: { base: "chime", withExt: "chime.mp3" },
        alert: { base: "alert", withExt: "alert.mp3" },
        notification: { base: "notification", withExt: "notification.wav" },
        ringtone: { base: "ringtone", withExt: "ringtone.wav" },
      };

      if (soundName !== "default") {
        const soundFile = soundFileMap[soundName];
        if (soundFile) {
          // En Expo, usar solo el nombre base sin extensión para la notificación
          sound = soundFile.base;

          // En Android, crear un canal específico para cada sonido
          // El sonido debe venir del canal, no de la notificación individual
          if (Platform.OS === "android") {
            try {
              customChannelId = `workbreak_${soundFile.base}`;
              
              // Eliminar el canal específico si existe para recrearlo
              try {
                await Notifications.deleteNotificationChannelAsync(customChannelId);
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch {
                // Ignorar si el canal no existe
              }

              // Crear un canal específico para este sonido
              // IMPORTANTE: En Expo/Android, el sonido debe ser el nombre base SIN extensión
              // Expo resuelve automáticamente el archivo desde app.json
              await Notifications.setNotificationChannelAsync(customChannelId, {
                name: `Notificaciones WorkBreak`,
                description: `Notificaciones con sonido ${soundFile.base}`,
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4CAF50",
                sound: soundFile.base, // Nombre sin extensión (Expo lo resuelve desde app.json)
                enableVibrate: true,
                showBadge: true,
              });

              // Delay más largo para asegurar que el canal se cree completamente
              await new Promise((resolve) => setTimeout(resolve, 500));

              console.log(
                `✓ Canal Android creado: ${customChannelId} con sonido: ${soundFile.base} (archivo: ${soundFile.withExt})`
              );
            } catch (error) {
              console.error(
                "✗ Error creando canal con sonido personalizado:",
                error
              );
              customChannelId = null;
            }
          }
        }
      }

      // Programar la notificación para que se envíe en el tiempo especificado
      let trigger: any = null;
      if (secondsFromNow > 0) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        };
      }

      // En Android, usar el canal específico si se creó uno personalizado
      // Si no hay canal personalizado, usar "default"
      const channelId = Platform.OS === "android" 
        ? (customChannelId || "default")
        : undefined;

      // En Android, cuando hay un canal personalizado, usar "default" para que use el sonido del canal
      // El sonido ya está configurado en el canal, así que la notificación debe usar "default"
      const notificationSound = Platform.OS === "android" && customChannelId
        ? "default" // Usar "default" para que use el sonido del canal personalizado
        : sound; // Para iOS o cuando no hay canal personalizado, usar el sonido directamente

      console.log(
        `📢 Programando notificación - Sonido: ${notificationSound}, Canal: ${channelId || "N/A"}, Trigger: ${secondsFromNow}s`
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: notificationSound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "pomodoro_end" },
        },
        trigger: trigger,
        ...(Platform.OS === "android" && channelId && { channelId }),
      });
      console.log(
        "Notificación de fin de pomodoro programada. ID:",
        notificationId,
        "con sonido:",
        sound,
        "en canal:",
        channelId
      );
    }
  } catch (error) {
    console.error("Error enviando notificación de fin de pomodoro:", error);
  }
}

/**
 * Envía una notificación cuando inicia el descanso (web o móvil)
 * @param preferences - Preferencias de notificación
 * @param breakType - Tipo de descanso (shortBreak o longBreak)
 * @param secondsFromNow - Segundos desde ahora para programar la notificación (por defecto: inmediatamente)
 */
export async function sendBreakStartNotification(
  preferences: NotificationPreferences,
  breakType: "shortBreak" | "longBreak",
  secondsFromNow: number = 0
): Promise<void> {
  if (
    !preferences.notificationsEnabled ||
    !preferences.breakStartNotification
  ) {
    return;
  }

  try {
    console.log(`Intentando enviar notificación de inicio de ${breakType}...`);

    // Solicitar permisos primero (solo si no están concedidos)
    const hasPermissions = await requestNotificationPermissions();
    if (!hasPermissions) {
      console.warn(
        "No se pueden enviar notificaciones: permisos no concedidos"
      );
      return;
    }

    const breakTypeText =
      breakType === "shortBreak" ? "Pausa Corta" : "Pausa Larga";
    const title = `¡${breakTypeText}! ⏸️`;
    const body = "Es momento de relajarte y hacer algunos ejercicios.";

    if (isWeb) {
      // Usar notificaciones web
      await sendWebNotification(title, body, {
        tag: "break-start",
        data: { type: "break_start", breakType },
      });
    } else {
      // Usar notificaciones móviles
      const Notifications = await getNotificationsModule();
      const soundName = preferences.alertSound || "default";

      // Determinar el sonido a usar
      let sound: string | boolean = true; // Por defecto usa el sonido del sistema

      // Mapear sonidos personalizados
      // En Android, el canal puede necesitar el nombre con extensión
      const soundFileMap: Record<string, { base: string; withExt: string }> = {
        bell: { base: "bell", withExt: "bell.wav" },
        chime: { base: "chime", withExt: "chime.mp3" },
        alert: { base: "alert", withExt: "alert.mp3" },
        notification: { base: "notification", withExt: "notification.wav" },
        ringtone: { base: "ringtone", withExt: "ringtone.wav" },
      };

      // Variable para almacenar el channelId si se crea un canal personalizado
      let customChannelId: string | null = null;

      if (soundName !== "default") {
        const soundFile = soundFileMap[soundName];
        if (soundFile) {
          // En Android, crear un canal específico para cada sonido
          // El sonido debe venir del canal, no de la notificación individual
          if (Platform.OS === "android") {
            try {
              customChannelId = `workbreak_${soundFile.base}`;
              
              // Eliminar el canal específico si existe para recrearlo
              try {
                await Notifications.deleteNotificationChannelAsync(customChannelId);
                await new Promise((resolve) => setTimeout(resolve, 100));
              } catch {
                // Ignorar si el canal no existe
              }

              // Crear un canal específico para este sonido
              // IMPORTANTE: En Expo/Android, el sonido debe ser el nombre base SIN extensión
              // Expo resuelve automáticamente el archivo desde app.json
              await Notifications.setNotificationChannelAsync(customChannelId, {
                name: `Notificaciones WorkBreak`,
                description: `Notificaciones con sonido ${soundFile.base}`,
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#4CAF50",
                sound: soundFile.base, // Nombre sin extensión (Expo lo resuelve desde app.json)
                enableVibrate: true,
                showBadge: true,
              });

              // Delay más largo para asegurar que el canal se cree completamente
              await new Promise((resolve) => setTimeout(resolve, 500));

              console.log(
                `✓ Canal Android creado: ${customChannelId} con sonido: ${soundFile.base} (archivo: ${soundFile.withExt})`
              );
            } catch (error) {
              console.error(
                "✗ Error creando canal con sonido personalizado:",
                error
              );
              customChannelId = null;
            }
          }
          
          // Para la notificación, usar el nombre base sin extensión
          sound = soundFile.base;
        }
      }

      // Programar la notificación para que se envíe en el tiempo especificado
      let trigger: any = null;
      if (secondsFromNow > 0) {
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
          repeats: false,
        };
      }

      // En Android, usar el canal específico si se creó uno personalizado
      // Si no hay canal personalizado, usar "default"
      const channelId = Platform.OS === "android" 
        ? (customChannelId || "default")
        : undefined;

      // En Android, cuando hay un canal personalizado, usar "default" para que use el sonido del canal
      // El sonido ya está configurado en el canal, así que la notificación debe usar "default"
      const notificationSound = Platform.OS === "android" && customChannelId
        ? "default" // Usar "default" para que use el sonido del canal personalizado
        : sound; // Para iOS o cuando no hay canal personalizado, usar el sonido directamente

      console.log(
        `📢 Programando notificación - Sonido: ${notificationSound}, Canal: ${channelId || "N/A"}, Trigger: ${secondsFromNow}s`
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: notificationSound,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          data: { type: "break_start", breakType },
        },
        trigger: trigger,
        ...(Platform.OS === "android" && channelId && { channelId }),
      });
      console.log(
        `Notificación de inicio de ${breakTypeText} programada. ID:`,
        notificationId,
        "con sonido:",
        sound,
        "en canal:",
        channelId
      );
    }
  } catch (error) {
    console.error("Error enviando notificación de inicio de descanso:", error);
  }
}

/**
 * Cancela todas las notificaciones programadas (solo móvil, web no necesita cancelación)
 */
export async function cancelAllNotifications(): Promise<void> {
  if (isWeb) {
    // En web, las notificaciones se cierran automáticamente
    // No hay necesidad de cancelar notificaciones programadas
    console.log("Cancelación de notificaciones no necesaria en web");
    return;
  }

  try {
    const Notifications = await getNotificationsModule();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error cancelando notificaciones:", error);
  }
}

/**
 * Obtiene el estado de los permisos de notificaciones (web o móvil)
 */
export async function getNotificationPermissionsStatus(): Promise<{
  granted: boolean;
  status: string;
}> {
  if (isWeb) {
    if (!isWebNotificationSupported()) {
      return {
        granted: false,
        status: "unsupported",
      };
    }
    const permission = Notification.permission;
    return {
      granted: permission === "granted",
      status: permission,
    };
  }

  try {
    const Notifications = await getNotificationsModule();
    const { status } = await Notifications.getPermissionsAsync();
    return {
      granted: status === "granted",
      status: status as string,
    };
  } catch (error) {
    console.error("Error obteniendo estado de permisos:", error);
    return {
      granted: false,
      status: "undetermined",
    };
  }
}

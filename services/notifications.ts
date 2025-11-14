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
 */

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
}

/**
 * Solicita permisos de notificaciones al usuario
 * Esta función se llama automáticamente cuando se intenta enviar una notificación
 */
async function requestNotificationPermissions(): Promise<boolean> {
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

/**
 * Envía una notificación cuando termina el pomodoro
 */
export async function sendPomodoroEndNotification(
  preferences: NotificationPreferences
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

    const Notifications = await getNotificationsModule();

    // Usar trigger null para enviar inmediatamente
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Pomodoro Completado! 🎉",
        body: "Es hora de tomar un descanso. ¡Buen trabajo!",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: "pomodoro_end" },
      },
      trigger: null, // Enviar inmediatamente
    });

    console.log(
      "Notificación de fin de pomodoro programada. ID:",
      notificationId
    );
  } catch (error) {
    console.error("Error enviando notificación de fin de pomodoro:", error);
  }
}

/**
 * Envía una notificación cuando inicia el descanso
 */
export async function sendBreakStartNotification(
  preferences: NotificationPreferences,
  breakType: "shortBreak" | "longBreak"
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

    const Notifications = await getNotificationsModule();
    const breakTypeText =
      breakType === "shortBreak" ? "Pausa Corta" : "Pausa Larga";

    // Usar trigger null para enviar inmediatamente
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `¡${breakTypeText}! ⏸️`,
        body: "Es momento de relajarte y hacer algunos ejercicios.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: "break_start", breakType },
      },
      trigger: null, // Enviar inmediatamente
    });

    console.log(
      `Notificación de inicio de ${breakTypeText} programada. ID:`,
      notificationId
    );
  } catch (error) {
    console.error("Error enviando notificación de inicio de descanso:", error);
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error cancelando notificaciones:", error);
  }
}

/**
 * Obtiene el estado de los permisos de notificaciones
 */
export async function getNotificationPermissionsStatus(): Promise<{
  granted: boolean;
  status: import("expo-notifications").PermissionStatus;
}> {
  try {
    const Notifications = await getNotificationsModule();
    const { status } = await Notifications.getPermissionsAsync();
    return {
      granted: status === "granted",
      status,
    };
  } catch (error) {
    console.error("Error obteniendo estado de permisos:", error);
    return {
      granted: false,
      status: "undetermined" as import("expo-notifications").PermissionStatus,
    };
  }
}

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";

// Mantener el splash screen visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Ocultar el splash screen cuando la app esté lista
    const hideSplash = async () => {
      try {
        // Esperar a que el splash screen esté listo antes de ocultarlo
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn("Error ocultando splash screen:", error);
      }
    };

    // Delay para asegurar que todos los recursos estén cargados
    // y que el splash screen se muestre correctamente
    const timer = setTimeout(() => {
      hideSplash();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // NO solicitamos permisos aquí para evitar cargar expo-notifications al inicio
  // Los permisos se solicitarán automáticamente la primera vez que se intente enviar una notificación

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="preferences"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="pomodoro-config"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="active-break"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

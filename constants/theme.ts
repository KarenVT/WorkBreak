/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#2b7e1f";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#111827",
    textMedium: "#394454",
    textLight: "#9ca3af",
    background: "#f7f7f7",
    tint: tintColorLight,
    icon: "#9EBF99",
    tabIconDefault: "#9EBF99",
    tabIconSelected: tintColorLight,
    // Colores específicos del timer
    timerDarkGreen: "#2b7e1f",
    timerMediumGreen: "#4F8C46",
    timerLightBackground: "#e5e7eb",
    toggleInactive: "#e5e7eb",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9EBF99",
    tabIconDefault: "#9EBF99",
    tabIconSelected: tintColorDark,
    // Colores específicos del timer
    timerDarkGreen: "#28731D",
    timerMediumGreen: "#4F8C46",
    timerLightBackground: "#e5e7eb",
    timerText: "#090D08",
    textMedium: "#394454",
    textLight: "#9ca3af",
    toggleInactive: "#e5e7eb",
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName =
  | "house.fill"
  | "paperplane.fill"
  | "chevron.left.forwardslash.chevron.right"
  | "chevron.right"
  | "chevron.left"
  | "arrow.clockwise"
  | "pause.fill"
  | "play.fill"
  | "forward.fill"
  | "gearshape.fill"
  | "dumbbell.fill"
  | "chart.bar.fill"
  | "bell.fill"
  | "timer"
  | "hourglass"
  | "music.note"
  | "info.circle.fill"
  | "minus"
  | "plus"
  | "figure.stretch"
  | "figure.mobility"
  | "eye.fill"
  | "figure.walk"
  | "speaker.wave.2.fill"
  | "speaker.slash.fill"
  | "xmark"
  | "backward.fill"
  | "checkmark.circle";

type IconMapping = Record<
  IconSymbolName,
  ComponentProps<typeof MaterialIcons>["name"]
>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "arrow.clockwise": "refresh",
  "pause.fill": "pause",
  "play.fill": "play-arrow",
  "forward.fill": "skip-next",
  "gearshape.fill": "settings",
  "dumbbell.fill": "fitness-center",
  "chart.bar.fill": "bar-chart",
  "bell.fill": "notifications",
  timer: "timer",
  hourglass: "hourglass-empty",
  "music.note": "music-note",
  "info.circle.fill": "info",
  minus: "remove",
  plus: "add",
  "figure.stretch": "self-improvement",
  "figure.mobility": "accessibility",
  "eye.fill": "visibility",
  "figure.walk": "directions-walk",
  "speaker.wave.2.fill": "volume-up",
  "speaker.slash.fill": "volume-off",
  xmark: "close",
  "backward.fill": "skip-previous",
  "checkmark.circle": "check-circle",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}

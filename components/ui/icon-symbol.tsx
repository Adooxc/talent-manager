// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "calendar": "event",
  "mappin": "place",
  "clock.fill": "schedule",
  "person.2.fill": "people",
  "folder.fill": "folder",
  "bell.fill": "notifications",
  "gearshape.fill": "settings",
  "plus": "add",
  "pencil": "edit",
  "trash.fill": "delete",
  "magnifyingglass": "search",
  "photo.fill": "photo",
  "phone.fill": "phone",
  "link": "link",
  "doc.fill": "description",
  "square.and.arrow.up": "share",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "camera.fill": "camera-alt",
  "star.fill": "star",
  "dollarsign.circle.fill": "attach-money",
  "arrow.left": "arrow-back",
  "chevron.left": "chevron-left",
  "doc.on.doc.fill": "content-copy",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "line.3.horizontal.decrease": "filter-list",
  "arrow.up.arrow.down": "sort",
  "square.grid.2x2": "grid-view",
  "list.bullet": "view-list",
  "chart.bar.fill": "bar-chart",
  "square.and.arrow.down": "download",
  "square.and.arrow.up.fill": "upload",
  "person.crop.circle.badge.plus": "person-add",
  "checkmark": "check",
  "xmark": "close",
  "slider.horizontal.3": "tune",
  "play.circle.fill": "play-circle-filled",
  "icloud.and.arrow.up": "cloud-upload",
  "icloud.and.arrow.down": "cloud-download",
  "arrow.clockwise": "refresh",
  "message.fill": "message",
  "info.circle.fill": "info",
  "archivebox.fill": "archive",
  "briefcase.fill": "work",
  "creditcard.fill": "credit-card",
  "clock": "access-time",
  "paperclip": "attach-file",
  "chart.pie.fill": "pie-chart",
  "arrow.up.right": "trending-up",
  "arrow.down.right": "trending-down",
  "receipt.fill": "receipt",
  "doc.text.fill": "article",
} as IconMapping;

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
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}

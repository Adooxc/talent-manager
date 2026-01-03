import { useMemo } from "react";
import { Colors, type ColorScheme, type ThemeColorPalette } from "@/constants/theme";
import { useThemeContext } from "@/lib/theme-provider";

/**
 * Returns the current theme's color palette with dynamic primary color.
 * Usage: const colors = useColors(); then colors.text, colors.background, etc.
 */
export function useColors(colorSchemeOverride?: ColorScheme): ThemeColorPalette {
  const { colorScheme, primaryColor } = useThemeContext();
  const scheme = (colorSchemeOverride ?? colorScheme ?? "light") as ColorScheme;
  
  return useMemo(() => {
    const baseColors = Colors[scheme];
    return {
      ...baseColors,
      primary: primaryColor,
      tint: primaryColor,
      tabIconSelected: primaryColor,
    };
  }, [scheme, primaryColor]);
}

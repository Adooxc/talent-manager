import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { FONT_SIZES, type FontSize } from "@/lib/types";

// Theme color options matching types.ts
const THEME_COLOR_VALUES: Record<string, string> = {
  indigo: '#6366F1',
  blue: '#3B82F6',
  green: '#22C55E',
  purple: '#8B5CF6',
  pink: '#EC4899',
  orange: '#F97316',
  red: '#EF4444',
};

type ThemeContextValue = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SETTINGS_KEY = "@talent_manager_settings";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useSystemColorScheme() ?? "light") as ColorScheme;
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemScheme);
  const [primaryColor, setPrimaryColorState] = useState<string>(THEME_COLOR_VALUES.indigo);
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.darkMode !== undefined) {
            const scheme = settings.darkMode ? "dark" : "light";
            setColorSchemeState(scheme);
            applyScheme(scheme, settings.themeColor ? THEME_COLOR_VALUES[settings.themeColor] : primaryColor);
          }
          if (settings.themeColor && THEME_COLOR_VALUES[settings.themeColor]) {
            setPrimaryColorState(THEME_COLOR_VALUES[settings.themeColor]);
          }
          if (settings.fontSize && FONT_SIZES[settings.fontSize as FontSize]) {
            setFontSizeState(settings.fontSize as FontSize);
            applyFontSize(settings.fontSize as FontSize);
          }
        }
      } catch (error) {
        console.error("Failed to load theme settings:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadSettings();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const settings = JSON.parse(stored);
          const newScheme = settings.darkMode ? "dark" : "light";
          const newColor = settings.themeColor ? THEME_COLOR_VALUES[settings.themeColor] : primaryColor;
          const newFontSize = settings.fontSize || fontSize;
          
          if (newScheme !== colorScheme) {
            setColorSchemeState(newScheme);
            applyScheme(newScheme, newColor);
          }
          if (newColor !== primaryColor) {
            setPrimaryColorState(newColor);
            applyScheme(colorScheme, newColor);
          }
          if (newFontSize !== fontSize) {
            setFontSizeState(newFontSize);
            applyFontSize(newFontSize);
          }
        }
      } catch (error) {
        console.error("Failed to check settings:", error);
      }
    };

    // Check for changes every 500ms (for real-time updates)
    const interval = setInterval(checkSettings, 500);
    return () => clearInterval(interval);
  }, [colorScheme, primaryColor, fontSize]);

  const applyScheme = useCallback((scheme: ColorScheme, customPrimary?: string) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        if (token === 'primary' && customPrimary) {
          root.style.setProperty(`--color-${token}`, customPrimary);
        } else {
          root.style.setProperty(`--color-${token}`, value);
        }
      });
    }
  }, []);

  const setColorScheme = useCallback((scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    applyScheme(scheme, primaryColor);
  }, [applyScheme, primaryColor]);

  const setPrimaryColor = useCallback((color: string) => {
    setPrimaryColorState(color);
    applyScheme(colorScheme, color);
  }, [applyScheme, colorScheme]);

  const applyFontSize = useCallback((size: FontSize) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const fontSizeValue = FONT_SIZES[size as FontSize];
      root.style.fontSize = `${fontSizeValue}px`;
    }
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    applyFontSize(size);
  }, [applyFontSize]);

  useEffect(() => {
    if (isInitialized) {
      applyScheme(colorScheme, primaryColor);
      applyFontSize(fontSize);
    }
  }, [applyScheme, applyFontSize, colorScheme, primaryColor, fontSize, isInitialized]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": primaryColor,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme, primaryColor],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      setColorScheme,
      primaryColor,
      setPrimaryColor,
      fontSize,
      setFontSize,
    }),
    [colorScheme, setColorScheme, primaryColor, setPrimaryColor, fontSize, setFontSize],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}

// Apply font size on load
if (typeof document !== "undefined") {
  const loadFontSize = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        if (settings.fontSize && FONT_SIZES[settings.fontSize as FontSize]) {
          const root = document.documentElement;
          root.style.fontSize = `${FONT_SIZES[settings.fontSize as FontSize]}px`;
        }
      }
    } catch (error) {
      console.error("Failed to load font size:", error);
    }
  };
  loadFontSize();
}

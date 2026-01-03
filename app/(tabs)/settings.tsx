import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Switch,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AppSettings, DEFAULT_SETTINGS, CURRENCIES } from "@/lib/types";
import { getSettings, saveSettings, clearAllData, getCategories } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profitMarginInput, setProfitMarginInput] = useState("");
  const [categoryCount, setCategoryCount] = useState(0);

  const loadSettings = useCallback(async () => {
    const [data, cats] = await Promise.all([getSettings(), getCategories()]);
    setSettings(data);
    setProfitMarginInput(data.defaultProfitMargin.toString());
    setCategoryCount(cats.length);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggleReminder = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const updated = await saveSettings({ monthlyReminderEnabled: value });
    setSettings(updated);
  };

  const handleProfitMarginChange = async (text: string) => {
    setProfitMarginInput(text);
    const value = parseFloat(text);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      const updated = await saveSettings({ defaultProfitMargin: value });
      setSettings(updated);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await saveSettings({ defaultCurrency: currency });
    setSettings(updated);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all talents, projects, categories, and settings. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await clearAllData();
            await loadSettings();
            Alert.alert("Data Cleared", "All data has been deleted.");
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    icon: any,
    title: string,
    subtitle: string,
    rightComponent: React.ReactNode,
    iconBgColor?: string
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor || colors.primary + "20" }]}>
        <IconSymbol name={icon} size={20} color={iconBgColor ? "#FFF" : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      {rightComponent}
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories Management */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>CATEGORIES</Text>
          
          <TouchableOpacity
            onPress={() => router.push("/settings/categories" as any)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="folder.fill" size={20} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Manage Categories</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {categoryCount} {categoryCount === 1 ? "category" : "categories"} configured
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Reminders */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>REMINDERS</Text>
          
          {renderSettingRow(
            "bell.fill",
            "Monthly Photo Updates",
            "Get reminded to update talent photos",
            <Switch
              value={settings.monthlyReminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          )}
        </View>

        {/* Pricing */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>PRICING</Text>
          
          {renderSettingRow(
            "dollarsign.circle.fill",
            "Default Profit Margin",
            "Applied to new projects",
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                value={profitMarginInput}
                onChangeText={handleProfitMarginChange}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
              />
              <Text style={[styles.inputSuffix, { color: colors.muted }]}>%</Text>
            </View>
          )}

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.success} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Default Currency</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Used for new talents and projects
              </Text>
            </View>
          </View>
          <View style={styles.currencyPicker}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => handleCurrencyChange(c.code)}
                style={[
                  styles.currencyButton,
                  {
                    backgroundColor: settings.defaultCurrency === c.code ? colors.primary : colors.background,
                    borderColor: settings.defaultCurrency === c.code ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.currencyCode,
                    { color: settings.defaultCurrency === c.code ? "#FFF" : colors.foreground },
                  ]}
                >
                  {c.code}
                </Text>
                <Text
                  style={[
                    styles.currencyName,
                    { color: settings.defaultCurrency === c.code ? "#FFF" : colors.muted },
                  ]}
                >
                  {c.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>DATA</Text>
          
          <TouchableOpacity
            onPress={handleClearData}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.error + "20" }]}>
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>Clear All Data</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Delete all talents, projects, and settings
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Talent Manager v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Personal use only
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 16,
  },
  inputSuffix: {
    fontSize: 16,
    marginLeft: 6,
  },
  currencyPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 70,
  },
  currencyCode: {
    fontSize: 14,
    fontWeight: "600",
  },
  currencyName: {
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 13,
    marginTop: 4,
  },
});

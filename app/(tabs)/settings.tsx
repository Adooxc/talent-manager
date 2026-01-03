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
  Share,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { AppSettings, DEFAULT_SETTINGS, CURRENCIES } from "@/lib/types";
import { getSettings, saveSettings, clearAllData, getCategories, exportAllData, importAllData } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profitMarginInput, setProfitMarginInput] = useState("");
  const [categoryCount, setCategoryCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `talent_manager_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      if (Platform.OS === "web") {
        // Web: Download file
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Success", "Backup file downloaded successfully.");
      } else {
        // Mobile: Save and share
        const filePath = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(filePath, jsonString);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(filePath, {
            mimeType: "application/json",
            dialogTitle: "Export Backup",
          });
        } else {
          Alert.alert("Error", "Sharing is not available on this device.");
        }
      }
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export backup.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setIsImporting(true);

      let jsonString: string;
      
      if (Platform.OS === "web") {
        const response = await fetch(file.uri);
        jsonString = await response.text();
      } else {
        jsonString = await FileSystem.readAsStringAsync(file.uri);
      }

      const data = JSON.parse(jsonString);
      
      Alert.alert(
        "Import Backup",
        "This will replace all existing data with the backup. Continue?",
        [
          { text: "Cancel", style: "cancel", onPress: () => setIsImporting(false) },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              const importResult = await importAllData(data);
              setIsImporting(false);
              
              if (importResult.success) {
                if (Platform.OS !== "web") {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                Alert.alert("Success", "Backup imported successfully.");
                await loadSettings();
              } else {
                Alert.alert("Error", importResult.error || "Failed to import backup.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Import error:", error);
      setIsImporting(false);
      Alert.alert("Error", "Failed to read backup file. Make sure it's a valid JSON file.");
    }
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
    iconBgColor?: string,
    onPress?: () => void,
    isLast?: boolean
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }, isLast && { borderBottomWidth: 0 }]}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor || colors.primary + "20" }]}>
        <IconSymbol name={icon} size={20} color={iconBgColor ? "#FFF" : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.muted }]}>{subtitle}</Text>
      </View>
      {rightComponent}
    </TouchableOpacity>
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
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>ACCOUNT</Text>
          
          {authLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.muted }]}>Loading...</Text>
            </View>
          ) : user ? (
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  {user.name || "Signed In"}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                  {user.email || "Cloud sync enabled"}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/login" as any)}
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <IconSymbol name="person.crop.circle.badge.plus" size={20} color="#FFF" />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>Sign In</Text>
                <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                  Enable cloud sync across devices
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

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
            />,
            undefined,
            undefined,
            true
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

        {/* Backup & Restore */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>BACKUP & RESTORE</Text>
          
          {renderSettingRow(
            "square.and.arrow.up",
            "Export Backup",
            "Save all data to a JSON file",
            isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            ),
            colors.success,
            isExporting ? undefined : handleExportBackup
          )}

          {renderSettingRow(
            "square.and.arrow.down",
            "Import Backup",
            "Restore data from a backup file",
            isImporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            ),
            colors.primary,
            isImporting ? undefined : handleImportBackup,
            true
          )}
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
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
  },
});

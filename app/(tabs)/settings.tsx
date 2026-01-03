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
  ActivityIndicator,
  I18nManager,
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
import { 
  AppSettings, 
  DEFAULT_SETTINGS, 
  THEME_COLORS, 
  FONT_SIZES_ARRAY,
  ThemeColor,
  FontSize,
  AppLanguage,
} from "@/lib/types";
import { getSettings, saveSettings, clearAllData, getCategories, exportAllData, importAllData } from "@/lib/storage";
import { 
  getNotificationSettings, 
  saveNotificationSettings, 
  requestNotificationPermissions,
  sendTestNotification,
  NotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "@/lib/notifications";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/hooks/use-auth";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [profitMarginInput, setProfitMarginInput] = useState("");
  const [categoryCount, setCategoryCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  const loadSettings = useCallback(async () => {
    const [data, cats, notifSettings] = await Promise.all([
      getSettings(), 
      getCategories(),
      getNotificationSettings(),
    ]);
    setSettings(data);
    setProfitMarginInput(data.defaultProfitMargin.toString());
    setCategoryCount(cats.length);
    setNotificationSettings(notifSettings);
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

  const handleToggleBookingReminders = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert("Permission Required", "Please enable notifications in your device settings to receive booking reminders.");
        return;
      }
    }
    const updated = await saveNotificationSettings({ bookingReminders: value });
    setNotificationSettings(updated);
  };

  const handleTogglePaymentReminders = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert("Permission Required", "Please enable notifications in your device settings to receive payment reminders.");
        return;
      }
    }
    const updated = await saveNotificationSettings({ paymentReminders: value });
    setNotificationSettings(updated);
  };

  const handleTestNotification = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      Alert.alert("Permission Required", "Please enable notifications in your device settings.");
      return;
    }
    await sendTestNotification();
    Alert.alert("Success", "Test notification sent!");
  };

  const handleToggleDarkMode = async (value: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const updated = await saveSettings({ darkMode: value });
    setSettings(updated);
    // Note: Full dark mode implementation requires ThemeProvider update
  };

  const handleThemeColorChange = async (color: ThemeColor) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await saveSettings({ themeColor: color });
    setSettings(updated);
  };

  const handleFontSizeChange = async (size: FontSize) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await saveSettings({ fontSize: size });
    setSettings(updated);
  };

  const handleLanguageChange = async (lang: AppLanguage) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updated = await saveSettings({ language: lang });
    setSettings(updated);
    
    // Handle RTL for Arabic
    if (lang === 'ar' && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      Alert.alert(
        "Language Changed",
        "Please restart the app to apply the Arabic layout.",
        [{ text: "OK" }]
      );
    } else if (lang === 'en' && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
      Alert.alert(
        "Language Changed",
        "Please restart the app to apply the English layout.",
        [{ text: "OK" }]
      );
    }
  };

  const handleProfitMarginChange = async (text: string) => {
    setProfitMarginInput(text);
    const value = parseFloat(text);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      const updated = await saveSettings({ defaultProfitMargin: value });
      setSettings(updated);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `talent_manager_backup_${new Date().toISOString().split("T")[0]}.json`;
      
      if (Platform.OS === "web") {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("Success", "Backup file downloaded successfully.");
      } else {
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

  const isArabic = settings.language === 'ar';
  const t = (en: string, ar: string) => isArabic ? ar : en;

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
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t("Settings", "الإعدادات")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("ACCOUNT", "الحساب")}
          </Text>
          
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
                  {user.name || t("Signed In", "تم تسجيل الدخول")}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                  {user.email || t("Cloud sync enabled", "المزامنة السحابية مفعلة")}
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
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                  {t("Sign In", "تسجيل الدخول")}
                </Text>
                <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                  {t("Enable cloud sync across devices", "تفعيل المزامنة السحابية")}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Appearance Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("APPEARANCE", "المظهر")}
          </Text>
          
          {renderSettingRow(
            "house.fill",
            t("Dark Mode", "الوضع الداكن"),
            t("Switch between light and dark theme", "التبديل بين الوضع الفاتح والداكن"),
            <Switch
              value={settings.darkMode}
              onValueChange={handleToggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />
          )}

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <IconSymbol name="star.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Theme Color", "لون التطبيق")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Choose your preferred accent color", "اختر لونك المفضل")}
              </Text>
            </View>
          </View>
          <View style={styles.colorPicker}>
            {THEME_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => handleThemeColorChange(c.value)}
                style={[
                  styles.colorButton,
                  { backgroundColor: c.color },
                  settings.themeColor === c.value && styles.colorButtonSelected,
                ]}
              >
                {settings.themeColor === c.value && (
                  <IconSymbol name="checkmark" size={16} color="#FFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Font Size settings removed */}

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + "20" }]}>
              <IconSymbol name="message.fill" size={20} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Language", "اللغة")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Choose app language", "اختر لغة التطبيق")}
              </Text>
            </View>
          </View>
          <View style={styles.languagePicker}>
            <TouchableOpacity
              onPress={() => handleLanguageChange('en')}
              style={[
                styles.languageButton,
                {
                  backgroundColor: settings.language === 'en' ? colors.primary : colors.background,
                  borderColor: settings.language === 'en' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.languageLabel, { color: settings.language === 'en' ? "#FFF" : colors.foreground }]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleLanguageChange('ar')}
              style={[
                styles.languageButton,
                {
                  backgroundColor: settings.language === 'ar' ? colors.primary : colors.background,
                  borderColor: settings.language === 'ar' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.languageLabel, { color: settings.language === 'ar' ? "#FFF" : colors.foreground }]}>
                العربية
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Management */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("CATEGORIES", "التصنيفات")}
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push("/settings/categories" as any)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="folder.fill" size={20} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Manage Categories", "إدارة التصنيفات")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {categoryCount} {categoryCount === 1 ? t("category", "تصنيف") : t("categories", "تصنيفات")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Message Templates */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("COMMUNICATION", "التواصل")}
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push("/settings/templates" as any)}
            style={[styles.settingRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
              <IconSymbol name="message.fill" size={20} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Message Templates", "قوالب الرسائل")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Pre-written messages for WhatsApp", "رسائل جاهزة للواتساب")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/settings/conversations" as any)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
              <IconSymbol name="doc.fill" size={20} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Conversation Log", "سجل المحادثات")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Notes from calls and meetings", "ملاحظات المكالمات والاجتماعات")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Reminders & Notifications */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("NOTIFICATIONS", "الإشعارات")}
          </Text>
          
          {renderSettingRow(
            "bell.fill",
            t("Booking Reminders", "تذكيرات الحجوزات"),
            t("Get notified before bookings", "إشعار قبل مواعيد الحجوزات"),
            <Switch
              value={notificationSettings.bookingReminders}
              onValueChange={handleToggleBookingReminders}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />,
            colors.primary
          )}

          {renderSettingRow(
            "dollarsign.circle.fill",
            t("Payment Reminders", "تذكيرات المدفوعات"),
            t("Get notified about due payments", "إشعار بالمدفوعات المستحقة"),
            <Switch
              value={notificationSettings.paymentReminders}
              onValueChange={handleTogglePaymentReminders}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />,
            colors.success
          )}

          {renderSettingRow(
            "photo.fill",
            t("Monthly Photo Updates", "تحديث الصور الشهري"),
            t("Get reminded to update talent photos", "تذكير بتحديث صور المواهب"),
            <Switch
              value={settings.monthlyReminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFF"
            />,
            colors.warning
          )}

          {Platform.OS !== "web" && renderSettingRow(
            "bell.badge.fill",
            t("Test Notification", "اختبار الإشعارات"),
            t("Send a test notification", "إرسال إشعار تجريبي"),
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />,
            colors.muted,
            handleTestNotification,
            true
          )}
        </View>

        {/* Pricing */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("PRICING", "التسعير")}
          </Text>
          
          {renderSettingRow(
            "dollarsign.circle.fill",
            t("Default Profit Margin", "هامش الربح الافتراضي"),
            t("Applied to new projects", "يطبق على المشاريع الجديدة"),
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

          {renderSettingRow(
            "dollarsign.circle.fill",
            t("Currency", "العملة"),
            t("Kuwaiti Dinar (KD)", "الدينار الكويتي"),
            <View style={[styles.currencyBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.currencyBadgeText}>KWD</Text>
            </View>,
            colors.success,
            undefined,
            true
          )}
        </View>

        {/* Backup & Restore */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("BACKUP & RESTORE", "النسخ الاحتياطي")}
          </Text>
          
          {renderSettingRow(
            "square.and.arrow.up",
            t("Export Backup", "تصدير النسخة الاحتياطية"),
            t("Save all data to a JSON file", "حفظ جميع البيانات كملف"),
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
            t("Import Backup", "استيراد النسخة الاحتياطية"),
            t("Restore data from a backup file", "استعادة البيانات من ملف"),
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
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("DATA", "البيانات")}
          </Text>
          
          <TouchableOpacity
            onPress={handleClearData}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.error + "20" }]}>
              <IconSymbol name="trash.fill" size={20} color={colors.error} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.error }]}>
                {t("Clear All Data", "حذف جميع البيانات")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Delete all talents, projects, and settings", "حذف جميع المواهب والمشاريع والإعدادات")}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Admin */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            {t("ADMIN", "المسؤول")}
          </Text>
          
          <TouchableOpacity
            onPress={() => router.push("/admin/login" as any)}
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: colors.warning }]}>
              <IconSymbol name="gearshape.fill" size={20} color="#FFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t("Admin Panel", "لوحة التحكم")}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                {t("Manage app settings and branding", "إدارة إعدادات التطبيق")}
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
            {t("Personal use only", "للاستخدام الشخصي فقط")}
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
  colorPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  fontSizePicker: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  fontSizeLabel: {
    fontWeight: "500",
  },
  languagePicker: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  languageLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currencyBadgeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
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

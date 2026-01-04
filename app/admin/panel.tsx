import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { loadAdminSettings, saveAdminSettings, type AdminSettings } from "@/lib/admin-sync";
import {
  saveTemplate,
  getTemplatesByType,
  deleteTemplate,
  createTemplateBackup,
  getBackupList,
  restoreFromBackup,
  deleteBackup,
  formatBackupDate,
  initializeBackupDir,
  type TemplateData,
} from "@/lib/template-manager";

const DEFAULT_SETTINGS: AdminSettings = {
  appName: "Talent Manager",
  primaryColor: "#7C3AED",
  logoUrl: "",
};

export default function AdminPanelScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Template management states
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  const [invoiceTemplates, setInvoiceTemplates] = useState<TemplateData[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<TemplateData[]>([]);
  const [backups, setBackups] = useState<string[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    loadSettings();
    initializeBackupDir();
  }, []);

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const saved = await loadAdminSettings();
      setSettings(saved);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const invoices = await getTemplatesByType('invoice');
      const quotations = await getTemplatesByType('quotation');
      const backupList = await getBackupList();
      
      setInvoiceTemplates(invoices);
      setQuotationTemplates(quotations);
      setBackups(backupList);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await saveAdminSettings(settings);
      Alert.alert("Success", "Settings saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSettings({ ...settings, logoUrl: result.assets[0].uri });
    }
  };

  const pickTemplateFile = async (type: 'invoice' | 'quotation') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Read file as base64
        const fileContent = await fetch(file.uri);
        const blob = await fileContent.blob();
        const reader = new FileReader();
        
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            await saveTemplate(type, file.name || `${type}_template`, base64, file.mimeType || 'application/pdf');
            Alert.alert("Success", `${type.charAt(0).toUpperCase() + type.slice(1)} template uploaded successfully`);
            loadTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to save template");
          }
        };
        
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Error picking file:", error);
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const handleDeleteTemplate = async (id: string, type: string) => {
    Alert.alert("Delete Template", `Are you sure you want to delete this ${type} template?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteTemplate(id);
            Alert.alert("Success", "Template deleted");
            loadTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to delete template");
          }
        },
      },
    ]);
  };

  const handleCreateBackup = async () => {
    try {
      setLoadingTemplates(true);
      await createTemplateBackup();
      Alert.alert("Success", "Backup created successfully");
      loadTemplates();
    } catch (error) {
      Alert.alert("Error", "Failed to create backup");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleRestoreBackup = async (fileName: string) => {
    Alert.alert("Restore Backup", "Are you sure you want to restore this backup? Current templates will be replaced.", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Restore",
        onPress: async () => {
          try {
            setLoadingTemplates(true);
            await restoreFromBackup(fileName);
            Alert.alert("Success", "Templates restored successfully");
            loadTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to restore backup");
          } finally {
            setLoadingTemplates(false);
          }
        },
      },
    ]);
  };

  const handleDeleteBackup = async (fileName: string) => {
    Alert.alert("Delete Backup", "Are you sure you want to delete this backup?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteBackup(fileName);
            Alert.alert("Success", "Backup deleted");
            loadTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to delete backup");
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Admin Control Panel</Text>
          <Text className="text-base text-muted">Manage app settings and templates</Text>
        </View>

        {/* Tab Navigation */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('settings')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: activeTab === 'settings' ? colors.primary : colors.surface,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: activeTab === 'settings' ? '#FFF' : colors.foreground,
              }}
            >
              Settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('templates')}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: activeTab === 'templates' ? colors.primary : colors.surface,
            }}
          >
            <Text
              style={{
                textAlign: 'center',
                fontWeight: '600',
                color: activeTab === 'templates' ? '#FFF' : colors.foreground,
              }}
            >
              Templates
            </Text>
          </TouchableOpacity>
        </View>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            {/* Logo Section */}
            <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-lg font-semibold text-foreground mb-3">App Logo</Text>

              {settings.logoUrl ? (
                <Image
                  source={{ uri: settings.logoUrl }}
                  style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 12 }}
                />
              ) : (
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                    backgroundColor: colors.border,
                    marginBottom: 12,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text className="text-muted">No Logo</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={pickImage}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
                  Change Logo
                </Text>
              </TouchableOpacity>
            </View>

            {/* App Name Section */}
            <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-lg font-semibold text-foreground mb-3">App Name</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  backgroundColor: colors.background,
                }}
                placeholder="Enter app name"
                placeholderTextColor={colors.muted}
                value={settings.appName}
                onChangeText={(text) => setSettings({ ...settings, appName: text })}
              />
            </View>

            {/* Primary Color Section */}
            <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
              <Text className="text-lg font-semibold text-foreground mb-3">Primary Color</Text>

              <View className="flex-row items-center gap-3 mb-4">
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 6,
                    backgroundColor: settings.primaryColor,
                    borderWidth: 2,
                    borderColor: colors.border,
                  }}
                />
                <TextInput
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: colors.foreground,
                    backgroundColor: colors.background,
                  }}
                  placeholder="#7C3AED"
                  placeholderTextColor={colors.muted}
                  value={settings.primaryColor}
                  onChangeText={(text) => setSettings({ ...settings, primaryColor: text })}
                />
              </View>

              {/* Color Presets */}
              <View className="flex-row gap-2">
                {["#7C3AED", "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7"].map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() => setSettings({ ...settings, primaryColor: color })}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      backgroundColor: color,
                      borderWidth: 2,
                      borderColor: settings.primaryColor === color ? colors.foreground : "transparent",
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={saveSettings}
              disabled={saving}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 12,
                borderRadius: 8,
                marginBottom: 12,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#FFF", textAlign: "center", fontSize: 16, fontWeight: "600" }}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                borderWidth: 1,
                borderColor: colors.error,
                paddingVertical: 12,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: colors.error, textAlign: "center", fontSize: 16, fontWeight: "600" }}>
                Logout
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            {loadingTemplates ? (
              <View className="justify-center items-center py-8">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                {/* Invoice Templates Section */}
                <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-lg font-semibold text-foreground mb-3">Invoice Templates</Text>

                  {invoiceTemplates.length > 0 ? (
                    <View className="gap-2 mb-4">
                      {invoiceTemplates.map((template) => (
                        <View
                          key={template.id}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            backgroundColor: colors.background,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                              {template.fileName}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {new Date(template.updatedAt).toLocaleDateString('ar-SA')}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => router.push(`/admin/template-preview?templateId=${template.id}`)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.primary + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                View
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteTemplate(template.id, 'invoice')}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.error + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.muted, marginBottom: 12 }}>No invoice templates yet</Text>
                  )}

                  <TouchableOpacity
                    onPress={() => pickTemplateFile('invoice')}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
                      Upload Invoice Template
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Quotation Templates Section */}
                <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-lg font-semibold text-foreground mb-3">Quotation Templates</Text>

                  {quotationTemplates.length > 0 ? (
                    <View className="gap-2 mb-4">
                      {quotationTemplates.map((template) => (
                        <View
                          key={template.id}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            backgroundColor: colors.background,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                              {template.fileName}
                            </Text>
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              {new Date(template.updatedAt).toLocaleDateString('ar-SA')}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => router.push(`/admin/template-preview?templateId=${template.id}`)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.primary + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                View
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteTemplate(template.id, 'quotation')}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.error + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.muted, marginBottom: 12 }}>No quotation templates yet</Text>
                  )}

                  <TouchableOpacity
                    onPress={() => pickTemplateFile('quotation')}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
                      Upload Quotation Template
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Backup Section */}
                <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
                  <Text className="text-lg font-semibold text-foreground mb-3">Backups</Text>

                  <TouchableOpacity
                    onPress={handleCreateBackup}
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 10,
                      borderRadius: 6,
                      marginBottom: 12,
                    }}
                  >
                    <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
                      Create Backup
                    </Text>
                  </TouchableOpacity>

                  {backups.length > 0 ? (
                    <View className="gap-2">
                      {backups.map((backup) => (
                        <View
                          key={backup}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            backgroundColor: colors.background,
                            borderRadius: 6,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 12 }}>
                              {formatBackupDate(backup)}
                            </Text>
                          </View>
                          <View className="flex-row gap-2">
                            <TouchableOpacity
                              onPress={() => handleRestoreBackup(backup)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.primary + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
                                Restore
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteBackup(backup)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: colors.error + '20',
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                                Delete
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.muted }}>No backups yet</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

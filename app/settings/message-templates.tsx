import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";
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

export default function MessageTemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const [invoiceTemplates, setInvoiceTemplates] = useState<TemplateData[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<TemplateData[]>([]);
  const [backups, setBackups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
    initializeBackupDir();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const pickTemplateFile = async (type: 'invoice' | 'quotation') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
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

  const handlePreviewTemplate = (templateId: string) => {
    router.push(`/admin/template-preview?templateId=${templateId}`);
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      await createTemplateBackup();
      Alert.alert("Success", "Backup created successfully");
      loadTemplates();
    } catch (error) {
      Alert.alert("Error", "Failed to create backup");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (fileName: string) => {
    Alert.alert("Restore Backup", "Are you sure you want to restore this backup? Current templates will be replaced.", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Restore",
        onPress: async () => {
          try {
            setLoading(true);
            await restoreFromBackup(fileName);
            Alert.alert("Success", "Templates restored successfully");
            loadTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to restore backup");
          } finally {
            setLoading(false);
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

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: "600" }}>←</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Message Templates</Text>
        </View>

        {/* Invoice Templates */}
        <View className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-base font-semibold text-foreground mb-2">Invoice Templates</Text>

          {invoiceTemplates.length > 0 ? (
            <View className="gap-2 mb-3">
              {invoiceTemplates.map((template) => (
                <View
                  key={template.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    backgroundColor: colors.background,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 12 }}>
                      {template.fileName}
                    </Text>
                  </View>
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      onPress={() => handlePreviewTemplate(template.id)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.primary + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                        View
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTemplate(template.id, 'invoice')}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.error + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: '600' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted, marginBottom: 8, fontSize: 12 }}>No invoice templates</Text>
          )}

          <TouchableOpacity
            onPress={() => pickTemplateFile('invoice')}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600", fontSize: 12 }}>
              Upload Invoice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quotation Templates */}
        <View className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-base font-semibold text-foreground mb-2">Quotation Templates</Text>

          {quotationTemplates.length > 0 ? (
            <View className="gap-2 mb-3">
              {quotationTemplates.map((template) => (
                <View
                  key={template.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    backgroundColor: colors.background,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 12 }}>
                      {template.fileName}
                    </Text>
                  </View>
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      onPress={() => handlePreviewTemplate(template.id)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.primary + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                        View
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteTemplate(template.id, 'quotation')}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.error + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: '600' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted, marginBottom: 8, fontSize: 12 }}>No quotation templates</Text>
          )}

          <TouchableOpacity
            onPress={() => pickTemplateFile('quotation')}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600", fontSize: 12 }}>
              Upload Quotation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Backups */}
        <View className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-base font-semibold text-foreground mb-2">Backups</Text>

          <TouchableOpacity
            onPress={handleCreateBackup}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 8,
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600", fontSize: 12 }}>
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
                    paddingVertical: 8,
                    paddingHorizontal: 8,
                    backgroundColor: colors.background,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 11, flex: 1 }}>
                    {formatBackupDate(backup)}
                  </Text>
                  <View className="flex-row gap-1">
                    <TouchableOpacity
                      onPress={() => handleRestoreBackup(backup)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.primary + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
                        Restore
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteBackup(backup)}
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: colors.error + '20',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: colors.error, fontSize: 11, fontWeight: '600' }}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={{ color: colors.muted, fontSize: 12 }}>No backups yet</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

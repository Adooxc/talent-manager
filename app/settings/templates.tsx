import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MessageTemplate, DEFAULT_MESSAGE_TEMPLATES, generateId } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";
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
  const [activeTab, setActiveTab] = useState<'messages' | 'files'>('messages');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [content, setContent] = useState("");
  const [contentAr, setContentAr] = useState("");
  
  // File templates state
  const [invoiceTemplates, setInvoiceTemplates] = useState<TemplateData[]>([]);
  const [quotationTemplates, setQuotationTemplates] = useState<TemplateData[]>([]);
  const [backups, setBackups] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const loadTemplates = useCallback(async () => {
    const settings = await getSettings();
    if (settings.messageTemplates && settings.messageTemplates.length > 0) {
      setTemplates(settings.messageTemplates);
    } else {
      const defaultTemplates = DEFAULT_MESSAGE_TEMPLATES.map(t => ({
        ...t,
        id: generateId(),
      }));
      setTemplates(defaultTemplates);
      await saveSettings({ messageTemplates: defaultTemplates });
    }
  }, []);

  const loadFileTemplates = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const invoices = await getTemplatesByType('invoice');
      const quotations = await getTemplatesByType('quotation');
      const backupList = await getBackupList();
      
      setInvoiceTemplates(invoices);
      setQuotationTemplates(quotations);
      setBackups(backupList);
    } catch (error) {
      console.error("Failed to load file templates:", error);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
      initializeBackupDir();
      if (activeTab === 'files') {
        loadFileTemplates();
      }
    }, [loadTemplates, activeTab])
  );

  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setName("");
    setNameAr("");
    setContent("");
    setContentAr("");
    setShowModal(true);
  };

  const handleEditTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setName(template.name);
    setNameAr(template.nameAr || "");
    setContent(template.content);
    setContentAr(template.contentAr || "");
    setShowModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!name.trim() || !content.trim()) {
      Alert.alert("Error", "Please enter template name and content.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    let updatedTemplates: MessageTemplate[];

    if (editingTemplate) {
      updatedTemplates = templates.map(t =>
        t.id === editingTemplate.id
          ? { ...t, name, nameAr, content, contentAr }
          : t
      );
    } else {
      const newTemplate: MessageTemplate = {
        id: generateId(),
        name,
        nameAr,
        content,
        contentAr,
        type: 'custom',
      };
      updatedTemplates = [...templates, newTemplate];
    }

    setTemplates(updatedTemplates);
    await saveSettings({ messageTemplates: updatedTemplates });
    setShowModal(false);
  };

  const handleDeleteTemplate = (template: MessageTemplate) => {
    Alert.alert(
      "Delete Template",
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            const updatedTemplates = templates.filter(t => t.id !== template.id);
            setTemplates(updatedTemplates);
            await saveSettings({ messageTemplates: updatedTemplates });
          },
        },
      ]
    );
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
            loadFileTemplates();
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

  const handleDeleteFileTemplate = async (id: string, type: string) => {
    Alert.alert("Delete Template", `Are you sure you want to delete this ${type} template?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteTemplate(id);
            Alert.alert("Success", "Template deleted");
            loadFileTemplates();
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
      setLoadingFiles(true);
      await createTemplateBackup();
      Alert.alert("Success", "Backup created successfully");
      loadFileTemplates();
    } catch (error) {
      Alert.alert("Error", "Failed to create backup");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleRestoreBackup = async (fileName: string) => {
    Alert.alert("Restore Backup", "Are you sure you want to restore this backup? Current templates will be replaced.", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Restore",
        onPress: async () => {
          try {
            setLoadingFiles(true);
            await restoreFromBackup(fileName);
            Alert.alert("Success", "Templates restored successfully");
            loadFileTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to restore backup");
          } finally {
            setLoadingFiles(false);
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
            loadFileTemplates();
          } catch (error) {
            Alert.alert("Error", "Failed to delete backup");
          }
        },
      },
    ]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job_offer': return 'briefcase.fill';
      case 'booking_confirmation': return 'checkmark.circle.fill';
      case 'thank_you': return 'heart.fill';
      case 'reminder': return 'bell.fill';
      default: return 'doc.fill';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job_offer': return colors.primary;
      case 'booking_confirmation': return colors.success;
      case 'thank_you': return '#EC4899';
      case 'reminder': return colors.warning;
      default: return colors.muted;
    }
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Templates</Text>
        {activeTab === 'messages' && (
          <TouchableOpacity
            onPress={handleAddTemplate}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <IconSymbol name="plus" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          style={[styles.tab, activeTab === 'messages' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'messages' ? colors.primary : colors.muted }]}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { setActiveTab('files'); loadFileTemplates(); }}
          style={[styles.tab, activeTab === 'files' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Text style={[styles.tabLabel, { color: activeTab === 'files' ? colors.primary : colors.muted }]}>Files</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'messages' ? (
          <>
            <Text style={[styles.description, { color: colors.muted }]}>
              Create message templates for quick WhatsApp communication. Use {"{name}"}, {"{date}"}, {"{project}"}, {"{location}"}, {"{time}"} as placeholders.
            </Text>

            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleEditTemplate(template)}
                style={[styles.templateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={styles.templateHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: getTypeColor(template.type) + "20" }]}>
                    <IconSymbol name={getTypeIcon(template.type) as any} size={18} color={getTypeColor(template.type)} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: colors.foreground }]}>{template.name}</Text>
                    {template.nameAr && (
                      <Text style={[styles.templateNameAr, { color: colors.muted }]}>{template.nameAr}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteTemplate(template)}
                    style={styles.deleteButton}
                  >
                    <IconSymbol name="trash.fill" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.templateContent, { color: colors.muted }]} numberOfLines={2}>
                  {template.content}
                </Text>
              </TouchableOpacity>
            ))}

            {templates.length === 0 && (
              <View style={styles.emptyState}>
                <IconSymbol name="message.fill" size={48} color={colors.muted} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>No templates yet</Text>
                <Text style={[styles.emptySubtext, { color: colors.muted }]}>
                  Tap + to create your first message template
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {loadingFiles ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <>
                {/* Invoice Templates */}
                <View style={[styles.fileSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.fileSectionTitle, { color: colors.foreground }]}>Invoice Templates</Text>
                  {invoiceTemplates.length > 0 ? (
                    <View style={styles.fileList}>
                      {invoiceTemplates.map((template) => (
                        <View key={template.id} style={[styles.fileItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <View style={styles.fileInfo}>
                            <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{template.fileName}</Text>
                          </View>
                          <View style={styles.fileActions}>
                            <TouchableOpacity onPress={() => handlePreviewTemplate(template.id)} style={[styles.fileButton, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.primary }]}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteFileTemplate(template.id, 'invoice')} style={[styles.fileButton, { backgroundColor: colors.error + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyFileText, { color: colors.muted }]}>No invoice templates</Text>
                  )}
                  <TouchableOpacity onPress={() => pickTemplateFile('invoice')} style={[styles.uploadButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.uploadButtonText}>Upload Invoice</Text>
                  </TouchableOpacity>
                </View>

                {/* Quotation Templates */}
                <View style={[styles.fileSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.fileSectionTitle, { color: colors.foreground }]}>Quotation Templates</Text>
                  {quotationTemplates.length > 0 ? (
                    <View style={styles.fileList}>
                      {quotationTemplates.map((template) => (
                        <View key={template.id} style={[styles.fileItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <View style={styles.fileInfo}>
                            <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{template.fileName}</Text>
                          </View>
                          <View style={styles.fileActions}>
                            <TouchableOpacity onPress={() => handlePreviewTemplate(template.id)} style={[styles.fileButton, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.primary }]}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteFileTemplate(template.id, 'quotation')} style={[styles.fileButton, { backgroundColor: colors.error + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyFileText, { color: colors.muted }]}>No quotation templates</Text>
                  )}
                  <TouchableOpacity onPress={() => pickTemplateFile('quotation')} style={[styles.uploadButton, { backgroundColor: colors.primary }]}>
                    <Text style={styles.uploadButtonText}>Upload Quotation</Text>
                  </TouchableOpacity>
                </View>

                {/* Backups */}
                <View style={[styles.fileSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.fileSectionTitle, { color: colors.foreground }]}>Backups</Text>
                  <TouchableOpacity onPress={handleCreateBackup} style={[styles.uploadButton, { backgroundColor: colors.primary, marginBottom: 8 }]}>
                    <Text style={styles.uploadButtonText}>Create Backup</Text>
                  </TouchableOpacity>
                  {backups.length > 0 ? (
                    <View style={styles.fileList}>
                      {backups.map((backup) => (
                        <View key={backup} style={[styles.fileItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <View style={styles.fileInfo}>
                            <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>{formatBackupDate(backup)}</Text>
                          </View>
                          <View style={styles.fileActions}>
                            <TouchableOpacity onPress={() => handleRestoreBackup(backup)} style={[styles.fileButton, { backgroundColor: colors.primary + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.primary }]}>Restore</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteBackup(backup)} style={[styles.fileButton, { backgroundColor: colors.error + '20' }]}>
                              <Text style={[styles.fileButtonText, { color: colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.emptyFileText, { color: colors.muted }]}>No backups yet</Text>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingTemplate ? "Edit Template" : "New Template"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.foreground }]}>Name (English)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Job Offer"
                placeholderTextColor={colors.muted}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Name (Arabic)</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'right' }]}
                value={nameAr}
                onChangeText={setNameAr}
                placeholder="مثال: عرض عمل"
                placeholderTextColor={colors.muted}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Message (English)</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={content}
                onChangeText={setContent}
                placeholder="Hi {name}, I have an opportunity for you..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Message (Arabic)</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'right' }]}
                value={contentAr}
                onChangeText={setContentAr}
                placeholder="مرحباً {name}، لدي فرصة عمل لك..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />

              <View style={styles.placeholderInfo}>
                <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>Available Placeholders:</Text>
                <Text style={[styles.placeholderText, { color: colors.muted }]}>
                  {"{name}"} - Talent name{"\n"}
                  {"{date}"} - Date{"\n"}
                  {"{time}"} - Time{"\n"}
                  {"{project}"} - Project name
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.cancelButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveTemplate}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  templateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  templateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
  },
  templateNameAr: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  templateContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  fileSection: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileList: {
    gap: 6,
    marginBottom: 8,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500',
  },
  fileActions: {
    flexDirection: 'row',
    gap: 4,
  },
  fileButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fileButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyFileText: {
    fontSize: 12,
    marginBottom: 8,
  },
  uploadButton: {
    paddingVertical: 8,
    borderRadius: 6,
  },
  uploadButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  placeholderInfo: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  placeholderTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

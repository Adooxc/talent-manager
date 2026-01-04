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
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MessageTemplate, DEFAULT_MESSAGE_TEMPLATES, generateId } from "@/lib/types";
import { getSettings, saveSettings } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function MessageTemplatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [content, setContent] = useState("");
  const [contentAr, setContentAr] = useState("");

  const loadTemplates = useCallback(async () => {
    const settings = await getSettings();
    if (settings.messageTemplates && settings.messageTemplates.length > 0) {
      setTemplates(settings.messageTemplates);
    } else {
      // Initialize with default templates
      const defaultTemplates = DEFAULT_MESSAGE_TEMPLATES.map(t => ({
        ...t,
        id: generateId(),
      }));
      setTemplates(defaultTemplates);
      await saveSettings({ messageTemplates: defaultTemplates });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [loadTemplates])
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
        <Text style={[styles.title, { color: colors.foreground }]}>Message Templates</Text>
        <TouchableOpacity
          onPress={handleAddTemplate}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <IconSymbol name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                numberOfLines={4}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Message (Arabic)</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface, textAlign: 'right' }]}
                value={contentAr}
                onChangeText={setContentAr}
                placeholder="مرحباً {name}، لدي فرصة عمل لك..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
              />

              <View style={styles.placeholderInfo}>
                <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>Available Placeholders:</Text>
                <Text style={[styles.placeholderText, { color: colors.muted }]}>
                  {"{name}"} - Talent name{"\n"}
                  {"{date}"} - Date{"\n"}
                  {"{time}"} - Time{"\n"}
                  {"{project}"} - Project name{"\n"}
                  {"{location}"} - Location
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
  },
  placeholderInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 13,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

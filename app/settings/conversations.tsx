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
  FlatList,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ConversationLog, Talent, generateId } from "@/lib/types";
import { getTalents } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CONVERSATIONS_KEY = "talent_manager_conversations";

export default function ConversationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTalentId, setSelectedTalentId] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<'call' | 'whatsapp' | 'meeting' | 'other'>('call');
  const [filterTalentId, setFilterTalentId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [talentsData, conversationsData] = await Promise.all([
      getTalents(),
      AsyncStorage.getItem(CONVERSATIONS_KEY),
    ]);
    setTalents(talentsData);
    if (conversationsData) {
      setConversations(JSON.parse(conversationsData));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const saveConversations = async (data: ConversationLog[]) => {
    await AsyncStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(data));
  };

  const handleAddConversation = () => {
    setSelectedTalentId(filterTalentId || (talents.length > 0 ? talents[0].id : ""));
    setNotes("");
    setType('call');
    setShowModal(true);
  };

  const handleSaveConversation = async () => {
    if (!selectedTalentId || !notes.trim()) {
      Alert.alert("Error", "Please select a talent and enter notes.");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newConversation: ConversationLog = {
      id: generateId(),
      talentId: selectedTalentId,
      date: new Date().toISOString(),
      notes: notes.trim(),
      type,
    };

    const updated = [newConversation, ...conversations];
    setConversations(updated);
    await saveConversations(updated);
    setShowModal(false);
  };

  const handleDeleteConversation = (conv: ConversationLog) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this conversation log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            const updated = conversations.filter(c => c.id !== conv.id);
            setConversations(updated);
            await saveConversations(updated);
          },
        },
      ]
    );
  };

  const getTalentName = (talentId: string) => {
    const talent = talents.find(t => t.id === talentId);
    return talent?.name || "Unknown";
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'call': return 'phone.fill';
      case 'whatsapp': return 'message.fill';
      case 'meeting': return 'person.2.fill';
      default: return 'doc.fill';
    }
  };

  const getTypeColor = (t: string) => {
    switch (t) {
      case 'call': return colors.primary;
      case 'whatsapp': return '#25D366';
      case 'meeting': return colors.warning;
      default: return colors.muted;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredConversations = filterTalentId
    ? conversations.filter(c => c.talentId === filterTalentId)
    : conversations;

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Conversation Log</Text>
        <TouchableOpacity
          onPress={handleAddConversation}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <IconSymbol name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filter by Talent */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          onPress={() => setFilterTalentId(null)}
          style={[
            styles.filterChip,
            {
              backgroundColor: !filterTalentId ? colors.primary : colors.surface,
              borderColor: !filterTalentId ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.filterChipText, { color: !filterTalentId ? "#FFF" : colors.foreground }]}>
            All
          </Text>
        </TouchableOpacity>
        {talents.slice(0, 10).map((talent) => (
          <TouchableOpacity
            key={talent.id}
            onPress={() => setFilterTalentId(talent.id)}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterTalentId === talent.id ? colors.primary : colors.surface,
                borderColor: filterTalentId === talent.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterTalentId === talent.id ? "#FFF" : colors.foreground },
              ]}
              numberOfLines={1}
            >
              {talent.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        renderItem={({ item }) => (
          <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.logHeader}>
              <View style={[styles.typeIcon, { backgroundColor: getTypeColor(item.type || 'other') + "20" }]}>
                <IconSymbol name={getTypeIcon(item.type || 'other') as any} size={18} color={getTypeColor(item.type || 'other')} />
              </View>
              <View style={styles.logInfo}>
                <Text style={[styles.talentName, { color: colors.foreground }]}>
                  {getTalentName(item.talentId)}
                </Text>
                <Text style={[styles.logDate, { color: colors.muted }]}>
                  {formatDate(item.date)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteConversation(item)}
                style={styles.deleteButton}
              >
                <IconSymbol name="trash.fill" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.logNotes, { color: colors.foreground }]}>{item.notes}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="doc.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No conversation logs</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Tap + to log a call, meeting, or chat
            </Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Conversation</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.label, { color: colors.foreground }]}>Talent</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.talentPicker}
              >
                {talents.map((talent) => (
                  <TouchableOpacity
                    key={talent.id}
                    onPress={() => setSelectedTalentId(talent.id)}
                    style={[
                      styles.talentChip,
                      {
                        backgroundColor: selectedTalentId === talent.id ? colors.primary : colors.surface,
                        borderColor: selectedTalentId === talent.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.talentChipText,
                        { color: selectedTalentId === talent.id ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {talent.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { color: colors.foreground }]}>Type</Text>
              <View style={styles.typePicker}>
                {(['call', 'whatsapp', 'meeting', 'other'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: type === t ? getTypeColor(t) : colors.surface,
                        borderColor: type === t ? getTypeColor(t) : colors.border,
                      },
                    ]}
                  >
                    <IconSymbol
                      name={getTypeIcon(t) as any}
                      size={18}
                      color={type === t ? "#FFF" : colors.foreground}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        { color: type === t ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Notes</Text>
              <TextInput
                style={[styles.textArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="What was discussed..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={[styles.cancelButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveConversation}
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logInfo: {
    flex: 1,
    marginLeft: 12,
  },
  talentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  logDate: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  logNotes: {
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
  talentPicker: {
    flexDirection: "row",
  },
  talentChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  talentChipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  typePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    textAlignVertical: "top",
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

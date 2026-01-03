import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Category } from "@/lib/types";
import { getCategories, saveCategory, updateCategory, deleteCategory } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function CategoriesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    const data = await getCategories();
    setCategories(data.sort((a, b) => a.order - b.order));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setNameAr("");
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setNameAr(category.nameAr || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
        });
      } else {
        await saveCategory({
          name: name.trim(),
          nameAr: nameAr.trim() || undefined,
          order: categories.length + 1,
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowModal(false);
      loadCategories();
    } catch (error) {
      Alert.alert("Error", "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? Talents in this category will not be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteCategory(category.id);
            loadCategories();
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.foreground }]}>{item.name}</Text>
        {item.nameAr && (
          <Text style={[styles.categoryNameAr, { color: colors.muted }]}>{item.nameAr}</Text>
        )}
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.actionButton}>
          <IconSymbol name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
          <IconSymbol name="trash.fill" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Categories</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <IconSymbol name="plus" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder.fill" size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No categories yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Tap the + button to add your first category
            </Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {editingCategory ? "Edit Category" : "Add Category"}
              </Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <Text style={[styles.modalSave, { color: colors.primary, opacity: saving ? 0.5 : 1 }]}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Name (English)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., Models, Actors"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Name (Arabic) - Optional</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground, textAlign: "right" }]}
                  value={nameAr}
                  onChangeText={setNameAr}
                  placeholder="مثال: عارضين، ممثلين"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    fontSize: 17,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: "600",
  },
  categoryNameAr: {
    fontSize: 14,
    marginTop: 4,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalSave: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});

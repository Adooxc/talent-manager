import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, Talent, ProjectStatus, ProjectTalent } from "@/lib/types";
import { getProjectById, updateProject, getTalents, calculateProjectCosts } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

export default function EditProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [selectedTalents, setSelectedTalents] = useState<ProjectTalent[]>([]);
  const [profitMargin, setProfitMargin] = useState("15");
  const [saving, setSaving] = useState(false);
  
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [showTalentPicker, setShowTalentPicker] = useState(false);
  const [customPrices, setCustomPrices] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!id) return;
    const [project, talents] = await Promise.all([
      getProjectById(id),
      getTalents(),
    ]);
    
    if (project) {
      setName(project.name);
      setDescription(project.description);
      setStartDate(project.startDate);
      setEndDate(project.endDate);
      setStatus(project.status);
      setSelectedTalents(project.talents);
      setProfitMargin(project.profitMarginPercent.toString());
      
      // Set custom prices
      const prices: Record<string, string> = {};
      project.talents.forEach((pt) => {
        if (pt.customPrice !== undefined) {
          prices[pt.talentId] = pt.customPrice.toString();
        }
      });
      setCustomPrices(prices);
    }
    setAllTalents(talents);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleTalentSelection = (talentId: string) => {
    const isSelected = selectedTalents.some((t) => t.talentId === talentId);
    if (isSelected) {
      setSelectedTalents(selectedTalents.filter((t) => t.talentId !== talentId));
    } else {
      setSelectedTalents([...selectedTalents, { talentId }]);
    }
  };

  const updateCustomPrice = (talentId: string, price: string) => {
    setCustomPrices({ ...customPrices, [talentId]: price });
    const priceNum = parseFloat(price);
    if (!isNaN(priceNum)) {
      setSelectedTalents(
        selectedTalents.map((t) =>
          t.talentId === talentId ? { ...t, customPrice: priceNum } : t
        )
      );
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a project name");
      return;
    }

    if (selectedTalents.length === 0) {
      Alert.alert("Error", "Please select at least one talent");
      return;
    }

    setSaving(true);
    try {
      await updateProject(id!, {
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        status,
        talents: selectedTalents,
        profitMarginPercent: parseFloat(profitMargin) || 0,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const costs = calculateProjectCosts(
    allTalents,
    selectedTalents,
    parseFloat(profitMargin) || 0
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "numeric";
      multiline?: boolean;
      prefix?: string;
      suffix?: string;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {options?.prefix && (
          <Text style={[styles.inputPrefix, { color: colors.muted }]}>{options.prefix}</Text>
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.foreground },
            options?.multiline && styles.multilineInput,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={options?.keyboardType || "default"}
          multiline={options?.multiline}
          returnKeyType={options?.multiline ? "default" : "done"}
        />
        {options?.suffix && (
          <Text style={[styles.inputSuffix, { color: colors.muted }]}>{options.suffix}</Text>
        )}
      </View>
    </View>
  );

  const renderTalentPickerItem = ({ item }: { item: Talent }) => {
    const isSelected = selectedTalents.some((t) => t.talentId === item.id);
    return (
      <Pressable
        onPress={() => toggleTalentSelection(item.id)}
        style={({ pressed }) => [
          styles.talentPickerItem,
          { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.talentPickerImage} contentFit="cover" />
        ) : (
          <View style={[styles.talentPickerPlaceholder, { backgroundColor: colors.muted }]}>
            <IconSymbol name="person.2.fill" size={20} color={colors.background} />
          </View>
        )}
        <View style={styles.talentPickerInfo}>
          <Text style={[styles.talentPickerName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.talentPickerPrice, { color: colors.muted }]}>
            ${item.pricePerProject.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.checkbox, { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : "transparent" }]}>
          {isSelected && <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Project</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, { opacity: saving ? 0.5 : 1 }]}
          >
            <Text style={[styles.saveText, { color: colors.primary }]}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Project Details</Text>
            {renderInput("Project Name", name, setName, "Enter project name")}
            {renderInput("Description", description, setDescription, "Enter description (optional)", { multiline: true })}
            
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                {renderInput("Start Date", startDate, setStartDate, "YYYY-MM-DD")}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                {renderInput("End Date", endDate, setEndDate, "YYYY-MM-DD")}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Status</Text>
              <View style={styles.statusContainer}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setStatus(opt.value)}
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor: status === opt.value ? colors.primary : colors.surface,
                        borderColor: status === opt.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        { color: status === opt.value ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Talents */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Talents</Text>
              <TouchableOpacity
                onPress={() => setShowTalentPicker(true)}
                style={[styles.addTalentButton, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={18} color="#FFF" />
                <Text style={styles.addTalentText}>Add</Text>
              </TouchableOpacity>
            </View>

            {selectedTalents.length === 0 ? (
              <View style={[styles.emptyTalents, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.muted }]}>No talents selected</Text>
              </View>
            ) : (
              selectedTalents.map((pt) => {
                const talent = allTalents.find((t) => t.id === pt.talentId);
                if (!talent) return null;
                return (
                  <View
                    key={pt.talentId}
                    style={[styles.selectedTalent, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {talent.profilePhoto ? (
                      <Image source={{ uri: talent.profilePhoto }} style={styles.selectedTalentImage} contentFit="cover" />
                    ) : (
                      <View style={[styles.selectedTalentPlaceholder, { backgroundColor: colors.muted }]}>
                        <IconSymbol name="person.2.fill" size={20} color={colors.background} />
                      </View>
                    )}
                    <View style={styles.selectedTalentInfo}>
                      <Text style={[styles.selectedTalentName, { color: colors.foreground }]}>{talent.name}</Text>
                      <View style={styles.priceInputRow}>
                        <Text style={[styles.priceLabel, { color: colors.muted }]}>$</Text>
                        <TextInput
                          style={[styles.priceInput, { color: colors.foreground, borderColor: colors.border }]}
                          value={customPrices[pt.talentId] ?? talent.pricePerProject.toString()}
                          onChangeText={(v) => updateCustomPrice(pt.talentId, v)}
                          keyboardType="numeric"
                          placeholder={talent.pricePerProject.toString()}
                          placeholderTextColor={colors.muted}
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleTalentSelection(pt.talentId)}
                      style={styles.removeTalentButton}
                    >
                      <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Cost Calculation */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cost Calculation</Text>
            
            {renderInput("Profit Margin", profitMargin, setProfitMargin, "15", {
              keyboardType: "numeric",
              suffix: "%",
            })}

            <View style={[styles.costSummary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.muted }]}>Subtotal (Talents)</Text>
                <Text style={[styles.costValue, { color: colors.foreground }]}>${costs.subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: colors.muted }]}>Profit ({profitMargin}%)</Text>
                <Text style={[styles.costValue, { color: colors.success }]}>+${costs.profit.toLocaleString()}</Text>
              </View>
              <View style={[styles.costRow, styles.totalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>${costs.total.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Talent Picker Modal */}
      <Modal visible={showTalentPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowTalentPicker(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Talents</Text>
            <TouchableOpacity onPress={() => setShowTalentPicker(false)}>
              <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={allTalents}
            renderItem={renderTalentPickerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalList}
          />
        </View>
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
  saveButton: {
    paddingHorizontal: 8,
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputPrefix: {
    fontSize: 16,
    marginRight: 4,
  },
  inputSuffix: {
    fontSize: 16,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
  },
  statusContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  addTalentButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addTalentText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTalents: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  selectedTalent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedTalentImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  selectedTalentPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedTalentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedTalentName: {
    fontSize: 16,
    fontWeight: "500",
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 14,
  },
  priceInput: {
    fontSize: 14,
    borderBottomWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  removeTalentButton: {
    padding: 4,
  },
  costSummary: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  costLabel: {
    fontSize: 15,
  },
  costValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalDone: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalList: {
    padding: 16,
  },
  talentPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  talentPickerImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  talentPickerPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  talentPickerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  talentPickerName: {
    fontSize: 16,
    fontWeight: "500",
  },
  talentPickerPrice: {
    fontSize: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

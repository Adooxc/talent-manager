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
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, TalentCategory, SocialMedia } from "@/lib/types";
import { getTalentById, updateTalent, markTalentPhotoUpdated } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const CATEGORIES: { value: TalentCategory; label: string }[] = [
  { value: "model", label: "Model" },
  { value: "artist", label: "Artist" },
  { value: "both", label: "Both" },
];

export default function EditTalentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TalentCategory>("model");
  const [photos, setPhotos] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({});
  const [pricePerProject, setPricePerProject] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [originalPhotos, setOriginalPhotos] = useState<string[]>([]);

  const loadTalent = useCallback(async () => {
    if (!id) return;
    const talent = await getTalentById(id);
    if (talent) {
      setName(talent.name);
      setCategory(talent.category);
      setPhotos(talent.photos);
      setOriginalPhotos(talent.photos);
      setPhoneNumbers(talent.phoneNumbers.length > 0 ? talent.phoneNumbers : [""]);
      setSocialMedia(talent.socialMedia);
      setPricePerProject(talent.pricePerProject.toString());
      setNotes(talent.notes);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTalent();
    }, [loadTalent])
  );

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset: ImagePicker.ImagePickerAsset) => asset.uri);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  const removePhoneNumber = (index: number) => {
    if (phoneNumbers.length > 1) {
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    }
  };

  const updateSocialMediaField = (key: keyof SocialMedia, value: string) => {
    setSocialMedia({ ...socialMedia, [key]: value });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (photos.length === 0) {
      Alert.alert("Error", "Please add at least one photo");
      return;
    }

    const price = parseFloat(pricePerProject) || 0;
    const photosChanged = JSON.stringify(photos) !== JSON.stringify(originalPhotos);

    setSaving(true);
    try {
      const updates: Partial<Talent> = {
        name: name.trim(),
        category,
        photos,
        profilePhoto: photos[0],
        phoneNumbers: phoneNumbers.filter((p) => p.trim()),
        socialMedia,
        pricePerProject: price,
        notes: notes.trim(),
      };

      await updateTalent(id!, updates);
      
      if (photosChanged) {
        await markTalentPhotoUpdated(id!);
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update talent");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    options?: {
      keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
      multiline?: boolean;
      prefix?: string;
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
      </View>
    </View>
  );

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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Edit Talent</Text>
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
          {/* Photos Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Photos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosContainer}
            >
              <TouchableOpacity
                onPress={pickImages}
                style={[styles.addPhotoButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <IconSymbol name="camera.fill" size={32} color={colors.primary} />
                <Text style={[styles.addPhotoText, { color: colors.primary }]}>Add Photos</Text>
              </TouchableOpacity>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                  {index === 0 && (
                    <View style={[styles.mainBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removePhoto(index)}
                    style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                  >
                    <IconSymbol name="xmark.circle.fill" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Basic Info</Text>
            {renderInput("Name", name, setName, "Enter name")}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setCategory(cat.value)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: category === cat.value ? colors.primary : colors.surface,
                        borderColor: category === cat.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: category === cat.value ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderInput("Price per Project", pricePerProject, setPricePerProject, "0", {
              keyboardType: "numeric",
              prefix: "$",
            })}
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact</Text>
            {phoneNumbers.map((phone, index) => (
              <View key={index} style={styles.phoneRow}>
                <View style={{ flex: 1 }}>
                  {renderInput(
                    index === 0 ? "Phone Numbers" : "",
                    phone,
                    (value) => updatePhoneNumber(index, value),
                    "Enter phone number",
                    { keyboardType: "phone-pad" }
                  )}
                </View>
                {phoneNumbers.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removePhoneNumber(index)}
                    style={[styles.removeButton, { marginTop: index === 0 ? 28 : 0 }]}
                  >
                    <IconSymbol name="xmark.circle.fill" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={addPhoneNumber} style={styles.addButton}>
              <IconSymbol name="plus" size={20} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Phone Number</Text>
            </TouchableOpacity>
          </View>

          {/* Social Media */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Social Media</Text>
            {renderInput("Instagram", socialMedia.instagram || "", (v) => updateSocialMediaField("instagram", v), "@username")}
            {renderInput("TikTok", socialMedia.tiktok || "", (v) => updateSocialMediaField("tiktok", v), "@username")}
            {renderInput("Twitter/X", socialMedia.twitter || "", (v) => updateSocialMediaField("twitter", v), "@username")}
            {renderInput("Facebook", socialMedia.facebook || "", (v) => updateSocialMediaField("facebook", v), "Profile URL")}
            {renderInput("YouTube", socialMedia.youtube || "", (v) => updateSocialMediaField("youtube", v), "Channel URL")}
            {renderInput("Other", socialMedia.other || "", (v) => updateSocialMediaField("other", v), "Other link")}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            {renderInput("Notes", notes, setNotes, "Add any additional notes...", { multiline: true })}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  photosContainer: {
    gap: 12,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  mainBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  removePhotoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
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
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  removeButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

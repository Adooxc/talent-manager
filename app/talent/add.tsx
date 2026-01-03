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
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Gender, SocialMedia, Category, CURRENCIES, TalentCustomFields, PREDEFINED_TAGS } from "@/lib/types";
import { saveTalent, getCategories, getSettings } from "@/lib/storage";

const GENDERS: { value: Gender; label: string; labelAr: string }[] = [
  { value: "male", label: "Male", labelAr: "رجال" },
  { value: "female", label: "Female", labelAr: "نساء" },
];

export default function AddTalentScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [photos, setPhotos] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([""]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({});
  const [pricePerProject, setPricePerProject] = useState("");
  const [currency, setCurrency] = useState("KWD");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // New fields
  const [customFields, setCustomFields] = useState<TalentCustomFields>({});
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);

  const loadData = useCallback(async () => {
    const [cats, settings] = await Promise.all([getCategories(), getSettings()]);
    setCategories(cats);
    setCurrency(settings.defaultCurrency);
    if (cats.length > 0 && !categoryId) {
      setCategoryId(cats[0].id);
    }
  }, [categoryId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset) => asset.uri);
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

  const updateSocialMedia = (key: keyof SocialMedia, value: string) => {
    setSocialMedia({ ...socialMedia, [key]: value });
  };

  const updateCustomField = (key: keyof TalentCustomFields, value: any) => {
    setCustomFields({ ...customFields, [key]: value });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag("");
    }
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

    if (!categoryId) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    const price = parseFloat(pricePerProject) || 0;

    setSaving(true);
    try {
      await saveTalent({
        name: name.trim(),
        categoryId,
        gender,
        photos,
        profilePhoto: photos[0],
        phoneNumbers: phoneNumbers.filter((p) => p.trim()),
        socialMedia,
        pricePerProject: price,
        currency,
        notes: notes.trim(),
        customFields,
        rating: rating > 0 ? rating : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        isFavorite: false,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to save talent");
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

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;
  const displayCurrencies = showAllCurrencies ? CURRENCIES : CURRENCIES.slice(0, 3);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Talent</Text>
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
            
            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Gender</Text>
              <View style={styles.categoryContainer}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setGender(g.value)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: gender === g.value ? colors.primary : colors.surface,
                        borderColor: gender === g.value ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: gender === g.value ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: categoryId === cat.id ? colors.primary : colors.surface,
                        borderColor: categoryId === cat.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: categoryId === cat.id ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Rating */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star === rating ? 0 : star)}>
                    <IconSymbol
                      name="star.fill"
                      size={32}
                      color={star <= rating ? "#F59E0B" : colors.border}
                    />
                  </TouchableOpacity>
                ))}
                {rating > 0 && (
                  <Text style={[styles.ratingText, { color: colors.muted }]}>{rating}/5</Text>
                )}
              </View>
            </View>

            {/* Price with Currency */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Price per Project</Text>
              <View style={styles.priceRow}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}>
                  <Text style={[styles.inputPrefix, { color: colors.muted }]}>{currencySymbol}</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={pricePerProject}
                    onChangeText={setPricePerProject}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    returnKeyType="done"
                  />
                </View>
              </View>
              <View style={styles.currencyRow}>
                {displayCurrencies.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => setCurrency(c.code)}
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor: currency === c.code ? colors.primary : colors.surface,
                        borderColor: currency === c.code ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        { color: currency === c.code ? "#FFF" : colors.foreground },
                      ]}
                    >
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
                {!showAllCurrencies && (
                  <TouchableOpacity onPress={() => setShowAllCurrencies(true)} style={styles.moreButton}>
                    <Text style={[styles.moreButtonText, { color: colors.primary }]}>More</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {PREDEFINED_TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[
                    styles.tagButton,
                    {
                      backgroundColor: selectedTags.includes(tag) ? colors.primary : colors.surface,
                      borderColor: selectedTags.includes(tag) ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      { color: selectedTags.includes(tag) ? "#FFF" : colors.foreground },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
              {selectedTags.filter(t => !PREDEFINED_TAGS.includes(t)).map((tag) => (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.tagButtonText, { color: "#FFF" }]}>{tag}</Text>
                  <IconSymbol name="xmark" size={12} color="#FFF" />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customTagRow}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, flex: 1 }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={customTag}
                  onChangeText={setCustomTag}
                  placeholder="Add custom tag..."
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  onSubmitEditing={addCustomTag}
                />
              </View>
              <TouchableOpacity
                onPress={addCustomTag}
                style={[styles.addTagButton, { backgroundColor: colors.primary }]}
              >
                <IconSymbol name="plus" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Custom Fields */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                {renderInput("Height", customFields.height || "", (v) => updateCustomField("height", v), "e.g., 175 cm")}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("Weight", customFields.weight || "", (v) => updateCustomField("weight", v), "e.g., 70 kg")}
              </View>
            </View>
            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                {renderInput("Age", customFields.age?.toString() || "", (v) => updateCustomField("age", parseInt(v) || undefined), "e.g., 25", { keyboardType: "numeric" })}
              </View>
              <View style={{ flex: 1 }}>
                {renderInput("Hair Color", customFields.hairColor || "", (v) => updateCustomField("hairColor", v), "e.g., Black")}
              </View>
            </View>
            {renderInput("Eye Color", customFields.eyeColor || "", (v) => updateCustomField("eyeColor", v), "e.g., Brown")}
            {renderInput("Nationality", customFields.nationality || "", (v) => updateCustomField("nationality", v), "e.g., Kuwaiti")}
            {renderInput("Location", customFields.location || "", (v) => updateCustomField("location", v), "e.g., Kuwait City")}
            {renderInput("Languages", customFields.languages?.join(", ") || "", (v) => updateCustomField("languages", v.split(",").map(l => l.trim()).filter(l => l)), "e.g., Arabic, English")}
            {renderInput("Experience", customFields.experience || "", (v) => updateCustomField("experience", v), "e.g., 5 years")}
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
            {renderInput("Instagram", socialMedia.instagram || "", (v) => updateSocialMedia("instagram", v), "@username")}
            {renderInput("TikTok", socialMedia.tiktok || "", (v) => updateSocialMedia("tiktok", v), "@username")}
            {renderInput("Snapchat", socialMedia.snapchat || "", (v) => updateSocialMedia("snapchat", v), "@username")}
            {renderInput("Twitter/X", socialMedia.twitter || "", (v) => updateSocialMedia("twitter", v), "@username")}
            {renderInput("YouTube", socialMedia.youtube || "", (v) => updateSocialMedia("youtube", v), "Channel URL")}
            {renderInput("Facebook", socialMedia.facebook || "", (v) => updateSocialMedia("facebook", v), "Profile URL")}
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
    paddingRight: 20,
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: "500",
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
    borderRadius: 8,
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
    paddingTop: 14,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  currencyButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  moreButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  tagButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  customTagRow: {
    flexDirection: "row",
    gap: 12,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldsRow: {
    flexDirection: "row",
    gap: 12,
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
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});

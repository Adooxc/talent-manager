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
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Gender, SocialMedia, Category, CURRENCIES, PhoneNumber } from "@/lib/types";
import { getTalentById, updateTalent, getCategories } from "@/lib/storage";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function EditTalentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [photos, setPhotos] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([{ number: "", countryCode: "+965", country: "Kuwait" }]);
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({});
  const [pricePerProject, setPricePerProject] = useState("");
  const [currency, setCurrency] = useState("KWD");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [talent, cats] = await Promise.all([getTalentById(id), getCategories()]);
    setCategories(cats);
    
    if (talent) {
      setName(talent.name);
      setCategoryId(talent.categoryId);
      setGender(talent.gender);
      setPhotos(talent.photos);
      const formattedPhones: PhoneNumber[] = talent.phoneNumbers.map(phone => {
        if (typeof phone === 'string') {
          return { number: phone, countryCode: "+965", country: "Kuwait" };
        }
        return phone;
      });
      setPhoneNumbers(formattedPhones.length > 0 ? formattedPhones : [{ number: "", countryCode: "+965", country: "Kuwait" }]);
      setSocialMedia(talent.socialMedia);
      setPricePerProject(talent.pricePerProject.toString());
      setCurrency(talent.currency);
      setNotes(talent.notes);
    }
  }, [id]);

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
    setPhoneNumbers([...phoneNumbers, { number: "", countryCode: "+965", country: "Kuwait" }]);
  };

  const updatePhoneNumber = (index: number, field: 'number' | 'countryCode' | 'country', value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setPhoneNumbers(updated);
  };

  const updatePhoneCountryCode = (index: number, countryCode: string, country: string) => {
    const updated = [...phoneNumbers];
    updated[index] = { ...updated[index], countryCode, country };
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

    setSaving(true);
    try {
      await updateTalent(id!, {
        name: name.trim(),
        categoryId,
        gender,
        photos,
        profilePhoto: photos[0],
        phoneNumbers: phoneNumbers.filter((p) => p.number && p.number.trim()),
        socialMedia,
        pricePerProject: price,
        currency,
        notes: notes.trim(),
      });

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

  const currencySymbol = CURRENCIES.find(c => c.code === currency)?.symbol || currency;

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
                <View style={styles.currencyPicker}>
                  {CURRENCIES.slice(0, 2).map((c) => (
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
                </View>
              </View>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact</Text>
            {phoneNumbers.map((phone, index) => (
              <View key={index}>
                <View style={styles.phoneRow}>
                  <View style={{ flex: 1 }}>
                    {renderInput(
                      index === 0 ? "Phone Numbers" : "",
                      phone.number,
                      (value) => updatePhoneNumber(index, 'number', value),
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
                <View style={styles.countryCodeRow}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Country Code</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                    placeholder="+965"
                    placeholderTextColor={colors.muted}
                    value={phone.countryCode}
                    onChangeText={(value) => updatePhoneNumber(index, 'countryCode', value)}
                  />
                </View>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    gap: 12,
  },
  currencyPicker: {
    flexDirection: "row",
    gap: 8,
  },
  currencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  countryCodeRow: {
    marginTop: 12,
    marginBottom: 16,
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

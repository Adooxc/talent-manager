import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, TalentCategory } from "@/lib/types";
import { getTalentById, deleteTalent, needsPhotoUpdate } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const CATEGORY_LABELS: Record<TalentCategory, string> = {
  model: "Model",
  artist: "Artist",
  both: "Model & Artist",
};

const CATEGORY_COLORS: Record<TalentCategory, string> = {
  model: "#6366F1",
  artist: "#EC4899",
  both: "#8B5CF6",
};

export default function TalentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const loadTalent = useCallback(async () => {
    if (!id) return;
    const data = await getTalentById(id);
    setTalent(data);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTalent();
    }, [loadTalent])
  );

  const handleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/talent/edit/${id}` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Talent",
      `Are you sure you want to delete ${talent?.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteTalent(id!);
            router.back();
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenSocial = (url: string) => {
    if (url.startsWith("@")) {
      // Handle username format
      Linking.openURL(`https://instagram.com/${url.replace("@", "")}`);
    } else if (!url.startsWith("http")) {
      Linking.openURL(`https://${url}`);
    } else {
      Linking.openURL(url);
    }
  };

  if (!talent) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.primary} />
            <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const needsUpdate = needsPhotoUpdate(talent);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <IconSymbol name="pencil" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <IconSymbol name="trash.fill" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery */}
        <View style={styles.galleryContainer}>
          <Image
            source={{ uri: talent.photos[selectedPhotoIndex] || talent.profilePhoto }}
            style={styles.mainPhoto}
            contentFit="cover"
          />
          {needsUpdate && (
            <View style={[styles.updateBadge, { backgroundColor: colors.warning }]}>
              <IconSymbol name="bell.fill" size={14} color="#FFF" />
              <Text style={styles.updateBadgeText}>Needs Update</Text>
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[talent.category] }]}>
            <Text style={styles.categoryText}>{CATEGORY_LABELS[talent.category]}</Text>
          </View>
        </View>

        {talent.photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {talent.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedPhotoIndex(index)}
                style={[
                  styles.thumbnail,
                  {
                    borderColor: selectedPhotoIndex === index ? colors.primary : colors.border,
                    borderWidth: selectedPhotoIndex === index ? 2 : 1,
                  },
                ]}
              >
                <Image source={{ uri: photo }} style={styles.thumbnailImage} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Name and Price */}
        <View style={styles.infoSection}>
          <Text style={[styles.name, { color: colors.foreground }]}>{talent.name}</Text>
          <View style={[styles.priceContainer, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.primary} />
            <Text style={[styles.price, { color: colors.primary }]}>
              ${talent.pricePerProject.toLocaleString()} / project
            </Text>
          </View>
        </View>

        {/* Contact */}
        {talent.phoneNumbers.length > 0 && talent.phoneNumbers[0] && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact</Text>
            {talent.phoneNumbers.filter(p => p).map((phone, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleCall(phone)}
                style={[styles.contactRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.success + "20" }]}>
                  <IconSymbol name="phone.fill" size={18} color={colors.success} />
                </View>
                <Text style={[styles.contactText, { color: colors.foreground }]}>{phone}</Text>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Social Media */}
        {Object.entries(talent.socialMedia).some(([_, value]) => value) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Social Media</Text>
            {Object.entries(talent.socialMedia).map(([key, value]) => {
              if (!value) return null;
              const labels: Record<string, string> = {
                instagram: "Instagram",
                tiktok: "TikTok",
                twitter: "Twitter/X",
                facebook: "Facebook",
                youtube: "YouTube",
                other: "Other",
              };
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleOpenSocial(value)}
                  style={[styles.contactRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.contactIcon, { backgroundColor: colors.primary + "20" }]}>
                    <IconSymbol name="link" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.socialContent}>
                    <Text style={[styles.socialLabel, { color: colors.muted }]}>{labels[key]}</Text>
                    <Text style={[styles.contactText, { color: colors.foreground }]}>{value}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={colors.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Notes */}
        {talent.notes && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            <View style={[styles.notesContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.notesText, { color: colors.foreground }]}>{talent.notes}</Text>
            </View>
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={[styles.metadataText, { color: colors.muted }]}>
            Added: {new Date(talent.createdAt).toLocaleDateString()}
          </Text>
          <Text style={[styles.metadataText, { color: colors.muted }]}>
            Last photo update: {new Date(talent.lastPhotoUpdate).toLocaleDateString()}
          </Text>
        </View>
      </ScrollView>
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
  headerActions: {
    flexDirection: "row",
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  galleryContainer: {
    position: "relative",
    aspectRatio: 1,
  },
  mainPhoto: {
    width: "100%",
    height: "100%",
  },
  updateBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  updateBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  categoryBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 8,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  socialContent: {
    flex: 1,
    marginLeft: 12,
  },
  socialLabel: {
    fontSize: 12,
  },
  notesContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metadata: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  metadataText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

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
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, Category, CURRENCIES } from "@/lib/types";
import { getTalentById, deleteTalent, needsPhotoUpdate, getCategories, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function TalentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const loadTalent = useCallback(async () => {
    if (!id) return;
    const [data, cats] = await Promise.all([getTalentById(id), getCategories()]);
    setTalent(data);
    if (data) {
      const cat = cats.find(c => c.id === data.categoryId);
      setCategory(cat || null);
    }
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

  const handleCalendar = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/talent/calendar/${id}` as any);
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

  const handleWhatsApp = (phone: string) => {
    // Remove any non-numeric characters except +
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    // Remove leading + if present for WhatsApp URL
    const whatsappPhone = cleanPhone.startsWith('+') ? cleanPhone.substring(1) : cleanPhone;
    // Custom message template
    const message = encodeURIComponent(`مرحباً ${talent?.name}، أتواصل معك بخصوص فرصة عمل...`);
    Linking.openURL(`https://wa.me/${whatsappPhone}?text=${message}`);
  };

  const handleCopyPhone = async (phone: string) => {
    await Clipboard.setStringAsync(phone);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert("Copied!", `Phone number ${phone} copied to clipboard`);
  };

  const handleSocialMedia = (url: string) => {
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }
    Linking.openURL(url);
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
  const currencySymbol = getCurrencySymbol(talent.currency);

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleCalendar} style={styles.headerButton}>
            <IconSymbol name="calendar" size={22} color={colors.primary} />
          </TouchableOpacity>
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
        {/* Main Photo */}
        <View style={styles.mainPhotoContainer}>
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
          {category && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.categoryText}>{category.name}</Text>
            </View>
          )}
          <View style={[styles.genderBadge, { backgroundColor: talent.gender === 'male' ? '#3B82F6' : '#EC4899' }]}>
            <Text style={styles.genderText}>{talent.gender === 'male' ? 'Male' : 'Female'}</Text>
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
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.foreground }]}>{talent.name}</Text>
            {talent.isFavorite && (
              <IconSymbol name="heart.fill" size={24} color="#EF4444" />
            )}
          </View>
          {talent.rating && talent.rating > 0 && (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IconSymbol
                  key={star}
                  name="star.fill"
                  size={18}
                  color={star <= talent.rating! ? "#F59E0B" : colors.border}
                />
              ))}
              <Text style={[styles.ratingText, { color: colors.muted }]}>{talent.rating}/5</Text>
            </View>
          )}
          <View style={[styles.priceContainer, { backgroundColor: colors.primary + "15" }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.primary} />
            <Text style={[styles.price, { color: colors.primary }]}>
              {currencySymbol} {talent.pricePerProject.toLocaleString()} / project
            </Text>
          </View>
        </View>

        {/* Tags */}
        {talent.tags && talent.tags.length > 0 && (
          <View style={styles.tagsSection}>
            {talent.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Custom Fields */}
        {talent.customFields && Object.values(talent.customFields).some(v => v) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>
            <View style={[styles.detailsGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {talent.customFields.age && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Age</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.age} years</Text>
                </View>
              )}
              {talent.customFields.height && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Height</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.height}</Text>
                </View>
              )}
              {talent.customFields.weight && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Weight</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.weight}</Text>
                </View>
              )}
              {talent.customFields.hairColor && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Hair Color</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.hairColor}</Text>
                </View>
              )}
              {talent.customFields.eyeColor && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Eye Color</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.eyeColor}</Text>
                </View>
              )}
              {talent.customFields.nationality && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Nationality</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.nationality}</Text>
                </View>
              )}
              {talent.customFields.location && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.location}</Text>
                </View>
              )}
              {talent.customFields.experience && (
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Experience</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.experience}</Text>
                </View>
              )}
              {talent.customFields.languages && talent.customFields.languages.length > 0 && (
                <View style={[styles.detailItem, { width: '100%' }]}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Languages</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{talent.customFields.languages.join(', ')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Contact */}
        {talent.phoneNumbers.length > 0 && talent.phoneNumbers[0] && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Contact</Text>
            {talent.phoneNumbers.filter(p => p).map((phone, index) => (
              <View key={index} style={[styles.contactRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => handleWhatsApp(phone)}
                  style={[styles.contactIcon, { backgroundColor: "#25D36620" }]}
                >
                  <Text style={{ fontSize: 18 }}>💬</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleWhatsApp(phone)}
                  style={styles.contactTextContainer}
                >
                  <Text style={[styles.contactText, { color: colors.foreground }]}>{phone}</Text>
                  <Text style={[styles.contactHint, { color: colors.muted }]}>Tap to WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCopyPhone(phone)}
                  style={[styles.actionButton, { backgroundColor: colors.primary + "20" }]}
                >
                  <IconSymbol name="doc.on.doc.fill" size={16} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCall(phone)}
                  style={[styles.actionButton, { backgroundColor: colors.success + "20" }]}
                >
                  <IconSymbol name="phone.fill" size={18} color={colors.success} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Social Media */}
        {Object.keys(talent.socialMedia).some(key => (talent.socialMedia as any)[key]) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Social Media</Text>
            {talent.socialMedia.instagram && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(`instagram.com/${talent.socialMedia.instagram?.replace('@', '')}`)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#E1306C20" }]}>
                  <Text style={styles.socialEmoji}>📷</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>Instagram</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]}>{talent.socialMedia.instagram}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            {talent.socialMedia.tiktok && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(`tiktok.com/${talent.socialMedia.tiktok?.replace('@', '')}`)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#00000020" }]}>
                  <Text style={styles.socialEmoji}>🎵</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>TikTok</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]}>{talent.socialMedia.tiktok}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            {talent.socialMedia.snapchat && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(`snapchat.com/add/${talent.socialMedia.snapchat?.replace('@', '')}`)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#FFFC0020" }]}>
                  <Text style={styles.socialEmoji}>👻</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>Snapchat</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]}>{talent.socialMedia.snapchat}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            {talent.socialMedia.twitter && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(`twitter.com/${talent.socialMedia.twitter?.replace('@', '')}`)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#1DA1F220" }]}>
                  <Text style={styles.socialEmoji}>𝕏</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>Twitter/X</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]}>{talent.socialMedia.twitter}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            {talent.socialMedia.youtube && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(talent.socialMedia.youtube!)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#FF000020" }]}>
                  <Text style={styles.socialEmoji}>▶️</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>YouTube</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]} numberOfLines={1}>{talent.socialMedia.youtube}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
            {talent.socialMedia.facebook && (
              <TouchableOpacity
                onPress={() => handleSocialMedia(talent.socialMedia.facebook!)}
                style={[styles.socialRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.socialIcon, { backgroundColor: "#1877F220" }]}>
                  <Text style={styles.socialEmoji}>📘</Text>
                </View>
                <View style={styles.socialInfo}>
                  <Text style={[styles.socialLabel, { color: colors.muted }]}>Facebook</Text>
                  <Text style={[styles.socialHandle, { color: colors.foreground }]} numberOfLines={1}>{talent.socialMedia.facebook}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </TouchableOpacity>
            )}
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
  mainPhotoContainer: {
    position: "relative",
    width: "100%",
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
    fontSize: 12,
    fontWeight: "600",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  genderBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  genderText: {
    color: "#FFF",
    fontSize: 14,
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
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  tagsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: "500",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailItem: {
    width: "50%",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 28,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactText: {
    fontSize: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactHint: {
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  socialEmoji: {
    fontSize: 18,
  },
  socialInfo: {
    flex: 1,
  },
  socialLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  socialHandle: {
    fontSize: 15,
    fontWeight: "500",
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
    paddingTop: 28,
  },
  metadataText: {
    fontSize: 13,
    marginBottom: 4,
  },
});

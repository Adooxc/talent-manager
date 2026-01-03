import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent } from "@/lib/types";
import { getTalents, needsPhotoUpdate, markTalentPhotoUpdated } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function UpdatesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTalents = useCallback(async () => {
    const data = await getTalents();
    const outdatedTalents = data.filter(needsPhotoUpdate);
    setTalents(outdatedTalents.sort((a, b) => 
      new Date(a.lastPhotoUpdate).getTime() - new Date(b.lastPhotoUpdate).getTime()
    ));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTalents();
    }, [loadTalents])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTalents();
    setRefreshing(false);
  };

  const handleTalentPress = (talent: Talent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/talent/${talent.id}` as any);
  };

  const handleMarkUpdated = async (talent: Talent) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await markTalentPhotoUpdated(talent.id);
    await loadTalents();
  };

  const handleMarkAllUpdated = () => {
    Alert.alert(
      "Mark All as Updated",
      "Are you sure you want to mark all talents as updated?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            for (const talent of talents) {
              await markTalentPhotoUpdated(talent.id);
            }
            await loadTalents();
          },
        },
      ]
    );
  };

  const getDaysSinceUpdate = (dateString: string) => {
    const lastUpdate = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const renderTalentCard = ({ item }: { item: Talent }) => {
    const daysSince = getDaysSinceUpdate(item.lastPhotoUpdate);
    
    return (
      <Pressable
        onPress={() => handleTalentPress(item)}
        style={({ pressed }) => [
          styles.talentCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.cardContent}>
          {item.profilePhoto ? (
            <Image
              source={{ uri: item.profilePhoto }}
              style={styles.profileImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.muted }]}>
              <IconSymbol name="person.2.fill" size={24} color={colors.background} />
            </View>
          )}
          
          <View style={styles.infoContainer}>
            <Text style={[styles.talentName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.lastUpdate, { color: colors.muted }]}>
              Last updated: {formatDate(item.lastPhotoUpdate)}
            </Text>
            <View style={[styles.daysContainer, { backgroundColor: colors.warning + "20" }]}>
              <IconSymbol name="bell.fill" size={14} color={colors.warning} />
              <Text style={[styles.daysText, { color: colors.warning }]}>
                {daysSince} days ago
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => handleMarkUpdated(item)}
          style={[styles.updateButton, { backgroundColor: colors.success }]}
          activeOpacity={0.8}
        >
          <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
          <Text style={styles.updateButtonText}>Mark Updated</Text>
        </TouchableOpacity>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Updates</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {talents.length} {talents.length === 1 ? "talent needs" : "talents need"} photo updates
            </Text>
          </View>
          {talents.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllUpdated}
              style={[styles.markAllButton, { borderColor: colors.primary }]}
            >
              <Text style={[styles.markAllText, { color: colors.primary }]}>Mark All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={talents}
        renderItem={renderTalentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
            </View>
            <Text style={[styles.emptyText, { color: colors.foreground }]}>
              All caught up!
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              All talent photos are up to date. Check back next month.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  markAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  talentCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  talentName: {
    fontSize: 17,
    fontWeight: "600",
  },
  lastUpdate: {
    fontSize: 13,
    marginTop: 4,
  },
  daysContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  daysText: {
    fontSize: 12,
    fontWeight: "600",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  updateButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 24,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});

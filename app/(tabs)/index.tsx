import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, TalentCategory } from "@/lib/types";
import { getTalents, needsPhotoUpdate } from "@/lib/storage";
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

export default function TalentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<TalentCategory | "all">("all");

  const loadTalents = useCallback(async () => {
    const data = await getTalents();
    setTalents(data.sort((a, b) => a.name.localeCompare(b.name)));
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

  const filteredTalents = talents.filter((talent) => {
    const matchesSearch = talent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || talent.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddTalent = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/talent/add" as any);
  };

  const handleTalentPress = (talent: Talent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/talent/${talent.id}` as any);
  };

  const renderTalentCard = ({ item }: { item: Talent }) => {
    const needsUpdate = needsPhotoUpdate(item);
    
    return (
      <Pressable
        onPress={() => handleTalentPress(item)}
        style={({ pressed }) => [
          styles.talentCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.imageContainer}>
          {item.profilePhoto ? (
            <Image
              source={{ uri: item.profilePhoto }}
              style={styles.profileImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.muted }]}>
              <IconSymbol name="person.2.fill" size={40} color={colors.background} />
            </View>
          )}
          {needsUpdate && (
            <View style={[styles.updateBadge, { backgroundColor: colors.warning }]}>
              <IconSymbol name="bell.fill" size={12} color="#FFF" />
            </View>
          )}
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: CATEGORY_COLORS[item.category] },
            ]}
          >
            <Text style={styles.categoryText}>{CATEGORY_LABELS[item.category]}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.talentName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.talentPrice, { color: colors.muted }]}>
            ${item.pricePerProject.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderFilterButton = (category: TalentCategory | "all", label: string) => {
    const isActive = filterCategory === category;
    return (
      <TouchableOpacity
        onPress={() => setFilterCategory(category)}
        style={[
          styles.filterButton,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.filterButtonText,
            { color: isActive ? "#FFF" : colors.foreground },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Talents</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {talents.length} {talents.length === 1 ? "talent" : "talents"}
        </Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search talents..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton("all", "All")}
        {renderFilterButton("model", "Models")}
        {renderFilterButton("artist", "Artists")}
        {renderFilterButton("both", "Both")}
      </View>

      <FlatList
        data={filteredTalents}
        renderItem={renderTalentCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2.fill" size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {searchQuery || filterCategory !== "all"
                ? "No talents found"
                : "No talents yet"}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              {searchQuery || filterCategory !== "all"
                ? "Try adjusting your search or filters"
                : "Tap the + button to add your first talent"}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={handleAddTalent}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={28} color="#FFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  talentCard: {
    width: "48%",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageContainer: {
    aspectRatio: 1,
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  updateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  cardContent: {
    padding: 12,
  },
  talentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  talentPrice: {
    fontSize: 14,
    marginTop: 4,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

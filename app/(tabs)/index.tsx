import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, Category, Gender } from "@/lib/types";
import { getTalents, needsPhotoUpdate, getCategories, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function TalentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string | "all">("all");
  const [filterGender, setFilterGender] = useState<Gender | "all">("all");

  const loadData = useCallback(async () => {
    const [talentsData, catsData] = await Promise.all([getTalents(), getCategories()]);
    setTalents(talentsData.sort((a, b) => a.name.localeCompare(b.name)));
    setCategories(catsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredTalents = talents.filter((talent) => {
    const matchesSearch = talent.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategoryId === "all" || talent.categoryId === filterCategoryId;
    const matchesGender = filterGender === "all" || talent.gender === filterGender;
    return matchesSearch && matchesCategory && matchesGender;
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

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const renderTalentCard = ({ item }: { item: Talent }) => {
    const needsUpdate = needsPhotoUpdate(item);
    const currencySymbol = getCurrencySymbol(item.currency);
    
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
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryText}>{getCategoryName(item.categoryId)}</Text>
          </View>
          <View style={[styles.genderBadge, { backgroundColor: item.gender === 'male' ? '#3B82F6' : '#EC4899' }]}>
            <Text style={styles.genderText}>{item.gender === 'male' ? '♂' : '♀'}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.talentName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.talentPrice, { color: colors.muted }]}>
            {currencySymbol} {item.pricePerProject.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Talents</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {filteredTalents.length} of {talents.length} {talents.length === 1 ? "talent" : "talents"}
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

      {/* Gender Filter */}
      <View style={styles.genderFilterContainer}>
        <TouchableOpacity
          onPress={() => setFilterGender("all")}
          style={[
            styles.genderFilterButton,
            {
              backgroundColor: filterGender === "all" ? colors.primary : colors.surface,
              borderColor: filterGender === "all" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.genderFilterText, { color: filterGender === "all" ? "#FFF" : colors.foreground }]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterGender("female")}
          style={[
            styles.genderFilterButton,
            {
              backgroundColor: filterGender === "female" ? "#EC4899" : colors.surface,
              borderColor: filterGender === "female" ? "#EC4899" : colors.border,
            },
          ]}
        >
          <Text style={[styles.genderFilterText, { color: filterGender === "female" ? "#FFF" : colors.foreground }]}>
            Women
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilterGender("male")}
          style={[
            styles.genderFilterButton,
            {
              backgroundColor: filterGender === "male" ? "#3B82F6" : colors.surface,
              borderColor: filterGender === "male" ? "#3B82F6" : colors.border,
            },
          ]}
        >
          <Text style={[styles.genderFilterText, { color: filterGender === "male" ? "#FFF" : colors.foreground }]}>
            Men
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          onPress={() => setFilterCategoryId("all")}
          style={[
            styles.filterButton,
            {
              backgroundColor: filterCategoryId === "all" ? colors.primary : colors.surface,
              borderColor: filterCategoryId === "all" ? colors.primary : colors.border,
            },
          ]}
        >
          <Text style={[styles.filterButtonText, { color: filterCategoryId === "all" ? "#FFF" : colors.foreground }]}>
            All Categories
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setFilterCategoryId(cat.id)}
            style={[
              styles.filterButton,
              {
                backgroundColor: filterCategoryId === cat.id ? colors.primary : colors.surface,
                borderColor: filterCategoryId === cat.id ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.filterButtonText, { color: filterCategoryId === cat.id ? "#FFF" : colors.foreground }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
              {searchQuery || filterCategoryId !== "all" || filterGender !== "all"
                ? "No talents found"
                : "No talents yet"}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              {searchQuery || filterCategoryId !== "all" || filterGender !== "all"
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
  genderFilterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  genderFilterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
  },
  genderFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterContainer: {
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
    bottom: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  genderBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  genderText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
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

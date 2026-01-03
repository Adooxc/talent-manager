import { useCallback, useMemo, useState } from "react";
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
  Alert,
  Modal,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Talent, Category, Gender, AppSettings, DEFAULT_SETTINGS } from "@/lib/types";
import { getTalents, needsPhotoUpdate, getCategories, getCurrencySymbol, getSettings, updateTalent, saveSettings } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

type SortBy = 'name' | 'price' | 'date' | 'rating';
type ViewMode = 'grid' | 'list';

interface FilterState {
  ageMin: string;
  ageMax: string;
  priceMin: string;
  priceMax: string;
  rating: number | null;
  location: string;
  nationality: string;
  languages: string[];
  tags: string[];
}

const DEFAULT_FILTERS: FilterState = {
  ageMin: '',
  ageMax: '',
  priceMin: '',
  priceMax: '',
  rating: null,
  location: '',
  nationality: '',
  languages: [],
  tags: [],
};

export default function TalentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<string | "all">("all");
  const [filterGender, setFilterGender] = useState<Gender | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);
  
  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // View and sort state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  // Advanced filters
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [tempFilters, setTempFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const locations = new Set<string>();
    const nationalities = new Set<string>();
    const languages = new Set<string>();
    const allTags = new Set<string>();
    
    talents.forEach(t => {
      if (t.customFields?.location) locations.add(t.customFields.location);
      if (t.customFields?.nationality) nationalities.add(t.customFields.nationality);
      t.customFields?.languages?.forEach(l => languages.add(l));
      t.tags?.forEach(tag => allTags.add(tag));
    });
    
    return {
      locations: Array.from(locations).sort(),
      nationalities: Array.from(nationalities).sort(),
      languages: Array.from(languages).sort(),
      tags: Array.from(allTags).sort(),
    };
  }, [talents]);

  const loadData = useCallback(async () => {
    const [talentsData, catsData, settingsData] = await Promise.all([
      getTalents(), 
      getCategories(),
      getSettings(),
    ]);
    setTalents(talentsData);
    setCategories(catsData);
    setSettings(settingsData);
    setViewMode(settingsData.viewMode || 'grid');
    setSortBy(settingsData.sortBy || 'name');
    setSortOrder(settingsData.sortOrder || 'asc');
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

  // Check if any advanced filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.ageMin !== '' || 
           filters.ageMax !== '' || 
           filters.priceMin !== '' || 
           filters.priceMax !== '' || 
           filters.rating !== null ||
           filters.location !== '' ||
           filters.nationality !== '' ||
           filters.languages.length > 0 ||
           filters.tags.length > 0;
  }, [filters]);

  // Sort and filter talents
  const sortedAndFilteredTalents = useMemo(() => {
    let filtered = talents.filter((talent) => {
      const matchesSearch = talent.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategoryId === "all" || talent.categoryId === filterCategoryId;
      const matchesGender = filterGender === "all" || talent.gender === filterGender;
      const matchesFavorites = !showFavoritesOnly || talent.isFavorite;
      const matchesArchived = showArchivedOnly ? talent.isArchived : !talent.isArchived;
      
      // Advanced filters
      const age = talent.customFields?.age;
      const matchesAgeMin = !filters.ageMin || (age && age >= parseInt(filters.ageMin));
      const matchesAgeMax = !filters.ageMax || (age && age <= parseInt(filters.ageMax));
      
      const matchesPriceMin = !filters.priceMin || talent.pricePerProject >= parseFloat(filters.priceMin);
      const matchesPriceMax = !filters.priceMax || talent.pricePerProject <= parseFloat(filters.priceMax);
      
      const matchesRating = filters.rating === null || (talent.rating && talent.rating >= filters.rating);
      
      const matchesLocation = !filters.location || 
        talent.customFields?.location?.toLowerCase().includes(filters.location.toLowerCase());
      
      const matchesNationality = !filters.nationality || 
        talent.customFields?.nationality?.toLowerCase().includes(filters.nationality.toLowerCase());
      
      const matchesLanguages = filters.languages.length === 0 || 
        filters.languages.some(lang => talent.customFields?.languages?.includes(lang));
      
      const matchesTags = filters.tags.length === 0 || 
        filters.tags.some(tag => talent.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesGender && matchesFavorites && matchesArchived &&
             matchesAgeMin && matchesAgeMax && matchesPriceMin && matchesPriceMax &&
             matchesRating && matchesLocation && matchesNationality && matchesLanguages && matchesTags;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.pricePerProject - b.pricePerProject;
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [talents, searchQuery, filterCategoryId, filterGender, showFavoritesOnly, sortBy, sortOrder, filters]);

  const handleAddTalent = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/talent/add");
  };

  const handleTalentPress = (talent: Talent) => {
    if (selectMode) {
      toggleSelection(talent.id);
      return;
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/talent/${talent.id}` as any);
  };

  const handleTalentLongPress = (talent: Talent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (!selectMode) {
      setSelectMode(true);
      setSelectedIds(new Set([talent.id]));
    }
  };

  const toggleSelection = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size === 0) {
      setSelectMode(false);
    }
  };

  const selectAll = () => {
    setSelectedIds(new Set(sortedAndFilteredTalents.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const toggleFavorite = async (talent: Talent) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await updateTalent(talent.id, { isFavorite: !talent.isFavorite });
    loadData();
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    await saveSettings({ viewMode: newMode });
  };

  const handleSort = async (newSortBy: SortBy) => {
    let newOrder: 'asc' | 'desc' = 'asc';
    if (sortBy === newSortBy) {
      newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    setShowSortMenu(false);
    await saveSettings({ sortBy: newSortBy, sortOrder: newOrder });
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || "Unknown";
  };

  const addSelectedToProject = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds).join(',');
    router.push(`/project/add?talents=${ids}` as any);
    clearSelection();
  };

  const sendBulkWhatsApp = async () => {
    if (selectedIds.size === 0) return;
    const selectedTalents = talents.filter(t => selectedIds.has(t.id));
    const message = settings.whatsappMessage || 'مرحباً، أتواصل معك بخصوص فرصة عمل...';
    
    for (const talent of selectedTalents) {
      if (talent.phoneNumbers && talent.phoneNumbers.length > 0) {
        const phone = talent.phoneNumbers[0].replace(/[^0-9]/g, '');
        const personalizedMessage = message.replace('{name}', talent.name);
        const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(personalizedMessage)}`;
        await Linking.openURL(url);
      }
    }
    clearSelection();
  };

  const createWhatsAppGroup = () => {
    if (selectedIds.size === 0) return;
    
    const selectedTalents = talents.filter(t => selectedIds.has(t.id));
    const phoneNumbers = selectedTalents
      .flatMap(t => t.phoneNumbers)
      .filter((p): p is string => p != null && p.trim() !== '')
      .map(p => p.replace(/[^0-9+]/g, ''));
    
    if (phoneNumbers.length === 0) {
      Alert.alert("No Phone Numbers", "Selected talents don't have phone numbers.");
      return;
    }
    
    // Show options
    Alert.alert(
      "WhatsApp Options",
      `${selectedTalents.length} talents selected (${phoneNumbers.length} phone numbers)`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Bulk Message",
          onPress: sendBulkWhatsApp,
        },
        {
          text: "Copy Numbers",
          onPress: () => {
            const numbersText = phoneNumbers.join('\n');
            Alert.alert(
              "Phone Numbers",
              numbersText + "\n\nCopy these numbers to create a WhatsApp group manually.",
              [{ text: "OK" }]
            );
          },
        },
        {
          text: "Open WhatsApp",
          onPress: () => {
            Linking.openURL('whatsapp://');
          },
        },
      ]
    );
  };

  const openFiltersModal = () => {
    setTempFilters(filters);
    setShowFiltersModal(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFiltersModal(false);
  };

  const clearFilters = () => {
    setTempFilters(DEFAULT_FILTERS);
  };

  const toggleLanguageFilter = (lang: string) => {
    const newLangs = tempFilters.languages.includes(lang)
      ? tempFilters.languages.filter(l => l !== lang)
      : [...tempFilters.languages, lang];
    setTempFilters({ ...tempFilters, languages: newLangs });
  };

  const toggleTagFilter = (tag: string) => {
    const newTags = tempFilters.tags.includes(tag)
      ? tempFilters.tags.filter(t => t !== tag)
      : [...tempFilters.tags, tag];
    setTempFilters({ ...tempFilters, tags: newTags });
  };

  const renderTalentCard = ({ item }: { item: Talent }) => {
    const needsUpdate = needsPhotoUpdate(item);
    const currencySymbol = getCurrencySymbol(item.currency);
    const isSelected = selectedIds.has(item.id);
    
    if (viewMode === 'list') {
      return (
        <Pressable
          onPress={() => handleTalentPress(item)}
          onLongPress={() => handleTalentLongPress(item)}
          style={({ pressed }) => [
            styles.listItem,
            { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
            pressed && { opacity: 0.7 },
            isSelected && { borderWidth: 2 },
          ]}
        >
          {selectMode && (
            <View style={[styles.checkbox, { borderColor: colors.primary, backgroundColor: isSelected ? colors.primary : 'transparent' }]}>
              {isSelected && <IconSymbol name="checkmark" size={16} color="#FFF" />}
            </View>
          )}
          <View style={styles.listImageContainer}>
            {item.profilePhoto ? (
              <Image source={{ uri: item.profilePhoto }} style={styles.listImage} contentFit="cover" />
            ) : (
              <View style={[styles.listPlaceholder, { backgroundColor: colors.muted }]}>
                <IconSymbol name="person.2.fill" size={24} color={colors.background} />
              </View>
            )}
          </View>
          <View style={styles.listItemContent}>
            <View style={styles.listHeader}>
              <Text style={[styles.listName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
              <TouchableOpacity onPress={() => toggleFavorite(item)}>
                <IconSymbol 
                  name={item.isFavorite ? "heart.fill" : "heart"} 
                  size={20} 
                  color={item.isFavorite ? "#EF4444" : colors.muted} 
                />
              </TouchableOpacity>
            </View>
            <Text style={[styles.listCategory, { color: colors.muted }]}>{getCategoryName(item.categoryId)}</Text>
            <View style={styles.listFooter}>
              <Text style={[styles.listPrice, { color: colors.primary }]}>
                {currencySymbol} {item.pricePerProject.toLocaleString()}
              </Text>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <IconSymbol name="star.fill" size={14} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: colors.muted }]}>{item.rating}</Text>
                </View>
              )}
            </View>
          </View>
          {needsUpdate && (
            <View style={[styles.listUpdateBadge, { backgroundColor: colors.warning }]}>
              <IconSymbol name="bell.fill" size={12} color="#FFF" />
            </View>
          )}
        </Pressable>
      );
    }
    
    return (
      <Pressable
        onPress={() => handleTalentPress(item)}
        onLongPress={() => handleTalentLongPress(item)}
        style={({ pressed }) => [
          styles.talentCard,
          { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
          pressed && { opacity: 0.7 },
          isSelected && { borderWidth: 2 },
        ]}
      >
        <View style={styles.imageContainer}>
          {item.profilePhoto ? (
            <Image source={{ uri: item.profilePhoto }} style={styles.profileImage} contentFit="cover" />
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.muted }]}>
              <IconSymbol name="person.2.fill" size={40} color={colors.background} />
            </View>
          )}
          {selectMode && (
            <View style={[styles.selectCheckbox, { borderColor: "#FFF", backgroundColor: isSelected ? colors.primary : 'rgba(0,0,0,0.3)' }]}>
              {isSelected && <IconSymbol name="checkmark" size={14} color="#FFF" />}
            </View>
          )}
          {needsUpdate && (
            <View style={[styles.updateBadge, { backgroundColor: colors.warning }]}>
              <IconSymbol name="bell.fill" size={12} color="#FFF" />
            </View>
          )}
          <TouchableOpacity 
            style={[styles.favoriteBadge, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
            onPress={() => toggleFavorite(item)}
          >
            <IconSymbol 
              name={item.isFavorite ? "heart.fill" : "heart"} 
              size={16} 
              color={item.isFavorite ? "#EF4444" : "#FFF"} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.talentName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.categoryLabel, { color: colors.muted }]} numberOfLines={1}>
            {getCategoryName(item.categoryId)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {currencySymbol} {item.pricePerProject.toLocaleString()}
            </Text>
            {item.rating && (
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={12} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: colors.muted }]}>{item.rating}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Talents</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {sortedAndFilteredTalents.length} {sortedAndFilteredTalents.length === 1 ? "talent" : "talents"}
              {hasActiveFilters && " (filtered)"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={[styles.headerButton, showFavoritesOnly && { backgroundColor: colors.primary + '20' }]}
            >
              <IconSymbol 
                name={showFavoritesOnly ? "heart.fill" : "heart"} 
                size={22} 
                color={showFavoritesOnly ? "#EF4444" : colors.muted} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowArchivedOnly(!showArchivedOnly)}
              style={[styles.headerButton, showArchivedOnly && { backgroundColor: colors.warning + '20' }]}
            >
              <IconSymbol 
                name="archivebox.fill" 
                size={22} 
                color={showArchivedOnly ? colors.warning : colors.muted} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={openFiltersModal} 
              style={[styles.headerButton, hasActiveFilters && { backgroundColor: colors.primary + '20' }]}
            >
              <IconSymbol name="slider.horizontal.3" size={22} color={hasActiveFilters ? colors.primary : colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)} style={styles.headerButton}>
              <IconSymbol name="arrow.up.arrow.down" size={22} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleViewMode} style={styles.headerButton}>
              <IconSymbol name={viewMode === 'grid' ? "list.bullet" : "square.grid.2x2"} size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {(['name', 'price', 'date', 'rating'] as SortBy[]).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => handleSort(option)}
              style={[styles.sortOption, sortBy === option && { backgroundColor: colors.primary + '20' }]}
            >
              <Text style={[styles.sortOptionText, { color: sortBy === option ? colors.primary : colors.foreground }]}>
                {option === 'name' ? 'Name' : option === 'price' ? 'Price' : option === 'date' ? 'Date Added' : 'Rating'}
              </Text>
              {sortBy === option && (
                <Text style={[styles.sortOrderText, { color: colors.primary }]}>
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Select Mode Header */}
      {selectMode && (
        <View style={[styles.selectHeader, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={clearSelection} style={styles.selectAction}>
            <IconSymbol name="xmark" size={20} color="#FFF" />
            <Text style={styles.selectActionText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.selectCount}>{selectedIds.size} selected</Text>
          <View style={styles.selectActions}>
            <TouchableOpacity onPress={selectAll} style={styles.selectAction}>
              <Text style={styles.selectActionText}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createWhatsAppGroup} style={styles.selectAction}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addSelectedToProject} style={styles.selectAction}>
              <IconSymbol name="folder.fill" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search */}
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

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
            {filters.ageMin && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>Age ≥ {filters.ageMin}</Text>
              </View>
            )}
            {filters.ageMax && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>Age ≤ {filters.ageMax}</Text>
              </View>
            )}
            {filters.priceMin && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>Price ≥ {filters.priceMin}</Text>
              </View>
            )}
            {filters.priceMax && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>Price ≤ {filters.priceMax}</Text>
              </View>
            )}
            {filters.rating && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>★ ≥ {filters.rating}</Text>
              </View>
            )}
            {filters.location && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{filters.location}</Text>
              </View>
            )}
            {filters.nationality && (
              <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{filters.nationality}</Text>
              </View>
            )}
            {filters.languages.map(lang => (
              <View key={lang} style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{lang}</Text>
              </View>
            ))}
            {filters.tags.map(tag => (
              <View key={tag} style={[styles.activeFilterChip, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.activeFilterText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
            <TouchableOpacity 
              onPress={() => setFilters(DEFAULT_FILTERS)}
              style={[styles.clearFiltersButton, { backgroundColor: colors.error + '20' }]}
            >
              <Text style={[styles.clearFiltersText, { color: colors.error }]}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <FlatList
        data={sortedAndFilteredTalents}
        renderItem={renderTalentCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="person.2.fill" size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {searchQuery || filterCategoryId !== "all" || filterGender !== "all" || showFavoritesOnly || hasActiveFilters
                ? "No talents found"
                : "No talents yet"}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              {searchQuery || filterCategoryId !== "all" || filterGender !== "all" || showFavoritesOnly || hasActiveFilters
                ? "Try adjusting your search or filters"
                : "Tap the + button to add your first talent"}
            </Text>
          </View>
        }
      />

      {!selectMode && (
        <TouchableOpacity
          onPress={handleAddTalent}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <IconSymbol name="plus" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Advanced Filters Modal */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFiltersModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Filters</Text>
            <TouchableOpacity onPress={applyFilters}>
              <Text style={[styles.modalApply, { color: colors.primary }]}>Apply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Age Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Age Range</Text>
              <View style={styles.rangeInputs}>
                <View style={[styles.rangeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.rangeInputText, { color: colors.foreground }]}
                    placeholder="Min"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={tempFilters.ageMin}
                    onChangeText={(v) => setTempFilters({ ...tempFilters, ageMin: v })}
                  />
                </View>
                <Text style={[styles.rangeSeparator, { color: colors.muted }]}>to</Text>
                <View style={[styles.rangeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.rangeInputText, { color: colors.foreground }]}
                    placeholder="Max"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={tempFilters.ageMax}
                    onChangeText={(v) => setTempFilters({ ...tempFilters, ageMax: v })}
                  />
                </View>
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Price Range</Text>
              <View style={styles.rangeInputs}>
                <View style={[styles.rangeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.rangeInputText, { color: colors.foreground }]}
                    placeholder="Min"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={tempFilters.priceMin}
                    onChangeText={(v) => setTempFilters({ ...tempFilters, priceMin: v })}
                  />
                </View>
                <Text style={[styles.rangeSeparator, { color: colors.muted }]}>to</Text>
                <View style={[styles.rangeInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.rangeInputText, { color: colors.foreground }]}
                    placeholder="Max"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={tempFilters.priceMax}
                    onChangeText={(v) => setTempFilters({ ...tempFilters, priceMax: v })}
                  />
                </View>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Minimum Rating</Text>
              <View style={styles.ratingFilter}>
                {[null, 1, 2, 3, 4, 5].map((r) => (
                  <TouchableOpacity
                    key={r ?? 'any'}
                    onPress={() => setTempFilters({ ...tempFilters, rating: r })}
                    style={[
                      styles.ratingOption,
                      {
                        backgroundColor: tempFilters.rating === r ? colors.primary : colors.surface,
                        borderColor: tempFilters.rating === r ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {r === null ? (
                      <Text style={[styles.ratingOptionText, { color: tempFilters.rating === r ? '#FFF' : colors.foreground }]}>Any</Text>
                    ) : (
                      <View style={styles.ratingStars}>
                        <IconSymbol name="star.fill" size={14} color={tempFilters.rating === r ? '#FFF' : '#F59E0B'} />
                        <Text style={[styles.ratingOptionText, { color: tempFilters.rating === r ? '#FFF' : colors.foreground }]}>{r}+</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Location</Text>
              <View style={[styles.textFilterInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textFilterInputText, { color: colors.foreground }]}
                  placeholder="Enter location..."
                  placeholderTextColor={colors.muted}
                  value={tempFilters.location}
                  onChangeText={(v) => setTempFilters({ ...tempFilters, location: v })}
                />
              </View>
              {filterOptions.locations.length > 0 && (
                <View style={styles.quickOptions}>
                  {filterOptions.locations.slice(0, 5).map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      onPress={() => setTempFilters({ ...tempFilters, location: loc })}
                      style={[styles.quickOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={[styles.quickOptionText, { color: colors.foreground }]}>{loc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Nationality */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Nationality</Text>
              <View style={[styles.textFilterInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textFilterInputText, { color: colors.foreground }]}
                  placeholder="Enter nationality..."
                  placeholderTextColor={colors.muted}
                  value={tempFilters.nationality}
                  onChangeText={(v) => setTempFilters({ ...tempFilters, nationality: v })}
                />
              </View>
              {filterOptions.nationalities.length > 0 && (
                <View style={styles.quickOptions}>
                  {filterOptions.nationalities.slice(0, 5).map((nat) => (
                    <TouchableOpacity
                      key={nat}
                      onPress={() => setTempFilters({ ...tempFilters, nationality: nat })}
                      style={[styles.quickOption, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <Text style={[styles.quickOptionText, { color: colors.foreground }]}>{nat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Languages */}
            {filterOptions.languages.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Languages</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.languages.map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      onPress={() => toggleLanguageFilter(lang)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: tempFilters.languages.includes(lang) ? colors.primary : colors.surface,
                          borderColor: tempFilters.languages.includes(lang) ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: tempFilters.languages.includes(lang) ? '#FFF' : colors.foreground }]}>
                        {lang}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Tags */}
            {filterOptions.tags.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>Tags</Text>
                <View style={styles.chipContainer}>
                  {filterOptions.tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleTagFilter(tag)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: tempFilters.tags.includes(tag) ? colors.primary : colors.surface,
                          borderColor: tempFilters.tags.includes(tag) ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: tempFilters.tags.includes(tag) ? '#FFF' : colors.foreground }]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Clear Filters Button */}
            <TouchableOpacity
              onPress={clearFilters}
              style={[styles.clearButton, { borderColor: colors.error }]}
            >
              <Text style={[styles.clearButtonText, { color: colors.error }]}>Clear All Filters</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
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
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  sortMenu: {
    position: "absolute",
    top: 100,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 150,
  },
  sortOptionText: {
    fontSize: 15,
  },
  sortOrderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
  },
  selectAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectActionText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "500",
  },
  selectCount: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  selectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    gap: 10,
    marginBottom: 12,
  },
  genderFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  genderFilterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 12,
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
  activeFiltersContainer: {
    paddingBottom: 12,
  },
  activeFiltersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  activeFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  talentCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
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
  selectCheckbox: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  favoriteBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    padding: 12,
  },
  talentName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
  },
  listImage: {
    width: "100%",
    height: "100%",
  },
  listPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  listCategory: {
    fontSize: 13,
    marginTop: 2,
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  listPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
  listUpdateBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
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
  // Modal styles
  modalContainer: {
    flex: 1,
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
  modalApply: {
    fontSize: 17,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    paddingVertical: 20,
  },
  filterSectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rangeInputText: {
    fontSize: 16,
    textAlign: "center",
  },
  rangeSeparator: {
    fontSize: 15,
  },
  ratingFilter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  ratingStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  textFilterInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textFilterInputText: {
    fontSize: 16,
  },
  quickOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickOptionText: {
    fontSize: 13,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

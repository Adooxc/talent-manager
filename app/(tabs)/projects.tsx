import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, ProjectStatus, Talent } from "@/lib/types";
import { getProjects, getTalents, calculateProjectCosts } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "#64748B",
  active: "#22C55E",
  completed: "#6366F1",
};

export default function ProjectsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [projectsData, talentsData] = await Promise.all([
      getProjects(),
      getTalents(),
    ]);
    setProjects(projectsData.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
    setTalents(talentsData);
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

  const handleAddProject = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/project/add" as any);
  };

  const handleProjectPress = (project: Project) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/project/${project.id}` as any);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const costs = calculateProjectCosts(talents, item.talents, item.profitMarginPercent);
    
    return (
      <Pressable
        onPress={() => handleProjectPress(item)}
        style={({ pressed }) => [
          styles.projectCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
        
        {item.description ? (
          <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <IconSymbol name="calendar" size={16} color={colors.muted} />
            <Text style={[styles.footerText, { color: colors.muted }]}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <IconSymbol name="person.2.fill" size={16} color={colors.muted} />
            <Text style={[styles.footerText, { color: colors.muted }]}>
              {item.talents.length} talents
            </Text>
          </View>
        </View>

        <View style={[styles.costContainer, { borderTopColor: colors.border }]}>
          <Text style={[styles.costLabel, { color: colors.muted }]}>Total</Text>
          <Text style={[styles.costValue, { color: colors.primary }]}>
            ${costs.total.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Projects</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </Text>
      </View>

      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="folder.fill" size={64} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No projects yet
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              Tap the + button to create your first project
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={handleAddProject}
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  projectCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 13,
  },
  costContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  costLabel: {
    fontSize: 14,
  },
  costValue: {
    fontSize: 18,
    fontWeight: "700",
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

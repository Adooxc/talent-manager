import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, Talent } from "@/lib/types";
import { getProjects, getTalentById, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

export default function TalentHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [talentData, allProjects] = await Promise.all([
      getTalentById(id),
      getProjects(),
    ]);
    setTalent(talentData);
    
    // Filter projects that include this talent
    const talentProjects = allProjects.filter(p => 
      p.talents.some(t => t.talentId === id)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setProjects(talentProjects);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'in_progress': return colors.primary;
      case 'cancelled': return colors.error;
      case 'on_hold': return colors.warning;
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'cancelled': return 'Cancelled';
      case 'on_hold': return 'On Hold';
      case 'negotiating': return 'Negotiating';
      default: return 'Draft';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateTotalEarnings = () => {
    return projects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => {
        const talentEntry = p.talents.find(t => t.talentId === id);
        const talentCost = talentEntry?.customPrice || 0;
        return sum + talentCost;
      }, 0);
  };

  const renderProjectCard = ({ item }: { item: Project }) => {
    const currencySymbol = getCurrencySymbol(item.currency);
    const talentEntry = item.talents.find(t => t.talentId === id);
    const talentCost = talentEntry?.customPrice || 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/project/${item.id}` as any)}
        style={[styles.projectCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={styles.projectHeader}>
          <Text style={[styles.projectName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        
        {item.clientName && (
          <Text style={[styles.clientName, { color: colors.muted }]}>
            Client: {item.clientName}
          </Text>
        )}
        
        <View style={styles.projectFooter}>
          <Text style={[styles.projectDate, { color: colors.muted }]}>
            {formatDate(item.createdAt)}
          </Text>
          <Text style={[styles.projectEarning, { color: colors.primary }]}>
            {currencySymbol} {talentCost.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalEarnings = calculateTotalEarnings();
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: colors.foreground }]}>Project History</Text>
          {talent && (
            <Text style={[styles.subtitle, { color: colors.muted }]}>{talent.name}</Text>
          )}
        </View>
      </View>

      {/* Stats Summary */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{projects.length}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total Projects</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Completed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            KD {totalEarnings.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Total Earned</Text>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol name="folder.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>No projects yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>
              This talent hasn't been added to any projects
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  projectCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  clientName: {
    fontSize: 14,
    marginBottom: 8,
  },
  projectFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  projectDate: {
    fontSize: 13,
  },
  projectEarning: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
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
});

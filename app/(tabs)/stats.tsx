import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  getTalents, 
  getProjects, 
  getCategories, 
  getSettings,
  calculateProjectCosts,
  getCurrencySymbol
} from "@/lib/storage";
import { Talent, Project, Category, AppSettings } from "@/lib/types";

interface Statistics {
  totalTalents: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  totalProfit: number;
  talentsByCategory: { name: string; count: number; color: string }[];
  talentsByGender: { male: number; female: number };
  averageTalentPrice: number;
  topRatedTalents: Talent[];
  recentProjects: Project[];
  currency: string;
}

const CATEGORY_COLORS = [
  "#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6",
  "#EF4444", "#06B6D4", "#84CC16", "#F97316", "#14B8A6"
];

export default function StatsScreen() {
  const colors = useColors();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const loadStats = useCallback(async () => {
    const [talents, projects, categories, settings] = await Promise.all([
      getTalents(),
      getProjects(),
      getCategories(),
      getSettings(),
    ]);

    // Calculate revenue and profit
    let totalRevenue = 0;
    let totalProfit = 0;

    for (const project of projects) {
      if (project.status === "completed") {
        const costs = calculateProjectCosts(talents, project.talents, project.profitMarginPercent);
        totalRevenue += costs.total;
        totalProfit += costs.profit;
      }
    }

    // Talents by category
    const talentsByCategory = categories.map((cat, index) => ({
      name: cat.name,
      count: talents.filter(t => t.categoryId === cat.id).length,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    })).filter(c => c.count > 0);

    // Talents by gender
    const talentsByGender = {
      male: talents.filter(t => t.gender === "male").length,
      female: talents.filter(t => t.gender === "female").length,
    };

    // Average price
    const avgPrice = talents.length > 0
      ? talents.reduce((sum, t) => sum + t.pricePerProject, 0) / talents.length
      : 0;

    // Top rated
    const topRated = [...talents]
      .filter(t => t.rating)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 5);

    // Recent projects
    const recentProjects = [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    setStats({
      totalTalents: talents.length,
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === "active").length,
      completedProjects: projects.filter(p => p.status === "completed").length,
      totalRevenue,
      totalProfit,
      talentsByCategory,
      talentsByGender,
      averageTalentPrice: avgPrice,
      topRatedTalents: topRated,
      recentProjects,
      currency: settings.defaultCurrency,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol(stats?.currency || "KWD");
    return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const renderStatCard = (
    icon: any,
    title: string,
    value: string | number,
    subtitle?: string,
    iconBg?: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: iconBg || colors.primary + "20" }]}>
        <IconSymbol name={icon} size={24} color={iconBg ? "#FFF" : colors.primary} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.muted }]}>{title}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: colors.muted }]}>{subtitle}</Text>}
    </View>
  );

  if (!stats) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text style={{ color: colors.muted }}>Loading statistics...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Dashboard</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Overview of your talent database</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Main Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard("person.2.fill", "Total Talents", stats.totalTalents)}
          {renderStatCard("folder.fill", "Total Projects", stats.totalProjects)}
          {renderStatCard("play.circle.fill", "Active", stats.activeProjects, undefined, colors.success)}
          {renderStatCard("checkmark.circle.fill", "Completed", stats.completedProjects, undefined, colors.primary)}
        </View>

        {/* Revenue Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Revenue Overview</Text>
          <View style={styles.revenueGrid}>
            <View style={styles.revenueItem}>
              <Text style={[styles.revenueLabel, { color: colors.muted }]}>Total Revenue</Text>
              <Text style={[styles.revenueValue, { color: colors.success }]}>
                {formatCurrency(stats.totalRevenue)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={[styles.revenueLabel, { color: colors.muted }]}>Total Profit</Text>
              <Text style={[styles.revenueValue, { color: colors.primary }]}>
                {formatCurrency(stats.totalProfit)}
              </Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={[styles.revenueLabel, { color: colors.muted }]}>Avg. Talent Price</Text>
              <Text style={[styles.revenueValue, { color: colors.foreground }]}>
                {formatCurrency(stats.averageTalentPrice)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gender Distribution */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gender Distribution</Text>
          <View style={styles.genderContainer}>
            <View style={styles.genderBar}>
              {stats.totalTalents > 0 && (
                <>
                  <View 
                    style={[
                      styles.genderSegment, 
                      { 
                        backgroundColor: "#6366F1", 
                        flex: stats.talentsByGender.male || 0.01 
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.genderSegment, 
                      { 
                        backgroundColor: "#EC4899", 
                        flex: stats.talentsByGender.female || 0.01 
                      }
                    ]} 
                  />
                </>
              )}
            </View>
            <View style={styles.genderLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#6366F1" }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>
                  Male ({stats.talentsByGender.male})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#EC4899" }]} />
                <Text style={[styles.legendText, { color: colors.foreground }]}>
                  Female ({stats.talentsByGender.female})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Categories Distribution */}
        {stats.talentsByCategory.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Talents by Category</Text>
            {stats.talentsByCategory.map((cat, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                  <Text style={[styles.categoryName, { color: colors.foreground }]}>{cat.name}</Text>
                </View>
                <View style={styles.categoryBarContainer}>
                  <View 
                    style={[
                      styles.categoryBar, 
                      { 
                        backgroundColor: cat.color + "40",
                        width: `${Math.min((cat.count / stats.totalTalents) * 100, 100)}%`
                      }
                    ]} 
                  />
                  <Text style={[styles.categoryCount, { color: colors.muted }]}>{cat.count}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Top Rated Talents */}
        {stats.topRatedTalents.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Rated Talents</Text>
            {stats.topRatedTalents.map((talent, index) => (
              <View key={talent.id} style={[styles.listItem, index < stats.topRatedTalents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={styles.listRank}>
                  <Text style={[styles.rankNumber, { color: colors.primary }]}>#{index + 1}</Text>
                </View>
                <View style={styles.listContent}>
                  <Text style={[styles.listName, { color: colors.foreground }]}>{talent.name}</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <IconSymbol 
                        key={star} 
                        name="star.fill" 
                        size={14} 
                        color={star <= (talent.rating || 0) ? "#F59E0B" : colors.border} 
                      />
                    ))}
                  </View>
                </View>
                <Text style={[styles.listPrice, { color: colors.muted }]}>
                  {formatCurrency(talent.pricePerProject)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Projects */}
        {stats.recentProjects.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Projects</Text>
            {stats.recentProjects.map((project, index) => (
              <View key={project.id} style={[styles.listItem, index < stats.recentProjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status, colors) }]} />
                <View style={styles.listContent}>
                  <Text style={[styles.listName, { color: colors.foreground }]}>{project.name}</Text>
                  <Text style={[styles.listDate, { color: colors.muted }]}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={[styles.talentCount, { color: colors.muted }]}>
                  {project.talents.length} talents
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function getStatusColor(status: string, colors: any): string {
  switch (status) {
    case "active": return colors.success;
    case "completed": return colors.primary;
    case "draft": return colors.muted;
    case "negotiating": return colors.warning;
    case "cancelled": return colors.error;
    case "postponed": return colors.warning;
    default: return colors.muted;
  }
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
  scrollContent: {
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statTitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 16,
  },
  revenueGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  revenueItem: {
    flex: 1,
    alignItems: "center",
  },
  revenueLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  genderContainer: {
    gap: 12,
  },
  genderBar: {
    flexDirection: "row",
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  genderSegment: {
    height: "100%",
  },
  genderLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: 120,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
  },
  categoryBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryBar: {
    height: 20,
    borderRadius: 10,
    minWidth: 20,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  listRank: {
    width: 36,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: "500",
  },
  listDate: {
    fontSize: 12,
    marginTop: 2,
  },
  listPrice: {
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  talentCount: {
    fontSize: 13,
  },
});

import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, ProjectStatus, Talent, Category } from "@/lib/types";
import { getProjectById, getTalents, deleteProject, calculateProjectCosts, getCategories, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  negotiating: "Negotiating",
  active: "Active",
  completed: "Completed",
  postponed: "Postponed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft: "#9CA3AF",
  negotiating: "#F59E0B",
  active: "#3B82F6",
  completed: "#22C55E",
  postponed: "#8B5CF6",
  cancelled: "#EF4444",
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [project, setProject] = useState<Project | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [projectData, talentsData, catsData] = await Promise.all([
      getProjectById(id),
      getTalents(),
      getCategories(),
    ]);
    setProject(projectData);
    setTalents(talentsData);
    setCategories(catsData);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/project/edit/${id}` as any);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Project",
      `Are you sure you want to delete "${project?.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteProject(id!);
            router.back();
          },
        },
      ]
    );
  };

  const generatePDF = async () => {
    if (!project) return;
    
    setExporting(true);
    try {
      const costs = calculateProjectCosts(talents, project.talents, project.profitMarginPercent);
      const currencySymbol = getCurrencySymbol(project.currency);
      
      const talentRows = project.talents.map((pt) => {
        const talent = talents.find((t) => t.id === pt.talentId);
        if (!talent) return "";
        const price = pt.customPrice ?? talent.pricePerProject;
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">
              <div style="display: flex; align-items: center; gap: 12px;">
                ${talent.profilePhoto ? `<img src="${talent.profilePhoto}" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;" />` : ""}
                <div>
                  <div style="font-weight: 600;">${talent.name}</div>
                  <div style="color: #64748B; font-size: 12px;">${categories.find(c => c.id === talent.categoryId)?.name || 'Unknown'}</div>
                </div>
              </div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right;">${currencySymbol} ${price.toLocaleString()}</td>
          </tr>
        `;
      }).join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${project.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #0F172A;
            }
            .header {
              margin-bottom: 32px;
              padding-bottom: 24px;
              border-bottom: 2px solid #6366F1;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              color: #6366F1;
            }
            .status {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              color: white;
              margin-top: 8px;
            }
            .description {
              color: #64748B;
              margin-top: 12px;
              line-height: 1.6;
            }
            .dates {
              color: #64748B;
              font-size: 14px;
              margin-top: 8px;
            }
            .section {
              margin-top: 32px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 16px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              background: #F8FAFC;
              border-radius: 12px;
              overflow: hidden;
            }
            th {
              background: #6366F1;
              color: white;
              padding: 12px;
              text-align: left;
            }
            th:last-child {
              text-align: right;
            }
            .summary {
              background: #F8FAFC;
              border-radius: 12px;
              padding: 20px;
              margin-top: 24px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .summary-row.total {
              border-top: 2px solid #E2E8F0;
              margin-top: 12px;
              padding-top: 16px;
              font-weight: 700;
              font-size: 18px;
            }
            .profit {
              color: #22C55E;
            }
            .total-value {
              color: #6366F1;
            }
            .footer {
              margin-top: 48px;
              text-align: center;
              color: #94A3B8;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${project.name}</h1>
            <span class="status" style="background: ${STATUS_COLORS[project.status]}">${STATUS_LABELS[project.status]}</span>
            ${project.description ? `<p class="description">${project.description}</p>` : ""}
            <div class="dates">
              ${new Date(project.startDate).toLocaleDateString()} - ${new Date(project.endDate).toLocaleDateString()}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Selected Talents (${project.talents.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Talent</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${talentRows}
              </tbody>
            </table>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>${currencySymbol} ${costs.subtotal.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Profit (${project.profitMarginPercent}%)</span>
              <span class="profit">+${currencySymbol} ${costs.profit.toLocaleString()}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span class="total-value">${currencySymbol} ${costs.total.toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} • Talent Manager
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === "web") {
        // For web, open in new tab
        window.open(uri, "_blank");
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `${project.name} - Project Details`,
        });
      } else {
        Alert.alert("Success", "PDF generated successfully");
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("PDF generation error:", error);
      Alert.alert("Error", "Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!project) {
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

  const costs = calculateProjectCosts(talents, project.talents, project.profitMarginPercent);

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
        {/* Project Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.projectName, { color: colors.foreground }]}>{project.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[project.status] }]}>
              <Text style={styles.statusText}>{STATUS_LABELS[project.status]}</Text>
            </View>
          </View>
          
          {project.description && (
            <Text style={[styles.description, { color: colors.muted }]}>{project.description}</Text>
          )}

          <View style={styles.dateContainer}>
            <IconSymbol name="calendar" size={18} color={colors.muted} />
            <Text style={[styles.dateText, { color: colors.muted }]}>
              {formatDate(project.startDate)} - {formatDate(project.endDate)}
            </Text>
          </View>
        </View>

        {/* Talents */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Selected Talents ({project.talents.length})
          </Text>
          
          {project.talents.map((pt) => {
            const talent = talents.find((t) => t.id === pt.talentId);
            if (!talent) return null;
            const price = pt.customPrice ?? talent.pricePerProject;
            
            return (
              <TouchableOpacity
                key={pt.talentId}
                onPress={() => router.push(`/talent/${talent.id}` as any)}
                style={[styles.talentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                {talent.profilePhoto ? (
                  <Image source={{ uri: talent.profilePhoto }} style={styles.talentImage} contentFit="cover" />
                ) : (
                  <View style={[styles.talentPlaceholder, { backgroundColor: colors.muted }]}>
                    <IconSymbol name="person.2.fill" size={24} color={colors.background} />
                  </View>
                )}
                <View style={styles.talentInfo}>
                  <Text style={[styles.talentName, { color: colors.foreground }]}>{talent.name}</Text>
                  <Text style={[styles.talentCategory, { color: colors.muted }]}>{categories.find(c => c.id === talent.categoryId)?.name || 'Unknown'}</Text>
                </View>
                <Text style={[styles.talentPrice, { color: colors.primary }]}>{getCurrencySymbol(project.currency)} {price.toLocaleString()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cost Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cost Summary</Text>
          
          <View style={[styles.costCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.muted }]}>Subtotal</Text>
              <Text style={[styles.costValue, { color: colors.foreground }]}>{getCurrencySymbol(project.currency)} {costs.subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: colors.muted }]}>Profit ({project.profitMarginPercent}%)</Text>
              <Text style={[styles.costValue, { color: colors.success }]}>+{getCurrencySymbol(project.currency)} {costs.profit.toLocaleString()}</Text>
            </View>
            <View style={[styles.costRow, styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>{getCurrencySymbol(project.currency)} {costs.total.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={generatePDF}
            disabled={exporting}
            style={[styles.exportButton, { backgroundColor: colors.primary, opacity: exporting ? 0.7 : 1 }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="doc.fill" size={22} color="#FFF" />
            <Text style={styles.exportButtonText}>
              {exporting ? "Generating PDF..." : "Export as PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={[styles.metadataText, { color: colors.muted }]}>
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </Text>
          <Text style={[styles.metadataText, { color: colors.muted }]}>
            Last updated: {new Date(project.updatedAt).toLocaleDateString()}
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
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  projectName: {
    fontSize: 28,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  talentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  talentImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  talentPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  talentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  talentName: {
    fontSize: 16,
    fontWeight: "600",
  },
  talentCategory: {
    fontSize: 13,
    marginTop: 2,
    textTransform: "capitalize",
  },
  talentPrice: {
    fontSize: 16,
    fontWeight: "600",
  },
  costCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  costLabel: {
    fontSize: 15,
  },
  costValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 18,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  exportButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
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

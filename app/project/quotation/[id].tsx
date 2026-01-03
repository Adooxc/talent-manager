import { useCallback, useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { Project, Talent, Category } from "@/lib/types";
import { getProjectById, getTalents, getCategories, calculateProjectCosts, getCurrencySymbol } from "@/lib/storage";
import { useFocusEffect } from "@react-navigation/native";

type DocumentType = 'quotation' | 'invoice';

export default function QuotationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const [project, setProject] = useState<Project | null>(null);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [docType, setDocType] = useState<DocumentType>('quotation');
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState('7');
  const [generating, setGenerating] = useState(false);

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

  const generateDocument = async () => {
    if (!project) return;
    
    setGenerating(true);
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const costs = calculateProjectCosts(talents, project.talents, project.profitMarginPercent);
      const currencySymbol = getCurrencySymbol(project.currency);
      const docNumber = `${docType === 'quotation' ? 'QT' : 'INV'}-${Date.now().toString().slice(-8)}`;
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const validUntil = new Date(Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const talentRows = project.talents.map((pt) => {
        const talent = talents.find((t) => t.id === pt.talentId);
        if (!talent) return "";
        const price = pt.customPrice ?? talent.pricePerProject;
        const category = categories.find(c => c.id === talent.categoryId)?.name || 'Talent';
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">${talent.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0;">${category}</td>
            <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right;">${currencySymbol} ${price.toLocaleString()}</td>
          </tr>
        `;
      }).join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${docType === 'quotation' ? 'Quotation' : 'Invoice'} - ${project.name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #0F172A;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 3px solid #6366F1;
            }
            .company-info h1 {
              font-size: 24px;
              margin: 0 0 8px 0;
              color: #6366F1;
            }
            .company-info p {
              margin: 4px 0;
              color: #64748B;
              font-size: 14px;
            }
            .doc-info {
              text-align: right;
            }
            .doc-type {
              font-size: 28px;
              font-weight: 700;
              color: #6366F1;
              margin: 0;
            }
            .doc-number {
              font-size: 14px;
              color: #64748B;
              margin: 8px 0;
            }
            .doc-date {
              font-size: 14px;
              color: #64748B;
            }
            .client-section {
              background: #F8FAFC;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .client-section h3 {
              margin: 0 0 12px 0;
              font-size: 14px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .client-name {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 4px 0;
            }
            .client-phone {
              color: #64748B;
              margin: 0;
            }
            .project-section {
              margin-bottom: 30px;
            }
            .project-section h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .project-name {
              font-size: 20px;
              font-weight: 600;
              margin: 0 0 8px 0;
            }
            .project-dates {
              color: #64748B;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background: #6366F1;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            th:last-child {
              text-align: right;
            }
            .totals {
              background: #F8FAFC;
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #E2E8F0;
            }
            .total-row:last-child {
              border-bottom: none;
              font-size: 20px;
              font-weight: 700;
              color: #6366F1;
              padding-top: 12px;
            }
            .total-label {
              color: #64748B;
            }
            .notes-section {
              background: #FEF3C7;
              padding: 16px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .notes-section h4 {
              margin: 0 0 8px 0;
              color: #92400E;
            }
            .notes-section p {
              margin: 0;
              color: #92400E;
              font-size: 14px;
            }
            .validity {
              text-align: center;
              color: #64748B;
              font-size: 14px;
              padding: 20px;
              border-top: 1px solid #E2E8F0;
            }
            .footer {
              text-align: center;
              color: #94A3B8;
              font-size: 12px;
              margin-top: 40px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${companyName ? `<h1>${companyName}</h1>` : '<h1>Talent Manager</h1>'}
              ${companyPhone ? `<p>📞 ${companyPhone}</p>` : ''}
              ${companyEmail ? `<p>✉️ ${companyEmail}</p>` : ''}
            </div>
            <div class="doc-info">
              <p class="doc-type">${docType === 'quotation' ? 'QUOTATION' : 'INVOICE'}</p>
              <p class="doc-number">${docNumber}</p>
              <p class="doc-date">${today}</p>
            </div>
          </div>

          ${project.clientName ? `
          <div class="client-section">
            <h3>${docType === 'quotation' ? 'Quote For' : 'Bill To'}</h3>
            <p class="client-name">${project.clientName}</p>
            ${project.clientPhone ? `<p class="client-phone">${project.clientPhone}</p>` : ''}
          </div>
          ` : ''}

          <div class="project-section">
            <h3>Project Details</h3>
            <p class="project-name">${project.name}</p>
            <p class="project-dates">
              ${new Date(project.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - 
              ${new Date(project.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Talent</th>
                <th>Category</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              ${talentRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span>${currencySymbol} ${costs.subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Service Fee (${project.profitMarginPercent}%)</span>
              <span>${currencySymbol} ${costs.profit.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Total ${docType === 'invoice' ? 'Due' : ''}</span>
              <span>${currencySymbol} ${costs.total.toLocaleString()}</span>
            </div>
          </div>

          ${notes ? `
          <div class="notes-section">
            <h4>Notes</h4>
            <p>${notes}</p>
          </div>
          ` : ''}

          ${docType === 'quotation' ? `
          <div class="validity">
            This quotation is valid until <strong>${validUntil}</strong>
          </div>
          ` : ''}

          <div class="footer">
            Generated by Talent Manager • ${today}
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${docType === 'quotation' ? 'Quotation' : 'Invoice'}`,
          UTI: 'com.adobe.pdf',
        });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate document. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!project) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text style={{ color: colors.muted }}>Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Generate Document
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Document Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              onPress={() => setDocType('quotation')}
              style={[
                styles.typeButton,
                { backgroundColor: docType === 'quotation' ? colors.primary : colors.surface },
              ]}
            >
              <IconSymbol name="doc.text.fill" size={20} color={docType === 'quotation' ? '#FFF' : colors.foreground} />
              <Text style={[styles.typeText, { color: docType === 'quotation' ? '#FFF' : colors.foreground }]}>
                Quotation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setDocType('invoice')}
              style={[
                styles.typeButton,
                { backgroundColor: docType === 'invoice' ? colors.primary : colors.surface },
              ]}
            >
              <IconSymbol name="dollarsign.circle.fill" size={20} color={docType === 'invoice' ? '#FFF' : colors.foreground} />
              <Text style={[styles.typeText, { color: docType === 'invoice' ? '#FFF' : colors.foreground }]}>
                Invoice
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Company Info</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Company Name"
              placeholderTextColor={colors.muted}
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Phone Number"
              placeholderTextColor={colors.muted}
              value={companyPhone}
              onChangeText={setCompanyPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Email Address"
              placeholderTextColor={colors.muted}
              value={companyEmail}
              onChangeText={setCompanyEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Validity (for quotation) */}
        {docType === 'quotation' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Validity Period</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Days valid"
                placeholderTextColor={colors.muted}
                value={validDays}
                onChangeText={setValidDays}
                keyboardType="number-pad"
              />
              <Text style={[styles.inputSuffix, { color: colors.muted }]}>days</Text>
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Additional Notes</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.foreground }]}
              placeholder="Payment terms, special conditions, etc."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Preview Info */}
        <View style={[styles.previewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.previewTitle, { color: colors.foreground }]}>{project.name}</Text>
          <Text style={[styles.previewSubtitle, { color: colors.muted }]}>
            {project.talents.length} talents • {getCurrencySymbol(project.currency)} {calculateProjectCosts(talents, project.talents, project.profitMarginPercent).total.toLocaleString()}
          </Text>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={generateDocument}
          disabled={generating}
          style={[styles.generateButton, { backgroundColor: colors.primary, opacity: generating ? 0.7 : 1 }]}
        >
          <IconSymbol name="doc.text.fill" size={20} color="#FFF" />
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : `Generate ${docType === 'quotation' ? 'Quotation' : 'Invoice'}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  inputSuffix: {
    fontSize: 14,
  },
  textAreaContainer: {
    alignItems: "flex-start",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  previewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  previewSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  generateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

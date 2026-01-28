import { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getTemplate, type TemplateData } from "@/lib/template-manager";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function TemplatePreviewScreen() {
  const router = useRouter();
  const colors = useColors();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileUri, setFileUri] = useState<string | null>(null);

  const loadTemplate = useCallback(async () => {
    try {
      setLoading(true);
      if (templateId) {
        const data = await getTemplate(templateId);
        setTemplate(data);

        if (data) {
          // Convert base64 to file URI for preview
          const fileName = data.fileName || `template_${Date.now()}`;
          const fileExtension = fileName.split('.').pop() || 'pdf';
          const tempUri = FileSystem.cacheDirectory + `preview_${Date.now()}.${fileExtension}`;

          await FileSystem.writeAsStringAsync(tempUri, data.content, {
            encoding: FileSystem.EncodingType.Base64,
          });

          setFileUri(tempUri);
        }
      }
    } catch (error) {
      console.error("Error loading template:", error);
      Alert.alert("Error", "Failed to load template");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleOpenExternally = async () => {
    try {
      if (!fileUri) {
        Alert.alert("Error", "File not available");
        return;
      }

      // Try to open with external app
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: template?.mimeType || "application/pdf",
          dialogTitle: `View ${template?.fileName}`,
        });
      } else {
        Alert.alert("Error", "Sharing not available on this device");
      }
    } catch (err) {
      console.error("Error opening file:", err);
      Alert.alert("Error", "Failed to open file");
    }
  };

  const isImageFile = template?.mimeType?.startsWith("image/");
  const isPdfFile = template?.mimeType === "application/pdf";

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Loading template...</Text>
      </ScreenContainer>
    );
  }

  if (!template) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Template not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: 6 }}
        >
          <Text style={{ color: "#FFF", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mb-4">
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>← Back</Text>
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-foreground mb-2">Template Preview</Text>
          <Text className="text-base text-muted">{template.fileName}</Text>
        </View>

        {/* Template Info */}
        <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <View className="mb-3">
            <Text className="text-sm text-muted">Type</Text>
            <Text className="text-base font-semibold text-foreground capitalize">
              {template.type}
            </Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted">File Name</Text>
            <Text className="text-base font-semibold text-foreground">{template.fileName}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted">File Type</Text>
            <Text className="text-base font-semibold text-foreground">{template.mimeType}</Text>
          </View>

          <View className="mb-3">
            <Text className="text-sm text-muted">Uploaded</Text>
            <Text className="text-base font-semibold text-foreground">
              {new Date(template.createdAt).toLocaleString("ar-SA")}
            </Text>
          </View>

          <View>
            <Text className="text-sm text-muted">Last Modified</Text>
            <Text className="text-base font-semibold text-foreground">
              {new Date(template.updatedAt).toLocaleString("ar-SA")}
            </Text>
          </View>
        </View>

        {/* Preview Section */}
        <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-4">Preview</Text>

          {isImageFile && fileUri ? (
            <View
              style={{
                width: "100%",
                height: 300,
                borderRadius: 8,
                backgroundColor: colors.background,
                overflow: "hidden",
                marginBottom: 12,
              }}
            >
              <Image
                source={{ uri: `file://${fileUri}` }}
                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              />
            </View>
          ) : isPdfFile ? (
            <View
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                backgroundColor: colors.background,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.border,
                borderStyle: "dashed",
                marginBottom: 12,
              }}
            >
              <Text className="text-4xl mb-2">📄</Text>
              <Text className="text-foreground font-semibold">PDF Document</Text>
              <Text className="text-muted text-sm mt-1">Tap &quot;Open Externally&quot; to view</Text>
            </View>
          ) : (
            <View
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                backgroundColor: colors.background,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: colors.border,
                borderStyle: "dashed",
                marginBottom: 12,
              }}
            >
              <Text className="text-4xl mb-2">📁</Text>
              <Text className="text-foreground font-semibold">File Preview</Text>
              <Text className="text-muted text-sm mt-1">Tap &quot;Open Externally&quot; to view</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleOpenExternally}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
              Open Externally
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: colors.foreground, textAlign: "center", fontWeight: "600" }}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

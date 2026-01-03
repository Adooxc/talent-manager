import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import * as ImagePicker from "expo-image-picker";
import { loadAdminSettings, saveAdminSettings, type AdminSettings } from "@/lib/admin-sync";

const DEFAULT_SETTINGS: AdminSettings = {
  appName: "Talent Manager",
  primaryColor: "#7C3AED",
  logoUrl: "",
};

export default function AdminPanelScreen() {
  const router = useRouter();
  const colors = useColors();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await loadAdminSettings();
      setSettings(saved);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await saveAdminSettings(settings);
      Alert.alert("Success", "Settings saved successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setSettings({ ...settings, logoUrl: result.assets[0].uri });
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          
          router.replace("/(tabs)");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Admin Control Panel</Text>
          <Text className="text-base text-muted">Manage app settings</Text>
        </View>

        {/* Logo Section */}
        <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-3">App Logo</Text>
          
          {settings.logoUrl ? (
            <Image
              source={{ uri: settings.logoUrl }}
              style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 12 }}
            />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 8,
                backgroundColor: colors.border,
                marginBottom: 12,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text className="text-muted">No Logo</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={pickImage}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 10,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#FFF", textAlign: "center", fontWeight: "600" }}>
              Change Logo
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Name Section */}
        <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-3">App Name</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 6,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.foreground,
              backgroundColor: colors.background,
            }}
            placeholder="Enter app name"
            placeholderTextColor={colors.muted}
            value={settings.appName}
            onChangeText={(text) => setSettings({ ...settings, appName: text })}
          />
        </View>

        {/* Primary Color Section */}
        <View className="mb-6 p-4 rounded-lg" style={{ backgroundColor: colors.surface }}>
          <Text className="text-lg font-semibold text-foreground mb-3">Primary Color</Text>
          
          <View className="flex-row items-center gap-3 mb-4">
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 6,
                backgroundColor: settings.primaryColor,
                borderWidth: 2,
                borderColor: colors.border,
              }}
            />
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.foreground,
                backgroundColor: colors.background,
              }}
              placeholder="#7C3AED"
              placeholderTextColor={colors.muted}
              value={settings.primaryColor}
              onChangeText={(text) => setSettings({ ...settings, primaryColor: text })}
            />
          </View>

          {/* Color Presets */}
          <View className="flex-row gap-2">
            {["#7C3AED", "#FF6B6B", "#4ECDC4", "#FFD93D", "#6C5CE7"].map((color) => (
              <TouchableOpacity
                key={color}
                onPress={() => setSettings({ ...settings, primaryColor: color })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 6,
                  backgroundColor: color,
                  borderWidth: 2,
                  borderColor: settings.primaryColor === color ? colors.foreground : "transparent",
                }}
              />
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveSettings}
          disabled={saving}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            {saving ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            borderWidth: 1,
            borderColor: colors.error,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <Text style={{ color: colors.error, textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

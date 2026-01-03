import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLoginUrl } from "@/constants/oauth";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      setLoading(true);
      const loginUrl = getLoginUrl();
      
      console.log("[Login] Starting OAuth flow...");
      console.log("[Login] Login URL:", loginUrl);

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        Linking.createURL("/oauth/callback")
      );
      console.log("[Login] OAuth result:", result.type);

      if (result.type === "success") {
        console.log("[Login] OAuth success, redirecting...");
        router.replace("/(tabs)");
      } else if (result.type === "cancel") {
        console.log("[Login] OAuth cancelled");
        Alert.alert("Cancelled", "Login was cancelled");
      } else if (result.type === "dismiss") {
        console.log("[Login] OAuth dismissed");
        Alert.alert("Dismissed", "Login was dismissed");
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <ScreenContainer className="p-6">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
            <IconSymbol name="person.crop.circle.badge.plus" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Cloud Sync
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Sign in to enable cloud synchronization across all your devices
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.features}>
          {[
            { icon: "icloud.and.arrow.up", label: "Sync data across devices" },
            { icon: "lock.fill", label: "Secure authentication" },
            { icon: "checkmark.circle.fill", label: "Automatic backups" },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + "20" }]}>
                <IconSymbol name={feature.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.featureLabel, { color: colors.foreground }]}>
                {feature.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Login Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <IconSymbol name="person.crop.circle.badge.checkmark" size={20} color="#FFF" />
                <Text style={styles.loginButtonText}>Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.skipButton, { borderColor: colors.border }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.skipButtonText, { color: colors.foreground }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <Text style={[styles.info, { color: colors.muted }]}>
          You can sign in later from Settings
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginTop: 40,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  features: {
    width: "100%",
    gap: 16,
    marginTop: 40,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 40,
  },
  loginButton: {
    flexDirection: "row",
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  info: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
  },
});

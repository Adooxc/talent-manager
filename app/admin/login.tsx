import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ADMIN_USERNAME = "Adoo";
const ADMIN_PASSWORD = "26542654";

export default function AdminLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      Alert.alert("Error", "Invalid username or password");
      return;
    }

    setLoading(true);
    try {
      // Save admin session
      await AsyncStorage.setItem("adminSession", "true");
      await AsyncStorage.setItem("adminLoginTime", new Date().toISOString());
      
      // Navigate to admin panel
      router.replace("/admin/panel");
    } catch (error) {
      Alert.alert("Error", "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-center">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Admin Panel</Text>
          <Text className="text-base text-muted">Enter your credentials to continue</Text>
        </View>

        {/* Username Input */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Username</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.foreground,
              backgroundColor: colors.surface,
            }}
            placeholder="Enter username"
            placeholderTextColor={colors.muted}
            value={username}
            onChangeText={setUsername}
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-foreground mb-2">Password</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.foreground,
              backgroundColor: colors.surface,
            }}
            placeholder="Enter password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            marginBottom: 12,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: "#FFF", textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: colors.foreground, textAlign: "center", fontSize: 16, fontWeight: "600" }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

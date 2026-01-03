import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdminSettings {
  appName: string;
  primaryColor: string;
  logoUrl: string;
}

const DEFAULT_SETTINGS: AdminSettings = {
  appName: "Talent Manager",
  primaryColor: "#7C3AED",
  logoUrl: "",
};

/**
 * Save admin settings to local storage and sync to server
 */
export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  try {
    // Save locally first
    await AsyncStorage.setItem("adminSettings", JSON.stringify(settings));

    // Try to sync to server
    try {
      const trpcClient = trpc.createClient({
        links: [],
      });
      
      // You can add server sync here when backend is ready
      // await trpcClient.admin.updateSettings.mutate(settings);
    } catch (error) {
      console.warn("Failed to sync admin settings to server:", error);
      // Continue anyway - local save was successful
    }
  } catch (error) {
    console.error("Failed to save admin settings:", error);
    throw error;
  }
}

/**
 * Load admin settings from local storage
 */
export async function loadAdminSettings(): Promise<AdminSettings> {
  try {
    const saved = await AsyncStorage.getItem("adminSettings");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to load admin settings:", error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Fetch admin settings from server (when backend is ready)
 */
export async function fetchAdminSettingsFromServer(): Promise<AdminSettings | null> {
  try {
    // This will be implemented when backend is ready
    // const trpcClient = trpc.createClient({...});
    // return await trpcClient.admin.getSettings.query();
    return null;
  } catch (error) {
    console.error("Failed to fetch admin settings from server:", error);
    return null;
  }
}

/**
 * Sync admin settings - fetch from server and update locally if different
 */
export async function syncAdminSettings(): Promise<AdminSettings> {
  try {
    // Try to get from server
    const serverSettings = await fetchAdminSettingsFromServer();
    
    if (serverSettings) {
      // Save server settings locally
      await AsyncStorage.setItem("adminSettings", JSON.stringify(serverSettings));
      return serverSettings;
    }
  } catch (error) {
    console.warn("Failed to sync admin settings:", error);
  }

  // Fall back to local settings
  return await loadAdminSettings();
}

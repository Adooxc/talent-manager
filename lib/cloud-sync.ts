import { getTalents, getProjects, getCategories, getSettings, getBookings } from "./storage";
import { Talent, Project, Category, TalentBooking, AppSettings } from "./types";
import { Platform } from "react-native";
import { getApiBaseUrl } from "../constants/oauth";
import * as Auth from "./_core/auth";

/**
 * Cloud Sync Module
 * Handles synchronization of local data with the cloud database after authentication
 */

export async function syncAllDataToCloud(): Promise<boolean> {
  try {
    console.log("[CloudSync] Starting full data sync to cloud...");

    // Skip sync only if running on web browser (not Expo Go)
    // Expo Go reports Platform.OS as 'web' but still needs sync
    // We check if we have a session token - if we do, we're on native/Expo Go and should sync
    // If we don't have a token, we're on web browser with cookie-based auth
    const sessionToken = await Auth.getSessionToken();
    if (!sessionToken) {
      console.log("[CloudSync] No session token, skipping sync (web browser with cookie auth)");
      return true;
    }

    console.log("[CloudSync] Platform:", Platform.OS, "- proceeding with sync");

    // Session token already checked above

    // Fetch all local data
    const [talents, projects, categories, bookings, settings] = await Promise.all([
      getTalents(),
      getProjects(),
      getCategories(),
      getBookings(),
      getSettings(),
    ]);

    console.log("[CloudSync] Local data fetched:", {
      talents: talents.length,
      projects: projects.length,
      categories: categories.length,
      bookings: bookings.length,
    });

    // Transform local data to cloud format
    const cloudData = {
      talents: talents.map((t) => transformTalent(t)),
      projects: projects.map((p) => transformProject(p)),
      categories: categories.map((c) => transformCategory(c)),
      bookings: bookings.map((b) => transformBooking(b)),
      settings: transformSettings(settings),
    };

    console.log("[CloudSync] Pushing data to cloud...");

    // Push data to cloud via direct API call
    const result = await pushToCloudAPI(cloudData, sessionToken);

    console.log("[CloudSync] Cloud sync successful:", result);
    return true;
  } catch (error) {
    console.error("[CloudSync] Error syncing data to cloud:", error);
    // Don't throw - sync failure shouldn't block the app
    return false;
  }
}

/**
 * Push data to cloud via direct API call (not using tRPC hooks)
 */
async function pushToCloudAPI(
  data: any,
  sessionToken: string
): Promise<any> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/trpc/sync.push`;

  console.log("[CloudSync] Making API call to:", url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${sessionToken}`,
    },
    credentials: "include",
    body: JSON.stringify({
      json: data,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[CloudSync] API error:", response.status, errorText);
    throw new Error(`Cloud sync failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("[CloudSync] API response:", result);
  return result;
}

/**
 * Transform local talent to cloud format
 */
function transformTalent(talent: Talent) {
  return {
    odId: talent.id, // Use local ID as original device ID
    categoryId: 1, // Will be mapped on server
    name: talent.name,
    gender: talent.gender,
    profilePhoto: talent.profilePhoto || null,
    photos: talent.photos,
    phoneNumbers: talent.phoneNumbers,
    socialMedia: talent.socialMedia,
    pricePerProject: talent.pricePerProject.toString(),
    currency: talent.currency,
    notes: talent.notes,
    customFields: talent.customFields,
    rating: talent.rating || null,
    tags: talent.tags,
    isFavorite: talent.isFavorite,
  };
}

/**
 * Transform local project to cloud format
 */
function transformProject(project: Project) {
  return {
    odId: project.id, // Use local ID as original device ID
    name: project.name,
    description: project.description,
    startDate: project.startDate || null,
    endDate: project.endDate || null,
    status: project.status as "draft" | "active" | "completed" | "negotiating" | "cancelled" | "postponed",
    talents: project.talents,
    profitMarginPercent: project.profitMarginPercent.toString(),
    currency: project.currency,
    pdfTemplate: project.pdfTemplate as "client" | "internal" | "invoice",
  };
}

/**
 * Transform local category to cloud format
 */
function transformCategory(category: Category) {
  return {
    name: category.name,
    nameAr: category.nameAr || null,
    order: category.order,
  };
}

/**
 * Transform local booking to cloud format
 */
function transformBooking(booking: TalentBooking) {
  return {
    odId: booking.id,
    talentId: 1, // Will be mapped on server
    title: booking.title,
    location: booking.location || null,
    startDate: booking.startDate,
    endDate: booking.endDate,
    allDay: booking.allDay,
    notes: booking.notes,
    projectId: booking.projectId || null,
  };
}

/**
 * Transform local settings to cloud format
 */
function transformSettings(settings: AppSettings) {
  return {
    monthlyReminderEnabled: settings.monthlyReminderEnabled,
    reminderDayOfMonth: settings.reminderDayOfMonth,
    defaultProfitMargin: settings.defaultProfitMargin.toString(),
    defaultCurrency: settings.defaultCurrency,
    viewMode: settings.viewMode as "grid" | "list",
    sortBy: settings.sortBy as "name" | "price" | "date" | "rating",
    sortOrder: settings.sortOrder as "asc" | "desc",
    darkMode: settings.darkMode,
    whatsappMessage: settings.whatsappMessage,
  };
}

/**
 * Pull data from cloud and merge with local data
 */
export async function pullDataFromCloud(): Promise<boolean> {
  try {
    console.log("[CloudSync] Pulling data from cloud...");

    if (Platform.OS === "web") {
      console.log("[CloudSync] Web platform, skipping pull (uses cookie-based auth)");
      return true;
    }

    // This would be implemented to fetch from cloud and merge
    // For now, just log that it's called
    console.log("[CloudSync] Cloud pull would be implemented here");
    return true;
  } catch (error) {
    console.error("[CloudSync] Error pulling data from cloud:", error);
    return false;
  }
}

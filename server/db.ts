import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  talents, 
  projects, 
  categories, 
  bookings, 
  userSettings,
  InsertTalent,
  InsertProject,
  InsertCategory,
  InsertBooking,
  InsertUserSettings,
  Talent,
  Project,
  Category,
  Booking,
  UserSettings
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// TALENTS
export async function getUserTalents(userId: number): Promise<Talent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(talents).where(eq(talents.userId, userId));
}

export async function createTalent(data: InsertTalent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(talents).values(data);
  return Number(result[0].insertId);
}

export async function updateTalent(id: number, userId: number, data: Partial<InsertTalent>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(talents).set(data).where(and(eq(talents.id, id), eq(talents.userId, userId)));
}

export async function deleteTalent(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(talents).where(and(eq(talents.id, id), eq(talents.userId, userId)));
}

export async function getTalentByOdId(odId: string, userId: number): Promise<Talent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(talents).where(and(eq(talents.odId, odId), eq(talents.userId, userId))).limit(1);
  return result[0];
}

// PROJECTS
export async function getUserProjects(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId));
}

export async function createProject(data: InsertProject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return Number(result[0].insertId);
}

export async function updateProject(id: number, userId: number, data: Partial<InsertProject>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function deleteProject(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
}

export async function getProjectByOdId(odId: string, userId: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(and(eq(projects.odId, odId), eq(projects.userId, userId))).limit(1);
  return result[0];
}

// CATEGORIES
export async function getUserCategories(userId: number): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.userId, userId));
}

export async function createCategory(data: InsertCategory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return Number(result[0].insertId);
}

export async function updateCategory(id: number, userId: number, data: Partial<InsertCategory>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)));
}

// BOOKINGS
export async function getUserBookings(userId: number): Promise<Booking[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).where(eq(bookings.userId, userId));
}

export async function createBooking(data: InsertBooking): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data);
  return Number(result[0].insertId);
}

export async function updateBooking(id: number, userId: number, data: Partial<InsertBooking>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set(data).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
}

export async function deleteBooking(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.userId, userId)));
}

export async function getBookingByOdId(odId: string, userId: number): Promise<Booking | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bookings).where(and(eq(bookings.odId, odId), eq(bookings.userId, userId))).limit(1);
  return result[0];
}

// USER SETTINGS
export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserSettings(userId: number, data: Partial<InsertUserSettings>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getUserSettings(userId);
  if (existing) {
    await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ ...data, userId });
  }
}

// SYNC
export interface SyncData {
  talents: Talent[];
  projects: Project[];
  categories: Category[];
  bookings: Booking[];
  settings: UserSettings | null;
  lastSyncAt: string;
}

export async function getAllUserData(userId: number): Promise<SyncData> {
  const [talentsList, projectsList, categoriesList, bookingsList, settings] = await Promise.all([
    getUserTalents(userId),
    getUserProjects(userId),
    getUserCategories(userId),
    getUserBookings(userId),
    getUserSettings(userId),
  ]);
  return {
    talents: talentsList,
    projects: projectsList,
    categories: categoriesList,
    bookings: bookingsList,
    settings: settings || null,
    lastSyncAt: new Date().toISOString(),
  };
}

export async function syncUserData(userId: number, data: {
  talents?: InsertTalent[];
  projects?: InsertProject[];
  categories?: InsertCategory[];
  bookings?: InsertBooking[];
  settings?: Partial<InsertUserSettings>;
}): Promise<SyncData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (data.talents && data.talents.length > 0) {
    for (const talent of data.talents) {
      const existing = await getTalentByOdId(talent.odId, userId);
      if (existing) {
        await updateTalent(existing.id, userId, talent);
      } else {
        await createTalent({ ...talent, userId });
      }
    }
  }
  
  if (data.projects && data.projects.length > 0) {
    for (const project of data.projects) {
      const existing = await getProjectByOdId(project.odId, userId);
      if (existing) {
        await updateProject(existing.id, userId, project);
      } else {
        await createProject({ ...project, userId });
      }
    }
  }
  
  if (data.categories && data.categories.length > 0) {
    const existingCats = await getUserCategories(userId);
    for (const cat of existingCats) {
      await deleteCategory(cat.id, userId);
    }
    for (const cat of data.categories) {
      await createCategory({ ...cat, userId });
    }
  }
  
  if (data.bookings && data.bookings.length > 0) {
    for (const booking of data.bookings) {
      const existing = await getBookingByOdId(booking.odId, userId);
      if (existing) {
        await updateBooking(existing.id, userId, booking);
      } else {
        await createBooking({ ...booking, userId });
      }
    }
  }
  
  if (data.settings) {
    await upsertUserSettings(userId, data.settings);
  }
  
  return getAllUserData(userId);
}

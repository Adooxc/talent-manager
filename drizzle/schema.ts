import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============ TALENT MANAGER TABLES ============

/**
 * Categories for talents (e.g., Actors, Models, Influencers)
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Talents (models, artists, influencers)
 */
export const talents = mysqlTable("talents", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(), // Original device ID for sync
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  gender: mysqlEnum("gender", ["male", "female"]).notNull(),
  profilePhoto: text("profilePhoto"),
  photos: json("photos").$type<string[]>(),
  phoneNumbers: json("phoneNumbers").$type<string[]>(),
  socialMedia: json("socialMedia").$type<{
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    snapchat?: string;
    other?: string;
  }>(),
  pricePerProject: decimal("pricePerProject", { precision: 12, scale: 2 }).default("0").notNull(),
  currency: varchar("currency", { length: 10 }).default("KWD").notNull(),
  notes: text("notes"),
  customFields: json("customFields").$type<{
    height?: string;
    weight?: string;
    age?: number;
    hairColor?: string;
    eyeColor?: string;
    languages?: string[];
    nationality?: string;
    location?: string;
    experience?: string;
  }>(),
  rating: int("rating"),
  tags: json("tags").$type<string[]>(),
  isFavorite: boolean("isFavorite").default(false).notNull(),
  lastPhotoUpdate: timestamp("lastPhotoUpdate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Talent = typeof talents.$inferSelect;
export type InsertTalent = typeof talents.$inferInsert;

/**
 * Projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "negotiating", "cancelled", "postponed"]).default("draft").notNull(),
  talents: json("talents").$type<{
    talentId: string;
    customPrice?: number;
    bookingId?: string;
    notes?: string;
  }[]>(),
  profitMarginPercent: decimal("profitMarginPercent", { precision: 5, scale: 2 }).default("15").notNull(),
  currency: varchar("currency", { length: 10 }).default("KWD").notNull(),
  pdfTemplate: mysqlEnum("pdfTemplate", ["client", "internal", "invoice"]).default("client"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Bookings for talent calendar
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  odId: varchar("odId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  talentId: int("talentId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  allDay: boolean("allDay").default(false).notNull(),
  notes: text("notes"),
  projectId: int("projectId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

/**
 * User settings
 */
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  monthlyReminderEnabled: boolean("monthlyReminderEnabled").default(true).notNull(),
  reminderDayOfMonth: int("reminderDayOfMonth").default(1).notNull(),
  defaultProfitMargin: decimal("defaultProfitMargin", { precision: 5, scale: 2 }).default("15").notNull(),
  defaultCurrency: varchar("defaultCurrency", { length: 10 }).default("KWD").notNull(),
  lastReminderDate: timestamp("lastReminderDate"),
  viewMode: mysqlEnum("viewMode", ["grid", "list"]).default("grid"),
  sortBy: mysqlEnum("sortBy", ["name", "price", "date", "rating"]).default("name"),
  sortOrder: mysqlEnum("sortOrder", ["asc", "desc"]).default("asc"),
  darkMode: boolean("darkMode").default(false).notNull(),
  whatsappMessage: text("whatsappMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

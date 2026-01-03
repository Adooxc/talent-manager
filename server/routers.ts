import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Zod schemas for validation
const talentSchema = z.object({
  odId: z.string(),
  categoryId: z.number(),
  name: z.string(),
  gender: z.enum(["male", "female"]),
  profilePhoto: z.string().nullable().optional(),
  photos: z.array(z.string()).nullable().optional(),
  phoneNumbers: z.array(z.string()).nullable().optional(),
  socialMedia: z.object({
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    youtube: z.string().optional(),
    snapchat: z.string().optional(),
    other: z.string().optional(),
  }).nullable().optional(),
  pricePerProject: z.string(),
  currency: z.string(),
  notes: z.string().nullable().optional(),
  customFields: z.object({
    height: z.string().optional(),
    weight: z.string().optional(),
    age: z.number().optional(),
    hairColor: z.string().optional(),
    eyeColor: z.string().optional(),
    languages: z.array(z.string()).optional(),
    nationality: z.string().optional(),
    location: z.string().optional(),
    experience: z.string().optional(),
  }).nullable().optional(),
  rating: z.number().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  isFavorite: z.boolean().optional(),
});

const projectSchema = z.object({
  odId: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: z.enum(["draft", "active", "completed", "negotiating", "cancelled", "postponed"]),
  talents: z.array(z.object({
    talentId: z.string(),
    customPrice: z.number().optional(),
    bookingId: z.string().optional(),
    notes: z.string().optional(),
  })).nullable().optional(),
  profitMarginPercent: z.string(),
  currency: z.string(),
  pdfTemplate: z.enum(["client", "internal", "invoice"]).nullable().optional(),
});

const categorySchema = z.object({
  name: z.string(),
  nameAr: z.string().nullable().optional(),
  order: z.number().optional(),
});

const bookingSchema = z.object({
  odId: z.string(),
  talentId: z.number(),
  title: z.string(),
  location: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  allDay: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  projectId: z.number().nullable().optional(),
});

const settingsSchema = z.object({
  monthlyReminderEnabled: z.boolean().optional(),
  reminderDayOfMonth: z.number().optional(),
  defaultProfitMargin: z.string().optional(),
  defaultCurrency: z.string().optional(),
  viewMode: z.enum(["grid", "list"]).nullable().optional(),
  sortBy: z.enum(["name", "price", "date", "rating"]).nullable().optional(),
  sortOrder: z.enum(["asc", "desc"]).nullable().optional(),
  darkMode: z.boolean().optional(),
  whatsappMessage: z.string().nullable().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Sync API
  sync: router({
    // Get all user data
    pull: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllUserData(ctx.user.id);
    }),

    // Push local data to server
    push: protectedProcedure
      .input(z.object({
        talents: z.array(talentSchema).optional(),
        projects: z.array(projectSchema).optional(),
        categories: z.array(categorySchema).optional(),
        bookings: z.array(bookingSchema).optional(),
        settings: settingsSchema.optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const transformedInput: Parameters<typeof db.syncUserData>[1] = {};
        
        if (input.talents) {
          transformedInput.talents = input.talents.map(t => ({
            ...t,
            userId: ctx.user.id,
            startDate: undefined,
            endDate: undefined,
          }));
        }
        
        if (input.projects) {
          transformedInput.projects = input.projects.map(p => ({
            ...p,
            userId: ctx.user.id,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          }));
        }
        
        if (input.categories) {
          transformedInput.categories = input.categories.map(c => ({
            ...c,
            userId: ctx.user.id,
          }));
        }
        
        if (input.bookings) {
          transformedInput.bookings = input.bookings.map(b => ({
            ...b,
            userId: ctx.user.id,
            startDate: new Date(b.startDate),
            endDate: new Date(b.endDate),
          }));
        }
        
        if (input.settings) {
          transformedInput.settings = input.settings;
        }
        
        return db.syncUserData(ctx.user.id, transformedInput);
      }),
  }),

  // Statistics API
  stats: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const data = await db.getAllUserData(ctx.user.id);
      
      const totalTalents = data.talents.length;
      const totalProjects = data.projects.length;
      const activeProjects = data.projects.filter(p => p.status === "active").length;
      const completedProjects = data.projects.filter(p => p.status === "completed").length;
      
      // Calculate revenue
      let totalRevenue = 0;
      let totalProfit = 0;
      
      for (const project of data.projects) {
        if (project.status === "completed" && project.talents) {
          const projectTalents = project.talents as { talentId: string; customPrice?: number }[];
          let subtotal = 0;
          
          for (const pt of projectTalents) {
            const talent = data.talents.find(t => t.odId === pt.talentId);
            if (talent) {
              subtotal += pt.customPrice ?? Number(talent.pricePerProject);
            }
          }
          
          const profit = subtotal * (Number(project.profitMarginPercent) / 100);
          totalRevenue += subtotal + profit;
          totalProfit += profit;
        }
      }
      
      // Talents by category
      const talentsByCategory = data.categories.map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        count: data.talents.filter(t => t.categoryId === cat.id).length,
      }));
      
      // Talents by gender
      const talentsByGender = {
        male: data.talents.filter(t => t.gender === "male").length,
        female: data.talents.filter(t => t.gender === "female").length,
      };
      
      // Average price
      const avgPrice = totalTalents > 0
        ? data.talents.reduce((sum, t) => sum + Number(t.pricePerProject), 0) / totalTalents
        : 0;
      
      // Top rated
      const topRated = [...data.talents]
        .filter(t => t.rating)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
      
      // Recent projects
      const recentProjects = [...data.projects]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
      
      return {
        totalTalents,
        totalProjects,
        activeProjects,
        completedProjects,
        totalRevenue,
        totalProfit,
        talentsByCategory,
        talentsByGender,
        averageTalentPrice: avgPrice,
        topRatedTalents: topRated,
        recentProjects,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

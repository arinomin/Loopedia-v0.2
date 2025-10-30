import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  nickname: text("nickname"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  profileText: text("profile_text"),
  isVerified: boolean("is_verified").default(false),
});

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const effects = pgTable("effects", {
  id: serial("id").primaryKey(),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  position: text("position").notNull(),
  fxGroup: text("fx_group").notNull().default("input"),
  effectType: text("effect_type").notNull(),
  sw: boolean("sw").notNull().default(false),
  swMode: text("sw_mode").notNull().default("TOGGLE"),
  insert: text("insert").notNull().default("ALL"),
  parameters: text("parameters").notNull(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const presetTags = pgTable("preset_tags", {
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.presetId, t.tagId] }),
}));

export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  isAutomatic: boolean("is_automatic").notNull().default(false),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userTitles = pgTable("user_titles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  titleId: integer("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("user_title_unique").on(t.userId, t.titleId),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  nickname: true,
});

export const insertPresetSchema = createInsertSchema(presets).pick({
  name: true,
  type: true,
});

export const insertEffectSchema = createInsertSchema(effects).pick({
  presetId: true,
  position: true,
  fxGroup: true,
  effectType: true,
  sw: true,
  swMode: true,
  insert: true,
  parameters: true,
}).extend({
  fxGroup: z.enum(["input", "track"]).default("input"),
  parameters: z.union([
    z.string(),
    z.record(z.any())
  ]).transform(params => {
    if (typeof params === 'string') {
      return params;
    }
    return JSON.stringify(params);
  })
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  profileText: true,
  nickname: true,
});

export const insertTitleSchema = createInsertSchema(titles)
  .omit({ id: true, createdAt: true });

export const insertUserTitleSchema = createInsertSchema(userTitles)
  .omit({ id: true, grantedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Preset = typeof presets.$inferSelect;
export type InsertPreset = z.infer<typeof insertPresetSchema>;

export type Effect = typeof effects.$inferSelect;
export type InsertEffect = z.infer<typeof insertEffectSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type Title = typeof titles.$inferSelect;
export type InsertTitle = z.infer<typeof insertTitleSchema>;

export type UserTitle = typeof userTitles.$inferSelect;
export type InsertUserTitle = z.infer<typeof insertUserTitleSchema>;

export type PresetWithDetails = Preset & {
  user: User & {
    titles?: (Title & { grantedAt: Date })[];
  };
  effects: Effect[];
  inputEffects?: Effect[];
  trackEffects?: Effect[];
  tags: Tag[];
};

export type PresetList = Preset & {
  user: User & {
    titles?: (Title & { grantedAt: Date })[];
  };
  tags: Tag[];
};

export type EffectType = "INPUT_FX" | "TRACK_FX" | "INPUT_TRACK_FX";
export type EffectPosition = "A" | "B" | "C" | "D";
export type ExtendedEffectPosition = "INPUT_A" | "INPUT_B" | "INPUT_C" | "INPUT_D" | "TRACK_A" | "TRACK_B" | "TRACK_C" | "TRACK_D";
export type FxGroup = "input" | "track";
export type SwitchMode = "TOGGLE" | "MOMENT";
export type InsertType = "ALL" | "MIC1" | "MIC2" | "INST1" | "INST2" | "TRACK1" | "TRACK2" | "TRACK3" | "TRACK4" | "TRACK5";

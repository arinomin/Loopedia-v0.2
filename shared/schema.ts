import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  nickname: text("nickname"),  // ユーザーが表示名として使用するニックネーム
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  profileText: text("profile_text"),
  country: text("country"),
  birthday: timestamp("birthday"),
  showBirthday: boolean("show_birthday").default(false),
  avatarUrl: text("avatar_url"),
  isVerified: boolean("is_verified").default(false), // 認証済みユーザーフラグ
});

export const presets = pgTable("presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // INPUT_FX, TRACK_FX, or INPUT_TRACK_FX
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const effects = pgTable("effects", {
  id: serial("id").primaryKey(),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  position: text("position").notNull(), // 基本位置: "A", "B", "C", "D"
  fxGroup: text("fx_group").notNull().default("input"), // 新規追加: "input" または "track"
  effectType: text("effect_type").notNull(), // e.g. "REVERB", "DELAY", etc.
  sw: boolean("sw").notNull().default(false),
  swMode: text("sw_mode").notNull().default("TOGGLE"),
  insert: text("insert").notNull().default("ALL"),
  parameters: text("parameters").notNull(), // JSON string of parameters
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

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// いいね機能のためのテーブル
export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ブックマーク機能のためのテーブル
export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  presetId: integer("preset_id")
    .notNull()
    .references(() => presets.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ユーザーのお気に入りループステーション
export const userLoopers = pgTable("user_loopers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  looperName: text("looper_name").notNull(),
  displayOrder: integer("display_order").notNull(),
});

// ユーザー設定のためのテーブル（いいね公開設定など）
export const userSettings = pgTable("user_settings", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id),
  showLikes: boolean("show_likes").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ユーザーフォローテーブル
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followedId: integer("followed_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // 同じフォロワーとフォローされたユーザーの組み合わせは一意にする
    followerFollowedUnique: uniqueIndex("follower_followed_unique_idx").on(
      table.followerId,
      table.followedId
    ),
  };
});

// 通知テーブル
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id), // 通知を受け取るユーザーID
  actorId: integer("actor_id").references(() => users.id), // アクションを起こしたユーザーID
  type: text("type").notNull(), // 通知タイプ: 'like', 'comment', 'follow', 'contact_reply'
  presetId: integer("preset_id").references(() => presets.id), // 関連プリセットID
  commentId: integer("comment_id").references(() => comments.id), // 関連コメントID
  contactId: integer("contact_id").references(() => contacts.id), // 関連お問い合わせID
  read: boolean("read").notNull().default(false), // 既読フラグ
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// お問い合わせ機能のためのテーブル
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // ログインユーザーからのお問い合わせの場合はユーザーIDを記録
  name: text("name").notNull(),
  contactMethod: text("contact_method"), // 'email', 'twitter', 'other' - 任意指定に変更
  contactDetail: text("contact_detail"), // 任意指定に変更
  category: text("category").notNull(), // 'question', 'bug', 'feature', 'account', 'other'
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // 'new', 'in_progress', 'resolved'
  isAnonymous: boolean("is_anonymous").default(false), // 匿名ユーザーからの問い合わせかどうか
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// お問い合わせへの返信テーブル
export const contactReplies = pgTable("contact_replies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id),
  reply: text("reply").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
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
  // fxGroupフィールドのデフォルト値を設定（既存データとの互換性のため）
  fxGroup: z.enum(["input", "track"]).default("input"),
  // parametersフィールドをより厳密に定義
  // 文字列またはオブジェクトとして受け入れる
  parameters: z.union([
    z.string(),
    z.record(z.any())
  ]).transform(params => {
    // 文字列の場合は既にJSON形式と見なす
    if (typeof params === 'string') {
      return params;
    }
    // オブジェクトの場合はJSON文字列に変換
    return JSON.stringify(params);
  })
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  presetId: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  presetId: true,
});

export const insertBookmarkSchema = createInsertSchema(bookmarks).pick({
  presetId: true,
});

export const insertUserLooperSchema = createInsertSchema(userLoopers).pick({
  userId: true,
  looperName: true,
  displayOrder: true,
});

export const updateUserProfileSchema = createInsertSchema(users).pick({
  profileText: true,
  nickname: true,
  country: true,
  birthday: true,
  showBirthday: true,
  avatarUrl: true,
  isVerified: true,
}).extend({
  // birthdayフィールドを文字列型としても受け入れるようにする (フロントエンドからの文字列形式の日付)
  birthday: z.union([z.date(), z.string(), z.null()]).optional(),
  // お気に入りアーティスト情報を含めるための拡張（スキーマ外のフィールド）
  favoriteArtists: z.array(
    z.object({
      userId: z.number(),
      looperName: z.string(),
      displayOrder: z.number()
    })
  ).optional()
});

export const updateUserSettingsSchema = createInsertSchema(userSettings).pick({
  showLikes: true,
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  userId: true,
  contactMethod: true,
  contactDetail: true,
  category: true,
  message: true,
  isAnonymous: true,
}).extend({
  // 設定しなくても良いように任意とする
  contactMethod: z.string().optional(),
  contactDetail: z.string().optional(),
  // 非ログインユーザーの場合は任意
  userId: z.number().optional(),
  // 匿名フラグも任意
  isAnonymous: z.boolean().optional(),
});

export const updateContactSchema = createInsertSchema(contacts).pick({
  status: true,
});

export const insertContactReplySchema = createInsertSchema(contactReplies).pick({
  contactId: true,
  reply: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Preset = typeof presets.$inferSelect;
export type InsertPreset = z.infer<typeof insertPresetSchema>;

export type Effect = typeof effects.$inferSelect;
export type InsertEffect = z.infer<typeof insertEffectSchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;

export type UserLooper = typeof userLoopers.$inferSelect;
export type InsertUserLooper = z.infer<typeof insertUserLooperSchema>;

export type UserSettings = typeof userSettings.$inferSelect;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type UpdateContact = z.infer<typeof updateContactSchema>;

export type ContactReply = typeof contactReplies.$inferSelect;
export type InsertContactReply = z.infer<typeof insertContactReplySchema>;

export type UserFollow = typeof userFollows.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

// Extended types for frontend use
export type PresetWithDetails = Preset & {
  user: User;
  effects: Effect[];
  inputEffects?: Effect[]; // INPUT_TRACK_FX タイプのプリセット用のINPUT側エフェクト
  trackEffects?: Effect[]; // INPUT_TRACK_FX タイプのプリセット用のTRACK側エフェクト
  tags: Tag[];
  likeCount?: number;
  bookmarkCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  likedUsers?: User[];
};

export type PresetList = Preset & {
  user: User;
  tags: Tag[];
  likeCount?: number;
  bookmarkCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type CommentWithUser = Comment & {
  user: User;
};

export type EffectType = "INPUT_FX" | "TRACK_FX" | "INPUT_TRACK_FX";
export type EffectPosition = "A" | "B" | "C" | "D";
export type ExtendedEffectPosition = "INPUT_A" | "INPUT_B" | "INPUT_C" | "INPUT_D" | "TRACK_A" | "TRACK_B" | "TRACK_C" | "TRACK_D";
export type FxGroup = "input" | "track";
export type SwitchMode = "TOGGLE" | "MOMENT";
export type InsertType = "ALL" | "MIC1" | "MIC2" | "INST1" | "INST2" | "TRACK1" | "TRACK2" | "TRACK3" | "TRACK4" | "TRACK5";

// ニュース関連のスキーマ (JSON形式で保存するため、データベーステーブルは不要)
export type News = {
  id: number;
  title: string;
  content: string;
  linkText: string | null;
  linkUrl: string | null;
  userId: number | null;
  pinned: boolean;
  createdAt: string;
};

export const insertNewsSchema = z.object({
  title: z.string().min(1, { message: "タイトルは必須です" }),
  content: z.string().min(1, { message: "内容は必須です" }),
  linkText: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  userId: z.number().nullable().optional(),
  pinned: z.boolean().default(false).optional(),
});

export type InsertNews = z.infer<typeof insertNewsSchema>;

// ユーザー称号関連のスキーマ
export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url"),
  isAutomatic: boolean("is_automatic").notNull().default(false),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTitleSchema = createInsertSchema(titles)
  .omit({ id: true, createdAt: true });

export type Title = typeof titles.$inferSelect;
export type InsertTitle = z.infer<typeof insertTitleSchema>;

// ユーザーと称号の関連付け
export const userTitles = pgTable("user_titles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  titleId: integer("title_id").notNull().references(() => titles.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
}, (t) => ({
  unq: uniqueIndex("user_title_unique").on(t.userId, t.titleId),
}));

export const insertUserTitleSchema = createInsertSchema(userTitles)
  .omit({ id: true, grantedAt: true });

export type UserTitle = typeof userTitles.$inferSelect;
export type InsertUserTitle = z.infer<typeof insertUserTitleSchema>;

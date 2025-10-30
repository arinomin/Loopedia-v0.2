import { users, presets, effects, tags, presetTags, titles, userTitles } from "@shared/schema";
import type { 
  InsertUser, User, Preset, Effect, Tag, 
  InsertPreset, InsertEffect, InsertTag,
  PresetWithDetails, PresetList,
  UpdateUserProfile,
  Title, InsertTitle, UserTitle, InsertUserTitle
} from "@shared/schema";

import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User>;

  getPresets(options?: { search?: string, tagId?: number, userId?: number, page?: number, limit?: number }): Promise<PresetList[]>;
  getPresetById(id: number): Promise<PresetWithDetails | undefined>;
  createPreset(preset: InsertPreset, userId: number, tags: string[], effects: Omit<InsertEffect, "presetId">[]): Promise<Preset>;
  updatePresetName(id: number, name: string): Promise<Preset | undefined>;
  deletePreset(id: number): Promise<boolean>;

  getEffectsByPresetId(presetId: number): Promise<Effect[]>;

  getTags(): Promise<Tag[]>;
  getOrCreateTag(name: string): Promise<Tag>;

  getTitles(): Promise<Title[]>;
  getTitleById(id: number): Promise<Title | undefined>;
  createTitle(title: InsertTitle): Promise<Title>;
  updateTitle(id: number, title: Partial<InsertTitle>): Promise<Title | undefined>;
  deleteTitle(id: number): Promise<boolean>;

  getUserTitles(userId: number): Promise<(Title & { grantedAt: Date })[]>;
  grantUserTitle(userId: number, titleId: number): Promise<UserTitle>;
  revokeUserTitle(userId: number, titleId: number): Promise<boolean>;
  hasUserTitle(userId: number, titleId: number): Promise<boolean>;
  
  getPresetsCountByType(): Promise<Record<string, number>>;
}

export class DbStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...insertUser,
      nickname: insertUser.nickname || insertUser.username,
    }).returning();
    return result[0];
  }

  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    const result = await db.update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    
    if (!result[0]) {
      throw new Error(`User not found: ${userId}`);
    }
    
    return result[0];
  }

  async getPresets(options?: { search?: string, tagId?: number, userId?: number, page?: number, limit?: number }): Promise<PresetList[]> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;

    let query = db.select({
      preset: presets,
      user: users,
    })
    .from(presets)
    .leftJoin(users, eq(presets.userId, users.id));

    if (options?.userId) {
      query = query.where(eq(presets.userId, options.userId));
    }

    if (options?.tagId) {
      const presetIdsWithTag = await db.select({ presetId: presetTags.presetId })
        .from(presetTags)
        .where(eq(presetTags.tagId, options.tagId));
      
      const ids = presetIdsWithTag.map(pt => pt.presetId);
      if (ids.length === 0) return [];
    }

    const results = await query
      .orderBy(desc(presets.createdAt))
      .limit(limit)
      .offset(offset);

    const presetsWithTags: PresetList[] = [];
    for (const result of results) {
      if (!result.preset || !result.user) continue;

      const presetTagRecords = await db.select({
        tag: tags,
      })
      .from(presetTags)
      .leftJoin(tags, eq(presetTags.tagId, tags.id))
      .where(eq(presetTags.presetId, result.preset.id));

      const presetTagsList = presetTagRecords
        .map(pt => pt.tag)
        .filter((tag): tag is Tag => tag !== null);

      const userTitlesData = await this.getUserTitles(result.user.id);

      presetsWithTags.push({
        ...result.preset,
        user: {
          ...result.user,
          titles: userTitlesData,
        },
        tags: presetTagsList,
      });
    }

    return presetsWithTags;
  }

  async getPresetById(id: number): Promise<PresetWithDetails | undefined> {
    const result = await db.select({
      preset: presets,
      user: users,
    })
    .from(presets)
    .leftJoin(users, eq(presets.userId, users.id))
    .where(eq(presets.id, id))
    .limit(1);

    if (!result[0] || !result[0].preset || !result[0].user) {
      return undefined;
    }

    const effectsList = await this.getEffectsByPresetId(id);
    const inputEffects = effectsList.filter(e => e.fxGroup === 'input');
    const trackEffects = effectsList.filter(e => e.fxGroup === 'track');

    const presetTagRecords = await db.select({
      tag: tags,
    })
    .from(presetTags)
    .leftJoin(tags, eq(presetTags.tagId, tags.id))
    .where(eq(presetTags.presetId, id));

    const presetTagsList = presetTagRecords
      .map(pt => pt.tag)
      .filter((tag): tag is Tag => tag !== null);

    const userTitlesData = await this.getUserTitles(result[0].user.id);

    return {
      ...result[0].preset,
      user: {
        ...result[0].user,
        titles: userTitlesData,
      },
      effects: effectsList,
      inputEffects,
      trackEffects,
      tags: presetTagsList,
    };
  }

  async createPreset(preset: InsertPreset, userId: number, tagNames: string[], effectsList: Omit<InsertEffect, "presetId">[]): Promise<Preset> {
    const [newPreset] = await db.insert(presets).values({
      ...preset,
      userId,
    }).returning();

    for (const tagName of tagNames) {
      const tag = await this.getOrCreateTag(tagName);
      await db.insert(presetTags).values({
        presetId: newPreset.id,
        tagId: tag.id,
      });
    }

    for (const effect of effectsList) {
      await db.insert(effects).values({
        ...effect,
        presetId: newPreset.id,
      });
    }

    return newPreset;
  }

  async updatePresetName(id: number, name: string): Promise<Preset | undefined> {
    const result = await db.update(presets)
      .set({ name })
      .where(eq(presets.id, id))
      .returning();
    
    return result[0];
  }

  async deletePreset(id: number): Promise<boolean> {
    await db.delete(presetTags).where(eq(presetTags.presetId, id));
    await db.delete(effects).where(eq(effects.presetId, id));
    const result = await db.delete(presets).where(eq(presets.id, id));
    return true;
  }

  async getEffectsByPresetId(presetId: number): Promise<Effect[]> {
    return await db.select().from(effects).where(eq(effects.presetId, presetId));
  }

  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getOrCreateTag(name: string): Promise<Tag> {
    const existing = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
    if (existing[0]) {
      return existing[0];
    }

    const [newTag] = await db.insert(tags).values({ name }).returning();
    return newTag;
  }

  async getTitles(): Promise<Title[]> {
    return await db.select().from(titles).orderBy(titles.name);
  }

  async getTitleById(id: number): Promise<Title | undefined> {
    const result = await db.select().from(titles).where(eq(titles.id, id)).limit(1);
    return result[0];
  }

  async createTitle(title: InsertTitle): Promise<Title> {
    const [newTitle] = await db.insert(titles).values(title).returning();
    return newTitle;
  }

  async updateTitle(id: number, title: Partial<InsertTitle>): Promise<Title | undefined> {
    const result = await db.update(titles)
      .set(title)
      .where(eq(titles.id, id))
      .returning();
    
    return result[0];
  }

  async deleteTitle(id: number): Promise<boolean> {
    await db.delete(userTitles).where(eq(userTitles.titleId, id));
    await db.delete(titles).where(eq(titles.id, id));
    return true;
  }

  async getUserTitles(userId: number): Promise<(Title & { grantedAt: Date })[]> {
    const results = await db.select({
      title: titles,
      grantedAt: userTitles.grantedAt,
    })
    .from(userTitles)
    .leftJoin(titles, eq(userTitles.titleId, titles.id))
    .where(eq(userTitles.userId, userId));

    return results
      .filter((r): r is { title: Title; grantedAt: Date } => r.title !== null)
      .map(r => ({
        ...r.title,
        grantedAt: r.grantedAt,
      }));
  }

  async grantUserTitle(userId: number, titleId: number): Promise<UserTitle> {
    const existing = await db.select().from(userTitles)
      .where(and(
        eq(userTitles.userId, userId),
        eq(userTitles.titleId, titleId)
      ))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const [newUserTitle] = await db.insert(userTitles).values({
      userId,
      titleId,
    }).returning();

    return newUserTitle;
  }

  async revokeUserTitle(userId: number, titleId: number): Promise<boolean> {
    await db.delete(userTitles)
      .where(and(
        eq(userTitles.userId, userId),
        eq(userTitles.titleId, titleId)
      ));
    
    return true;
  }

  async hasUserTitle(userId: number, titleId: number): Promise<boolean> {
    const result = await db.select().from(userTitles)
      .where(and(
        eq(userTitles.userId, userId),
        eq(userTitles.titleId, titleId)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async getPresetsCountByType(): Promise<Record<string, number>> {
    const results = await db.select({
      type: presets.type,
      count: sql<number>`count(*)::int`,
    })
    .from(presets)
    .groupBy(presets.type);

    const counts: Record<string, number> = {};
    for (const result of results) {
      counts[result.type] = result.count;
    }

    return counts;
  }
}

export const storage = new DbStorage();

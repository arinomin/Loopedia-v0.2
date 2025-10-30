
import { users, presets, effects, tags, presetTags, comments, likes, bookmarks, userSettings, userLoopers, contacts, contactReplies, userFollows, notifications, titles, userTitles } from "@shared/schema";
import type { 
  InsertUser, User, Preset, Effect, Tag, Comment, 
  InsertPreset, InsertEffect, InsertTag, InsertComment, 
  PresetWithDetails, PresetList, CommentWithUser, 
  Like, Bookmark, UserSettings, InsertLike, InsertBookmark, UpdateUserSettings,
  UserLooper, InsertUserLooper, UpdateUserProfile,
  Contact, ContactReply, InsertContact, InsertContactReply, UpdateContact,
  News, InsertNews, Title, InsertTitle, UserTitle, InsertUserTitle
} from "@shared/schema";

// フォローとお知らせに関する型定義
export type UserFollow = {
  id: number;
  followerId: number;
  followedId: number;
  createdAt: Date;
};

export type Notification = {
  id: number;
  userId: number;
  actorId: number | null;
  type: string;
  presetId: number | null;
  commentId: number | null;
  contactId: number | null;
  read: boolean;
  createdAt: Date;
};
import { db } from "./db";
import { eq, and, or, like, desc, sql, isNull, exists, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User>;

  // User Loopers methods
  getUserLoopers(userId: number): Promise<UserLooper[]>;
  createUserLooper(looper: InsertUserLooper): Promise<UserLooper>;
  updateUserLooper(id: number, looper: Partial<InsertUserLooper>): Promise<UserLooper>;
  deleteUserLooper(id: number): Promise<boolean>;

  // User settings methods
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings>;

  // User follow methods
  followUser(followerId: number, followedId: number): Promise<UserFollow>;
  unfollowUser(followerId: number, followedId: number): Promise<boolean>;
  isFollowing(followerId: number, followedId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getFollowersCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;

  // Notification methods
  getNotifications(userId: number, limit?: number, offset?: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  markNotificationAsRead(notificationId: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  createNotification(notification: { userId: number, actorId?: number, type: string, presetId?: number, commentId?: number, contactId?: number }): Promise<Notification>;

  // Preset methods
  getPresets(options?: { search?: string, tagId?: number, userId?: number, page?: number, limit?: number, likedBy?: number, bookmarkedBy?: number }): Promise<PresetList[]>;
  getPresetById(id: number, currentUserId?: number): Promise<PresetWithDetails | undefined>;
  createPreset(preset: InsertPreset, userId: number, tags: string[], effects: Omit<InsertEffect, "presetId">[]): Promise<Preset>;
  updatePresetName(id: number, name: string): Promise<Preset | undefined>;
  deletePreset(id: number): Promise<boolean>;

  // Effect methods
  getEffectsByPresetId(presetId: number): Promise<Effect[]>;

  // Tag methods
  getTags(): Promise<Tag[]>;
  getOrCreateTag(name: string): Promise<Tag>;

  // Comment methods
  getCommentsByPresetId(presetId: number): Promise<CommentWithUser[]>;
  createComment(comment: InsertComment, userId: number): Promise<Comment>;

  // Like methods
  getLikesByPresetId(presetId: number): Promise<Like[]>;
  getLikesByUserId(userId: number): Promise<Like[]>;
  getLikedUsersByPresetId(presetId: number): Promise<User[]>;
  isPresetLikedByUser(presetId: number, userId: number): Promise<boolean>;
  likePreset(presetId: number, userId: number): Promise<Like>;
  unlikePreset(presetId: number, userId: number): Promise<boolean>;

  // Bookmark methods
  getBookmarksByUserId(userId: number): Promise<Bookmark[]>;
  isPresetBookmarkedByUser(presetId: number, userId: number): Promise<boolean>;
  bookmarkPreset(presetId: number, userId: number): Promise<Bookmark>;
  unbookmarkPreset(presetId: number, userId: number): Promise<boolean>;

  // Contact methods
  getContacts(): Promise<Contact[]>;
  getContactById(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContactStatus(id: number, status: UpdateContact): Promise<Contact | undefined>;

  // Contact Reply methods
  getContactRepliesByContactId(contactId: number): Promise<ContactReply[]>;
  createContactReply(reply: InsertContactReply): Promise<ContactReply>;

  // News methods - server/utils/news-storage.tsに移行済み

  // Title methods
  getTitles(): Promise<Title[]>;
  getTitleById(id: number): Promise<Title | undefined>;
  createTitle(title: InsertTitle): Promise<Title>;
  updateTitle(id: number, title: Partial<InsertTitle>): Promise<Title | undefined>;
  deleteTitle(id: number): Promise<boolean>;

  // User Title methods
  getUserTitles(userId: number): Promise<(Title & { grantedAt: Date })[]>;
  grantUserTitle(userId: number, titleId: number): Promise<UserTitle>;
  revokeUserTitle(userId: number, titleId: number): Promise<boolean>;
  hasUserTitle(userId: number, titleId: number): Promise<boolean>;
  
  // System statistics methods
  getPresetsCountByType(): Promise<Record<string, number>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private presets: Map<number, Preset>;
  private effects: Map<number, Effect>;
  private tags: Map<number, Tag>;
  private presetTags: Map<string, { presetId: number, tagId: number }>;
  private comments: Map<number, Comment>;
  private likes: Map<string, Like>;
  private bookmarks: Map<string, Bookmark>;
  private userSettings: Map<number, UserSettings>;
  private userLoopers: Map<number, UserLooper>;
  private userFollows: Map<string, UserFollow>;
  private notifications: Map<number, Notification>;
  private contacts: Map<number, Contact>;
  private contactReplies: Map<number, ContactReply>;
  private news: Map<number, News>;
  private titles: Map<number, Title>;
  private userTitles: Map<string, UserTitle>;

  private userId: number;
  private presetId: number;
  private effectId: number;
  private tagId: number;
  private commentId: number;
  private likeId: number;
  private bookmarkId: number;
  private userLooperId: number;
  private userFollowId: number;
  private notificationId: number;
  private contactId: number;
  private contactReplyId: number;
  private newsId: number;
  private titleId: number;
  private userTitleId: number;

  constructor() {
    this.users = new Map();
    this.presets = new Map();
    this.effects = new Map();
    this.tags = new Map();
    this.presetTags = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.bookmarks = new Map();
    this.userSettings = new Map();
    this.userLoopers = new Map();
    this.userFollows = new Map();
    this.notifications = new Map();
    this.contacts = new Map();
    this.contactReplies = new Map();
    this.news = new Map();
    this.titles = new Map();
    this.userTitles = new Map();

    this.userId = 1;
    this.presetId = 1;
    this.effectId = 1;
    this.tagId = 1;
    this.commentId = 1;
    this.likeId = 1;
    this.bookmarkId = 1;
    this.userLooperId = 1;
    this.userFollowId = 1;
    this.notificationId = 1;
    this.contactId = 1;
    this.contactReplyId = 1;
    this.newsId = 1;
    this.titleId = 1;
    this.userTitleId = 1;

    // Initialize admin user
    this.createUser({
      username: "admin",
      password: "password" // In a real app, this would be hashed
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      nickname: insertUser.nickname || insertUser.username, // ニックネームがなければユーザー名を設定
      profileText: null,
      country: null,
      birthday: null,
      showBirthday: false,
      avatarUrl: null,
      isVerified: false // 新規ユーザーはデフォルトで未認証
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // birthdayが文字列の場合は日付オブジェクトに変換
    let processedProfile = {...profile};
    if (profile.birthday && typeof profile.birthday === 'string') {
      processedProfile.birthday = new Date(profile.birthday);
    }

    // 型安全のためにプロパティを明示的に指定
    const updatedUser: User = {
      ...user,
      nickname: processedProfile.nickname ?? user.nickname,
      profileText: processedProfile.profileText ?? user.profileText,
      country: processedProfile.country ?? user.country,
      birthday: processedProfile.birthday ? (processedProfile.birthday instanceof Date ? processedProfile.birthday : new Date(processedProfile.birthday)) : user.birthday,
      showBirthday: processedProfile.showBirthday ?? user.showBirthday,
      avatarUrl: processedProfile.avatarUrl ?? user.avatarUrl,
      isVerified: processedProfile.isVerified ?? user.isVerified ?? false,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // User Loopers methods
  async getUserLoopers(userId: number): Promise<UserLooper[]> {
    return Array.from(this.userLoopers.values())
      .filter(looper => looper.userId === userId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createUserLooper(looper: InsertUserLooper): Promise<UserLooper> {
    const id = this.userLooperId++;
    const userLooper: UserLooper = {
      ...looper,
      id
    };

    this.userLoopers.set(id, userLooper);
    return userLooper;
  }

  async updateUserLooper(id: number, looper: Partial<InsertUserLooper>): Promise<UserLooper> {
    const existingLooper = this.userLoopers.get(id);
    if (!existingLooper) {
      throw new Error(`User looper not found: ${id}`);
    }

    const updatedLooper: UserLooper = {
      ...existingLooper,
      ...looper
    };

    this.userLoopers.set(id, updatedLooper);
    return updatedLooper;
  }

  async deleteUserLooper(id: number): Promise<boolean> {
    return this.userLoopers.delete(id);
  }

  // Preset methods
  async getPresets(options: { search?: string, tagId?: number, userId?: number, page?: number, limit?: number, likedBy?: number, bookmarkedBy?: number, currentUserId?: number } = {}): Promise<PresetList[]> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let filteredPresets = Array.from(this.presets.values());

    // Filter by user id (作成者で絞り込み)
    if (options.userId) {
      filteredPresets = filteredPresets.filter(preset => preset.userId === options.userId);
    }

    // Filter by liked user (いいねしたユーザーで絞り込み)
    if (options.likedBy) {
      const likedPresetIds = Array.from(this.likes.values())
        .filter(like => like.userId === options.likedBy)
        .map(like => like.presetId);

      filteredPresets = filteredPresets.filter(preset => likedPresetIds.includes(preset.id));
    }

    // Filter by bookmarked user (ブックマークしたユーザーで絞り込み)
    if (options.bookmarkedBy) {
      const bookmarkedPresetIds = Array.from(this.bookmarks.values())
        .filter(bookmark => bookmark.userId === options.bookmarkedBy)
        .map(bookmark => bookmark.presetId);

      filteredPresets = filteredPresets.filter(preset => bookmarkedPresetIds.includes(preset.id));
    }

    // Filter by tag id
    if (options.tagId) {
      const presetIdsWithTag = new Set(
        Array.from(this.presetTags.values())
          .filter(pt => pt.tagId === options.tagId)
          .map(pt => pt.presetId)
      );
      filteredPresets = filteredPresets.filter(preset => presetIdsWithTag.has(preset.id));
    }

    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredPresets = filteredPresets.filter(preset => {
        // Check preset name
        if (preset.name.toLowerCase().includes(searchTerm)) {
          return true;
        }

        // Check associated tags
        const presetTagIds = Array.from(this.presetTags.values())
          .filter(pt => pt.presetId === preset.id)
          .map(pt => pt.tagId);

        const matchingTag = Array.from(this.tags.values())
          .filter(tag => presetTagIds.includes(tag.id))
          .some(tag => tag.name.toLowerCase().includes(searchTerm));

        return matchingTag;
      });
    }

    // Sort by creation date (newest first)
    filteredPresets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const paginatedPresets = filteredPresets.slice(offset, offset + limit);

    // Gather user and tag data for each preset
    return Promise.all(paginatedPresets.map(async preset => {
      const user = this.users.get(preset.userId);
      if (!user) {
        throw new Error(`User not found: ${preset.userId}`);
      }

      const presetTagIds = Array.from(this.presetTags.values())
        .filter(pt => pt.presetId === preset.id)
        .map(pt => pt.tagId);

      const presetTags = Array.from(this.tags.values())
        .filter(tag => presetTagIds.includes(tag.id));

      // いいね数を取得
      const likes = await this.getLikesByPresetId(preset.id);
      const likeCount = likes.length;

      // ブックマーク数を取得
      const bookmarks = Array.from(this.bookmarks.values())
        .filter(bookmark => bookmark.presetId === preset.id);
      const bookmarkCount = bookmarks.length;

      // 現在のユーザーがいいね・ブックマークしているかを確認
      let isLiked = false;
      let isBookmarked = false;
      if (options.currentUserId) {
        isLiked = await this.isPresetLikedByUser(preset.id, options.currentUserId);
        isBookmarked = await this.isPresetBookmarkedByUser(preset.id, options.currentUserId);
      }

      return {
        ...preset,
        user,
        tags: presetTags,
        likeCount,
        bookmarkCount,
        isLiked,
        isBookmarked,
      };
    }));
  }

  async getPresetById(id: number, currentUserId?: number): Promise<PresetWithDetails | undefined> {
    const preset = this.presets.get(id);
    if (!preset) {
      return undefined;
    }

    const user = this.users.get(preset.userId);
    if (!user) {
      throw new Error(`User not found: ${preset.userId}`);
    }

    const presetEffects = Array.from(this.effects.values())
      .filter(effect => effect.presetId === id);

    const presetTagIds = Array.from(this.presetTags.values())
      .filter(pt => pt.presetId === id)
      .map(pt => pt.tagId);

    const presetTags = Array.from(this.tags.values())
      .filter(tag => presetTagIds.includes(tag.id));

    // いいね数を取得
    const likes = await this.getLikesByPresetId(id);
    const likeCount = likes.length;

    // ブックマーク数を取得
    const bookmarks = Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.presetId === id);
    const bookmarkCount = bookmarks.length;

    // 現在のユーザーがいいね・ブックマークしているかを確認
    let isLiked = false;
    let isBookmarked = false;
    if (currentUserId) {
      isLiked = await this.isPresetLikedByUser(id, currentUserId);
      isBookmarked = await this.isPresetBookmarkedByUser(id, currentUserId);
    }

    // いいねしたユーザー一覧を取得
    const likedUsers = await this.getLikedUsersByPresetId(id);

    return {
      ...preset,
      user,
      effects: presetEffects,
      tags: presetTags,
      likeCount,
      bookmarkCount,
      isLiked,
      isBookmarked,
      likedUsers,
    };
  }

  async createPreset(
    insertPreset: InsertPreset, 
    userId: number, 
    tagNames: string[], 
    insertEffects: Omit<InsertEffect, "presetId">[]
  ): Promise<Preset> {
    const id = this.presetId++;
    const preset: Preset = {
      ...insertPreset,
      id,
      userId,
      createdAt: new Date(),
    };

    this.presets.set(id, preset);

    // Create or get tags and link them to preset
    for (const tagName of tagNames) {
      const tag = await this.getOrCreateTag(tagName);
      const presetTagId = `${id}-${tag.id}`;
      this.presetTags.set(presetTagId, { presetId: id, tagId: tag.id });
    }

    // Create effects
    for (const effectData of insertEffects) {
      const effectId = this.effectId++;

      // 拡張ポジションから基本ポジションとFXグループを抽出
      let position = effectData.position;
      // デフォルトはinput
      let fxGroup: "input" | "track" = (effectData.fxGroup as any) === "track" ? "track" : "input";
      
      // 拡張ポジション（"INPUT_A"や"TRACK_B"など）から基本ポジションとFXグループを抽出
      if (position.includes("_")) {
        const parts = position.split("_");
        if (parts.length === 2) {
          // "INPUT" -> "input", "TRACK" -> "track"
          fxGroup = parts[0].toLowerCase() === "track" ? "track" : "input";
          position = parts[1]; // "A", "B", "C", "D"
        }
      }
      
      // 必須プロパティを適切な型と初期値で確実に設定
      const effect: Effect = {
        id: effectId,
        presetId: id,
        position, // 基本ポジション（"A", "B", "C", "D"）
        fxGroup, // "input" または "track"
        effectType: effectData.effectType,
        parameters: effectData.parameters,

        // オプショナルなプロパティに初期値を設定
        insert: effectData.insert || "ALL",
        sw: typeof effectData.sw === 'boolean' ? effectData.sw : false,
        swMode: effectData.swMode || "TOGGLE",
      };

      this.effects.set(effectId, effect);
    }

    return preset;
  }

  async updatePresetName(id: number, name: string): Promise<Preset | undefined> {
    const preset = this.presets.get(id);
    if (!preset) {
      return undefined;
    }

    const updatedPreset: Preset = {
      ...preset,
      name
    };

    this.presets.set(id, updatedPreset);
    return updatedPreset;
  }

  async deletePreset(id: number): Promise<boolean> {
    // Delete preset tags
    const presetTagEntries = Array.from(this.presetTags.entries())
      .filter(([_, pt]) => pt.presetId === id);

    for (const [key] of presetTagEntries) {
      this.presetTags.delete(key);
    }

    // Delete effects
    const effectIds = Array.from(this.effects.values())
      .filter(effect => effect.presetId === id)
      .map(effect => effect.id);

    for (const effectId of effectIds) {
      this.effects.delete(effectId);
    }

    // Delete comments
    const commentIds = Array.from(this.comments.values())
      .filter(comment => comment.presetId === id)
      .map(comment => comment.id);

    for (const commentId of commentIds) {
      this.comments.delete(commentId);
    }

    // Delete preset
    return this.presets.delete(id);
  }

  // Effect methods
  async getEffectsByPresetId(presetId: number): Promise<Effect[]> {
    return Array.from(this.effects.values())
      .filter(effect => effect.presetId === presetId);
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getOrCreateTag(name: string): Promise<Tag> {
    // Find existing tag
    const existingTag = Array.from(this.tags.values())
      .find(tag => tag.name.toLowerCase() === name.toLowerCase());

    if (existingTag) {
      return existingTag;
    }

    // Create new tag
    const id = this.tagId++;
    const tag: Tag = { id, name };
    this.tags.set(id, tag);
    return tag;
  }

  // Comment methods
  async getCommentsByPresetId(presetId: number): Promise<CommentWithUser[]> {
    const presetComments = Array.from(this.comments.values())
      .filter(comment => comment.presetId === presetId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return presetComments.map(comment => {
      const user = this.users.get(comment.userId);
      if (!user) {
        throw new Error(`User not found: ${comment.userId}`);
      }

      return {
        ...comment,
        user,
      };
    });
  }

  async createComment(insertComment: InsertComment, userId: number): Promise<Comment> {
    const id = this.commentId++;
    const comment: Comment = {
      ...insertComment,
      id,
      userId,
      createdAt: new Date(),
    };

    this.comments.set(id, comment);
    return comment;
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    // デフォルト設定がなければ作成して返す
    if (!this.userSettings.has(userId)) {
      const settings: UserSettings = {
        userId,
        showLikes: true,
        updatedAt: new Date()
      };
      this.userSettings.set(userId, settings);
    }
    return this.userSettings.get(userId);
  }

  async updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    if (!existingSettings) {
      throw new Error(`User settings not found for user: ${userId}`);
    }

    const updatedSettings: UserSettings = {
      ...existingSettings,
      ...settings,
      updatedAt: new Date()
    };

    this.userSettings.set(userId, updatedSettings);
    return updatedSettings;
  }

  // User follow methods
  async followUser(followerId: number, followedId: number): Promise<UserFollow> {
    // 自分自身をフォローできないようにチェック
    if (followerId === followedId) {
      throw new Error("Cannot follow yourself");
    }

    // フォロワーとフォロイーが存在するかチェック
    const follower = await this.getUser(followerId);
    const followed = await this.getUser(followedId);
    if (!follower || !followed) {
      throw new Error("User not found");
    }

    // すでにフォローしているかチェック
    const isAlreadyFollowing = await this.isFollowing(followerId, followedId);
    if (isAlreadyFollowing) {
      throw new Error("Already following this user");
    }

    // フォローを作成
    const id = this.userFollowId++;
    const followKey = `${followerId}-${followedId}`;
    const userFollow: UserFollow = {
      id,
      followerId,
      followedId,
      createdAt: new Date()
    };

    this.userFollows.set(followKey, userFollow);

    // 通知を作成
    await this.createNotification({
      userId: followedId,
      actorId: followerId,
      type: 'follow'
    });

    return userFollow;
  }

  async unfollowUser(followerId: number, followedId: number): Promise<boolean> {
    const followKey = `${followerId}-${followedId}`;
    return this.userFollows.delete(followKey);
  }

  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const followKey = `${followerId}-${followedId}`;
    return this.userFollows.has(followKey);
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = Array.from(this.userFollows.values())
      .filter(follow => follow.followedId === userId)
      .map(follow => follow.followerId);

    const followers: User[] = [];
    for (const id of followerIds) {
      const user = await this.getUser(id);
      if (user) followers.push(user);
    }

    return followers;
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = Array.from(this.userFollows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followedId);

    const following: User[] = [];
    for (const id of followingIds) {
      const user = await this.getUser(id);
      if (user) following.push(user);
    }

    return following;
  }

  async getFollowersCount(userId: number): Promise<number> {
    return Array.from(this.userFollows.values())
      .filter(follow => follow.followedId === userId)
      .length;
  }

  async getFollowingCount(userId: number): Promise<number> {
    return Array.from(this.userFollows.values())
      .filter(follow => follow.followerId === userId)
      .length;
  }

  // Notification methods
  async getNotifications(userId: number, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.read)
      .length;
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.read = true;
    this.notifications.set(notificationId, notification);
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userId === userId);

    for (const [id, notification] of userNotifications) {
      notification.read = true;
      this.notifications.set(id, notification);
    }

    return true;
  }

  async createNotification(notificationData: { userId: number, actorId?: number, type: string, presetId?: number, commentId?: number, contactId?: number }): Promise<Notification> {
    const id = this.notificationId++;
    const notification: Notification = {
      id,
      userId: notificationData.userId,
      actorId: notificationData.actorId ?? null,
      type: notificationData.type,
      presetId: notificationData.presetId ?? null,
      commentId: notificationData.commentId ?? null,
      contactId: notificationData.contactId ?? null,
      read: false,
      createdAt: new Date()
    };

    this.notifications.set(id, notification);
    return notification;
  }

  // Like methods
  async getLikesByPresetId(presetId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.presetId === presetId);
  }

  async getLikesByUserId(userId: number): Promise<Like[]> {
    return Array.from(this.likes.values())
      .filter(like => like.userId === userId);
  }

  async getLikedUsersByPresetId(presetId: number): Promise<User[]> {
    const likes = await this.getLikesByPresetId(presetId);
    const userIds = likes.map(like => like.userId);
    return Array.from(this.users.values())
      .filter(user => userIds.includes(user.id));
  }

  async isPresetLikedByUser(presetId: number, userId: number): Promise<boolean> {
    // likeを特定するキーを生成
    const likeKey = `${userId}-${presetId}`;
    return this.likes.has(likeKey);
  }

  async likePreset(presetId: number, userId: number): Promise<Like> {
    // 既に「いいね」されているか確認
    const isLiked = await this.isPresetLikedByUser(presetId, userId);
    if (isLiked) {
      const likeKey = `${userId}-${presetId}`;
      const existingLike = this.likes.get(likeKey);
      if (existingLike) {
        return existingLike;
      }
    }

    // 新しいいいねを作成
    const id = this.likeId++;
    const likeKey = `${userId}-${presetId}`;
    const like: Like = {
      id,
      userId,
      presetId,
      createdAt: new Date()
    };

    this.likes.set(likeKey, like);
    return like;
  }

  async unlikePreset(presetId: number, userId: number): Promise<boolean> {
    const likeKey = `${userId}-${presetId}`;
    return this.likes.delete(likeKey);
  }

  // Bookmark methods
  async getBookmarksByUserId(userId: number): Promise<Bookmark[]> {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.userId === userId);
  }

  async isPresetBookmarkedByUser(presetId: number, userId: number): Promise<boolean> {
    // bookmarkを特定するキーを生成
    const bookmarkKey = `${userId}-${presetId}`;
    return this.bookmarks.has(bookmarkKey);
  }

  async bookmarkPreset(presetId: number, userId: number): Promise<Bookmark> {
    // 既にブックマークされているか確認
    const isBookmarked = await this.isPresetBookmarkedByUser(presetId, userId);
    if (isBookmarked) {
      const bookmarkKey = `${userId}-${presetId}`;
      const existingBookmark = this.bookmarks.get(bookmarkKey);
      if (existingBookmark) {
        return existingBookmark;
      }
    }

    // 新しいブックマークを作成
    const id = this.bookmarkId++;
    const bookmarkKey = `${userId}-${presetId}`;
    const bookmark: Bookmark = {
      id,
      userId,
      presetId,
      createdAt: new Date()
    };

    this.bookmarks.set(bookmarkKey, bookmark);
    return bookmark;
  }

  async unbookmarkPreset(presetId: number, userId: number): Promise<boolean> {
    const bookmarkKey = `${userId}-${presetId}`;
    return this.bookmarks.delete(bookmarkKey);
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const id = this.contactId++;
    const now = new Date();

    const contact: Contact = {
      id,
      name: contactData.name,
      userId: contactData.userId || null,
      contactMethod: contactData.contactMethod || null,
      contactDetail: contactData.contactDetail || null,
      category: contactData.category,
      message: contactData.message,
      status: "new",
      createdAt: now,
      updatedAt: now,
      isAnonymous: contactData.isAnonymous || false,
    };

    this.contacts.set(id, contact);
    return contact;
  }

  async updateContactStatus(id: number, statusUpdate: UpdateContact): Promise<Contact | undefined> {
    const contact = this.contacts.get(id);
    if (!contact) {
      return undefined;
    }

    const updatedContact: Contact = {
      ...contact,
      ...statusUpdate,
      updatedAt: new Date()
    };

    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  // Contact Reply methods
  async getContactRepliesByContactId(contactId: number): Promise<ContactReply[]> {
    return Array.from(this.contactReplies.values())
      .filter(reply => reply.contactId === contactId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createContactReply(replyData: InsertContactReply): Promise<ContactReply> {
    const id = this.contactReplyId++;

    const reply: ContactReply = {
      id,
      ...replyData,
      createdAt: new Date()
    };

    this.contactReplies.set(id, reply);

    // お問い合わせのステータスを更新
    const contact = this.contacts.get(replyData.contactId);
    if (contact && contact.status === "new") {
      this.updateContactStatus(replyData.contactId, { status: "in_progress" });
    }

    return reply;
  }

  // News methods
  async getNews(options: { pinned?: boolean, limit?: number, offset?: number } = {}): Promise<News[]> {
    let newsList = Array.from(this.news.values());
    
    if (options.pinned !== undefined) {
      newsList = newsList.filter(news => news.pinned === options.pinned);
    }
    
    // Sort by creation date, newest first
    newsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply pagination
    if (options.offset) {
      newsList = newsList.slice(options.offset);
    }
    
    if (options.limit) {
      newsList = newsList.slice(0, options.limit);
    }
    
    return newsList;
  }

  async getNewsById(id: number): Promise<News | undefined> {
    return this.news.get(id);
  }

  async createNews(newsData: InsertNews): Promise<News> {
    const id = this.newsId++;
    const news: News = {
      id,
      title: newsData.title,
      content: newsData.content,
      linkText: newsData.linkText || null,
      linkUrl: newsData.linkUrl || null,
      userId: newsData.userId || null,
      pinned: newsData.pinned ?? false,
      createdAt: new Date()
    };
    this.news.set(id, news);
    return news;
  }

  async updateNews(id: number, newsData: Partial<InsertNews>): Promise<News | undefined> {
    const existingNews = this.news.get(id);
    if (!existingNews) {
      return undefined;
    }
    
    const updatedNews: News = {
      ...existingNews,
      ...newsData,
    };
    
    this.news.set(id, updatedNews);
    return updatedNews;
  }

  async deleteNews(id: number): Promise<boolean> {
    return this.news.delete(id);
  }

  async toggleNewsPin(id: number): Promise<News | undefined> {
    const existingNews = this.news.get(id);
    if (!existingNews) {
      return undefined;
    }
    
    const updatedNews: News = {
      ...existingNews,
      pinned: !existingNews.pinned
    };
    
    this.news.set(id, updatedNews);
    return updatedNews;
  }

  // Title methods
  async getTitles(): Promise<Title[]> {
    return Array.from(this.titles.values());
  }

  async getTitleById(id: number): Promise<Title | undefined> {
    return this.titles.get(id);
  }

  async createTitle(titleData: InsertTitle): Promise<Title> {
    const id = this.titleId++;
    const title: Title = {
      id,
      name: titleData.name,
      description: titleData.description,
      iconUrl: titleData.iconUrl || null,
      condition: titleData.condition || null,
      isAutomatic: titleData.isAutomatic ?? false,
      createdAt: new Date()
    };
    this.titles.set(id, title);
    return title;
  }

  async updateTitle(id: number, titleData: Partial<InsertTitle>): Promise<Title | undefined> {
    const existingTitle = this.titles.get(id);
    if (!existingTitle) {
      return undefined;
    }
    
    const updatedTitle: Title = {
      ...existingTitle,
      ...titleData,
    };
    
    this.titles.set(id, updatedTitle);
    return updatedTitle;
  }

  async deleteTitle(id: number): Promise<boolean> {
    // Remove all user titles with this title ID
    for (const [key, userTitle] of this.userTitles.entries()) {
      if (userTitle.titleId === id) {
        this.userTitles.delete(key);
      }
    }
    
    // Delete the title
    return this.titles.delete(id);
  }

  // User Title methods
  async getUserTitles(userId: number): Promise<(Title & { grantedAt: Date })[]> {
    const userTitleArray = Array.from(this.userTitles.values())
      .filter(userTitle => userTitle.userId === userId);
      
    const result: (Title & { grantedAt: Date })[] = [];
    
    for (const userTitle of userTitleArray) {
      const title = this.titles.get(userTitle.titleId);
      if (title) {
        result.push({
          ...title,
          grantedAt: userTitle.grantedAt
        });
      }
    }
    
    return result;
  }

  async grantUserTitle(userId: number, titleId: number): Promise<UserTitle> {
    // Check if user already has this title
    const hasTitle = await this.hasUserTitle(userId, titleId);
    if (hasTitle) {
      throw new Error('User already has this title');
    }
    
    const id = this.userTitleId++;
    const userTitle: UserTitle = {
      id,
      userId,
      titleId,
      grantedAt: new Date()
    };
    
    const key = `${userId}-${titleId}`;
    this.userTitles.set(key, userTitle);
    
    return userTitle;
  }

  async revokeUserTitle(userId: number, titleId: number): Promise<boolean> {
    const key = `${userId}-${titleId}`;
    return this.userTitles.delete(key);
  }

  async hasUserTitle(userId: number, titleId: number): Promise<boolean> {
    const key = `${userId}-${titleId}`;
    return this.userTitles.has(key);
  }
  
  async getPresetsCountByType(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {
      INPUT_FX: 0,
      TRACK_FX: 0,
      INPUT_TRACK_FX: 0
    };
    
    // プリセットをタイプ別にカウント
    for (const preset of this.presets.values()) {
      if (preset.type in counts) {
        counts[preset.type]++;
      }
    }
    
    return counts;
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // ニックネームが提供されていない場合はユーザー名を使用
    const userToInsert = {
      ...insertUser,
      nickname: insertUser.nickname || insertUser.username
    };

    const [user] = await db
      .insert(users)
      .values(userToInsert)
      .returning();
    return user;
  }

  // User follow methods
  async followUser(followerId: number, followedId: number): Promise<UserFollow> {
    // 自分自身をフォローできないようにチェック
    if (followerId === followedId) {
      throw new Error("Cannot follow yourself");
    }

    // フォロワーとフォロイーが存在するかチェック
    const follower = await this.getUser(followerId);
    const followed = await this.getUser(followedId);
    if (!follower || !followed) {
      throw new Error("User not found");
    }

    // すでにフォローしているかチェック
    const isAlreadyFollowing = await this.isFollowing(followerId, followedId);
    if (isAlreadyFollowing) {
      throw new Error("Already following this user");
    }

    const [userFollow] = await db
      .insert(userFollows)
      .values({
        followerId,
        followedId
      })
      .returning();

    // 通知を作成
    await this.createNotification({
      userId: followedId,
      actorId: followerId,
      type: 'follow'
    });

    return userFollow;
  }

  async unfollowUser(followerId: number, followedId: number): Promise<boolean> {
    // 実際にデータベースからフォロー関係を削除
    const result = await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followedId, followedId)
        )
      );

    return Number(result.count) > 0;
  }

  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    // データベースにフォロー関係が存在するか確認
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followedId, followedId)
        )
      );

    return Number(result.count) > 0;
  }

  async getFollowers(userId: number): Promise<User[]> {
    // フォロワーのユーザー情報を取得
    const followers = await db
      .select()
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followedId, userId));

    return followers.map(f => ({ 
      id: f.users.id,
      username: f.users.username,
      nickname: f.users.nickname,
      password: f.users.password,
      createdAt: f.users.createdAt,
      profileText: f.users.profileText,
      country: f.users.country,
      birthday: f.users.birthday,
      showBirthday: f.users.showBirthday,
      avatarUrl: f.users.avatarUrl,
      isVerified: f.users.isVerified ?? false
    }));
  }

  async getFollowing(userId: number): Promise<User[]> {
    // フォロー中のユーザー情報を取得
    const following = await db
      .select()
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followedId, users.id))
      .where(eq(userFollows.followerId, userId));

    return following.map(f => ({ 
      id: f.users.id,
      username: f.users.username,
      nickname: f.users.nickname,
      password: f.users.password,
      createdAt: f.users.createdAt,
      profileText: f.users.profileText,
      country: f.users.country,
      birthday: f.users.birthday,
      showBirthday: f.users.showBirthday,
      avatarUrl: f.users.avatarUrl,
      isVerified: f.users.isVerified ?? false
    }));
  }

  async getFollowersCount(userId: number): Promise<number> {
    // フォロワー数をカウント
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followedId, userId));

    return Number(result.count);
  }

  async getFollowingCount(userId: number): Promise<number> {
    // フォロー中の数をカウント
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    return Number(result.count);
  }

  // Notification methods
  async getNotifications(userId: number, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    // JOINを使用してユーザー情報も取得
    const notificationResults = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        actorId: notifications.actorId,
        type: notifications.type,
        presetId: notifications.presetId,
        commentId: notifications.commentId,
        contactId: notifications.contactId,
        read: notifications.read,
        createdAt: notifications.createdAt,
        actor: {
          id: users.id,
          username: users.username,
          nickname: users.nickname,
          avatarUrl: users.avatarUrl,
          isVerified: users.isVerified
        }
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return notificationResults;
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({
        count: sql<number>`count(*)`
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );

    return Number(result[0]?.count) || 0;
  }

  async markNotificationAsRead(notificationId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({
        read: true
      })
      .where(eq(notifications.id, notificationId));

    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({
        read: true
      })
      .where(eq(notifications.userId, userId));

    return true;
  }

  async createNotification(notificationData: { userId: number, actorId?: number, type: string, presetId?: number, commentId?: number, contactId?: number }): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: notificationData.userId,
        actorId: notificationData.actorId || null,
        type: notificationData.type,
        presetId: notificationData.presetId || null,
        commentId: notificationData.commentId || null,
        contactId: notificationData.contactId || null,
        read: false
      })
      .returning();

    return notification;
  }

  async updateUserProfile(userId: number, profile: UpdateUserProfile): Promise<User> {
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // favoriteArtistsの処理があればここで行う
    const { favoriteArtists, ...profileData } = profile as any;

    if (favoriteArtists && Array.isArray(favoriteArtists)) {
      // 現在のユーザーループを削除
      await db.delete(userLoopers).where(eq(userLoopers.userId, userId));

      // 新しいループを登録
      for (const looper of favoriteArtists) {
        await db.insert(userLoopers).values({
          userId,
          looperName: looper.looperName,
          displayOrder: looper.displayOrder
        });
      }
    }

    // birthdayが文字列の場合は日付オブジェクトに変換
    let processedProfile = {...profileData};
    if (profileData.birthday && typeof profileData.birthday === 'string') {
      processedProfile.birthday = new Date(profileData.birthday);
    }

    const [updatedUser] = await db
      .update(users)
      .set(processedProfile)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  // User Loopers methods
  async getUserLoopers(userId: number): Promise<UserLooper[]> {
    return db
      .select()
      .from(userLoopers)
      .where(eq(userLoopers.userId, userId))
      .orderBy(userLoopers.displayOrder);
  }

  async createUserLooper(looper: InsertUserLooper): Promise<UserLooper> {
    const [userLooper] = await db
      .insert(userLoopers)
      .values(looper)
      .returning();

    return userLooper;
  }

  async updateUserLooper(id: number, looper: Partial<InsertUserLooper>): Promise<UserLooper> {
    const [updatedLooper] = await db
      .update(userLoopers)
      .set(looper)
      .where(eq(userLoopers.id, id))
      .returning();

    if (!updatedLooper) {
      throw new Error(`User looper not found: ${id}`);
    }

    return updatedLooper;
  }

  async deleteUserLooper(id: number): Promise<boolean> {
    const result = await db
      .delete(userLoopers)
      .where(eq(userLoopers.id, id));

    return !!result;
  }

  // User settings methods
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (settings) {
      return settings;
    }

    // デフォルト設定がなければ作成して返す
    const defaultSettings = {
      userId,
      showLikes: true,
      updatedAt: new Date()
    };

    const [createdSettings] = await db
      .insert(userSettings)
      .values(defaultSettings)
      .returning();

    return createdSettings;
  }

  async updateUserSettings(userId: number, settings: UpdateUserSettings): Promise<UserSettings> {
    // Check if settings exist
    const existingSettings = await this.getUserSettings(userId);
    if (!existingSettings) {
      throw new Error(`User settings not found for user: ${userId}`);
    }

    const updatedData = {
      ...settings,
      updatedAt: new Date()
    };

    const [updatedSettings] = await db
      .update(userSettings)
      .set(updatedData)
      .where(eq(userSettings.userId, userId))
      .returning();

    return updatedSettings;
  }

  // Preset methods
  async getPresets(options: { search?: string, tagId?: number, userId?: number, page?: number, limit?: number, likedBy?: number, bookmarkedBy?: number, currentUserId?: number } = {}): Promise<PresetList[]> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    // 条件配列を準備
    let conditions: any[] = [];

    // ユーザーIDでフィルタリング
    if (options.userId) {
      conditions.push(eq(presets.userId, options.userId));
    }

    // 検索語でフィルタリング
    if (options.search) {
      const searchTerm = `%${options.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`lower(${presets.name})`, searchTerm),
          exists(
            db.select()
              .from(presetTags)
              .innerJoin(tags, eq(presetTags.tagId, tags.id))
              .where(
                and(
                  eq(presetTags.presetId, presets.id),
                  like(sql`lower(${tags.name})`, searchTerm)
                )
              )
          )
        )
      );
    }

    // 基本クエリを構築
    let baseQuery = db.select({
      preset: presets,
      user: users,
    }).from(presets)
    .innerJoin(users, eq(presets.userId, users.id));

    // いいねしたユーザーでフィルタリング
    if (options.likedBy) {
      baseQuery = baseQuery.innerJoin(likes, eq(presets.id, likes.presetId));
      conditions.push(eq(likes.userId, options.likedBy));
    }

    // ブックマークしたユーザーでフィルタリング
    if (options.bookmarkedBy) {
      baseQuery = baseQuery.innerJoin(bookmarks, eq(presets.id, bookmarks.presetId));
      conditions.push(eq(bookmarks.userId, options.bookmarkedBy));
    }

    // タグでフィルタリング
    if (options.tagId) {
      baseQuery = baseQuery.innerJoin(presetTags, eq(presets.id, presetTags.presetId));
      conditions.push(eq(presetTags.tagId, options.tagId));
    }

    // 条件を適用してクエリ実行
    const finalQuery = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // ソートしてページネーション適用
    const results = await finalQuery
      .orderBy(desc(presets.createdAt))
      .limit(limit)
      .offset(offset);

    // 結果が空の場合は空配列を返す
    if (results.length === 0) {
      return [];
    }

    // プリセットIDのリスト
    const presetIds = results.map(r => r.preset.id);

    // タグデータを取得
    const presetTagsData = await db
      .select({
        presetId: presetTags.presetId,
        tag: tags,
      })
      .from(presetTags)
      .innerJoin(tags, eq(presetTags.tagId, tags.id))
      .where(inArray(presetTags.presetId, presetIds));

    // いいね数を取得
    const likeCounts = await db
      .select({
        presetId: likes.presetId,
        count: sql<number>`count(*)`,
      })
      .from(likes)
      .where(inArray(likes.presetId, presetIds))
      .groupBy(likes.presetId);

    // ブックマーク数を取得
    const bookmarkCounts = await db
      .select({
        presetId: bookmarks.presetId,
        count: sql<number>`count(*)`,
      })
      .from(bookmarks)
      .where(inArray(bookmarks.presetId, presetIds))
      .groupBy(bookmarks.presetId);

    // 現在のユーザーのいいね・ブックマーク状態を取得
    let userLikes: { presetId: number }[] = [];
    let userBookmarks: { presetId: number }[] = [];

    if (options.currentUserId) {
      userLikes = await db
        .select({ presetId: likes.presetId })
        .from(likes)
        .where(
          and(
            eq(likes.userId, options.currentUserId),
            inArray(likes.presetId, presetIds)
          )
        );

      userBookmarks = await db
        .select({ presetId: bookmarks.presetId })
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.userId, options.currentUserId),
            inArray(bookmarks.presetId, presetIds)
          )
        );
    }

    // データを整形して返す
    return results.map(r => {
      const presetId = r.preset.id;

      // このプリセットのタグ
      const presetTagsList = presetTagsData
        .filter(pt => pt.presetId === presetId)
        .map(pt => pt.tag);

      // このプリセットのいいね数
      const likeCount = likeCounts.find(lc => lc.presetId === presetId)?.count || 0;

      // このプリセットのブックマーク数
      const bookmarkCount = bookmarkCounts.find(bc => bc.presetId === presetId)?.count || 0;

      // ユーザーがいいね・ブックマークしているか
      const isLiked = userLikes.some(ul => ul.presetId === presetId);
      const isBookmarked = userBookmarks.some(ub => ub.presetId === presetId);

      return {
        ...r.preset,
        user: r.user,
        tags: presetTagsList,
        likeCount,
        bookmarkCount,
        isLiked,
        isBookmarked,
      };
    });
  }

  async getPresetById(id: number, currentUserId?: number): Promise<PresetWithDetails | undefined> {
    // プリセットとユーザー情報を取得
    const [result] = await db
      .select({
        preset: presets,
        user: users,
      })
      .from(presets)
      .innerJoin(users, eq(presets.userId, users.id))
      .where(eq(presets.id, id));

    if (!result) {
      return undefined;
    }

    // エフェクト情報を取得
    const presetEffects = await db
      .select()
      .from(effects)
      .where(eq(effects.presetId, id));

    // タグ情報を取得
    const tagsResult = await db
      .select({
        tag: tags,
      })
      .from(presetTags)
      .innerJoin(tags, eq(presetTags.tagId, tags.id))
      .where(eq(presetTags.presetId, id));

    // いいね数を取得
    const [likeCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(likes)
      .where(eq(likes.presetId, id));

    // ブックマーク数を取得
    const [bookmarkCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(bookmarks)
      .where(eq(bookmarks.presetId, id));

    // いいねユーザーを取得
    const likedUsers = await db
      .select({
        user: users,
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.presetId, id));

    // ユーザーのいいね・ブックマーク状態
    let isLiked = false;
    let isBookmarked = false;

    if (currentUserId) {
      // いいね状態
      const [userLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.presetId, id),
            eq(likes.userId, currentUserId)
          )
        );

      isLiked = !!userLike;

      // ブックマーク状態
      const [userBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.presetId, id),
            eq(bookmarks.userId, currentUserId)
          )
        );

      isBookmarked = !!userBookmark;
    }

    // プリセットタイプに基づいて返却データを構築
    const presetData: PresetWithDetails = {
      ...result.preset,
      user: result.user,
      effects: presetEffects,
      tags: tagsResult.map((pt: { tag: Tag }) => pt.tag),
      likeCount: Number(likeCount.count),
      bookmarkCount: Number(bookmarkCount.count),
      isLiked,
      isBookmarked,
      likedUsers: likedUsers.map(lu => lu.user),
    };
    
    // INPUT_TRACK_FXタイプの場合、エフェクトをINPUT側とTRACK側に分ける
    if (result.preset.type === "INPUT_TRACK_FX") {
      // fx_groupフィールドを優先的に使用
      const inputEffects = presetEffects.filter(e => 
        e.fxGroup === "input" || 
        // 古い形式のデータと互換性を保つための処理
        (e.fxGroup === "input" && ["A", "B", "C", "D"].includes(e.position)) ||
        e.position.startsWith("INPUT_")
      );
      
      const trackEffects = presetEffects.filter(e => 
        e.fxGroup === "track" || 
        e.position.startsWith("TRACK_")
      );
      
      presetData.inputEffects = inputEffects;
      presetData.trackEffects = trackEffects;
    }
    
    return presetData;
  }

  async createPreset(
    insertPreset: InsertPreset, 
    userId: number, 
    tagNames: string[], 
    insertEffects: Omit<InsertEffect, "presetId">[]
  ): Promise<Preset> {
    console.log("Storing preset with effects count:", insertEffects.length);
    console.log("Preset data:", JSON.stringify(insertPreset, null, 2));
    console.log("User ID:", userId);
    console.log("Tag names:", JSON.stringify(tagNames, null, 2));
    
    // エフェクトデータの形式をログ出力
    insertEffects.forEach((effect, index) => {
      console.log(`Effect ${index} (${effect.position})`, {
        effectType: effect.effectType,
        parameters: {
          type: typeof effect.parameters,
          isString: typeof effect.parameters === 'string',
          length: typeof effect.parameters === 'string' ? effect.parameters.length : null,
          value: effect.parameters
        }
      });
    });
    
    // トランザクションを開始
    return await db.transaction(async (tx) => {
      try {
        // プリセットを作成
        console.log("Creating preset in database...");
        const [preset] = await tx
          .insert(presets)
          .values({
            ...insertPreset,
            userId,
          })
          .returning();

        console.log("Created preset:", preset.id);

        // タグの処理
        const createdTagIds: number[] = [];
        console.log(`Processing ${tagNames.length} tags...`);
        
        // タグを作成または取得し、プリセットとリンク
        for (const tagName of tagNames) {
          if (!tagName || tagName.trim() === '') {
            console.log("Skipping empty tag");
            continue;
          }
          
          try {
            console.log(`Processing tag: "${tagName}"`);
            
            // タグを検索または作成
            let tag: Tag;
            const [existingTag] = await tx
              .select()
              .from(tags)
              .where(eq(sql`lower(${tags.name})`, tagName.toLowerCase()));

            if (existingTag) {
              tag = existingTag;
              console.log(`Using existing tag: ${tag.id} (${tag.name})`);
            } else {
              console.log(`Creating new tag: "${tagName}"`);
              const [newTag] = await tx
                .insert(tags)
                .values({ name: tagName })
                .returning();
              tag = newTag;
              console.log(`Created new tag: ${tag.id} (${tag.name})`);
            }

            // 重複を避ける
            if (createdTagIds.includes(tag.id)) {
              console.log(`Skip duplicate tag ID: ${tag.id}`);
              continue;
            }
            createdTagIds.push(tag.id);

            // プリセットとタグをリンク
            console.log(`Linking preset ${preset.id} with tag ${tag.id}`);
            await tx
              .insert(presetTags)
              .values({
                presetId: preset.id,
                tagId: tag.id,
              });
            
            console.log(`Linked preset ${preset.id} with tag ${tag.id} (${tag.name})`);
          } catch (tagError) {
            console.error(`Error processing tag "${tagName}":`, tagError);
            // タグ処理エラーは全体を失敗させない - 続行する
          }
        }

        // エフェクトの処理
        console.log(`Processing ${insertEffects.length} effects...`);
        
        // オブジェクトの深いコピーを作成
        const processedEffects = JSON.parse(JSON.stringify(insertEffects));
        
        // エフェクトを作成
        for (let i = 0; i < processedEffects.length; i++) {
          const effectData = processedEffects[i];
          
          try {
            console.log(`Processing effect ${i} (${effectData.position}, ${effectData.effectType})...`);
            
            // パラメータ処理を詳細にログ
            console.log(`Original parameters (${typeof effectData.parameters}):`, effectData.parameters);
            
            // パラメータが文字列でない場合は変換
            let parameters = effectData.parameters;
            
            // パラメータの正規化
            if (parameters === undefined || parameters === null) {
              console.log("Parameters undefined/null, using empty object");
              parameters = "{}";
            }
            else if (typeof parameters !== 'string') {
              try {
                console.log("Converting non-string parameters to JSON string");
                parameters = JSON.stringify(parameters);
                console.log("Converted parameters:", parameters);
              } catch (jsonError) {
                console.error("Failed to stringify parameters:", jsonError);
                parameters = "{}";
              }
            }
            
            // パラメータが有効なJSON文字列であることを確認
            try {
              // 一度パースして再度文字列化することで正規化
              console.log("Validating parameters JSON string");
              const parsedParams = JSON.parse(parameters);
              console.log("Parsed parameters:", parsedParams);
              parameters = JSON.stringify(parsedParams);
              console.log("Normalized parameters:", parameters);
            } catch (jsonError) {
              console.error("Invalid JSON parameters:", parameters, jsonError);
              parameters = "{}";
            }

            // データベースに挿入する前の最終チェック
            if (typeof parameters !== 'string') {
              console.error("Parameters still not a string after normalization:", parameters);
              parameters = "{}";
            }

            console.log(`Final parameters for database (${effectData.position}):`, parameters);

            // エフェクトをデータベースに挿入
            console.log(`Inserting effect for preset ${preset.id}:`, {
              position: effectData.position,
              effectType: effectData.effectType,
              parametersLength: parameters.length
            });
            
            // 拡張ポジションから基本ポジションとFXグループを抽出
            let position = effectData.position;
            // デフォルトはinput
            let fxGroup: "input" | "track" = (effectData.fxGroup as any) === "track" ? "track" : "input";
            
            // 拡張ポジション（"INPUT_A"や"TRACK_B"など）から基本ポジションとFXグループを抽出
            if (position.includes("_")) {
              const parts = position.split("_");
              if (parts.length === 2) {
                // "INPUT" -> "input", "TRACK" -> "track"
                fxGroup = parts[0].toLowerCase() === "track" ? "track" : "input";
                position = parts[1]; // "A", "B", "C", "D"
              }
            }
            
            console.log(`Normalized position: ${position}, fxGroup: ${fxGroup} from original: ${effectData.position}`);
            
            const [createdEffect] = await tx
              .insert(effects)
              .values({
                presetId: preset.id,
                position, // 基本ポジション（"A", "B", "C", "D"）
                fxGroup, // "input" または "track"
                effectType: effectData.effectType,
                parameters,
                insert: effectData.insert || "ALL",
                sw: typeof effectData.sw === 'boolean' ? effectData.sw : false,
                swMode: effectData.swMode || "TOGGLE",
              })
              .returning();
              
            console.log(`Created effect: ${createdEffect.id} for preset: ${preset.id}`);
          } catch (effectError) {
            console.error(`Error creating effect ${i} (${effectData.position}):`, {
              error: effectError,
              effect: {
                position: effectData.position,
                effectType: effectData.effectType
              }
            });
            
            // エラーオブジェクトをより具体的にする
            if (effectError instanceof Error) {
              throw new Error(`Effect creation failed for ${effectData.position}: ${effectError.message}`);
            } else {
              throw new Error(`Effect creation failed for ${effectData.position}`);
            }
          }
        }

        console.log(`Preset ${preset.id} creation completed successfully with ${processedEffects.length} effects`);
        return preset;
      } catch (error) {
        console.error("Transaction error in createPreset:", {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // エラーを再スローしてトランザクションをロールバック
        if (error instanceof Error) {
          if (error.message.includes("duplicate key")) {
            throw new Error("データの重複があります。既存のプリセット名を変更してください。");
          } else {
            throw error;
          }
        } else {
          throw new Error("プリセット作成中に不明なエラーが発生しました");
        }
      }
    });
  }

  async updatePresetName(id: number, name: string): Promise<Preset | undefined> {
    const [updatedPreset] = await db
      .update(presets)
      .set({ name })
      .where(eq(presets.id, id))
      .returning();

    return updatedPreset || undefined;
  }

  async deletePreset(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // プリセットタグの削除
      await tx
        .delete(presetTags)
        .where(eq(presetTags.presetId, id));

      // エフェクトの削除
      await tx
        .delete(effects)
        .where(eq(effects.presetId, id));

      // コメントの削除
      await tx
        .delete(comments)
        .where(eq(comments.presetId, id));

      // いいねの削除
      await tx
        .delete(likes)
        .where(eq(likes.presetId, id));

      // ブックマークの削除
      await tx
        .delete(bookmarks)
        .where(eq(bookmarks.presetId, id));

      // プリセットの削除
      const result = await tx
        .delete(presets)
        .where(eq(presets.id, id));

      return !!result;
    });
  }

  // Effect methods
  async getEffectsByPresetId(presetId: number): Promise<Effect[]> {
    return db
      .select()
      .from(effects)
      .where(eq(effects.presetId, presetId));
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return db.select().from(tags);
  }

  async getOrCreateTag(name: string): Promise<Tag> {
    // 既存のタグを検索
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(sql`lower(${tags.name})`, name.toLowerCase()));

    if (existingTag) {
      return existingTag;
    }

    // 新しいタグを作成
    const [newTag] = await db
      .insert(tags)
      .values({ name })
      .returning();

    return newTag;
  }

  // Comment methods
  async getCommentsByPresetId(presetId: number): Promise<CommentWithUser[]> {
    const commentsWithUsers = await db
      .select({
        comment: comments,
        user: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.presetId, presetId))
      .orderBy(desc(comments.createdAt));

    return commentsWithUsers.map(c => ({
      ...c.comment,
      user: c.user,
    }));
  }

  async createComment(insertComment: InsertComment, userId: number): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({
        ...insertComment,
        userId,
      })
      .returning();

    return comment;
  }

  // Like methods
  async getLikesByPresetId(presetId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.presetId, presetId));
  }

  async getLikesByUserId(userId: number): Promise<Like[]> {
    return db
      .select()
      .from(likes)
      .where(eq(likes.userId, userId));
  }

  async getLikedUsersByPresetId(presetId: number): Promise<User[]> {
    const result = await db
      .select({
        user: users,
      })
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.presetId, presetId));

    return result.map(r => r.user);
  }

  async isPresetLikedByUser(presetId: number, userId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.presetId, presetId),
          eq(likes.userId, userId)
        )
      );

    return !!like;
  }

  async likePreset(presetId: number, userId: number): Promise<Like> {
    // 既にいいねされているか確認
    const isLiked = await this.isPresetLikedByUser(presetId, userId);
    if (isLiked) {
      const [existingLike] = await db
        .select()
        .from(likes)
        .where(
          and(
            eq(likes.presetId, presetId),
            eq(likes.userId, userId)
          )
        );

      if (existingLike) {
        return existingLike;
      }
    }

    // 新しいいいねを作成
    const [like] = await db
      .insert(likes)
      .values({
        userId,
        presetId,
      })
      .returning();

    // プリセットの所有者を取得
    const preset = await this.getPresetById(presetId);
    if (preset && preset.userId !== userId) {
      // いいね通知を作成（自分自身のプリセットにいいねした場合は通知しない）
      try {
        await db.insert(notifications).values({
          userId: preset.userId,
          actorId: userId,
          type: 'like',
          presetId: presetId,
          read: false
        });
      } catch (error) {
        console.error("Failed to create like notification:", error);
      }
    }

    return like;
  }

  async unlikePreset(presetId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.presetId, presetId),
          eq(likes.userId, userId)
        )
      );

    return !!result;
  }

  // Bookmark methods
  async getBookmarksByUserId(userId: number): Promise<Bookmark[]> {
    return db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));
  }

  async isPresetBookmarkedByUser(presetId: number, userId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.presetId, presetId),
          eq(bookmarks.userId, userId)
        )
      );

    return !!bookmark;
  }

  async bookmarkPreset(presetId: number, userId: number): Promise<Bookmark> {
    // 既にブックマークされているか確認
    const isBookmarked = await this.isPresetBookmarkedByUser(presetId, userId);
    if (isBookmarked) {
      const [existingBookmark] = await db
        .select()
        .from(bookmarks)
        .where(
          and(
            eq(bookmarks.presetId, presetId),
            eq(bookmarks.userId, userId)
          )
        );

      if (existingBookmark) {
        return existingBookmark;
      }
    }

    // 新しいブックマークを作成
    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        userId,
        presetId,
      })
      .returning();

    return bookmark;
  }

  async unbookmarkPreset(presetId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.presetId, presetId),
          eq(bookmarks.userId, userId)
        )
      );

    return !!result;
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    try {
      return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    try {
      const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
      return contact;
    } catch (error) {
      console.error(`Error fetching contact with id ${id}:`, error);
      return undefined;
    }
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    try {
      const [contact] = await db.insert(contacts)
        .values({
          ...contactData,
          status: "new",
          createdAt: new Date(),
          updatedAt: new Date(),
          isAnonymous: contactData.isAnonymous || false
        })
        .returning();
      return contact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  async updateContactStatus(id: number, statusUpdate: UpdateContact): Promise<Contact | undefined> {
    try {
      const [updatedContact] = await db.update(contacts)
        .set({
          ...statusUpdate,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, id))
        .returning();
      return updatedContact;
    } catch (error) {
      console.error(`Error updating contact status for id ${id}:`, error);
      return undefined;
    }
  }

  // Contact Reply methods
  async getContactRepliesByContactId(contactId: number): Promise<ContactReply[]> {
    try {
      return await db.select()
        .from(contactReplies)
        .where(eq(contactReplies.contactId, contactId))
        .orderBy(contactReplies.createdAt);
    } catch (error) {
      console.error(`Error fetching replies for contact id ${contactId}:`, error);
      return [];
    }
  }

  async createContactReply(replyData: InsertContactReply): Promise<ContactReply> {
    try {
      // トランザクションを使って返信を作成し、問い合わせステータスを更新
      let reply: ContactReply | undefined;

      await db.transaction(async (tx) => {
        // 返信の作成
        const [newReply] = await tx.insert(contactReplies)
          .values({
            ...replyData,
            createdAt: new Date()
          })
          .returning();

        reply = newReply;

        // 問い合わせのステータスを確認
        const [contact] = await tx.select()
          .from(contacts)
          .where(eq(contacts.id, replyData.contactId));

        // 新規の場合は対応中に更新
        if (contact && contact.status === "new") {
          await tx.update(contacts)
            .set({
              status: "in_progress",
              updatedAt: new Date()
            })
            .where(eq(contacts.id, replyData.contactId));
        }
      });

      if (!reply) {
        throw new Error('Failed to create contact reply');
      }

      return reply;
    } catch (error) {
      console.error('Error creating contact reply:', error);
      throw error;
    }
  }

  // News methods
  // ニュース関連メソッドは server/utils/news-storage.ts に移動しました

  // Title methods
  async getTitles(): Promise<Title[]> {
    try {
      return await db.select().from(titles);
    } catch (error) {
      console.error('Error getting titles:', error);
      throw error;
    }
  }

  async getTitleById(id: number): Promise<Title | undefined> {
    try {
      const [result] = await db.select().from(titles).where(eq(titles.id, id));
      return result;
    } catch (error) {
      console.error('Error getting title by id:', error);
      throw error;
    }
  }

  async createTitle(titleData: InsertTitle): Promise<Title> {
    try {
      const [result] = await db.insert(titles)
        .values(titleData)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating title:', error);
      throw error;
    }
  }

  async updateTitle(id: number, titleData: Partial<InsertTitle>): Promise<Title | undefined> {
    try {
      const [result] = await db.update(titles)
        .set(titleData)
        .where(eq(titles.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating title:', error);
      throw error;
    }
  }

  async deleteTitle(id: number): Promise<boolean> {
    try {
      await db.delete(userTitles)
        .where(eq(userTitles.titleId, id));
      
      await db.delete(titles)
        .where(eq(titles.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting title:', error);
      throw error;
    }
  }

  // User Title methods
  async getUserTitles(userId: number): Promise<(Title & { grantedAt: Date })[]> {
    try {
      const results = await db.select({
        ...titles,
        grantedAt: userTitles.grantedAt
      })
      .from(userTitles)
      .innerJoin(titles, eq(userTitles.titleId, titles.id))
      .where(eq(userTitles.userId, userId));
      
      return results as (Title & { grantedAt: Date })[];
    } catch (error) {
      console.error('Error getting user titles:', error);
      throw error;
    }
  }

  async grantUserTitle(userId: number, titleId: number): Promise<UserTitle> {
    try {
      // Check if user already has this title
      const hasTitle = await this.hasUserTitle(userId, titleId);
      if (hasTitle) {
        throw new Error('User already has this title');
      }
      
      const [result] = await db.insert(userTitles)
        .values({ userId, titleId })
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error granting user title:', error);
      throw error;
    }
  }

  async revokeUserTitle(userId: number, titleId: number): Promise<boolean> {
    try {
      await db.delete(userTitles)
        .where(and(
          eq(userTitles.userId, userId),
          eq(userTitles.titleId, titleId)
        ));
      
      return true;
    } catch (error) {
      console.error('Error revoking user title:', error);
      throw error;
    }
  }

  async hasUserTitle(userId: number, titleId: number): Promise<boolean> {
    try {
      const [result] = await db.select()
        .from(userTitles)
        .where(and(
          eq(userTitles.userId, userId),
          eq(userTitles.titleId, titleId)
        ));
      
      return !!result;
    } catch (error) {
      console.error('Error checking if user has title:', error);
      throw error;
    }
  }
  
  // System statistics methods
  async getPresetsCountByType(): Promise<Record<string, number>> {
    try {
      // プリセットタイプごとの件数を集計
      const results = await db
        .select({
          type: presets.type,
          count: sql<number>`count(*)`,
        })
        .from(presets)
        .groupBy(presets.type);
      
      // 結果をRecord型にマッピング
      const countByType: Record<string, number> = {};
      
      // すべてのタイプに初期値を設定
      countByType["INPUT_FX"] = 0;
      countByType["TRACK_FX"] = 0;
      countByType["INPUT_TRACK_FX"] = 0;
      
      // 取得した結果で上書き
      for (const result of results) {
        countByType[result.type] = Number(result.count);
      }
      
      return countByType;
    } catch (error) {
      console.error('Error getting presets count by type:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();

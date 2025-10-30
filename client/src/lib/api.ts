import { apiRequest } from "./queryClient";
import { PresetWithDetails, PresetList, CommentWithUser } from "@shared/schema";

// フォロー関連の型
export interface UserProfile {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
}

export interface FollowUser {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  followedAt?: string;
}

// apiRequestの返り値の型をany型に修正（厳密な型チェックを一時的に緩和）
const typedApiRequest = <T>(method: string, url: string, data?: any): Promise<T> => {
  return apiRequest(method, url, data) as Promise<T>;
};

// Preset API
export async function getPresets(options: {
  search?: string;
  tagId?: number;
  userId?: number;
  page?: number;
  limit?: number;
} = {}): Promise<PresetList[]> {
  const params = new URLSearchParams();
  if (options.search) params.append("search", options.search);
  if (options.tagId) params.append("tagId", options.tagId.toString());
  if (options.userId) params.append("userId", options.userId.toString());
  if (options.page) params.append("page", options.page.toString());
  if (options.limit) params.append("limit", options.limit.toString());
  
  const response = await fetch(`/api/presets?${params}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch presets");
  }
  
  return response.json();
}

export async function getPresetById(id: number): Promise<PresetWithDetails> {
  const response = await fetch(`/api/presets/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch preset");
  }
  
  return response.json();
}

export async function createPreset(data: any): Promise<any> {
  return apiRequest("POST", "/api/presets", data);
}

export async function deletePreset(id: number): Promise<any> {
  return apiRequest("DELETE", `/api/presets/${id}`, undefined);
}

export async function updatePresetName(id: number, name: string): Promise<any> {
  return apiRequest("PATCH", `/api/presets/${id}`, { name });
}

// Comment API
export async function getCommentsByPresetId(presetId: number): Promise<CommentWithUser[]> {
  const response = await fetch(`/api/presets/${presetId}/comments`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }
  
  return response.json();
}

export async function createComment(presetId: number, content: string): Promise<any> {
  return apiRequest("POST", `/api/presets/${presetId}/comments`, { content });
}

// Auth API
export async function login(username: string, password: string): Promise<any> {
  return apiRequest("POST", "/api/auth/login", { username, password });
}

export async function register(username: string, password: string): Promise<any> {
  return apiRequest("POST", "/api/auth/register", { username, password });
}

export async function logout(): Promise<any> {
  return apiRequest("POST", "/api/auth/logout", {});
}

export async function getCurrentUser(): Promise<any> {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch current user");
  }
  
  return response.json();
}

// いいね関連のAPI - トグル式に変更（追加・削除の両方に対応）
export async function toggleLikePreset(presetId: number): Promise<any> {
  return apiRequest("POST", `/api/presets/${presetId}/like`, {});
}

// 以前のAPI互換性のために残す
export async function likePreset(presetId: number): Promise<any> {
  return toggleLikePreset(presetId);
}

export async function unlikePreset(presetId: number): Promise<any> {
  return toggleLikePreset(presetId);
}

// ブックマーク関連のAPI - トグル式に変更
export async function toggleBookmarkPreset(presetId: number): Promise<any> {
  return apiRequest("POST", `/api/presets/${presetId}/bookmark`, {});
}

// 以前のAPI互換性のために残す
export async function bookmarkPreset(presetId: number): Promise<any> {
  return toggleBookmarkPreset(presetId);
}

export async function unbookmarkPreset(presetId: number): Promise<any> {
  return toggleBookmarkPreset(presetId);
}

// ユーザー設定関連のAPI
export async function getUserSettings(): Promise<any> {
  return apiRequest("GET", `/api/user/settings`, undefined);
}

export async function updateUserSettings(settings: { showLikes: boolean }): Promise<any> {
  return apiRequest("PUT", `/api/user/settings`, settings);
}

// ユーザープロフィール関連のAPI
export async function getUserById(userId: number): Promise<UserProfile> {
  return apiRequest("GET", `/api/users/${userId}`, undefined);
}

// フォロー関連のAPI
export async function followUser(userId: number): Promise<any> {
  return apiRequest("POST", `/api/users/${userId}/follow`, undefined);
}

export async function unfollowUser(userId: number): Promise<any> {
  return apiRequest("DELETE", `/api/users/${userId}/follow`, undefined);
}

export async function getUserFollowers(userId: number): Promise<FollowUser[]> {
  const response = await fetch(`/api/users/${userId}/followers`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch followers");
  }
  
  return response.json();
}

export async function getUserFollowing(userId: number): Promise<FollowUser[]> {
  const response = await fetch(`/api/users/${userId}/following`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch following");
  }
  
  return response.json();
}

export async function updateUserProfile(profileData: {
  profileText?: string;
  country?: string;
  birthday?: string | Date | null;
  showBirthday?: boolean;
  avatarUrl?: string;
  favoriteArtists?: Array<{ userId: number, looperName: string, displayOrder: number }>;
}): Promise<any> {
  return apiRequest("PUT", `/api/user/profile`, profileData);
}

// 通知関連のAPI
export interface Notification {
  id: number;
  userId: number;
  actorId: number | null;
  type: 'like' | 'comment' | 'follow' | 'contact_reply';
  presetId: number | null;
  commentId: number | null;
  contactId: number | null;
  read: boolean;
  createdAt: string;
  actor?: {
    id: number;
    username: string;
    nickname: string | null;
    avatarUrl: string | null;
  };
}

export async function getNotifications(limit: number = 20, offset: number = 0): Promise<Notification[]> {
  const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  
  return response.json();
}

export async function getUnreadNotificationsCount(): Promise<{ count: number }> {
  const response = await fetch("/api/notifications/unread/count", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch unread notification count");
  }
  
  return response.json();
}

export async function markNotificationAsRead(notificationId: number): Promise<any> {
  return apiRequest("PATCH", `/api/notifications/${notificationId}/read`, undefined);
}

export async function markAllNotificationsAsRead(): Promise<any> {
  return apiRequest("PATCH", "/api/notifications/read-all", undefined);
}

// お気に入りループステーション関連のAPI
export async function getUserLoopers(): Promise<any> {
  return apiRequest("GET", `/api/user/loopers`, undefined);
}

export async function getUserLoopersByUserId(userId: number): Promise<any> {
  return apiRequest("GET", `/api/users/${userId}/loopers`, undefined);
}

export async function createUserLooper(looperData: { looperName: string }): Promise<any> {
  return apiRequest("POST", `/api/user/loopers`, looperData);
}

export async function updateUserLooper(looperId: number, looperData: {
  looperName?: string;
  displayOrder?: number;
}): Promise<any> {
  return apiRequest("PUT", `/api/user/loopers/${looperId}`, looperData);
}

export async function deleteUserLooper(looperId: number): Promise<any> {
  return apiRequest("DELETE", `/api/user/loopers/${looperId}`, undefined);
}

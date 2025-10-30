
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { NotificationType } from "@/components/notifications/notification-dropdown";

// 通知一覧を取得するフック（最大100件まで取得可能）
export function useNotifications(limit: number = 20) {
  return useQuery<NotificationType[]>({
    queryKey: ["/api/notifications", { limit }],
    queryFn: async () => {
      return apiRequest("GET", `/api/notifications?limit=${limit}`);
    },
  });
}

// 未読通知数を取得するフック
export function useUnreadNotificationsCount() {
  return useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: async () => {
      const count = await apiRequest("GET", "/api/notifications/unread-count");
      return count;
    },
    // より頻繁に更新する（1分ごと）
    refetchInterval: 60 * 1000,
  });
}

// 特定の通知を既読にするフック
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: number) => {
      return apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      // 通知一覧と未読数のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });
}

// すべての通知を既読にするフック
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      // 通知一覧と未読数のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });
}

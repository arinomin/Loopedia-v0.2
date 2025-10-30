
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// フォロー状態を取得するフック
export function useCurrentUser() {
  const { data: userData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch current user: ${response.status}`);
      }
      const data = await response.json();
      // ログイン中のユーザー情報をローカルストレージに保存
      if (data && data.id) {
        localStorage.setItem("currentUser", JSON.stringify(data));
      } else {
        localStorage.removeItem("currentUser");
      }
      return data;
    },
  });

  return userData;
}

// 指定したユーザーのフォロー状態を確認するフック
export function useFollowStatus(userId: number) {
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const currentUserId = currentUser?.id;

  // 自分自身の場合またはログインしていない場合は常にfalse
  if (!currentUserId || currentUserId === userId) {
    return { isFollowing: false };
  }

  const { data: userData, isLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 0, // 常に最新データを取得
    refetchOnWindowFocus: true
  });

  return {
    isFollowing: userData?.isFollowing || false,
    isLoading
  };
}

// フォロー機能を提供するフック
export function useFollow(userId: number) {
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const currentUserId = currentUser?.id;

  // 関連クエリを無効化する関数
  const invalidateRelatedQueries = async () => {
    console.log("Invalidating related queries...");

    try {
      if (currentUserId) {
        // 最小限のクエリだけを無効化（効率化）
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${userId}`]
        });
        
        // フォロー/フォロワー情報のみ無効化
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${userId}/followers`]
        });
        await queryClient.invalidateQueries({ 
          queryKey: [`/api/users/${userId}/following`]
        });
        
        if (userId !== currentUserId) {
          await queryClient.invalidateQueries({ 
            queryKey: [`/api/users/${currentUserId}/following`]
          });
        }
        
        console.log("Successfully invalidated related queries");
        
        // 即時再取得
        await Promise.all([
          queryClient.refetchQueries({ queryKey: [`/api/users/${userId}`] }),
          queryClient.refetchQueries({ queryKey: [`/api/users/${userId}/followers`] }),
          queryClient.refetchQueries({ queryKey: [`/api/users/${userId}/following`] })
        ]);
      }
    } catch (error) {
      console.error("Error invalidating queries:", error);
    }
  };

  // ユーザーをフォローする
  const followMutation = useMutation({
    mutationFn: async () => {
      console.log(`Following user ${userId}...`);
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Follow request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Follow response:", result);
      return result;
    },
    onSuccess: async () => {
      await invalidateRelatedQueries();
    },
    onError: (error) => {
      console.error("Follow error:", error);
    }
  });

  // ユーザーのフォローを解除する
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      console.log(`Unfollowing user ${userId}...`);
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Unfollow request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log("Unfollow response:", result);
      return result;
    },
    onSuccess: async () => {
      await invalidateRelatedQueries();
    },
    onError: (error) => {
      console.error("Unfollow error:", error);
    }
  });

  return {
    followMutation,
    unfollowMutation,
  };
}

// ユーザーのフォロワーを取得するフック
export function useUserFollowers(userId: number) {
  return useQuery({
    queryKey: [`/api/users/${userId}/followers`],
    queryFn: async () => {
      console.log(`Fetching followers for user ${userId}...`);
      const response = await fetch(`/api/users/${userId}/followers`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch followers");
      }
      const result = await response.json();
      console.log(`Fetched ${result.length} followers for user ${userId}`);
      return result;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    refetchInterval: 10000 // 10秒ごとに再取得（必要に応じて調整）
  });
}

// ユーザーのフォロー中リストを取得するフック
export function useUserFollowing(userId: number) {
  return useQuery({
    queryKey: [`/api/users/${userId}/following`],
    queryFn: async () => {
      console.log(`Fetching following for user ${userId}...`);
      const response = await fetch(`/api/users/${userId}/following`, {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      const result = await response.json();
      console.log(`Fetched ${result.length} following for user ${userId}`);
      return result;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
    refetchInterval: 10000 // 10秒ごとに再取得（必要に応じて調整）
  });
}

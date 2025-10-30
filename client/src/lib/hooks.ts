import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "./queryClient";
import { 
  likePreset, 
  unlikePreset, 
  bookmarkPreset, 
  unbookmarkPreset,
  getUserSettings,
  updateUserSettings,
  getPresetById
} from "./api";

// Hook for handling authentication
export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) => 
      apiRequest("POST", "/api/auth/login", credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "ログイン成功",
        description: "ようこそ！",
      });
    },
    onError: () => {
      toast({
        title: "ログイン失敗",
        description: "ユーザー名またはパスワードが正しくありません。",
        variant: "destructive",
      });
    },
  });
  
  const registerMutation = useMutation({
    mutationFn: (userData: { username: string; password: string }) => 
      apiRequest("POST", "/api/auth/register", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "登録成功",
        description: "アカウントが作成されました。自動的にログインしました。",
      });
    },
    onError: () => {
      toast({
        title: "登録失敗",
        description: "アカウントの作成に失敗しました。別のユーザー名を試してください。",
        variant: "destructive",
      });
    },
  });
  
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "ログアウト成功",
        description: "正常にログアウトしました。",
      });
    },
    onError: () => {
      toast({
        title: "ログアウトエラー",
        description: "ログアウトに失敗しました。",
        variant: "destructive",
      });
    },
  });
  
  return {
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}

// Hook for handling comments
export function useComments(presetId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest("POST", `/api/presets/${presetId}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}/comments`] });
      toast({
        title: "コメント追加",
        description: "コメントが正常に追加されました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "コメントの追加に失敗しました。",
        variant: "destructive",
      });
    }
  });
  
  return {
    addComment: addCommentMutation.mutate,
    isAddingComment: addCommentMutation.isPending,
  };
}

// Hook for managing preset creation form state
export function usePresetForm() {
  const [formState, setFormState] = useState({
    name: "",
    type: "INPUT_FX",
    tags: "",
    currentTab: "A",
    effects: {
      A: { effectType: "", sw: false, swMode: "TOGGLE", insert: "ALL", parameters: {} },
      B: { effectType: "", sw: false, swMode: "TOGGLE", insert: "ALL", parameters: {} },
      C: { effectType: "", sw: false, swMode: "TOGGLE", insert: "ALL", parameters: {} },
      D: { effectType: "", sw: false, swMode: "TOGGLE", insert: "ALL", parameters: {} },
    },
  });
  
  const updateForm = (updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };
  
  const updateEffect = (position: string, updates: Partial<typeof formState.effects.A>) => {
    setFormState(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [position]: {
          ...prev.effects[position as keyof typeof prev.effects],
          ...updates,
        },
      },
    }));
  };
  
  return {
    formState,
    updateForm,
    updateEffect,
  };
}

// プリセットのいいね・ブックマーク機能のためのカスタムフック
export function usePresetReactions(presetId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // プリセットの現在の状態を取得
  const { data: preset } = useQuery({
    queryKey: [`/api/presets/${presetId}`],
    enabled: !!presetId,
  });
  
  // いいねを付けるミューテーション
  const addLikeMutation = useMutation({
    mutationFn: () => likePreset(presetId),
    onSuccess: () => {
      console.log(`Added like to preset ${presetId}`);
      
      // 即時にキャッシュ更新を行う（オプティミスティックUIの即時反映）
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: true,
          likeCount: (oldData.likeCount || 0) + 1
        };
      });
      
      // キャッシュを無効化して最新データをサーバーから取得
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "いいねしました",
        description: "プリセットにいいねしました",
      });
    },
    onError: (error) => {
      console.error("Like operation failed:", error);
      toast({
        title: "エラー",
        description: "いいねの処理中にエラーが発生しました",
        variant: "destructive",
      });
      
      // エラー時にはキャッシュを元に戻す
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
    }
  });
  
  // いいねを取り消すミューテーション
  const removeLikeMutation = useMutation({
    mutationFn: () => unlikePreset(presetId),
    onSuccess: () => {
      console.log(`Removed like from preset ${presetId}`);
      
      // 即時にキャッシュ更新を行う（オプティミスティックUIの即時反映）
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: false,
          likeCount: Math.max(0, (oldData.likeCount || 0) - 1)
        };
      });
      
      // キャッシュを無効化して最新データをサーバーから取得
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "いいねを取り消しました",
        description: "プリセットのいいねを取り消しました",
      });
    },
    onError: (error) => {
      console.error("Unlike operation failed:", error);
      toast({
        title: "エラー",
        description: "いいね取り消しの処理中にエラーが発生しました",
        variant: "destructive",
      });
      
      // エラー時にはキャッシュを元に戻す
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
    }
  });
  
  // ブックマークを追加するミューテーション
  const addBookmarkMutation = useMutation({
    mutationFn: () => bookmarkPreset(presetId),
    onSuccess: () => {
      console.log(`Added bookmark to preset ${presetId}`);
      
      // 即時にキャッシュ更新を行う（オプティミスティックUIの即時反映）
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isBookmarked: true,
          bookmarkCount: (oldData.bookmarkCount || 0) + 1
        };
      });
      
      // キャッシュを無効化して最新データをサーバーから取得
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "ブックマークしました",
        description: "プリセットをブックマークしました",
      });
    },
    onError: (error) => {
      console.error("Bookmark operation failed:", error);
      toast({
        title: "エラー",
        description: "ブックマークの処理中にエラーが発生しました",
        variant: "destructive",
      });
      
      // エラー時にはキャッシュを元に戻す
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
    }
  });
  
  // ブックマークを取り消すミューテーション
  const removeBookmarkMutation = useMutation({
    mutationFn: () => unbookmarkPreset(presetId),
    onSuccess: () => {
      console.log(`Removed bookmark from preset ${presetId}`);
      
      // 即時にキャッシュ更新を行う（オプティミスティックUIの即時反映）
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isBookmarked: false,
          bookmarkCount: Math.max(0, (oldData.bookmarkCount || 0) - 1)
        };
      });
      
      // キャッシュを無効化して最新データをサーバーから取得
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "ブックマークを取り消しました",
        description: "プリセットのブックマークを取り消しました",
      });
    },
    onError: (error) => {
      console.error("Unbookmark operation failed:", error);
      toast({
        title: "エラー",
        description: "ブックマーク取り消しの処理中にエラーが発生しました",
        variant: "destructive",
      });
      
      // エラー時にはキャッシュを元に戻す
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
    }
  });
  
  // ユーザー設定を取得・更新するためのフック
  const userSettingsMutation = useMutation({
    mutationFn: (showLikes: boolean) => {
      return updateUserSettings({ showLikes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "設定を更新しました",
        description: "ユーザー設定が正常に更新されました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "設定の更新に失敗しました",
        variant: "destructive",
      });
    }
  });
  
  const { data: userSettings } = useQuery({
    queryKey: ["/api/user/settings"],
    queryFn: () => getUserSettings(),
    enabled: !!queryClient.getQueryData(["/api/auth/me"]),
  });
  
  // いいね状態を切り替える関数
  const toggleLike = async () => {
    try {
      // クリックしたときの状態を表示（型チェックを追加）
      console.log("Clicking like button. Current state:", preset ? (preset as any).isLiked : false);
      
      // 直接APIを呼び出す
      const response = await apiRequest("POST", `/api/presets/${presetId}/like`, {});
      console.log("Toggle like response:", response);
      
      // レスポンスを基に楽観的UIを更新
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isLiked: response.isLiked,
          likeCount: response.likeCount
        };
      });
      
      // リスト表示の更新
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      
      // 成功トースト
      toast({
        title: response.isLiked ? "いいねしました" : "いいねを取り消しました",
        description: response.isLiked ? "プリセットにいいねしました" : "プリセットのいいねを取り消しました",
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      // エラーの場合、キャッシュを更新して最新の状態を取得
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "エラー",
        description: "いいねの処理に失敗しました",
        variant: "destructive",
      });
    }
  };
  
  // ブックマーク状態を切り替える関数
  const toggleBookmark = async () => {
    try {
      // クリックしたときの状態を表示（型チェックを追加）
      console.log("Clicking bookmark button. Current state:", preset ? (preset as any).isBookmarked : false);
      
      // 直接APIを呼び出す
      const response = await apiRequest("POST", `/api/presets/${presetId}/bookmark`, {});
      console.log("Toggle bookmark response:", response);
      
      // レスポンスを基に楽観的UIを更新
      queryClient.setQueryData([`/api/presets/${presetId}`], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          isBookmarked: response.isBookmarked,
          bookmarkCount: response.bookmarkCount
        };
      });
      
      // リスト表示の更新
      queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
      
      // 成功トースト
      toast({
        title: response.isBookmarked ? "ブックマークしました" : "ブックマークを取り消しました",
        description: response.isBookmarked ? "プリセットをブックマークしました" : "プリセットのブックマークを取り消しました",
      });
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      // エラーの場合、キャッシュを更新して最新の状態を取得
      queryClient.invalidateQueries({ queryKey: [`/api/presets/${presetId}`] });
      
      toast({
        title: "エラー",
        description: "ブックマークの処理に失敗しました",
        variant: "destructive",
      });
    }
  };

  return {
    toggleLike,
    isTogglingLike: addLikeMutation.isPending || removeLikeMutation.isPending,
    toggleBookmark,
    isTogglingBookmark: addBookmarkMutation.isPending || removeBookmarkMutation.isPending,
    updateUserSettings: userSettingsMutation.mutate,
    isUpdatingSettings: userSettingsMutation.isPending,
    userSettings,
    preset
  };
}

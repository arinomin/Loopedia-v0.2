import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useFollow, useFollowStatus } from "@/hooks/use-follow";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type FollowButtonProps = {
  userId: number;
  isFollowing: boolean; // 初期値として使用
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  variant = "default",
  size = "default",
  className = "",
}: FollowButtonProps) {
  // カスタムフックを使用して現在のフォロー状態を取得
  const { isFollowing: serverIsFollowing } = useFollowStatus(userId);
  // 内部状態は操作中の一時的な状態変化のためだけに使用
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const { followMutation, unfollowMutation } = useFollow(userId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // サーバーからの状態が更新されたら内部状態も更新
  useEffect(() => {
    setIsFollowing(serverIsFollowing);
  }, [serverIsFollowing]);

  // propsの値が変わったら内部状態も更新
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // 操作の楽観的UI更新
        setIsFollowing(false);
        
        console.log(`Unfollowing user ${userId}...`);
        // サーバー側の処理
        const result = await unfollowMutation.mutateAsync();
        console.log("Unfollow result:", result);

        toast({
          title: "フォロー解除",
          description: "ユーザーのフォローを解除しました",
        });
      } else {
        // 操作の楽観的UI更新
        setIsFollowing(true);
        
        console.log(`Following user ${userId}...`);
        // サーバー側の処理
        const result = await followMutation.mutateAsync();
        console.log("Follow result:", result);

        toast({
          title: "フォロー",
          description: "ユーザーをフォローしました",
        });
      }
      
      // 関連するデータの更新は useFollow フックの onSuccess 内で行われるため、
      // ここでは最新のユーザー情報を取得するだけにする
      const userData = await queryClient.fetchQuery({
        queryKey: [`/api/users/${userId}`],
        queryFn: async () => {
          const response = await fetch(`/api/users/${userId}`, {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (!response.ok) throw new Error("Failed to fetch updated user data");
          return response.json();
        },
        staleTime: 0
      });
      
      // サーバーからの最新状態を設定
      setIsFollowing(userData.isFollowing);
    } catch (error) {
      // エラー時は元の状態に戻す
      setIsFollowing(!isFollowing);
      console.error("フォロー操作でエラーが発生しました:", error);
      toast({
        title: "エラー",
        description: "フォロー操作に失敗しました",
        variant: "destructive",
      });
    }
  };

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      className={className}
      onClick={handleFollowToggle}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserCheck className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "フォロー中" : "フォローする"}
    </Button>
  );
}

import { useState, useEffect } from "react";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-follow";
import { Link } from "wouter";
import { FollowButton } from "@/components/follow-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
  isFollowing?: boolean;
}

interface FollowListDialogProps {
  userId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "followers" | "following";
}

// ユーザー項目コンポーネント
function UserListItem({ 
  user, 
  isCurrentUser,
  showFollowButton,
  onOpenChange
}: { 
  user: User; 
  isCurrentUser: boolean;
  showFollowButton: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <Link 
        href={`/user/${user.id}`}
        onClick={() => onOpenChange(false)}
        className="flex items-center"
      >
        <Avatar className="h-10 w-10 mr-3">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.username} />
          ) : (
            <AvatarFallback>
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium">{user.nickname || user.username}</p>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </Link>

      {showFollowButton && !isCurrentUser && (
        <FollowButton 
          userId={user.id} 
          isFollowing={user.isFollowing || false}
          size="sm"
        />
      )}
    </div>
  );
}

export function FollowListDialog({
  userId,
  open,
  onOpenChange,
  initialTab = "followers",
}: FollowListDialogProps) {
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const { data: followers = [], isLoading: isLoadingFollowers, refetch: refetchFollowers } = useUserFollowers(userId);
  const { data: following = [], isLoading: isLoadingFollowing, refetch: refetchFollowing } = useUserFollowing(userId);
  const queryClient = useQueryClient();

  // 現在ログイン中のユーザーID
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const currentUserId = currentUser?.id;

  // ダイアログが開かれた時にデータを更新
  useEffect(() => {
    if (open) {
      // 強制的に再取得
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following`] });

      refetchFollowers();
      refetchFollowing();
    }
  }, [open, refetchFollowers, refetchFollowing, queryClient, userId]);

  // フォロワーとフォロー中のデータをログに出力（デバッグ用）
  console.log("Followers data:", followers);
  console.log("Following data:", following);

  // 手動で最新データを取得する関数
  const handleRefresh = async () => {
    // 強制的にキャッシュを無効化して最新データを取得
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/followers`] }),
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following`] })
    ]);

    // 両方のデータを同時に更新
    await Promise.all([
      refetchFollowers(),
      refetchFollowing()
    ]);
    
    console.log(`Refreshed data for user ${userId}: followers=${followers?.length}, following=${following?.length}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row justify-between items-center">
          <DialogTitle>フォロー/フォロワー</DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <DialogDescription className="sr-only">
          ユーザーのフォロワーとフォロー中のリストを表示します
        </DialogDescription>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "followers" | "following")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">フォロワー</TabsTrigger>
            <TabsTrigger value="following">フォロー中</TabsTrigger>
          </TabsList>
          <TabsContent value="followers">
            {isLoadingFollowers ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : followers && followers.length > 0 ? (
              <div className="space-y-4 mt-2">
                {followers.map((user: User) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    isCurrentUser={currentUserId === user.id}
                    showFollowButton={currentUserId !== null && currentUserId !== userId && currentUserId !== user.id}
                    onOpenChange={onOpenChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                フォロワーはいません
              </div>
            )}
          </TabsContent>
          <TabsContent value="following">
            {isLoadingFollowing ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : following && following.length > 0 ? (
              <div className="space-y-4 mt-2">
                {following.map((user: User) => (
                  <UserListItem
                    key={user.id}
                    user={user}
                    isCurrentUser={currentUserId === user.id}
                    showFollowButton={currentUserId !== null && currentUserId !== userId && currentUserId !== user.id}
                    onOpenChange={onOpenChange}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                フォローしているユーザーはいません
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

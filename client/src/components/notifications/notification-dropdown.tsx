import { useEffect, useState } from "react";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationsCount
} from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Check, UserPlus, Heart, MessageCircle, ArrowDown, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { UserBadge } from "@/components/user-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


export type NotificationType = {
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
    isVerified?: boolean;
    isAdmin?: boolean;
  };
};

interface NotificationDropdownProps {
  isMobile?: boolean;
  isLink?: boolean;  // 通知ページへのリンクとして使用するかどうか
}

export function NotificationDropdown({ isMobile = false, isLink = false }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0, isLoading: isLoadingCount, refetch: refetchUnreadCount } = useUnreadNotificationsCount();
  const [limit, setLimit] = useState(20); 
  const { data: notifications = [], isLoading, isFetching, refetch: refetchNotifications } = useNotifications(limit);
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  const [, setLocation] = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);


  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchNotifications();
      await refetchUnreadCount();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); 
    }
  };

  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  }, [open, unreadCount, markAllAsReadMutation]);

  const handleLoadMore = () => {
    setLimit(Math.min(limit + 20, 100));
  };

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

    setOpen(false);
    setSheetOpen(false);

    if (notification.type === 'like' || notification.type === 'comment') {
      if (notification.presetId) {
        setLocation(`/presets/${notification.presetId}`);
      }
    } else if (notification.type === 'follow') {
      if (notification.actorId) {
        setLocation(`/users/${notification.actorId}`);
      }
    } else if (notification.type === 'contact_reply') {
      if (notification.contactId) {
        setLocation(`/contact-reply/${notification.contactId}`);
      }
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'contact_reply':
        return <MessageCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const renderNotificationContent = (notification: NotificationType) => {
    const actorName = notification.actor?.nickname || notification.actor?.username || '不明なユーザー';
    
    // ユーザー名のみの部分 (バッジなし)
    let nameText = '';
    
    switch (notification.type) {
      case 'like':
        return (
          <>
            <span className="inline-flex items-center">
              {notification.actor && (
                <UserBadge 
                  user={notification.actor} 
                  size="sm" 
                  showUsername={false}
                  showNickname={true}
                  className="mr-1" 
                />
              )}
            </span>
            があなたのプリセットをいいねしました
          </>
        );
      case 'comment':
        return (
          <>
            <span className="inline-flex items-center">
              {notification.actor && (
                <UserBadge 
                  user={notification.actor} 
                  size="sm" 
                  showUsername={false}
                  showNickname={true}
                  className="mr-1" 
                />
              )}
            </span>
            があなたのプリセットにコメントしました
          </>
        );
      case 'follow':
        return (
          <>
            <span className="inline-flex items-center">
              {notification.actor && (
                <UserBadge 
                  user={notification.actor} 
                  size="sm" 
                  showUsername={false}
                  showNickname={true}
                  className="mr-1" 
                />
              )}
            </span>
            があなたをフォローしました
          </>
        );
      case 'contact_reply':
        return `あなたのお問い合わせに返信がありました`;
      default:
        return '新しい通知があります';
    }
  };

  // リンクモードの場合、通知カウントだけを表示
  if (isLink) {
    return (
      <div className="relative">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500" variant="destructive">
            {unreadCount}
          </Badge>
        )}
      </div>
    );
  }

  // Mobile rendering
  if (isMobile) {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <div className="h-5 w-5 relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500" variant="destructive">
                {unreadCount}
              </Badge>
            )}
          </div>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>通知</SheetTitle>
          </SheetHeader>
          <div className="mt-4 max-h-[calc(100vh-150px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="h-6 w-6" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                通知はありません
              </div>
            ) : (
              <>
                {notifications.map((notification: NotificationType) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-2 px-4 py-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {notification.actor ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.actor.avatarUrl || undefined} />
                          <AvatarFallback>
                            {notification.actor.nickname?.charAt(0) || notification.actor.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {renderNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        {renderNotificationContent(notification)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                      </p>
                    </div>
                  </div>
                ))}
                {notifications.length >= limit && limit < 100 && (
                  <div className="p-2 text-center border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={handleLoadMore}
                      disabled={isFetching}
                    >
                      {isFetching ? (
                        <Spinner className="h-3 w-3 mr-2" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-2" />
                      )}
                      さらに読み込む
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop rendering (remains largely unchanged)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500" variant="destructive">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>通知</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="p-1 h-6 w-6"
              title="通知を更新"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs h-7 px-2"
            >
              {markAllAsReadMutation.isPending ? (
                <Spinner className="h-3 w-3" />
              ) : (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  すべて既読にする
                </>
              )}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-6 w-6" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            通知はありません
          </div>
        ) : (
          <>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((notification: NotificationType) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex items-start gap-2 px-4 py-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {notification.actor ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={notification.actor.avatarUrl || undefined} />
                        <AvatarFallback>
                          {notification.actor.nickname?.charAt(0) || notification.actor.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {renderNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      {renderNotificationContent(notification)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            {notifications.length >= limit && limit < 100 && (
              <div className="p-2 text-center border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleLoadMore}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Spinner className="h-3 w-3 mr-2" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-2" />
                  )}
                  さらに読み込む
                </Button>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Bell, Heart, MessageCircle, UserPlus, ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useMarkAllNotificationsAsRead, useMarkNotificationAsRead } from "@/hooks/use-notifications";
import { UserBadge } from "@/components/user-badge";

interface Notification {
  id: number;
  userId: number;
  actorId: number | null;
  type: string;
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
  preset?: {
    id: number;
    name: string;
  };
}

export default function NotificationsPage() {
  const [limit, setLimit] = useState(20);
  const [, setLocation] = useLocation();

  const { data: notifications = [], isLoading, isFetching, refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", { limit }],
    queryFn: () => 
      fetch(`/api/notifications?limit=${limit}`, { credentials: "include" })
        .then(res => res.json()),
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  const hasUnread = notifications.some(notification => !notification.read);

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleLoadMore = () => {
    setLimit(Math.min(limit + 20, 100));
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }

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

  const getNotificationIcon = (type: string) => {
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

  const getNotificationMessage = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return (
          <span className="flex items-center flex-wrap">
            {notification.actor && (
              <UserBadge 
                user={notification.actor as any} 
                size="sm" 
                className="mr-1" 
              />
            )}
            <span>があなたのプリセット「{notification.preset?.name || 'プリセット'}」をいいねしました</span>
          </span>
        );
      case 'comment':
        return (
          <span className="flex items-center flex-wrap">
            {notification.actor && (
              <UserBadge 
                user={notification.actor as any} 
                size="sm" 
                className="mr-1" 
              />
            )}
            <span>があなたのプリセット「{notification.preset?.name || 'プリセット'}」にコメントしました</span>
          </span>
        );
      case 'follow':
        return (
          <span className="flex items-center flex-wrap">
            {notification.actor && (
              <UserBadge 
                user={notification.actor as any} 
                size="sm" 
                className="mr-1" 
              />
            )}
            <span>があなたをフォローしました</span>
          </span>
        );
      case 'contact_reply':
        return `あなたのお問い合わせに返信がありました`;
      default:
        return '新しい通知があります';
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'like' || notification.type === 'comment') {
      return notification.presetId ? `/presets/${notification.presetId}` : '#';
    } else if (notification.type === 'follow') {
      return notification.actorId ? `/users/${notification.actorId}` : '#';
    } else if (notification.type === 'contact_reply') {
      return notification.contactId ? `/contact-reply/${notification.contactId}` : '#';
    }
    return '#';
  };

  return (
    <div className="container max-w-4xl py-8 mx-auto px-4">
      <Card className="shadow-lg border border-gray-200 bg-white mx-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-primary/10 to-gray-50 rounded-t-lg border-b">
          <CardTitle className="text-xl font-bold flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            通知
          </CardTitle>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs bg-white hover:bg-gray-100 shadow-sm"
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
        </CardHeader>
        <CardContent className="pb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              通知はありません
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 cursor-pointer border-b border-border hover:bg-gray-50 transition-colors rounded-md my-1 ${
                    !notification.read ? "bg-blue-50/70 shadow-sm" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex-shrink-0">
                    {notification.actor ? (
                      <Avatar className="h-12 w-12 border-2 border-gray-100 shadow-md">
                        <AvatarImage src={notification.actor.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {notification.actor.nickname?.charAt(0) || notification.actor.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shadow-md border-2 border-gray-100">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">
                      {getNotificationMessage(notification)}
                    </p>
                    <div className="flex items-center mt-2">
                      <Badge variant="outline" className="text-xs text-muted-foreground bg-gray-50 shadow-sm">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ja })}
                      </Badge>
                      {!notification.read && (
                        <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {notifications.length >= limit && limit < 100 && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="w-full max-w-xs"
                  >
                    {isFetching ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-2" />
                    )}
                    さらに読み込む
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
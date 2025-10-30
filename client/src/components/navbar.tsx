import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient, performLogout } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  PlusCircle,
  User,
  LogOut,
  Menu,
  RefreshCw,
  Shield,
  Bell,
  Search,
  Settings,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import loopediaLogo from "@/assets/loopedia-logo.png";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { NotificationDropdown } from "./notifications/notification-dropdown";

interface NavbarProps {
  user: { id: number; username: string } | null;
}

interface UserProfileData {
  id: number;
  username: string;
  nickname?: string;
  avatarUrl?: string;
}

export default function Navbar({ user }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [isHome] = useRoute("/");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  // ユーザープロファイル情報を取得
  const { data: userProfile } = useQuery<UserProfileData>({
    queryKey: ["/api/users", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const response = await fetch(`/api/users/${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user profile");
      return response.json();
    },
    enabled: !!user, // ユーザーがログインしている場合のみ実行
  });

  // 一覧ページの更新処理
  const handleRefresh = useCallback(() => {
    // キャッシュを無効化してデータを再取得
    queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    toast({
      title: "更新",
      description: "プリセット一覧を更新しました",
    });
  }, [toast]);

  // ロゴクリック時の処理
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (location === "/") {
        // ホームページにいる場合は更新処理を実行
        handleRefresh();
      } else {
        // 他のページにいる場合はホームに戻る
        setLocation("/");
      }
    },
    [location, handleRefresh, setLocation],
  );

  const handleLogout = async () => {
    try {
      console.log("強化されたログアウト処理を開始");

      // 強化されたログアウト関数を使用
      const success = await performLogout();

      if (success) {
        toast({
          title: "ログアウト成功",
          description: "正常にログアウトしました。",
          duration: 2000,
        });

        // モバイルメニューを閉じる
        setSheetOpen(false);

        // ホームページにリダイレクト
        setTimeout(() => {
          console.log("ホームページにリダイレクト");
          setLocation("/");
        }, 500);
      } else {
        throw new Error("ログアウト処理が失敗しました");
      }
    } catch (error) {
      console.error("ログアウトエラー:", error);
      toast({
        title: "ログアウトエラー",
        description: "ログアウトに失敗しました。",
        variant: "destructive",
      });
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  // モバイルナビゲーション（Twitter風）
  if (isMobile) {
    return (
      <>
        {/* 上部ナビゲーション */}
        <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
          <div className="px-4 flex justify-between h-14 items-center relative border-b border-gray-100">
            <div className="flex items-center">
              <a
                href="#"
                onClick={handleLogoClick}
                className="flex items-center cursor-pointer"
              >
                {isHome && (
                  <div className="flex items-center gap-1">
                    <img src={loopediaLogo} alt="Loopedia" className="h-8" />
                    <RefreshCw
                      className="h-4 w-4 ml-1 text-gray-400 hover:text-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRefresh();
                      }}
                    />
                  </div>
                )}
                {!isHome && (
                  <img src={loopediaLogo} alt="Loopedia" className="h-8" />
                )}
              </a>
            </div>
            <div>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="focus:outline-none relative z-50 hover:bg-gray-100"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>メニュー</SheetTitle>
                    <SheetDescription></SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col space-y-6 mt-4 h-full">
                    {user && (
                      <div className="border-b pb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-12 w-12">
                            {userProfile?.avatarUrl && (
                              <AvatarImage src={userProfile.avatarUrl} />
                            )}
                            <AvatarFallback>
                              {userProfile?.nickname?.[0] ||
                                user.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-lg">
                              {userProfile?.nickname || user.username}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <Link
                      href="/"
                      className="flex items-center space-x-4 text-lg font-medium"
                      onClick={() => setSheetOpen(false)}
                    >
                      <Home className="h-6 w-6" />
                      <span>プリセット一覧</span>
                    </Link>
                    <Link
                      href="/create"
                      className="flex items-center space-x-4 text-lg font-medium"
                      onClick={() => setSheetOpen(false)}
                    >
                      <PlusCircle className="h-6 w-6" />
                      <span>新規作成</span>
                    </Link>
                    {user && (
                      <>
                        <Link
                          href={`/users/${user.id}`}
                          className="flex items-center space-x-4 text-lg font-medium"
                          onClick={() => setSheetOpen(false)}
                        >
                          <User className="h-6 w-6" />
                          <span>プロフィール</span>
                        </Link>
                        {user.username === "admin" && (
                          <Link
                            href="/admin"
                            className="flex items-center space-x-4 text-lg font-medium"
                            onClick={() => setSheetOpen(false)}
                          >
                            <Shield className="h-6 w-6" />
                            <span>管理</span>
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          className="flex items-center space-x-4 text-lg font-medium"
                          onClick={() => setSheetOpen(false)}
                        >
                          <Settings className="h-6 w-6" />
                          <span>設定</span>
                        </Link>
                        <Button
                          variant="ghost"
                          className="flex items-center justify-start space-x-4 text-lg font-medium h-auto p-0 hover:bg-transparent"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-6 w-6 text-destructive" />
                          <span className="text-destructive">ログアウト</span>
                        </Button>
                      </>
                    )}
                    {!user && (
                      <Link
                        href="/login"
                        className="flex items-center space-x-4 text-lg font-medium"
                        onClick={() => setSheetOpen(false)}
                      >
                        <User className="h-6 w-6" />
                        <span>ログイン</span>
                      </Link>
                    )}

                    {/* フッターリンク - 縦に配置 */}
                    <div className="mt-auto pt-6 border-t border-gray-200">
                      <div className="flex flex-col gap-4 text-sm">
                        <h3 className="text-xs uppercase font-semibold text-gray-500 mb-1"></h3>
                        <div className="flex flex-col space-y-2">
                          <Link
                            href="/terms-of-service"
                            className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-primary transition-colors"
                            onClick={() => setSheetOpen(false)}
                          >
                            <span className="text-sm">利用規約</span>
                          </Link>
                          <Link
                            href="/privacy-policy"
                            className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-primary transition-colors"
                            onClick={() => setSheetOpen(false)}
                          >
                            <span className="text-sm">
                              プライバシーポリシー
                            </span>
                          </Link>
                          <Link
                            href="/contact"
                            className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 hover:text-primary transition-colors"
                            onClick={() => setSheetOpen(false)}
                          >
                            <span className="text-sm">お問い合わせ</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>

        {/* 下部タブナビゲーション（改良版） */}
        <div className="bg-white shadow-lg fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200">
          <div className="grid grid-cols-5 h-16 px-2">
            <Link
              href="/"
              className={`flex flex-col items-center justify-center py-2 ${
                isActive("/")
                  ? "text-primary border-t-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Home
                className={`h-6 w-6 ${isActive("/") ? "text-primary" : ""}`}
              />
              <span className="text-xs mt-1 font-medium"></span>
            </Link>

            {/* 検索ボタン - 検索専用ページへ遷移 */}
            <Link
              href="/search"
              className={`flex flex-col items-center justify-center py-2 ${
                isActive("/search")
                  ? "text-primary border-t-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Search
                className={`h-6 w-6 ${isActive("/search") ? "text-primary" : ""}`}
              />
              <span className="text-xs mt-1 font-medium"></span>
            </Link>

            <Link
              href="/create"
              className={`flex flex-col items-center justify-center py-2 ${
                isActive("/create")
                  ? "text-primary border-t-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <PlusCircle
                className={`h-6 w-6 ${isActive("/create") ? "text-primary" : ""}`}
              />
              <span className="text-xs mt-1 font-medium"></span>
            </Link>

            {/* 通知ボタン - 通知ページへのリンク */}
            <Link
              href={user ? "/notifications" : "#"}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive("/notifications")
                  ? "text-primary border-t-2 border-primary"
                  : user
                    ? "text-gray-500 hover:text-gray-700"
                    : "text-gray-400 pointer-events-none opacity-50"
              }`}
            >
              {user ? (
                <NotificationDropdown isMobile={true} isLink={true} />
              ) : (
                <Bell className="h-6 w-6" />
              )}
              <span className="text-xs mt-1 font-medium"></span>
            </Link>

            <Link
              href={user ? `/users/${user.id}` : "/login"}
              className={`flex flex-col items-center justify-center py-2 ${
                isActive("/users") || isActive("/login")
                  ? "text-primary border-t-2 border-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {user && userProfile?.avatarUrl ? (
                <div
                  className={`p-0.5 rounded-full ${isActive("/users") ? "ring-2 ring-primary" : ""}`}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={userProfile.avatarUrl} />
                    <AvatarFallback>
                      {userProfile?.nickname?.[0] ||
                        user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <User
                  className={`h-6 w-6 ${isActive("/users") || isActive("/login") ? "text-primary" : ""}`}
                />
              )}
              <span className="text-xs mt-1 font-medium">
                {user ? "" : "ログイン"}
              </span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  // デスクトップナビゲーション（従来のもの）
  return (
    <nav className="bg-white shadow-sm mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <a
                href="#"
                onClick={handleLogoClick}
                className="flex items-center cursor-pointer"
              >
                {isHome && (
                  <div className="flex items-center gap-1">
                    <img src={loopediaLogo} alt="Loopedia" className="h-8" />
                    {isHome && (
                      <RefreshCw
                        className="h-4 w-4 ml-1 text-gray-400 hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRefresh();
                        }}
                      />
                    )}
                  </div>
                )}
                {!isHome && (
                  <img src={loopediaLogo} alt="Loopedia" className="h-8" />
                )}
              </a>
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center gap-4">
                  {user.username === "admin" && (
                    <Link
                      href="/admin"
                      className={`relative p-2 rounded-full ${
                        isActive("/admin")
                          ? "bg-primary/10 text-primary"
                          : "text-gray-500 hover:text-primary hover:bg-gray-100"
                      }`}
                    >
                      <Shield className="h-5 w-5" />
                    </Link>
                  )}
                  <Link
                    href="/search"
                    className={`relative p-2 rounded-full ${
                      isActive("/search")
                        ? "bg-primary/10 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-gray-100"
                    }`}
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/notifications"
                    className={`relative p-2 rounded-full ${
                      isActive("/notifications")
                        ? "bg-primary/10 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-gray-100"
                    }`}
                  >
                    <NotificationDropdown isLink={true} />
                  </Link>
                  <Link
                    href="/settings"
                    className={`relative p-2 rounded-full ${
                      isActive("/settings")
                        ? "bg-primary/10 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-gray-100"
                    }`}
                  >
                    <Settings className="h-5 w-5" />
                  </Link>
                  <Link href={`/users/${user.id}`}>
                    <Avatar className="h-9 w-9 cursor-pointer border-2 border-gray-100 hover:border-primary/50 transition-colors">
                      {userProfile?.avatarUrl && (
                        <AvatarImage src={userProfile.avatarUrl} />
                      )}
                      <AvatarFallback>
                        {userProfile?.nickname?.[0] ||
                          user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <Button variant="outline" onClick={handleLogout} size="sm">
                    ログアウト
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link
                    href="/search"
                    className={`relative p-2 rounded-full ${
                      isActive("/search")
                        ? "bg-primary/10 text-primary"
                        : "text-gray-500 hover:text-primary hover:bg-gray-100"
                    }`}
                  >
                    <Search className="h-5 w-5" />
                  </Link>
                  <Link href="/login">
                    <Button type="button">ログイン</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

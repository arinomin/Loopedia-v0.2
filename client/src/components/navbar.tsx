import { Link, useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient, performLogout } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Home,
  PlusCircle,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import loopediaLogo from "@/assets/loopedia-logo.png";
import { useState, useCallback } from "react";

interface NavbarProps {
  user: { id: number; username: string; nickname?: string } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [isHome] = useRoute("/");
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/presets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
    toast({
      title: "更新",
      description: "プリセット一覧を更新しました",
    });
  }, [toast]);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (location === "/") {
        handleRefresh();
      } else {
        setLocation("/");
      }
    },
    [location, handleRefresh, setLocation],
  );

  const handleLogout = async () => {
    try {
      const success = await performLogout();

      if (success) {
        toast({
          title: "ログアウト成功",
          description: "正常にログアウトしました。",
          duration: 2000,
        });

        setSheetOpen(false);

        setTimeout(() => {
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

  if (isMobile) {
    return (
      <>
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
                          <div>
                            <div className="font-semibold text-lg">
                              {user.nickname || user.username}
                            </div>
                            <div className="text-muted-foreground text-sm">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {user && (
                      <>
                        <Link
                          href="/"
                          className="flex items-center space-x-4 text-lg font-medium"
                          onClick={() => setSheetOpen(false)}
                        >
                          <Home className="h-6 w-6" />
                          <span>マイプリセット</span>
                        </Link>
                        <Link
                          href="/create"
                          className="flex items-center space-x-4 text-lg font-medium"
                          onClick={() => setSheetOpen(false)}
                        >
                          <PlusCircle className="h-6 w-6" />
                          <span>新規作成</span>
                        </Link>
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
                          className="flex items-center space-x-4 text-lg font-medium justify-start p-0 h-auto text-foreground hover:bg-transparent"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-6 w-6" />
                          <span>ログアウト</span>
                        </Button>
                      </>
                    )}
                    {!user && (
                      <Link
                        href="/login"
                        className="flex items-center space-x-4 text-lg font-medium"
                        onClick={() => setSheetOpen(false)}
                      >
                        <Home className="h-6 w-6" />
                        <span>ログイン</span>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>

        <nav className="bg-white shadow-sm fixed bottom-0 left-0 right-0 z-50 border-t">
          <div className="flex justify-around items-center h-16">
            {user && (
              <>
                <Link
                  href="/"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    isActive("/") ? "text-primary" : "text-gray-600"
                  }`}
                  data-testid="link-home"
                >
                  <Home className="h-6 w-6" />
                  <span className="text-xs mt-1">マイプリセット</span>
                </Link>
                <Link
                  href="/create"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    isActive("/create") ? "text-primary" : "text-gray-600"
                  }`}
                  data-testid="link-create"
                >
                  <PlusCircle className="h-6 w-6" />
                  <span className="text-xs mt-1">作成</span>
                </Link>
                <Link
                  href="/settings"
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    isActive("/settings") ? "text-primary" : "text-gray-600"
                  }`}
                  data-testid="link-settings"
                >
                  <Settings className="h-6 w-6" />
                  <span className="text-xs mt-1">設定</span>
                </Link>
              </>
            )}
            {!user && (
              <Link
                href="/login"
                className="flex flex-col items-center justify-center flex-1 h-full text-gray-600"
                data-testid="link-login"
              >
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">ログイン</span>
              </Link>
            )}
          </div>
        </nav>
      </>
    );
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between h-16 items-center">
        <div className="flex items-center space-x-8">
          <a
            href="#"
            onClick={handleLogoClick}
            className="flex items-center cursor-pointer"
          >
            <img src={loopediaLogo} alt="Loopedia" className="h-10" />
          </a>
          {user && (
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className={`flex items-center space-x-2 ${
                  isActive("/") ? "text-primary font-medium" : "text-gray-600"
                }`}
                data-testid="link-home"
              >
                <Home className="h-5 w-5" />
                <span>マイプリセット</span>
              </Link>
              <Link
                href="/create"
                className={`flex items-center space-x-2 ${
                  isActive("/create") ? "text-primary font-medium" : "text-gray-600"
                }`}
                data-testid="link-create"
              >
                <PlusCircle className="h-5 w-5" />
                <span>新規作成</span>
              </Link>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                href="/settings"
                className={`flex items-center space-x-2 ${
                  isActive("/settings") ? "text-primary font-medium" : "text-gray-600"
                }`}
                data-testid="link-settings"
              >
                <Settings className="h-5 w-5" />
                <span className="hidden sm:inline">設定</span>
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center space-x-2"
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline">ログアウト</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" data-testid="button-login">
                ログイン
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

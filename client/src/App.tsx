import { Switch, Route } from "wouter";
import { queryClient, verifyAuthState } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PresetList from "@/pages/preset-list";
import PresetDetail from "@/pages/preset-detail";
import PresetCreate from "@/pages/preset-create";
import UserProfile from "@/pages/user-profile";
import Login from "@/pages/login";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import Contact from "@/pages/contact";
import AdminPanel from "@/pages/admin-panel";
import ContactHistory from "@/pages/contact-history";
import ContactReply from "@/pages/contact-reply";
import SearchPage from "@/pages/search";
import NotificationsPage from "@/pages/notifications";
import SettingsPage from "@/pages/settings";
import LandingPage from "@/pages/landing";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// 重複したSearchPage関数を削除 - 代わりに@/pages/searchからインポートしたものを使用

function App() {
  // ユーザー認証状態をチェック（改良版）
  const { data: user, refetch: refetchUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      console.log("Checking auth state...");
      try {
        // 認証検証機能を使用
        return await verifyAuthState();
      } catch (error) {
        console.error("Auth check error:", error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5分ごとに再確認
    refetchOnWindowFocus: true, // フォーカス時に再確認
    retry: 1, // エラー時に1回リトライ
  });
  
  // ログイン状態の変化をチェック
  useEffect(() => {
    console.log("User authentication state:", user);
  }, [user]);
  
  // 初回ロード時とウィンドウがアクティブになった時に認証状態を再確認
  useEffect(() => {
    // ページロード時に認証状態を検証
    const verifyUserAuth = async () => {
      try {
        await verifyAuthState();
        // 認証状態を更新
        refetchUser();
      } catch (error) {
        console.error("Failed to verify authentication:", error);
      }
    };
    
    // 初回実行
    verifyUserAuth();
    
    // ウィンドウフォーカス時に再検証
    const handleFocus = () => {
      console.log("Window focused, verifying auth state...");
      verifyUserAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-grow">
        <div className="pb-16 md:pb-0 pt-16 md:pt-0"> {/* モバイル用パディング（ナビゲーションバー分の上下スペース） */}
          <Switch>
            {/* ホームページは認証状態によって表示を切り替え */}
            <Route path="/">
              {(params) => (user ? <PresetList /> : <LandingPage />)}
            </Route>
            <Route path="/create" component={PresetCreate} />
            <Route path="/presets/:id" component={PresetDetail} />
            <Route path="/users/:id" component={UserProfile} />
            <Route path="/login" component={Login} />
            <Route path="/contact" component={Contact} />
            <Route path="/contact-history" component={ContactHistory} />
            <Route path="/contact-reply/:id" component={ContactReply} />
            <Route path="/terms-of-service" component={TermsOfService} />
            <Route path="/privacy-policy" component={PrivacyPolicy} />
            <Route path="/admin" component={AdminPanel} />
            <Route path="/search" component={SearchPage} />
            <Route path="/notifications" component={NotificationsPage} />
            <Route path="/settings" component={SettingsPage} />
          </Switch>
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

// Wrapper for the app to provide the query client
function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

export default AppWrapper;
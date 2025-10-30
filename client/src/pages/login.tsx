import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient, verifyAuthState } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import loopediaLogo from "@/assets/loopedia-logo.png";

export default function Login() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState("login");
  
  // Login state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Register state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // ユーザーがすでにログインしている場合はリダイレクト
  useEffect(() => {
    // 認証状態を検証
    const checkAuthState = async () => {
      const userData = await verifyAuthState();
      // ユーザーデータが存在する場合はホームページにリダイレクト
      if (userData) {
        console.log("既にログインしています。ホームページにリダイレクトします。");
        navigate("/");
      }
    };
    
    checkAuthState();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast({
        title: "入力エラー",
        description: "ユーザー名とパスワードを入力してください。",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoggingIn(true);
      
      // ログイン要求を送信
      const loginResponse = await apiRequest("POST", "/api/auth/login", {
        username: loginUsername,
        password: loginPassword,
      });
      
      console.log("Login response:", loginResponse);
      
      // 認証状態をすぐに更新（キャッシュをクリアして最新データを取得）
      queryClient.resetQueries({ queryKey: ["/api/auth/me"] });
      
      // ログイン後の検証として明示的にユーザー情報を取得
      const userData = await verifyAuthState();
      console.log("Auth verification after login:", userData);
      
      if (!userData) {
        console.error("認証に成功したのにユーザー情報の取得に失敗しました");
        throw new Error("認証検証に失敗しました。");
      }
      
      // セッションIDを表示（デバッグ用）
      console.log("ログイン成功: セッションID =", loginResponse.sessionId || "不明");
      
      toast({
        title: "ログイン成功",
        description: "ようこそ！",
        duration: 2000, // 表示時間を2秒に設定
      });
      
      // 少し遅延してから画面遷移（トーストメッセージを確認できるよう）
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      toast({
        title: "ログイン失敗",
        description: "ユーザー名またはパスワードが正しくありません。",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerPassword || !confirmPassword) {
      toast({
        title: "入力エラー",
        description: "すべての項目を入力してください。",
        variant: "destructive",
      });
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast({
        title: "パスワードエラー",
        description: "パスワードと確認用パスワードが一致しません。",
        variant: "destructive",
      });
      return;
    }

    if (!acceptTerms) {
      toast({
        title: "利用規約への同意が必要です",
        description: "アカウントを作成するには利用規約とプライバシーポリシーに同意する必要があります。",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsRegistering(true);
      
      // 登録要求を送信
      const registerResponse = await apiRequest("POST", "/api/auth/register", {
        username: registerUsername,
        password: registerPassword,
      });
      
      console.log("Register response:", registerResponse);
      
      // 認証状態をすぐに更新（キャッシュをクリアして最新データを取得）
      queryClient.resetQueries({ queryKey: ["/api/auth/me"] });
      
      // 登録後の検証として明示的にユーザー情報を取得 
      const userData = await verifyAuthState();
      console.log("Auth verification after registration:", userData);
      
      if (!userData) {
        console.error("登録に成功したのにユーザー情報の取得に失敗しました");
        throw new Error("登録後の認証検証に失敗しました。");
      }
      
      // セッションIDを表示（デバッグ用）
      console.log("登録成功: セッションID =", registerResponse.sessionId || "不明");
      
      toast({
        title: "登録成功",
        description: "アカウントが作成されました。自動的にログインしました。",
        duration: 2000, // 表示時間を2秒に設定
      });
      
      // 少し遅延してから画面遷移（トーストメッセージを確認できるよう）
      setTimeout(() => navigate("/"), 1000);
    } catch (error) {
      toast({
        title: "登録失敗",
        description: "アカウントの作成に失敗しました。別のユーザー名を試してください。",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="flex justify-center mb-4">
            <img src={loopediaLogo} alt="Loopedia" className="h-12" />
          </CardTitle>
          <CardDescription>
            アカウントでログインまたは新規登録してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">ログイン</TabsTrigger>
              <TabsTrigger value="register">新規登録</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">ユーザー名</Label>
                  <Input
                    id="login-username"
                    placeholder="username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">パスワード</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-username">ユーザー名</Label>
                  <Input
                    id="register-username"
                    placeholder="username"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">パスワード</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">パスワード（確認）</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    <span className="text-sm text-muted-foreground">
                      <Link to="/terms-of-service" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        利用規約
                      </Link>
                      と
                      <Link to="/privacy-policy" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                        プライバシーポリシー
                      </Link>
                      に同意します
                    </span>
                  </label>
                </div>
                
                <Button
                  type="submit"
                  className="w-full mt-4"
                  disabled={isRegistering}
                >
                  {isRegistering ? "登録中..." : "アカウント作成"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="px-8 py-4 flex justify-center">
          <div className="text-center mt-2">
            <p className="text-sm text-muted-foreground">
              <span>テスト用アカウント: </span>
              <span className="font-semibold">admin</span> / <span className="font-semibold">password</span>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

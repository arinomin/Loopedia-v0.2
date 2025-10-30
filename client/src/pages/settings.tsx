import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(res => res.json()),
    staleTime: Infinity,
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      try {
        const response = await apiRequest("POST", "/api/auth/change-password", data);
        return await response.json().catch(() => ({}));
      } catch (error) {
        console.log("Password change error:", error);
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "パスワードを変更しました",
        description: "新しいパスワードでログインできます",
        variant: "default",
        duration: 1000,
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword) {
      toast({
        title: "入力エラー",
        description: "現在のパスワードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (!newPassword) {
      toast({
        title: "入力エラー",
        description: "新しいパスワードを入力してください",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "入力エラー",
        description: "パスワードは8文字以上である必要があります",
        variant: "destructive", 
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "入力エラー",
        description: "新しいパスワードと確認用パスワードが一致しません",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8 px-4 md:px-6">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">設定</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>
              現在ログイン中のアカウント情報
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label className="text-sm text-muted-foreground">ユーザー名</Label>
                <p className="text-base font-medium" data-testid="text-username">@{currentUser.username}</p>
              </div>
              {currentUser.nickname && (
                <div>
                  <Label className="text-sm text-muted-foreground">ニックネーム</Label>
                  <p className="text-base font-medium" data-testid="text-nickname">{currentUser.nickname}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>パスワード変更</CardTitle>
            <CardDescription>
              アカウントのパスワードを変更します。
              定期的なパスワード変更を推奨します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">現在のパスワード</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="現在のパスワードを入力"
                  data-testid="input-current-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">新しいパスワード</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新しいパスワードを入力（8文字以上）"
                  data-testid="input-new-password"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="新しいパスワードを再入力"
                  data-testid="input-confirm-password"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-4"
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⋯</span>
                    変更中...
                  </>
                ) : (
                  <>
                    <LockKeyhole className="h-4 w-4 mr-2" />
                    パスワードを変更
                  </>
                )}
              </Button>
              
              {changePasswordMutation.isSuccess && (
                <div className="flex items-center text-sm text-green-600 mt-2">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  パスワードを変更しました
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

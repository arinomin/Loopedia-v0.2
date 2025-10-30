import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  username: z.string().min(3, { message: "ユーザー名は3文字以上必要です" }),
  password: z.string().min(6, { message: "パスワードは6文字以上必要です" }),
});

const registerSchema = z.object({
  username: z.string().min(3, { message: "ユーザー名は3文字以上必要です" }),
  password: z.string().min(6, { message: "パスワードは6文字以上必要です" }),
  confirmPassword: z.string().min(6, { message: "パスワードは6文字以上必要です" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  title?: string;
  description?: string;
}

export function LoginModal({ 
  isOpen, 
  onClose, 
  onLoginSuccess,
  title = "ログインまたは新規登録", 
  description = "プリセットの保存にはアカウントが必要です。" 
}: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // ログインフォーム
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  // 新規登録フォーム
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      // ユーザー情報を更新
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "ログイン成功",
        description: "ようこそ、" + data.username + "さん！",
      });
      
      // 閉じる前に成功コールバックを実行
      onLoginSuccess();
      
      // モーダルを閉じる
      onClose();
    } catch (error) {
      toast({
        title: "ログイン失敗",
        description: "ユーザー名またはパスワードが正しくありません。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        username: data.username,
        password: data.password,
      });
      
      // 自動的にログイン
      await apiRequest("POST", "/api/auth/login", {
        username: data.username,
        password: data.password,
      });
      
      // ユーザー情報を更新
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      toast({
        title: "アカウント作成成功",
        description: "アカウントが作成され、自動的にログインしました。",
      });
      
      // 閉じる前に成功コールバックを実行
      onLoginSuccess();
      
      // モーダルを閉じる
      onClose();
    } catch (error) {
      toast({
        title: "アカウント作成失敗",
        description: "ユーザー名が既に使用されているか、サーバーエラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="register">新規登録</TabsTrigger>
          </TabsList>
          
          {/* ログインタブ */}
          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4 py-2">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ユーザー名</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} autoComplete="current-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* 新規登録タブ */}
          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4 py-2">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ユーザー名</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード（確認）</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "登録中..." : "新規登録"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
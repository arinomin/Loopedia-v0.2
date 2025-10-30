import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Contact = {
  id: number;
  name: string;
  userId: number;
  contactMethod: string;
  contactDetail: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  replies: Reply[];
};

type Reply = {
  id: number;
  contactId: number;
  message: string;
  isAdmin: boolean;
  createdAt: string;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const getCategoryLabel = (category: string) => {
  const categories: Record<string, string> = {
    question: "使い方・機能に関する質問",
    bug: "不具合・エラーの報告",
    feature: "機能改善・追加の要望",
    account: "アカウントに関する問題",
    other: "その他"
  };
  return categories[category] || category;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 hover:bg-blue-50">新規</Badge>;
    case "in_progress":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 hover:bg-yellow-50">対応中</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-green-50 text-green-600 hover:bg-green-50">完了</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function ContactReplyPage() {
  const [_, params] = useRoute<{ id: string }>('/contact-reply/:id');
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [replyText, setReplyText] = useState('');
  const contactId = params ? parseInt(params.id) : null;
  const queryClient = useQueryClient();
  
  // ユーザー情報を取得
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.json()),
    staleTime: Infinity
  });
  
  // お問い合わせ詳細を取得
  const { data: contact, isLoading: isContactLoading, error: contactError } = useQuery({
    queryKey: ["/api/contacts", contactId],
    queryFn: () => fetch(`/api/contacts/${contactId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch contact details');
        return res.json();
      }),
    enabled: !!contactId && !!currentUser,
  });
  
  // 返信を送信するミューテーション
  const replyMutation = useMutation({
    mutationFn: async (data: { reply: string }) => {
      const response = await fetch(`/api/contacts/${contactId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '返信の送信に失敗しました');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", contactId] });
      queryClient.invalidateQueries({ queryKey: ["/api/contacts/my"] });
      
      toast({
        title: "返信が送信されました",
        description: "お問い合わせに返信しました。",
      });
      
      // お問い合わせ詳細ページに戻る
      setTimeout(() => {
        navigate(`/contact-history?contactId=${contactId}`);
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "エラー",
        description: error.message || "返信の送信中にエラーが発生しました。",
        variant: "destructive"
      });
    },
  });
  
  // ログインしていない場合、ログインページにリダイレクト
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, isUserLoading, navigate]);

  const handleSubmit = () => {
    if (!replyText.trim()) {
      toast({
        title: "入力エラー",
        description: "返信内容を入力してください",
        variant: "destructive"
      });
      return;
    }
    
    replyMutation.mutate({ reply: replyText });
  };

  if (isUserLoading || (isContactLoading && !contactError)) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (contactError) {
    return (
      <div className="container max-w-4xl py-12 px-4">
        <Card className="text-center p-6">
          <CardHeader>
            <CardTitle>お問い合わせが見つかりません</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <p className="mb-4">指定されたお問い合わせは存在しないか、アクセス権限がありません。</p>
            <Button onClick={() => navigate("/contact-history")}>お問い合わせ履歴に戻る</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => navigate(`/contact-history`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          お問い合わせ履歴に戻る
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold">お問い合わせに返信する</h1>
      </div>

      {contact && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">
                お問い合わせ #{contact.id}
              </CardTitle>
              {getStatusBadge(contact.status)}
            </div>
            <CardDescription>
              {getCategoryLabel(contact.category)} - {formatDate(contact.createdAt)}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">元のお問い合わせ内容</p>
              <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap">{contact.message}</div>
            </div>
            
            {contact.replies && contact.replies.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">これまでの返信</p>
                <div className="space-y-4 max-h-[300px] overflow-y-auto p-2">
                  {contact.replies.map((reply: Reply) => (
                    <div 
                      key={reply.id} 
                      className={`p-4 rounded-md ${reply.isAdmin ? 'bg-primary/10 ml-4' : 'bg-muted/50 mr-4'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">
                          {reply.isAdmin ? '管理者' : 'あなた'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">返信内容</p>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="返信内容を入力してください"
                rows={5}
                disabled={replyMutation.isPending}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(`/contact-history`)}
              disabled={replyMutation.isPending}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={replyMutation.isPending}
              className="flex items-center"
            >
              {replyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  返信を送信
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
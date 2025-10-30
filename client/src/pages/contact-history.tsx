import React, { useState, useCallback, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, CheckCircle, Loader2, AlertCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function ContactHistoryPage() {
  const [location, navigate] = useLocation();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // URLからcontactIdパラメータを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const contactId = params.get('contactId');
    if (contactId) {
      setSelectedContactId(parseInt(contactId));
    }
  }, []);

  // ユーザー情報を取得
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.json()),
    staleTime: Infinity
  });

  // お問い合わせ一覧を取得 (ログインユーザーの問い合わせのみ)
  const { data: contacts, isLoading: isContactsLoading, error: contactsError, refetch: refetchContacts } = useQuery({
    queryKey: ["/api/contacts/my"],
    queryFn: () => fetch("/api/contacts/my", { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch contacts');
        return res.json();
      }),
    enabled: !!currentUser,
    select: (data) => {
      // サーバーサイドでフィルタリングするが、念のため
      if (currentUser) {
        return data.filter((contact: Contact) => contact.userId === currentUser.id);
      }
      return data;
    }
  });

  // 問い合わせリストを更新する関数
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchContacts();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // 選択されたお問い合わせの詳細を取得
  const { data: selectedContact, isLoading: isContactDetailLoading, error: contactDetailError, refetch: refetchContact } = useQuery({
    queryKey: ["/api/contacts", selectedContactId],
    queryFn: () => fetch(`/api/contacts/${selectedContactId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch contact details');
        return res.json();
      }),
    enabled: !!selectedContactId,
  });

  useEffect(() => {
    if (selectedContactId) {
      refetchContact();
    }
  }, [selectedContactId, refetchContact]);


  const handleContactSelect = useCallback((contactId: number) => {
    setSelectedContactId(contactId);
  }, []);

  // お問い合わせ詳細に戻る
  const handleBackToList = useCallback(() => {
    setSelectedContactId(null);
  }, []);

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container max-w-4xl py-12 px-4">
        <Card className="text-center p-6">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">お問い合わせ履歴を閲覧するには、ログインしてください。</p>
            <Button onClick={() => navigate("/login")}>ログイン</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="flex flex-col mb-6">
        <div className="flex items-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => navigate("/contact")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            お問い合わせに戻る
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="ml-1 hidden md:inline">更新</span>
          </Button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">お問い合わせ履歴</h1>
      </div>

      {selectedContactId ? (
        // お問い合わせ詳細表示
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToList}
                    className="-ml-2 text-muted-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    一覧に戻る
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (selectedContactId) {
                        await queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedContactId] });
                        await refetchContact();
                      }
                    }}
                    disabled={isContactDetailLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isContactDetailLoading ? "animate-spin" : ""}`} />
                    <span className="ml-1 sr-only md:not-sr-only">更新</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  {isContactDetailLoading ? (
                    <div className="h-6 w-40 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <CardTitle className="text-xl">
                      お問い合わせ詳細 {selectedContact && `#${selectedContact.id}`}
                    </CardTitle>
                  )}
                  {selectedContact && (
                    <div className="ml-2 shrink-0">
                      {getStatusBadge(selectedContact.status)}
                    </div>
                  )}
                </div>
              </div>
          </CardHeader>

          <CardContent>
            {isContactDetailLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                <div className="h-20 bg-muted animate-pulse rounded"></div>
              </div>
            ) : contactDetailError ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>お問い合わせの読み込みに失敗しました。</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => navigate("/contact-history")}
                >
                  再読み込み
                </Button>
              </div>
            ) : selectedContact && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">お問い合わせ日時</p>
                    <p>{formatDate(selectedContact.createdAt)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">カテゴリー</p>
                    <p>{getCategoryLabel(selectedContact.category)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">お問い合わせ内容</p>
                  <div className="p-4 bg-muted/50 rounded-md whitespace-pre-wrap">{selectedContact.message}</div>
                </div>

                {selectedContact.replies?.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">返信履歴</h3>
                    <div className="space-y-4">
                      {selectedContact.replies.map((reply: Reply, index: number) => (
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
                ) : (
                  <div className="text-center p-6 border rounded-md border-dashed">
                    <p className="text-muted-foreground">まだ返信はありません</p>
                  </div>
                )}

                {/* 返信フォーム */}
                {selectedContact.status !== "completed" && (
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => navigate(`/contact-reply/${selectedContact.id}`)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      返信する
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // お問い合わせ一覧表示
        <Card>
          <CardHeader>
            <CardTitle>問い合わせ一覧</CardTitle>
            <CardDescription>
              過去のお問い合わせとその回答履歴を確認できます
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isContactsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 border rounded-md animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : contactsError ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>お問い合わせの読み込みに失敗しました。</p>
                <Button variant="outline" className="mt-4" onClick={() => refetchContacts()}>
                  再読み込み
                </Button>
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact: Contact) => (
                  <div 
                    key={contact.id} 
                    className="p-4 border rounded-md hover:border-primary cursor-pointer transition-colors"
                    onClick={() => handleContactSelect(contact.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium mb-1 line-clamp-1">
                          {getCategoryLabel(contact.category)}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {contact.message}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        {getStatusBadge(contact.status)}
                        <span className="text-xs text-muted-foreground mt-1">
                          {formatDate(contact.createdAt)}
                        </span>
                      </div>
                    </div>
                    {contact.replies && contact.replies.length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          返信 {contact.replies.length}件
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-md">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg mb-1">お問い合わせはまだありません</h3>
                <p className="text-muted-foreground">
                  お問い合わせフォームから初めてのお問い合わせをしてみましょう
                </p>
                <Button className="mt-4" onClick={() => navigate("/contact")}>
                  お問い合わせをする
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
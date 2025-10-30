import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { News, InsertNews, Title, InsertTitle, UserTitle, InsertUserTitle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  UserX, 
  Shield, 
  AlertTriangle, 
  Settings, 
  Mail, 
  Loader2,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  KeyRound,
  Newspaper,
  Plus,
  Trash,
  PinOff,
  Pencil,
  Pin,
  Award
} from "lucide-react";

// 管理者用ページコンポーネント
export default function AdminPanel() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("users");

  // タブが切り替わったときに対応するデータを更新
  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // お問い合わせタブが選択されたらデータを更新
    if (value === "inquiries") {
      refreshContacts();
    } else if (value === "users") {
      refreshUsers();
    } else if (value === "system") {
      refreshStats();
    } else if (value === "news") {
      refetchNews();
    } else if (value === "titles") {
      refetchTitles(); // 称号タブが選択されたら称号一覧を更新
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [openNewsDialog, setOpenNewsDialog] = useState(false);
  const [openNewsDetailDialog, setOpenNewsDetailDialog] = useState(false);
  const [deleteNewsConfirmOpen, setDeleteNewsConfirmOpen] = useState(false);
  
  // 称号管理用の状態
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [openTitleDialog, setOpenTitleDialog] = useState(false);
  const [openTitleDetailDialog, setOpenTitleDetailDialog] = useState(false);
  const [deleteTitleConfirmOpen, setDeleteTitleConfirmOpen] = useState(false);
  const [openGrantTitleDialog, setOpenGrantTitleDialog] = useState(false);
  const [userList, setUserList] = useState<any[]>([]);
  const [contactList, setContactList] = useState<any[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [userSortField, setUserSortField] = useState<string>("id");
  const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">("asc");
  const [contactFilter, setContactFilter] = useState<string>("all"); // all, new, in_progress, resolved
  const [userTitles, setUserTitles] = useState<any[]>([]); // ユーザーが持っている称号リスト
  const [availableTitles, setAvailableTitles] = useState<any[]>([]); // 付与可能な称号リスト

  // 現在のユーザー情報を取得して管理者権限をチェック
  const { data: currentUser, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.json()),
  });

  // ユーザー削除のミューテーション
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `ユーザー削除エラー: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "削除完了",
        description: "ユーザーを削除しました",
      });
      // ユーザー一覧を更新
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "削除エラー",
        description: error.message || "ユーザーの削除に失敗しました",
        variant: "destructive"
      });
    }
  });

  // ユーザー一覧を取得
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        // APIからユーザー一覧を取得
        const res = await fetch("/api/admin/users", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();
        console.log("Users data from API:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast({
          title: "エラー",
          description: "ユーザー一覧の取得に失敗しました。",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !isUserLoading && currentUser?.username === "admin",
  });

  // ユーザーデータが変更されたら状態を更新
  useEffect(() => {
    if (users) {
      setUserList(users);
    }
  }, [users]);

  // お問い合わせ一覧
  const { data: contacts, isLoading: isContactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ["/api/admin/contacts"],
    queryFn: async () => {
      try {
        // APIからお問い合わせデータを取得（標準のfetch APIを使用）
        const res = await fetch("/api/admin/contacts", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Contacts data from API:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch contacts:", error);
        toast({
          title: "エラー",
          description: "お問い合わせ一覧の取得に失敗しました。",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !isUserLoading && currentUser?.username === "admin",
  });

  // お問い合わせデータが変更されたら状態を更新
  useEffect(() => {
    if (contacts) {
      console.log("Contacts loaded:", contacts);
      // 各ステータスの問い合わせ数を確認
      const newCount = contacts.filter((c: any) => c.status === "new").length;
      const inProgressCount = contacts.filter((c: any) => c.status === "in_progress").length;
      const resolvedCount = contacts.filter((c: any) => c.status === "resolved").length;
      console.log(`Contact counts - new: ${newCount}, in_progress: ${inProgressCount}, resolved: ${resolvedCount}`);
      setContactList(contacts);
    }
  }, [contacts]);

  // システム統計情報
  // ニュース一覧を取得
  const { data: newsItems, isLoading: isNewsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["/api/news"],
    queryFn: async () => {
      try {
        // APIからニュース一覧を取得
        const res = await fetch("/api/news", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });
        
        if (!res.ok) {
          throw new Error(`APIエラー: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error('ニュースデータの取得エラー:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });
  
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        // APIから統計情報を取得
        const res = await fetch("/api/admin/stats", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        console.log("Stats data from API:", data);
        return data;
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        toast({
          title: "エラー",
          description: "統計情報の取得に失敗しました。",
          variant: "destructive",
        });
        return {
          totalUsers: 0,
          activeUsers: 0,
          totalPresets: 0,
          newPresets24h: 0,
          totalComments: 0,
          presetsByType: {
            INPUT_FX: 0,
            TRACK_FX: 0
          }
        };
      }
    },
    enabled: !isUserLoading && currentUser?.username === "admin",
  });

  // ユーザー削除のミューテーション (Replaced with more robust implementation above)

  // ユーザー認証状態更新のミューテーション
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: number, isVerified: boolean }) => {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `ユーザー認証状態の更新に失敗しました: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "更新完了",
        description: data.isVerified ? "ユーザーを認証しました" : "ユーザーの認証を解除しました",
      });
      // ユーザー一覧を更新
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: Error) => {
      toast({
        title: "更新エラー",
        description: error.message || "ユーザーの認証状態の更新に失敗しました",
        variant: "destructive"
      });
    }
  });
  
  // パスワードリセットのための状態管理
  const [tempPassword, setTempPassword] = useState<string>("");
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false);

  // パスワードリセットのミューテーション
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "パスワードリセットに失敗しました" }));
        throw new Error(errorData.message || `パスワードリセットに失敗しました: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      setShowPasswordResetDialog(true);
      
      toast({
        title: "パスワードリセット完了",
        description: "一時パスワードが生成されました",
      });
    },
    onError: (error: Error) => {
      console.error('Password reset error:', error);
      toast({
        title: "エラー",
        description: error.message || "パスワードリセットに失敗しました",
        variant: "destructive",
      });
    }
  });

  // お問い合わせステータス更新のミューテーション
  const updateContactStatusMutation = useMutation({
    mutationFn: async ({ contactId, status }: { contactId: number, status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/contacts/${contactId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "更新成功",
        description: "お問い合わせのステータスが更新されました。",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
    },
    onError: (error) => {
      toast({
        title: "更新エラー",
        description: "ステータスの更新に失敗しました。",
        variant: "destructive",
      });
    }
  });

  // お問い合わせへの返信ミューテーション
  const replyToContactMutation = useMutation({
    mutationFn: async ({ contactId, reply }: { contactId: number, reply: string }) => {
      const res = await apiRequest("POST", `/api/admin/contacts/${contactId}/reply`, { reply });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "返信成功",
        description: "お問い合わせへの返信が送信されました。",
      });
      setOpenContactDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contacts"] });
    },
    onError: (error) => {
      toast({
        title: "返信エラー",
        description: "返信の送信に失敗しました。",
        variant: "destructive",
      });
    }
  });
  
  // ニュース作成用のミューテーション
  const createNewsMutation = useMutation({
    mutationFn: async (newsData: InsertNews) => {
      console.log('ニュース作成リクエスト:', newsData);
      const res = await apiRequest("POST", "/api/admin/news", newsData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "ニュースの作成に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('ニュース作成成功:', data);
      toast({
        title: "ニュース作成完了",
        description: "新しいニュースが作成されました。",
      });
      setOpenNewsDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error) => {
      console.error('ニュース作成エラー:', error);
      toast({
        title: "作成エラー",
        description: error instanceof Error ? error.message : "ニュースの作成中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  });
  
  // ニュース更新用のミューテーション
  const updateNewsMutation = useMutation({
    mutationFn: async ({ newsId, data }: { newsId: number, data: Partial<InsertNews> }) => {
      console.log('ニュース更新リクエスト:', { newsId, data });
      const res = await apiRequest("PUT", `/api/admin/news/${newsId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "ニュースの更新に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('ニュース更新成功:', data);
      toast({
        title: "ニュース更新完了",
        description: "ニュースが更新されました。",
      });
      setOpenNewsDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error) => {
      console.error('ニュース更新エラー:', error);
      toast({
        title: "更新エラー",
        description: error instanceof Error ? error.message : "ニュースの更新中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  });

  // ニュース削除用のミューテーション
  const deleteNewsMutation = useMutation({
    mutationFn: async (newsId: number) => {
      console.log('ニュース削除リクエスト:', newsId);
      const res = await apiRequest("DELETE", `/api/admin/news/${newsId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "ニュースの削除に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('ニュース削除成功:', data);
      toast({
        title: "ニュース削除完了",
        description: "ニュースが削除されました。",
      });
      setDeleteNewsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
    },
    onError: (error) => {
      console.error('ニュース削除エラー:', error);
      toast({
        title: "削除エラー",
        description: "ニュースの削除中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  });
  
  // 称号作成用のミューテーション
  const createTitleMutation = useMutation({
    mutationFn: async (titleData: InsertTitle) => {
      console.log('称号作成リクエスト:', titleData);
      const res = await apiRequest("POST", "/api/admin/titles", titleData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "称号の作成に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('称号作成成功:', data);
      toast({
        title: "称号作成完了",
        description: "新しい称号が作成されました",
      });
      setOpenTitleDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/titles"] });
    },
    onError: (error) => {
      console.error('称号作成エラー:', error);
      toast({
        title: "作成エラー",
        description: error instanceof Error ? error.message : "称号の作成中にエラーが発生しました",
        variant: "destructive",
      });
    }
  });
  
  // 称号更新用のミューテーション
  const updateTitleMutation = useMutation({
    mutationFn: async ({ titleId, data }: { titleId: number, data: Partial<InsertTitle> }) => {
      console.log('称号更新リクエスト:', { titleId, data });
      const res = await apiRequest("PUT", `/api/admin/titles/${titleId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "称号の更新に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('称号更新成功:', data);
      toast({
        title: "称号更新完了",
        description: "称号が更新されました",
      });
      setOpenTitleDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/titles"] });
    },
    onError: (error) => {
      console.error('称号更新エラー:', error);
      toast({
        title: "更新エラー",
        description: error instanceof Error ? error.message : "称号の更新中にエラーが発生しました",
        variant: "destructive",
      });
    }
  });
  
  // 称号削除用のミューテーション
  const deleteTitleMutation = useMutation({
    mutationFn: async (titleId: number) => {
      console.log('称号削除リクエスト:', titleId);
      const res = await apiRequest("DELETE", `/api/admin/titles/${titleId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "称号の削除に失敗しました");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log('称号削除成功:', data);
      toast({
        title: "称号削除完了",
        description: "称号が削除されました",
      });
      setDeleteTitleConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/titles"] });
    },
    onError: (error) => {
      console.error('称号削除エラー:', error);
      toast({
        title: "削除エラー",
        description: error instanceof Error ? error.message : "称号の削除中にエラーが発生しました",
        variant: "destructive",
      });
    }
  });
  
  // 称号一覧の取得
  const { data: titlesData, isLoading: isTitlesLoading, refetch: refetchTitles } = useQuery({
    queryKey: ["/api/titles"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/titles");
        if (!res.ok) throw new Error("称号一覧の取得に失敗しました");
        return res.json();
      } catch (error) {
        console.error("称号一覧取得エラー:", error);
        toast({
          title: "エラー",
          description: error instanceof Error ? error.message : "称号一覧の取得に失敗しました",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  // ユーザーに称号を付与するミューテーション
  const grantUserTitleMutation = useMutation({
    mutationFn: async ({ userId, titleId }: { userId: number, titleId: number }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/titles/${titleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "称号付与完了",
        description: "ユーザーに称号が付与されました。",
      });
      // ユーザーの称号リストを更新
      if (selectedUser) {
        fetchUserTitles(selectedUser.id);
      }
    },
    onError: (error) => {
      console.error('称号付与エラー:', error);
      toast({
        title: "エラー",
        description: "称号の付与中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  });
  
  // ユーザーから称号を剥奪するミューテーション
  const revokeUserTitleMutation = useMutation({
    mutationFn: async ({ userId, titleId }: { userId: number, titleId: number }) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}/titles/${titleId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "称号剥奪完了",
        description: "ユーザーから称号が剥奪されました。",
      });
      // ユーザーの称号リストを更新
      if (selectedUser) {
        fetchUserTitles(selectedUser.id);
      }
    },
    onError: (error) => {
      console.error('称号剥奪エラー:', error);
      toast({
        title: "エラー",
        description: "称号の剥奪中にエラーが発生しました。",
        variant: "destructive",
      });
    }
  });

  // ユーザー一覧更新処理
  const refreshUsers = async () => {
    try {
      // ローディング状態を表示
      toast({
        title: "データ取得中",
        description: "ユーザーデータを取得しています...",
      });

      // APIから直接データを取得
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();
      console.log('ユーザーデータを取得しました:', data);

      // データを更新
      setUserList(data);

      // キャッシュも更新
      queryClient.setQueryData(['/api/admin/users'], data);

      toast({
        title: "更新完了",
        description: `ユーザー一覧を更新しました (${data.length}人)`,
      });
    } catch (error) {
      console.error('ユーザーデータの取得エラー:', error);
      toast({
        title: "更新エラー",
        description: `ユーザー一覧の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  // お問い合わせ一覧更新処理
  const refreshContacts = async () => {
    try {
      // ローディング状態を表示（短い操作の場合はコメントアウトしてもよい）
      toast({
        title: "データ取得中",
        description: "お問い合わせデータを取得しています...",
      });

      // React QueryのrefetchContacts関数を使用して最新データを取得
      await refetchContacts();

      // 成功メッセージ
      toast({
        title: "更新完了",
        description: `お問い合わせ一覧を更新しました (${contacts?.length || 0}件)`,
      });
    } catch (error) {
      console.error('お問い合わせデータの取得エラー:', error);
      toast({
        title: "更新エラー",
        description: `お問い合わせ一覧の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  // システム統計情報更新処理
  const refreshStats = async () => {
    try {
      // ローディング状態を表示
      toast({
        title: "データ取得中",
        description: "システム統計データを取得しています...",
      });

      // APIから直接データを取得
      const response = await fetch('/api/admin/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }

      const data = await response.json();
      console.log('システム統計データを取得しました:', data);

      // キャッシュも更新
      queryClient.setQueryData(['/api/admin/stats'], data);

      toast({
        title: "更新完了",
        description: "システム統計情報を更新しました",
      });
    } catch (error) {
      console.error('システム統計データの取得エラー:', error);
      toast({
        title: "更新エラー",
        description: `システム統計情報の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive",
      });
    }
  };

  // 管理者権限のチェック
  useEffect(() => {
    if (!isUserLoading && currentUser && currentUser.username !== "admin") {
      toast({
        title: "権限エラー",
        description: "このページへのアクセス権限がありません。",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [currentUser, isUserLoading, navigate, toast]);

  const handleDeleteUser = async (userId: number) => {
    try {
      setOpenUserDialog(false); // ダイアログを閉じる
      toast({
        title: "削除処理中",
        description: "ユーザーを削除しています...",
      });
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "削除エラー",
        description: error instanceof Error ? error.message : "ユーザーの削除に失敗しました",
        variant: "destructive"
      });
    }
  };
  
  // 特定ユーザーの称号リストを取得する
  const fetchUserTitles = async (userId: number) => {
    try {
      console.log(`ユーザーID=${userId}の称号情報を取得中...`);
      const response = await fetch(`/api/users/${userId}/titles`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `エラー: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`ユーザーの称号情報を取得:`, data);
      setUserTitles(Array.isArray(data) ? data : []);
      
      // 付与可能な称号リストを取得（既に持っている称号を除外）
      if (titlesData) {
        const currentTitleIds = Array.isArray(data) ? data.map((title: any) => title.id) : [];
        const available = Array.isArray(titlesData) 
          ? titlesData.filter((title: any) => !currentTitleIds.includes(title.id))
          : [];
        console.log(`付与可能な称号:`, available);
        setAvailableTitles(available);
      } else {
        console.log('称号マスターデータがまだロードされていません');
        setAvailableTitles([]);
      }
    } catch (error) {
      console.error("ユーザー称号の取得エラー:", error);
      setUserTitles([]);
      setAvailableTitles([]);
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "ユーザーの称号情報の取得に失敗しました",
        variant: "destructive"
      });
    }
  };
  
  // ユーザーに称号を付与する
  const handleGrantUserTitle = (userId: number, titleId: number) => {
    grantUserTitleMutation.mutate({ userId, titleId });
  };
  
  // ユーザーから称号を剥奪する
  const handleRevokeUserTitle = (userId: number, titleId: number) => {
    revokeUserTitleMutation.mutate({ userId, titleId });
  };
  


  const handleUpdateContactStatus = async (contactId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`エラー: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "更新完了",
          description: "ステータスを更新しました",
        });
      }
    } catch (error) {
      console.error("Failed to update contact status:", error);
      toast({
        title: "更新エラー",
        description: `ステータスの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: number, isVerified: boolean) => {
    try {
      await verifyUserMutation.mutateAsync({ userId, isVerified });
    } catch (error) {
      console.error("Failed to update user verification status:", error);
    }
  };
  
  const handleResetPassword = async (userId: number) => {
    try {
      toast({
        title: "パスワードリセット中",
        description: "ユーザーのパスワードをリセットしています...",
      });
      await resetPasswordMutation.mutateAsync(userId);
    } catch (error) {
      console.error("パスワードリセットエラー:", error);
      toast({
        title: "リセットエラー",
        description: error instanceof Error ? error.message : "パスワードのリセットに失敗しました",
        variant: "destructive"
      });
    }
  };

  // ユーザーリストのソート処理
  const handleSortUsers = (field: string) => {
    if (userSortField === field) {
      // 同じフィールドをクリックした場合は昇順・降順を切り替える
      setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc");
    } else {
      // 異なるフィールドをクリックした場合は、そのフィールドで昇順ソート
      setUserSortField(field);
      setUserSortDirection("asc");
    }
  };

  // フィルタリングとソートを適用したユーザーリスト
  const filteredAndSortedUsers = users
    ?.filter((user: any) => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.nickname && user.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a: any, b: any) => {
      // 選択されたフィールドに基づいてソート
      let comparison = 0;
      switch (userSortField) {
        case "id":
          comparison = a.id - b.id;
          break;
        case "username":
          comparison = a.username.localeCompare(b.username);
          break;
        case "nickname":
          comparison = (a.nickname || "").localeCompare(b.nickname || "");
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "presetCount":
          comparison = (a.presetCount || 0) - (b.presetCount || 0);
          break;
        case "followersCount":
          comparison = (a.followersCount || 0) - (b.followersCount || 0);
          break;
        default:
          comparison = a.id - b.id;
      }
      // 降順の場合は結果を反転
      return userSortDirection === "asc" ? comparison : -comparison;
    });

  // ステータスに基づいてフィルタリングされたお問い合わせリスト
  const filteredContacts = contacts
    ?.filter((contact: any) => {
      // ステータスフィルターの適用
      if (contactFilter !== "all") {
        console.log(`フィルタリング: ID=${contact.id}, status=${contact.status}, filter=${contactFilter}`);
        
        // ステータスの一致確認 (大文字小文字を区別しない)
        const contactStatus = String(contact.status).toLowerCase();
        const filterValue = contactFilter.toLowerCase();
        
        return contactStatus === filterValue;
      }
      return true;
    })
    .filter((contact: any) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.contactDetail && contact.contactDetail.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const renderUserDialog = () => {
    if (!selectedUser) return null;

    return (
      <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ユーザー詳細</DialogTitle>
            <DialogDescription>
              ユーザーID: {selectedUser.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                {selectedUser.avatarUrl && <AvatarImage src={selectedUser.avatarUrl} />}
                <AvatarFallback>{selectedUser.nickname?.[0] || selectedUser.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.nickname || selectedUser.username}</h3>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p><span className="font-medium">登録日:</span> {new Date(selectedUser.createdAt).toLocaleDateString("ja-JP")}</p>
              <p><span className="font-medium">投稿数:</span> {selectedUser.presetCount || 0}</p>
              <p><span className="font-medium">コメント数:</span> {selectedUser.commentCount || 0}</p>
              <p><span className="font-medium">いいね数:</span> {selectedUser.likeCount || 0}</p>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="is-verified"
                  checked={!!selectedUser.isVerified}
                  onCheckedChange={(checked) => {
                    setSelectedUser({
                      ...selectedUser,
                      isVerified: !!checked
                    });
                    handleVerifyUser(selectedUser.id, !!checked);
                  }}
                />
                <Label htmlFor="is-verified" className="font-medium">認証ユーザー</Label>
              </div>
              
              <div className="mt-4">
                <h4 className="font-semibold mb-2">ユーザー称号の管理</h4>
                <div className="flex flex-col space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">チェックを入れると称号が付与され、外すと称号が剥奪されます</p>
                  
                  <div className="max-h-[300px] overflow-y-auto p-2 border rounded">
                    <div className="space-y-3">
                      {titlesData?.map((title: Title) => {
                        // ユーザーが持っている称号かどうかを判定
                        const hasTitleAlready = userTitles.some(ut => ut.id === title.id);
                        
                        return (
                          <div key={title.id} className="flex items-start gap-2 pb-2 border-b last:border-b-0">
                            <Checkbox 
                              id={`user-title-${title.id}`}
                              checked={hasTitleAlready}
                              onCheckedChange={checked => {
                                if (checked) {
                                  handleGrantUserTitle(selectedUser.id, title.id);
                                } else {
                                  handleRevokeUserTitle(selectedUser.id, title.id);
                                }
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Label 
                                htmlFor={`user-title-${title.id}`} 
                                className={`font-medium ${hasTitleAlready ? 'text-primary' : ''}`}
                              >
                                {title.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">{title.description}</p>
                            </div>
                          </div>
                        );
                      })}
                      {!titlesData || titlesData.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-4">
                          利用可能な称号がありません
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpenUserDialog(false)}>閉じる</Button>
            
            <Button 
              variant="secondary" 
              onClick={() => handleResetPassword(selectedUser.id)}
              disabled={resetPasswordMutation.isPending}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              {resetPasswordMutation.isPending ? "処理中..." : "パスワードリセット"}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <UserX className="mr-2 h-4 w-4" />
                  ユーザー削除
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ユーザーを削除しますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    この操作は取り消せません。ユーザー「{selectedUser.nickname || selectedUser.username}」のアカウントと関連するすべてのデータが削除されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleDeleteUser(selectedUser.id);
                      setOpenUserDialog(false);
                    }}
                    className="bg-destructive text-destructive-foreground"
                  >
                    削除する
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  
  // パスワードリセットダイアログ
  const renderPasswordResetDialog = () => {
    return (
      <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>パスワードリセット完了</DialogTitle>
            <DialogDescription>
              一時パスワードが生成されました。ユーザーにこのパスワードを共有してください。
              ユーザーはログイン後、設定ページからパスワードを変更する必要があります。
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-md font-mono text-center">
            {tempPassword}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            ※ セキュリティ上の理由から、このパスワードはこの画面を閉じると二度と表示されません。
          </p>
          <DialogFooter>
            <Button 
              onClick={() => {
                try {
                  navigator.clipboard.writeText(tempPassword);
                  toast({
                    title: "コピー完了",
                    description: "一時パスワードをクリップボードにコピーしました",
                  });
                } catch (err) {
                  console.error("クリップボードへのコピーに失敗しました:", err);
                  toast({
                    title: "コピーエラー",
                    description: "一時パスワードをコピーできませんでした",
                    variant: "destructive"
                  });
                }
              }}
              className="mr-auto"
            >
              クリップボードにコピー
            </Button>
            <Button variant="outline" onClick={() => setShowPasswordResetDialog(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderContactDialog = () => {
    if (!selectedContact) return null;

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "new":
          return <Badge variant="default">新規</Badge>;
        case "in_progress":
          return <Badge variant="outline">対応中</Badge>;
        case "resolved":
          return <Badge variant="secondary">解決済み</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    };

    const handleSendReply = async () => {
      if (!replyText.trim()) {
        toast({
          title: "入力エラー",
          description: "返信内容を入力してください",
          variant: "destructive"
        });
        return;
      }

      setIsReplying(true);

      try {
        const response = await fetch(`/api/admin/contacts/${selectedContact.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reply: replyText }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`エラー: ${response.status}`);
        }

        const result = await response.json();

        // 返信を表示用のデータに追加
        if (selectedContact && result.success) {
          if (!selectedContact.replies) {
            selectedContact.replies = [];
          }
          selectedContact.replies.push(result.reply);
          setSelectedContact({ ...selectedContact });
        }

        // 返信成功後、テキストエリアをクリア
        setReplyText("");

        toast({
          title: "返信完了",
          description: "お問い合わせに返信しました",
        });
      } catch (error) {
        console.error("Failed to send reply:", error);
        toast({
          title: "返信エラー",
          description: `返信の送信に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
          variant: "destructive"
        });
      } finally {
        setIsReplying(false);
      }
    };

    return (
      <Dialog open={openContactDialog} onOpenChange={setOpenContactDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>お問い合わせ詳細</DialogTitle>
            <DialogDescription>
              問い合わせID: {selectedContact.id} | {new Date(selectedContact.createdAt).toLocaleString("ja-JP")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium">名前</h3>
                <p>{selectedContact.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">連絡先</h3>
                <p>{selectedContact.contactMethod === "twitter" ? "@" : ""}{selectedContact.contactDetail}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">カテゴリ</h3>
                <p>{getCategoryName(selectedContact.category)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">ステータス</h3>
                <div className="mt-1">
                  {getStatusBadge(selectedContact.status)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1">問い合わせ内容</h3>
              <div className="p-3 bg-muted rounded-md whitespace-pre-wrap">
                {selectedContact.message}
              </div>
            </div>

            {/* 返信履歴表示エリア */}
            {selectedContact.replies && selectedContact.replies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">返信履歴</h3>
                <div className="space-y-2">
                  {selectedContact.replies.map((reply: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-md whitespace-pre-wrap ${reply.isAdmin 
                        ? 'bg-primary text-primary-foreground ml-8' 
                        : 'bg-muted mr-8'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium">{reply.isAdmin ? '管理者' : 'ユーザー'}</span>
                        <span className="text-xs">{new Date(reply.createdAt).toLocaleString("ja-JP")}</span>
                      </div>
                      <div>{reply.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="status">ステータス変更</Label>
              <Select
                value={selectedContact.status}
                onValueChange={(value) => {
                  handleUpdateContactStatus(selectedContact.id, value);
                  // ステータスの変更を即座に反映させる
                  setSelectedContact({ ...selectedContact, status: value });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">新規</SelectItem>
                  <SelectItem value="in_progress">対応中</SelectItem>
                  <SelectItem value="resolved">解決済み</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="response">返信内容</Label>
              <Textarea
                id="response"
                placeholder="返信内容を入力..."
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              {selectedContact.status === "resolved" && (
                <p className="text-xs text-yellow-600 mt-1">
                  ※ すでに解決済みの問い合わせです。必要に応じてステータスを変更してください。
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setOpenContactDialog(false)}>閉じる</Button>
            <Button 
              onClick={handleSendReply} 
              disabled={isReplying || !replyText.trim()}
              className="sm:ml-auto"
            >
              {isReplying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>返信する</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // カテゴリ名を取得
  const getCategoryName = (categoryKey: string) => {
    const categories: Record<string, string> = {
      "question": "使い方・機能に関する質問",
      "bug": "不具合・エラーの報告",
      "feature": "機能改善・追加の要望",
      "account": "アカウントに関する問題",
      "other": "その他"
    };
    return categories[categoryKey] || categoryKey;
  };

  // 読み込み中の場合はローディング表示
  if (isUserLoading || (currentUser?.username === "admin" && (isUsersLoading || isContactsLoading || isStatsLoading))) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 管理者でない場合は表示しない（すでにリダイレクトしているはず）
  if (currentUser?.username !== "admin") {
    return <div className="p-8 text-center">このページにアクセスする権限がありません。</div>;
  }

  return (
    <div className="container py-8 px-4 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">管理パネル</h1>
        <p className="text-muted-foreground">管理者専用のコントロールパネルです。ユーザー管理やシステム設定を行えます。</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="users">
            <Shield className="mr-2 h-4 w-4" />
            ユーザー管理
          </TabsTrigger>
          <TabsTrigger value="news">
            <Newspaper className="mr-2 h-4 w-4" />
            ニュース管理
          </TabsTrigger>
          <TabsTrigger value="titles">
            <Award className="mr-2 h-4 w-4" />
            称号管理
          </TabsTrigger>
          <TabsTrigger value="inquiries">
            <Mail className="mr-2 h-4 w-4" />
            お問い合わせ
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="mr-2 h-4 w-4" />
            システム情報
          </TabsTrigger>
        </TabsList>

        {/* 検索フィールド */}
        {(activeTab === "users" || activeTab === "inquiries") && (
          <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === "users" ? "ユーザー名で検索..." : "お問い合わせ内容で検索..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
        )}

        {/* ユーザー管理タブ */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>登録ユーザー一覧</CardTitle>
                  <CardDescription>
                    全ユーザー: {users?.length || 0}人
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={refreshUsers}
                >
                  <RefreshCw className="h-4 w-4" />
                  更新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* データがロードされるまでデモユーザーを表示 */}
              {(!users || users.length === 0) && (
                <div className="py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center py-2 border-b">
                      <div className="h-6 w-6 mr-2 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}

              {isMobile ? (
                // モバイル表示
                <div className="space-y-4">
                  {filteredAndSortedUsers && filteredAndSortedUsers.length > 0 ? (
                    filteredAndSortedUsers.map((user: any) => (
                      <Card key={user.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.username}</div>
                                <div className="text-sm text-muted-foreground">{user.nickname || "-"}</div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenUserDialog(true);
                                fetchUserTitles(user.id);
                              }}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="text-sm grid grid-cols-2 gap-x-2 gap-y-1">
                            <div className="text-muted-foreground">ID:</div>
                            <div>{user.id}</div>
                            <div className="text-muted-foreground">登録日:</div>
                            <div>{new Date(user.createdAt).toLocaleDateString("ja-JP")}</div>
                            <div className="text-muted-foreground">投稿数:</div>
                            <div>{user.presetCount || 0}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      {searchQuery ? "検索条件に一致するユーザーはいません" : "ユーザーが登録されていません"}
                    </div>
                  )}
                </div>
              ) : (
                // デスクトップ表示
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("id")}
                      >
                        ID
                        {userSortField === "id" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("username")}
                      >
                        ユーザー名
                        {userSortField === "username" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("nickname")}
                      >
                        ニックネーム
                        {userSortField === "nickname" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("createdAt")}
                      >
                        登録日
                        {userSortField === "createdAt" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("presetCount")}
                      >
                        投稿数
                        {userSortField === "presetCount" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSortUsers("followersCount")}
                      >
                        フォロワー数
                        {userSortField === "followersCount" && (
                          <span className="ml-1">{userSortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUsers && filteredAndSortedUsers.length > 0 ? (
                      filteredAndSortedUsers.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-6 w-6 mr-2">
                                {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                                <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              {user.username}
                            </div>
                          </TableCell>
                          <TableCell>{user.nickname || "-"}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleDateString("ja-JP")}</TableCell>
                          <TableCell>{user.presetCount || 0}</TableCell>
                          <TableCell>{user.followersCount || 0}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenUserDialog(true);
                                fetchUserTitles(user.id);
                              }}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          {searchQuery ? "検索条件に一致するユーザーはいません" : "ユーザーが登録されていません"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* お問い合わせ管理タブ */}
        <TabsContent value="inquiries" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>お問い合わせ一覧</CardTitle>
                  <CardDescription>
                    全お問い合わせ: {contacts?.length || 0}件 
                    (未対応: {contacts?.filter((c: any) => c.status === "new").length || 0}件)
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={refreshContacts}
                >
                  <RefreshCw className="h-4 w-4" />
                  更新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* ステータスフィルタータブ */}
              <div className="mb-4">
                <TabsList className="bg-muted/60">
                  <TabsTrigger
                    value="all"
                    className={contactFilter === "all" ? "bg-background" : ""}
                    onClick={() => {
                      console.log("Setting filter to all");
                      setContactFilter("all");
                    }}
                  >
                    すべて
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className={contactFilter === "new" ? "bg-background" : ""}
                    onClick={() => {
                      console.log("Setting filter to new");
                      setContactFilter("new");
                    }}
                  >
                    新規
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem]">
                      {contacts?.filter((c: any) => c.status === "new").length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="in_progress" 
                    className={contactFilter === "in_progress" ? "bg-background" : ""}
                    onClick={() => {
                      console.log("Setting filter to in_progress");
                      setContactFilter("in_progress");
                    }}
                  >
                    対応中
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem]">
                      {contacts?.filter((c: any) => c.status === "in_progress").length || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className={contactFilter === "resolved" ? "bg-background" : ""}
                    onClick={() => {
                      console.log("Setting filter to resolved");
                      setContactFilter("resolved");
                    }}
                  >
                    解決済み
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem]">
                      {contacts?.filter((c: any) => c.status === "resolved").length || 0}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* データがロードされるまでデモデータを表示 */}
              {(!contacts || contacts.length === 0) && (
                <div className="py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="py-2 border-b">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}

              {isMobile ? (
                // モバイル表示
                <div className="space-y-3">
                  {filteredContacts && filteredContacts.length > 0 ? (
                    filteredContacts.map((contact: any) => (
                      <Card key={contact.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(contact.createdAt).toLocaleDateString("ja-JP")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {contact.status === "new" && <Badge variant="default">新規</Badge>}
                              {contact.status === "in_progress" && <Badge variant="outline">対応中</Badge>}
                              {contact.status === "resolved" && <Badge variant="secondary">解決済み</Badge>}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setOpenContactDialog(true);
                                }}
                              >
                                <ChevronRight className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {getCategoryName(contact.category)} - {contact.message.substring(0, 10)}{contact.message.length > 10 ? "..." : ""}
                          </div>
                          <div className="text-sm line-clamp-2 bg-secondary p-2 rounded">
                            {contact.message}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="py-4 text-center text-muted-foreground">
                      {searchQuery ? "検索条件に一致するお問い合わせはありません" : "お問い合わせはありません"}
                    </div>
                  )}
                </div>
              ) : (
                // デスクトップ表示
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>日時</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>概要</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts && filteredContacts.length > 0 ? (
                      filteredContacts.map((contact: any) => (
                        <TableRow key={contact.id}>
                          <TableCell>{contact.id}</TableCell>
                          <TableCell>{new Date(contact.createdAt).toLocaleDateString("ja-JP")}</TableCell>
                          <TableCell>{contact.name}</TableCell>
                          <TableCell>{getCategoryName(contact.category)}</TableCell>
                          <TableCell>{contact.message.substring(0, 10)}{contact.message.length > 10 ? "..." : ""}</TableCell>
                          <TableCell>
                            {contact.status === "new" && <Badge variant="default">新規</Badge>}
                            {contact.status === "in_progress" && <Badge variant="outline">対応中</Badge>}
                            {contact.status === "resolved" && <Badge variant="secondary">解決済み</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact);
                                setOpenContactDialog(true);
                              }}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          {searchQuery ? "検索条件に一致するお問い合わせはありません" : "お問い合わせはありません"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* システム情報タブ */}
        {/* ニュース管理タブ */}
        <TabsContent value="news" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ニュース管理</CardTitle>
                <CardDescription>システムニュースの作成・編集・削除ができます</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedNews(null);
                    setOpenNewsDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新規作成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchNews()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  更新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* データがロードされるまでスケルトンUI表示 */}
              {isNewsLoading && (
                <div className="py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col py-2 border-b gap-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* ニュース一覧表示 */}
              {!isNewsLoading && newsItems && newsItems.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead className="w-[120px]">状態</TableHead>
                        <TableHead>タイトル</TableHead>
                        <TableHead className="w-[180px]">作成日</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newsItems.map((item: News) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>
                            {item.pinned ? (
                              <Badge variant="secondary">固定表示</Badge>
                            ) : (
                              <Badge variant="outline">通常</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.title}</div>
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                console.log('ニュース詳細ボタンがクリックされました', item);
                                setSelectedNews(item);
                                setOpenNewsDetailDialog(true);
                              }}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : !isNewsLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  表示するニュースがありません
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 称号管理タブ */}
        <TabsContent value="titles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>称号管理</CardTitle>
                <CardDescription>ユーザー称号の作成・付与・削除ができます</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTitle(null);
                    setOpenTitleDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新規称号作成
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchTitles()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  更新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* データがロードされるまでスケルトンUI表示 */}
              {isTitlesLoading && (
                <div className="py-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col py-2 border-b gap-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              )}

              {/* 称号一覧表示 */}
              {!isTitlesLoading && titlesData && titlesData.length > 0 ? (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead className="w-[120px]">種類</TableHead>
                        <TableHead>称号名</TableHead>
                        <TableHead>説明</TableHead>
                        <TableHead className="w-[100px]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {titlesData.map((title: Title) => (
                        <TableRow key={title.id}>
                          <TableCell>{title.id}</TableCell>
                          <TableCell>
                            {title.isAutomatic ? (
                              <Badge variant="secondary">自動付与</Badge>
                            ) : (
                              <Badge variant="outline">手動付与</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{title.name}</div>
                          </TableCell>
                          <TableCell>{title.description}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                console.log('称号詳細ボタンがクリックされました', title);
                                setSelectedTitle(title);
                                setOpenTitleDetailDialog(true);
                              }}
                            >
                              詳細
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : !isTitlesLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  表示する称号がありません
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>ユーザー統計</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={refreshStats}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>総ユーザー数:</span>
                    <span className="font-semibold">{stats?.totalUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>アクティブユーザー:</span>
                    <span className="font-semibold">{stats?.activeUsers || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>コンテンツ統計</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>総プリセット数:</span>
                    <span className="font-semibold">{stats?.totalPresets || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>過去24時間の新規プリセット:</span>
                    <span className="font-semibold">{stats?.newPresets24h || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>総コメント数:</span>
                    <span className="font-semibold">{stats?.totalComments || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>プリセットタイプ別統計</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>INPUT_FX:</span>
                    <span className="font-semibold">{stats?.presetsByType?.INPUT_FX || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TRACK_FX:</span>
                    <span className="font-semibold">{stats?.presetsByType?.TRACK_FX || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>システムメンテナンス</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" />
                  <p>システムメンテナンス機能は現在開発中です。将来のアップデートで追加される予定です。</p>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <Button variant="outline" disabled>データベースバックアップ</Button>
                  <Button variant="outline" disabled>キャッシュクリア</Button>
                  <Button variant="outline" disabled>ログファイル表示</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ユーザー詳細ダイアログ */}
      {renderUserDialog()}

      {/* お問い合わせ詳細ダイアログ */}
      {renderContactDialog()}

      {/* ニュース作成/編集ダイアログ */}
      <Dialog open={openNewsDialog} onOpenChange={setOpenNewsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedNews ? "ニュース編集" : "ニュース作成"}</DialogTitle>
            <DialogDescription>
              {selectedNews 
                ? "既存のニュースを編集します。変更後、保存ボタンをクリックしてください。" 
                : "新しいニュースを作成します。必要事項を入力してください。"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            
            // フォームデータをログ出力
            console.log('フォームデータ:');
            formData.forEach((value, key) => {
              console.log(`${key}: ${value}`);
            });
            
            const newsData: InsertNews = {
              title: formData.get('title') as string,
              content: formData.get('content') as string,
              linkText: (formData.get('linkText') as string) || null,
              linkUrl: (formData.get('linkUrl') as string) || null,
              pinned: formData.get('pinned') === 'on',
              userId: currentUser?.id,
            };
            
            console.log('ニュースデータ:', newsData);
            console.log('selectedNews:', selectedNews);
            
            try {
              if (selectedNews) {
                // 更新の場合
                console.log(`ニュースID: ${selectedNews.id} を更新します`);
                await updateNewsMutation.mutate({ 
                  newsId: selectedNews.id,
                  data: newsData
                });
              } else {
                // 新規作成の場合
                console.log('新規ニュースを作成します');
                await createNewsMutation.mutate(newsData);
              }
            } catch (error) {
              console.error(selectedNews ? "ニュース更新エラー:" : "ニュース作成エラー:", error);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">タイトル</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="ニュースのタイトルを入力"
                  defaultValue={selectedNews?.title || ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="ニュースの内容を入力"
                  className="min-h-[100px]"
                  defaultValue={selectedNews?.content || ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkText">リンクテキスト (任意)</Label>
                <Input
                  id="linkText"
                  name="linkText"
                  placeholder="詳細はこちら"
                  defaultValue={selectedNews?.linkText || ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="linkUrl">リンクURL (任意)</Label>
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  placeholder="https://example.com/news"
                  defaultValue={selectedNews?.linkUrl || ""}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pinned"
                  name="pinned"
                  defaultChecked={selectedNews?.pinned || false}
                />
                <Label htmlFor="pinned">ニュースを固定表示する</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setSelectedNews(null);
                setOpenNewsDialog(false);
              }}>
                キャンセル
              </Button>
              <Button type="submit" disabled={createNewsMutation.isPending || updateNewsMutation.isPending}>
                {(createNewsMutation.isPending || updateNewsMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedNews ? "更新" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ニュース削除確認ダイアログ */}
      <AlertDialog open={deleteNewsConfirmOpen} onOpenChange={setDeleteNewsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ニュースを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              このニュースを削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedNews) {
                  console.log("ニュース削除開始:", selectedNews.id);
                  deleteNewsMutation.mutate(selectedNews.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteNewsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ニュース詳細ダイアログ */}
      <Dialog open={openNewsDetailDialog} onOpenChange={setOpenNewsDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>ニュース詳細</DialogTitle>
            <DialogDescription>
              ID: {selectedNews?.id} | 作成日: {selectedNews && new Date(selectedNews.createdAt).toLocaleString('ja-JP')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="w-24 font-medium">状態:</div>
              <Badge variant={selectedNews?.pinned ? "secondary" : "outline"}>
                {selectedNews?.pinned ? "固定表示" : "通常"}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">タイトル:</div>
              <div className="p-2 bg-muted rounded">{selectedNews?.title}</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">内容:</div>
              <div className="p-2 bg-muted rounded whitespace-pre-wrap">{selectedNews?.content}</div>
            </div>
            
            {(selectedNews?.linkText || selectedNews?.linkUrl) && (
              <div className="space-y-1">
                <div className="font-medium">リンク:</div>
                <div className="p-2 bg-muted rounded">
                  {selectedNews?.linkText && <div>{selectedNews.linkText}</div>}
                  {selectedNews?.linkUrl && (
                    <a 
                      href={selectedNews.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm break-all"
                    >
                      {selectedNews.linkUrl}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenNewsDetailDialog(false);
              }}
            >
              閉じる
            </Button>
            
            <Button
              variant="default"
              onClick={() => {
                // 固定状態を切り替える
                if (selectedNews) {
                  updateNewsMutation.mutate({
                    newsId: selectedNews.id,
                    data: { pinned: !selectedNews.pinned }
                  });
                  // ダイアログは閉じないで状態をすぐに更新
                  setSelectedNews({
                    ...selectedNews,
                    pinned: !selectedNews.pinned
                  });
                }
              }}
            >
              {selectedNews?.pinned ? (
                <>
                  <PinOff className="mr-2 h-4 w-4" />
                  固定を解除
                </>
              ) : (
                <>
                  <Pin className="mr-2 h-4 w-4" />
                  固定表示に設定
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                // 編集ダイアログを開く
                setOpenNewsDetailDialog(false);
                setOpenNewsDialog(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => {
                // 削除確認ダイアログを開く
                setOpenNewsDetailDialog(false);
                setDeleteNewsConfirmOpen(true);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 称号作成・編集ダイアログ */}
      <Dialog open={openTitleDialog} onOpenChange={setOpenTitleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedTitle ? "称号編集" : "称号作成"}</DialogTitle>
            <DialogDescription>
              {selectedTitle ? "既存の称号を編集します" : "新しい称号を作成します"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titleData: InsertTitle = {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                iconUrl: formData.get("iconUrl") as string || null,
                isAutomatic: formData.get("isAutomatic") === "on",
                condition: formData.get("condition") as string || null,
              };
              
              console.log('称号データ:', titleData);
              
              try {
                if (selectedTitle) {
                  // 更新の場合
                  console.log(`称号ID: ${selectedTitle.id} を更新します`);
                  updateTitleMutation.mutate({ 
                    titleId: selectedTitle.id,
                    data: titleData
                  });
                } else {
                  // 新規作成の場合
                  createTitleMutation.mutate(titleData);
                }
              } catch (error) {
                console.error('称号保存エラー:', error);
                toast({
                  title: "エラー",
                  description: error instanceof Error ? error.message : "称号の保存に失敗しました",
                  variant: "destructive",
                });
              }
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  称号名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="バグハンター"
                  defaultValue={selectedTitle?.name}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  説明 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="バグを報告してくれたユーザーに贈られる称号です"
                  defaultValue={selectedTitle?.description}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="iconUrl" className="text-right">
                  アイコンURL
                </Label>
                <Input
                  id="iconUrl"
                  name="iconUrl"
                  placeholder="/icons/bug-hunter.svg"
                  defaultValue={selectedTitle?.iconUrl || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isAutomatic" className="text-right">
                  自動付与
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Checkbox 
                    id="isAutomatic" 
                    name="isAutomatic"
                    defaultChecked={selectedTitle?.isAutomatic}
                  />
                  <Label htmlFor="isAutomatic">条件を満たした場合に自動的に付与する</Label>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="condition" className="text-right">
                  付与条件
                </Label>
                <Textarea
                  id="condition"
                  name="condition"
                  placeholder="例: バグ報告が5件以上のユーザー"
                  defaultValue={selectedTitle?.condition || ""}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {(createTitleMutation.isPending || updateTitleMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedTitle ? "更新" : "作成"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 称号詳細ダイアログ */}
      <Dialog open={openTitleDetailDialog} onOpenChange={setOpenTitleDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>称号詳細</DialogTitle>
            <DialogDescription>
              ID: {selectedTitle?.id} | 作成日: {selectedTitle && new Date(selectedTitle.createdAt).toLocaleString('ja-JP')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <div className="w-24 font-medium">種類:</div>
              <Badge variant={selectedTitle?.isAutomatic ? "secondary" : "outline"}>
                {selectedTitle?.isAutomatic ? "自動付与" : "手動付与"}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">称号名:</div>
              <div className="p-2 bg-muted rounded">{selectedTitle?.name}</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium">説明:</div>
              <div className="p-2 bg-muted rounded whitespace-pre-wrap">{selectedTitle?.description}</div>
            </div>
            
            {selectedTitle?.condition && (
              <div className="space-y-1">
                <div className="font-medium">付与条件:</div>
                <div className="p-2 bg-muted rounded whitespace-pre-wrap">{selectedTitle.condition}</div>
              </div>
            )}
            
            {selectedTitle?.iconUrl && (
              <div className="space-y-1">
                <div className="font-medium">アイコン:</div>
                <div className="p-2 bg-muted rounded">
                  <a 
                    href={selectedTitle.iconUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm break-all"
                  >
                    {selectedTitle.iconUrl}
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setOpenTitleDetailDialog(false);
              }}
            >
              閉じる
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                // 編集ダイアログを開く
                setOpenTitleDetailDialog(false);
                setOpenTitleDialog(true);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </Button>
            
            <Button
              variant="destructive"
              onClick={() => {
                // 削除確認ダイアログを開く
                setOpenTitleDetailDialog(false);
                setDeleteTitleConfirmOpen(true);
              }}
            >
              <Trash className="mr-2 h-4 w-4" />
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 称号削除確認ダイアログ */}
      <AlertDialog open={deleteTitleConfirmOpen} onOpenChange={setDeleteTitleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>称号を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この称号を削除します。この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (selectedTitle) {
                  console.log("称号削除開始:", selectedTitle.id);
                  deleteTitleMutation.mutate(selectedTitle.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTitleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ユーザーへの称号付与ダイアログ */}
      <Dialog open={openGrantTitleDialog} onOpenChange={setOpenGrantTitleDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>称号付与</DialogTitle>
            <DialogDescription>
              ユーザー: {selectedUser?.username} に称号を付与します
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const titleId = Number(formData.get("titleId"));
              
              if (!selectedUser || !titleId) {
                toast({
                  title: "エラー",
                  description: "ユーザーまたは称号が選択されていません",
                  variant: "destructive",
                });
                return;
              }
              
              const userTitleData: InsertUserTitle = {
                userId: selectedUser.id,
                titleId: titleId
              };
              
              grantUserTitleMutation.mutate({ userId: selectedUser.id, titleId });
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="titleId" className="text-right">
                  称号 <span className="text-destructive">*</span>
                </Label>
                <Select name="titleId" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="称号を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {titlesData && titlesData.map((title: Title) => (
                      <SelectItem key={title.id} value={title.id.toString()}>
                        {title.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {grantUserTitleMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                付与する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
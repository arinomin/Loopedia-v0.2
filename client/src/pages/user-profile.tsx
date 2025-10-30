import React, { useState } from "react";
import { FollowButton } from "@/components/follow-button";
import { useUserFollowers, useUserFollowing } from "@/hooks/use-follow";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PresetCard } from "@/components/ui/card-preset";
import { formatDate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { FollowListDialog } from "@/components/follow-list-dialog";
import { 
  getUserSettings, 
  updateUserSettings, 
  getUserById, 
  updateUserProfile,
  getUserLoopersByUserId,
  getUserLoopers,
  createUserLooper,
  updateUserLooper,
  deleteUserLooper
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, PlusIcon, Pencil, X, ChevronUp, ChevronDown, MapPin, Upload, Camera } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PresetList } from "@shared/schema";
import { ArrowLeft } from 'lucide-react'; // アイコンをインポート
import { UserBadge } from "@/components/user-badge";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [selectedTab, setSelectedTab] = useState("presets");
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [initialFollowTab, setInitialFollowTab] = useState<"followers" | "following">("followers");
  const queryClient = useQueryClient();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  interface UserType {
    id: number;
    username: string;
    createdAt?: string;
  }

  // PresetListの型を使用

  // Fetch user's presets
  const { data: presets = [], isLoading: isLoadingPresets } = useQuery<PresetList[]>({
    queryKey: [`/api/presets`, undefined, undefined, 1, { userId: id }],
    queryFn: async () => {
      const response = await fetch(`/api/presets?userId=${id}`);
      if (!response.ok) throw new Error("Failed to fetch user's presets");
      return response.json();
    },
  });

  // Fetch liked presets
  const { data: likedPresets = [], isLoading: isLoadingLikedPresets } = useQuery<PresetList[]>({
    queryKey: [`/api/presets`, undefined, undefined, 1, { likedBy: id }],
    queryFn: async () => {
      const response = await fetch(`/api/presets?likedBy=${id}`);
      if (!response.ok) throw new Error("Failed to fetch liked presets");
      return response.json();
    },
    enabled: selectedTab === "likes",
  });

  // Fetch bookmarked presets
  const { data: bookmarkedPresets = [], isLoading: isLoadingBookmarkedPresets } = useQuery<PresetList[]>({
    queryKey: [`/api/presets`, undefined, undefined, 1, { bookmarkedBy: id }],
    queryFn: async () => {
      const response = await fetch(`/api/presets?bookmarkedBy=${id}`);
      if (!response.ok) throw new Error("Failed to fetch bookmarked presets");
      return response.json();
    },
    enabled: selectedTab === "bookmarks",
  });

  // Fetch user data directly
  const { data: profileUser, isLoading: isLoadingUser, refetch: refetchUserData } = useQuery<any>({
    queryKey: [`/api/users/${id}`],
    queryFn: () => getUserById(parseInt(id)),
    enabled: !!id,
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5秒後にデータを古いとみなす（より頻繁に更新）
  });

  // Fetch current user to check if it's the profile owner
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user settings
  const { data: userSettings } = useQuery<any>({
    queryKey: ["/api/user/settings"],
    queryFn: getUserSettings,
    enabled: !!currentUser && currentUser.id === parseInt(id),
  });

  // Fetch user loopers
  const { data: userLoopers = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${id}/loopers`],
    queryFn: () => getUserLoopersByUserId(parseInt(id)),
    enabled: !!id,
  });

  // Fetch own loopers when on own profile
  const { data: ownLoopers = [] } = useQuery<any[]>({
    queryKey: [`/api/user/loopers`],
    queryFn: getUserLoopers,
    enabled: !!currentUser && currentUser.id === parseInt(id),
  });

  // Toggle user settings
  const settingsMutation = useMutation({
    mutationFn: (showLikes: boolean) => {
      return updateUserSettings({ showLikes });
    },
    onSuccess: () => {
      // 設定を更新したら関連するデータを再取得
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
    },
  });

  // Add new looper
  const [isAddLooperOpen, setIsAddLooperOpen] = useState(false);
  const addLooperMutation = useMutation({
    mutationFn: (looperName: string) => {
      return createUserLooper({ looperName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/loopers`] });
      setIsAddLooperOpen(false);
    },
  });

  // Delete looper
  const deleteLooperMutation = useMutation({
    mutationFn: (looperId: number) => {
      return deleteUserLooper(looperId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/loopers`] });
    },
  });

  // Update looper order
  const updateLooperOrderMutation = useMutation({
    mutationFn: ({ looperId, displayOrder }: { looperId: number; displayOrder: number }) => {
      return updateUserLooper(looperId, { displayOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/loopers`] });
    },
  });

  // Move looper up or down
  const moveLooper = (looperId: number, direction: 'up' | 'down') => {
    const looperIndex = ownLoopers.findIndex(l => l.id === looperId);
    if (looperIndex === -1) return;

    if (direction === 'up' && looperIndex > 0) {
      const newOrder = ownLoopers[looperIndex].displayOrder - 1;
      updateLooperOrderMutation.mutate({ looperId, displayOrder: newOrder });
      updateLooperOrderMutation.mutate({ 
        looperId: ownLoopers[looperIndex - 1].id, 
        displayOrder: ownLoopers[looperIndex].displayOrder 
      });
    } else if (direction === 'down' && looperIndex < ownLoopers.length - 1) {
      const newOrder = ownLoopers[looperIndex].displayOrder + 1;
      updateLooperOrderMutation.mutate({ looperId, displayOrder: newOrder });
      updateLooperOrderMutation.mutate({ 
        looperId: ownLoopers[looperIndex + 1].id, 
        displayOrder: ownLoopers[looperIndex].displayOrder 
      });
    }
  };

  // Profile form schema
  const profileFormSchema = z.object({
    nickname: z.string().min(1, { message: "ニックネームは必須です" })
      .max(30, { message: "ニックネームは30文字以内で入力してください" }),
    profileText: z.string().max(150, { message: "プロフィールは150文字以内で入力してください" }).optional(),
    country: z.string().optional(),
    countryOther: z.string().optional(),
    // 以下を修正: 誕生日をstring型で処理し、フロントエンドからサーバーに送信する際に文字列として扱う
    birthYear: z.string().optional(),
    birthMonth: z.string().optional(),
    birthDay: z.string().optional(),
    showBirthday: z.boolean().default(false),
    avatarUrl: z.string().optional(),
    avatarFile: z.instanceof(File).optional(),
    hasImageChanged: z.boolean().optional(), // 画像変更フラグを追加
    // Favorite Loopers（好きなアーティスト）
    favoriteLooper1: z.string().max(30, { message: "30文字以内で入力してください" }).optional(),
    favoriteLooper2: z.string().max(30, { message: "30文字以内で入力してください" }).optional(),
    favoriteLooper3: z.string().max(30, { message: "30文字以内で入力してください" }).optional(),
  });

  // Profile edit form
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // 誕生日を年月日に分割
  let birthYear = "";
  let birthMonth = "";
  let birthDay = "";

  if (profileUser?.birthday) {
    const date = new Date(profileUser.birthday);
    birthYear = date.getFullYear().toString();
    birthMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    birthDay = date.getDate().toString().padStart(2, '0');
  }

  // お気に入りLooper（アーティスト）のデフォルト値を設定
  const userFavLoopers = userLoopers.sort((a, b) => a.displayOrder - b.displayOrder);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: profileUser?.nickname || profileUser?.username || "",
      profileText: profileUser?.profileText || "",
      country: profileUser?.country || "",
      countryOther: "",
      birthYear,
      birthMonth,
      birthDay,
      showBirthday: profileUser?.showBirthday || false,
      avatarUrl: profileUser?.avatarUrl || "",
      hasImageChanged: false,
      favoriteLooper1: userFavLoopers[0]?.looperName || "",
      favoriteLooper2: userFavLoopers[1]?.looperName || "",
      favoriteLooper3: userFavLoopers[2]?.looperName || "",
    },
  });

  // ファイル選択時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // プレビュー画像を設定
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      // フォームの値に設定
      profileForm.setValue('avatarFile', file);

      // ファイル選択時に、フォームの状態を変更して保存ボタンを有効化
      profileForm.setValue('hasImageChanged', true);
    };
    reader.readAsDataURL(file);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      // フォームデータから誕生日を作成（年月日が揃っている場合のみ）
      let birthday = null;
      if (data.birthYear && data.birthMonth && data.birthDay && 
          data.birthYear !== 'none' && data.birthMonth !== 'none' && data.birthDay !== 'none') {
        // ISOフォーマットの日付文字列を作成
        const dateStr = `${data.birthYear}-${data.birthMonth}-${data.birthDay}`;
        birthday = dateStr;
      }

      // ここでfavoriteLooperの値を取得して、API呼び出し時に保存
      // このアプリではループステーションの代わりにアーティスト名を保存するように変更
      const loopers = [];
      if (data.favoriteLooper1) {
        loopers.push({
          userId: currentUser?.id || 0,
          looperName: data.favoriteLooper1,
          displayOrder: 0
        });
      }
      if (data.favoriteLooper2) {
        loopers.push({
          userId: currentUser?.id || 0,
          looperName: data.favoriteLooper2,
          displayOrder: 1
        });
      }
      if (data.favoriteLooper3) {
        loopers.push({
          userId: currentUser?.id || 0,
          looperName: data.favoriteLooper3,
          displayOrder: 2
        });
      }

      // アバター画像のアップロード処理
      let avatarUrl = data.avatarUrl;
      if (data.avatarFile) {
        console.log("Preparing to upload avatar file:", data.avatarFile.name, data.avatarFile.size, data.avatarFile.type);
        // FormDataを作成してファイルを添付
        const formData = new FormData();
        formData.append('avatar', data.avatarFile);

        try {
          console.log("Sending avatar upload request to server");
          const response = await fetch('/api/users/avatar', {
            method: 'POST',
            body: formData,
            // 認証情報を含めて送信
            credentials: 'include'
          });

          console.log("Avatar upload response status:", response.status);
          
          if (response.ok) {
            const result = await response.json();
            console.log("Avatar upload successful. Result:", result);
            avatarUrl = result.avatarUrl;
          } else {
            const errorText = await response.text();
            console.error('Avatar upload failed:', response.status, errorText);
            throw new Error(`アバター画像のアップロードに失敗しました: ${response.status}`);
          }
        } catch (error) {
          console.error('Avatar upload error:', error);
          throw error;
        }
      }

      // APIに送信するデータを整形
      const profileData = {
        nickname: data.nickname,
        profileText: data.profileText,
        country: data.country === 'other' ? data.countryOther : data.country,
        birthday: birthday,
        showBirthday: data.showBirthday,
        avatarUrl: avatarUrl,
        // ここでFavorite Loopersも送信する
        favoriteArtists: loopers
      };

      return updateUserProfile(profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/loopers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/loopers`] });
      setIsProfileEditOpen(false);
      toast({
        title: "プロフィールを更新しました",
        description: "変更が保存されました。",
      });
    },
    onError: (error) => {
      console.error("Profile update error:", error);
      toast({
        title: "エラーが発生しました",
        description: "プロフィールの更新に失敗しました。もう一度お試しください。",
        variant: "destructive",
      });
    }
  });

  // Define countries
  const countries = [
    { value: "japan", label: "日本" },
    { value: "united_states", label: "アメリカ合衆国" },
    { value: "china", label: "中国" },
    { value: "south_korea", label: "韓国" },
    { value: "australia", label: "オーストラリア" },
    { value: "germany", label: "ドイツ" },
    { value: "france", label: "フランス" },
    { value: "united_kingdom", label: "イギリス" },
    { value: "canada", label: "カナダ" },
    { value: "india", label: "インド" },
    { value: "brazil", label: "ブラジル" },
    { value: "mexico", label: "メキシコ" },
    { value: "italy", label: "イタリア" },
    { value: "spain", label: "スペイン" },
    { value: "russia", label: "ロシア" },
    { value: "south_africa", label: "南アフリカ" },
    { value: "singapore", label: "シンガポール" },
    { value: "thailand", label: "タイ" },
    { value: "vietnam", label: "ベトナム" },
    { value: "indonesia", label: "インドネシア" },
    { value: "malaysia", label: "マレーシア" },
    { value: "netherlands", label: "オランダ" },
    { value: "sweden", label: "スウェーデン" },
    { value: "norway", label: "ノルウェー" },
    { value: "finland", label: "フィンランド" },
    { value: "switzerland", label: "スイス" },
    { value: "new_zealand", label: "ニュージーランド" },
    { value: "other", label: "その他" },
  ];

  const userExists = !!profileUser;
  const isOwnProfile = !!currentUser && !!profileUser && currentUser.id === profileUser.id;
  const canSeeLikes = isOwnProfile || (userSettings?.showLikes !== false);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          プリセット一覧に戻る
        </Link>
      </div>

      {isLoadingPresets ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      ) : !userExists ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">ユーザーが見つかりませんでした</h3>
              <p className="mt-2 text-sm text-gray-500">
                指定されたユーザーIDのユーザーは存在しないか、プリセットを作成していません。
              </p>
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline" className="w-full">プリセット一覧に戻る</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {profileUser?.avatarUrl ? (
                      <img
                        src={profileUser.avatarUrl}
                        alt={`${profileUser.username}のアバター`}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary text-2xl font-semibold">
                        {profileUser?.username.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold flex items-center">
                      <UserBadge 
                        user={profileUser} 
                        size="md" 
                        showUsername={false}
                        showNickname={true}
                      />
                    </h3>
                    <p className="text-muted-foreground">
                      @{profileUser?.username}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {!isOwnProfile && profileUser && (
                        <FollowButton
                          userId={profileUser.id}
                          isFollowing={profileUser.isFollowing || false}
                          size="sm"
                        />
                      )}
                    </div>
                    {profileUser?.country && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {countries.find(c => c.value === profileUser.country)?.label || profileUser.country}
                      </p>
                    )}
                  </div>
                </div>
                {isOwnProfile ? (
                  <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4 mr-2" />
                        プロフィール編集
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto mobile-keyboard-fix" aria-describedby="profile-edit-description">
                      <DialogHeader>
                        <DialogTitle>プロフィール編集</DialogTitle>
                        <p id="profile-edit-description" className="sr-only">プロフィール情報の編集フォーム</p>
                      </DialogHeader>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                          <FormField
                            control={profileForm.control}
                            name="nickname"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ニックネーム</FormLabel>
                                <FormControl>
                                  <Input placeholder="ニックネーム" {...field} />
                                </FormControl>
                                <FormDescription>
                                  他のユーザーに表示される名前です（30文字まで）
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* アバタープレビューと選択コンポーネント */}
                          <div className="space-y-4">
                            <FormLabel>プロフィール画像</FormLabel>
                            <div className="flex flex-col items-center space-y-3">
                              <div className="relative h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                {(previewImage || profileUser?.avatarUrl) ? (
                                  <img
                                    src={previewImage || profileUser?.avatarUrl}
                                    alt="プロフィール画像プレビュー"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Camera className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex justify-center">
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                  <div className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                                    <Upload className="mr-2 h-4 w-4" />
                                    画像をアップロード
                                  </div>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                              <FormDescription className="text-center">
                                画像は5MB以下のJPEG、PNG、GIF形式のみ対応しています
                              </FormDescription>
                            </div>
                          </div>

                          <FormField
                            control={profileForm.control}
                            name="profileText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>自己紹介</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="自己紹介文（150文字まで）"
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  あなた自身について簡単に紹介してください（150文字まで）
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>国/地域</FormLabel>
                                <Select onValueChange={(value) => {
                                  field.onChange(value);
                                  // その他を選択した場合は、countryOtherフィールドをリセット
                                  if (value !== 'other') {
                                    profileForm.setValue('countryOther', '');
                                  }
                                }} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="国/地域を選択" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country.value} value={country.value}>
                                        {country.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* その他の国/地域を選択した場合のみ表示 */}
                          {profileForm.watch('country') === 'other' && (
                            <FormField
                              control={profileForm.control}
                              name="countryOther"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>国/地域名（その他）</FormLabel>
                                  <FormControl>
                                    <Input placeholder="国/地域名を入力" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          {/* 誕生日（年） */}
                          {/* 生年月日（横並び） */}
                          <div>
                            <FormLabel className="block mb-2">生年月日</FormLabel>
                            <div className="flex gap-2">
                              <FormField
                                control={profileForm.control}
                                name="birthYear"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="年を選択" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">選択なし</SelectItem>
                                        {Array.from({ length: 100 }, (_, i) => {
                                          const year = new Date().getFullYear() - i;
                                          return (
                                            <SelectItem key={year} value={year.toString()}>
                                              {year}年
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="birthMonth"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="月を選択" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">選択なし</SelectItem>
                                        {Array.from({ length: 12 }, (_, i) => {
                                          const month = (i + 1).toString().padStart(2, '0');
                                          return (
                                            <SelectItem key={month} value={month}>
                                              {i + 1}月
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="birthDay"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="日を選択" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="none">選択なし</SelectItem>
                                        {Array.from({ length: 31 }, (_, i) => {
                                          const day = (i + 1).toString().padStart(2, '0');
                                          return (
                                            <SelectItem key={day} value={day}>
                                              {i + 1}日
                                            </SelectItem>
                                          );
                                        })}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          <FormField
                            control={profileForm.control}
                            name="showBirthday"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>誕生日を公開する</FormLabel>
                                  <FormDescription>
                                    オンにすると、あなたのプロフィールページに誕生日が表示されます。
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          {/* お気に入りアーティスト (Looper) 入力欄 */}
                          <div className="space-y-4">
                            <h3 className="text-base font-medium mb-4">お気に入りのアーティスト</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="favoriteLooper1"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="アーティスト名 1（任意）" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="favoriteLooper2"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="アーティスト名 2（任意）" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={profileForm.control}
                                name="favoriteLooper3"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="アーティスト名 3（任意）" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsProfileEditOpen(false)}
                              className="transition-none"
                            >
                              キャンセル
                            </Button>
                            <Button 
                              type="submit"
                              disabled={updateProfileMutation.isPending || !profileForm.formState.isDirty}
                              className="transition-none"
                            >
                              {updateProfileMutation.isPending ? "保存中..." : "保存"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                ) : null}
              </div>

              {profileUser?.profileText && (
                <div className="mt-4 text-sm">
                  {profileUser.profileText}
                </div>
              )}

              {/* お気に入りアーティスト - プロフィール文の下に表示 */}
              {userLoopers.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Favorite Artists:</span> {userLoopers.sort((a, b) => a.displayOrder - b.displayOrder).map(looper => looper.looperName).join(', ')}
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-6 text-sm">
                <button 
                  className="hover:underline" 
                  onClick={() => {
                    setFollowDialogOpen(true);
                    setInitialFollowTab("following");
                  }}
                >
                  <span className="font-semibold">{profileUser?.followingCount || 0}</span>{" "}
                  <span className="text-muted-foreground">フォロー中</span>
                </button>
                <button 
                  className="hover:underline" 
                  onClick={() => {
                    setFollowDialogOpen(true);
                    setInitialFollowTab("followers");
                  }}
                >
                  <span className="font-semibold">{profileUser?.followersCount || 0}</span>{" "}
                  <span className="text-muted-foreground">フォロワー</span>
                </button>
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-muted-foreground">登録日</dt>
                    <dd className="mt-1 text-sm">{profileUser?.createdAt ? formatDate(profileUser.createdAt) : "不明"}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-muted-foreground">プリセット数</dt>
                    <dd className="mt-1 text-sm">{presets.length}</dd>
                  </div>
                  {profileUser?.birthday && profileUser.showBirthday && (
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-muted-foreground">誕生日</dt>
                      <dd className="mt-1 text-sm">{formatDate(profileUser.birthday, "yyyy年MM月dd日")}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* 旧来の管理セクションは削除 - プロフィール編集から設定するように変更 */}
            </CardContent>
          </Card>

          <div className="mt-8">
            <Tabs defaultValue="presets" onValueChange={setSelectedTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="presets">公開プリセット</TabsTrigger>
                {canSeeLikes && <TabsTrigger value="likes">いいね</TabsTrigger>}
                {isOwnProfile && <TabsTrigger value="bookmarks">ブックマーク</TabsTrigger>}
              </TabsList>

              {isOwnProfile && selectedTab === "likes" && (
                <div className="mb-4 flex items-center space-x-2">
                  <Switch 
                    id="likes-privacy" 
                    checked={userSettings?.showLikes !== false}
                    onCheckedChange={(checked) => {
                      settingsMutation.mutate(checked);
                    }}
                    disabled={settingsMutation.isPending}
                  />
                  <Label htmlFor="likes-privacy">いいねを公開する</Label>
                </div>
              )}

              <TabsContent value="presets">
                {presets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {presets.map((preset: PresetList) => (
                      <PresetCard key={preset.id} preset={preset} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900">プリセットがありません</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      このユーザーはまだプリセットを公開していません。
                    </p>
                  </div>
                )}

                {presets.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline">もっと見る</Button>
                  </div>
                )}
              </TabsContent>

              {canSeeLikes && (
                <TabsContent value="likes">
                  {isLoadingLikedPresets ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-64 bg-gray-200 rounded"></div>
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                  ) : likedPresets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {likedPresets.map((preset: PresetList) => (
                        <PresetCard key={preset.id} preset={preset} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900">いいねしたプリセットがありません</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        このユーザーはまだいいねをしていません。
                      </p>
                    </div>
                  )}

                  {likedPresets.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <Button variant="outline">もっと見る</Button>
                    </div>
                  )}
                </TabsContent>
              )}

              {isOwnProfile && (
                <TabsContent value="bookmarks">
                  {isLoadingBookmarkedPresets ? (
                    <div className="animate-pulse space-y-4">
                      <div className="h-64 bg-gray-200 rounded"></div>
                      <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                  ) : bookmarkedPresets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bookmarkedPresets.map((preset: PresetList) => (
                        <PresetCard key={preset.id} preset={preset} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900">ブックマークしたプリセットがありません</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        まだブックマークしたプリセットはありません。
                      </p>
                    </div>
                  )}

                  {bookmarkedPresets.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <Button variant="outline">もっと見る</Button>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </>
      )}

      {/* フォロー/フォロワー一覧ダイアログ */}
      {profileUser && (
        <FollowListDialog
          userId={profileUser.id}
          open={followDialogOpen}
          onOpenChange={setFollowDialogOpen}
          initialTab={initialFollowTab}
        />
      )}
    </div>
  );
}
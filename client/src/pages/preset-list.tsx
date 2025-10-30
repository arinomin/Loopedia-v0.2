import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PresetCard } from "@/components/ui/card-preset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { PresetList as PresetListType, Tag } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlusCircle, Search, Filter, RefreshCw } from "lucide-react";
import { NewsFeed } from "@/components/news-feed";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogContent, 
  DialogClose, 
  DialogFooter 
} from "@/components/ui/dialog";

type PresetListProps = {
  guestMode?: boolean;
  hideLoginButtons?: boolean;
};

export default function PresetList({ guestMode = false, hideLoginButtons = false }: PresetListProps) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetListType | null>(null);
  const queryClient = useQueryClient();

  // 実際に使用されているタグのみを取得
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags/active"],
    queryFn: async () => {
      const response = await fetch("/api/tags/active");
      if (!response.ok) throw new Error("Failed to fetch active tags");
      return response.json();
    }
  });

  // Fetch presets with filters
  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["/api/presets", search, tagFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (tagFilter && tagFilter !== "all") params.append("tagId", tagFilter);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/presets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch presets");
      return response.json();
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already applied due to the state change
    if (isMobile) {
      setFilterSheetOpen(false);
    }
  };

  // データの更新用関数
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/presets"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tags"] })
      ]);
      // ページを1に戻して最新のデータを表示
      setPage(1);
    } catch (error) {
      console.error("データの更新に失敗しました:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // アニメーション効果のため少し待機
    }
  };

  // ページネーションの総ページ数（APIからの取得が理想）
  // 今回はクライアント側で計算する方法を使用
  const totalItems = presets?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const shouldShowPagination = totalItems > pageSize;

  const handlePresetClick = (preset: PresetListType) => {
    setSelectedPreset(preset);
    setShowDialog(true);
  };

  // ユーザー認証状態を取得
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });
  
  // ユーザーが存在するかチェック（型安全に処理）
  const isAuthenticated = !!user;

  // モバイル表示
  if (isMobile) {
    return (
      <div className="pb-20 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold mr-2">プリセット一覧</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="relative"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing && <span className="sr-only">更新中...</span>}
            </Button>
          </div>
          <div className="flex space-x-2">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="filter-sheet-trigger">
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[90vw]">
                <SheetHeader>
                  <SheetTitle>検索とフィルター</SheetTitle>
                  <SheetDescription>
                    プリセットを探す条件を設定してください
                  </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSearch} className="mt-6 space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">キーワード検索</label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="キーワードを入力"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">タグで絞り込み</label>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="すべてのタグ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべてのタグ</SelectItem>
                        {tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">並び順</label>
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger>
                        <SelectValue placeholder="並び順" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">作成日順（新しい順）</SelectItem>
                        <SelectItem value="oldest">作成日順（古い順）</SelectItem>
                        <SelectItem value="name">名前順</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <SheetFooter>
                    <SheetClose asChild>
                      <Button type="submit" className="w-full">適用</Button>
                    </SheetClose>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
            {/* 新規作成ボタンは、ゲストモードでない場合か、ログイン済みの場合のみ表示 */}
            {(!guestMode || isAuthenticated) && (
              <Link href="/create">
                <Button size="icon">
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {/* ゲストモードでログインしていない場合、かつhideLoginButtonsがfalseの場合にログインボタンを表示 */}
            {guestMode && !isAuthenticated && !hideLoginButtons && (
              <Link href="/login">
                <Button size="icon" variant="outline">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 現在の検索条件表示 */}
        {(search || tagFilter !== "all") && (
          <div className="flex flex-wrap gap-2 mb-4">
            {search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                {search}
              </Badge>
            )}
            {tagFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                {tags.find(t => t.id.toString() === tagFilter)?.name || 'タグ'}
              </Badge>
            )}
          </div>
        )}

        {/* プリセットリスト */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 h-32 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : presets.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {presets.map((preset: PresetListType) => (
                <PresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900">プリセットが見つかりませんでした</h3>
              <p className="mt-2 text-sm text-gray-500">検索条件を変更するか、新しいプリセットを作成してください。</p>
            </div>
          )}
        </div>

        {/* Simple Pagination for Mobile */}
        {presets.length > 0 && shouldShowPagination && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2">{page} / {totalPages}</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        
        {/* モバイル表示用ニュースフィード（Qiitaスタイル - 下部配置） */}
        <div className="mt-10">
          <NewsFeed />
        </div>

        {/* プリセット詳細ダイアログ */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent aria-describedby="preset-detail-description">
            <DialogHeader>
              <DialogTitle>プリセット詳細</DialogTitle>
              <DialogDescription id="preset-detail-description">
                選択したプリセットの詳細情報です。以下の内容をご確認ください。
              </DialogDescription>
            </DialogHeader>
            {selectedPreset && (
              <div className="mt-4 space-y-4">
                <div className="text-left">
                  <h3 className="font-medium">プリセット名</h3>
                  <p className="text-muted-foreground">{selectedPreset.name}</p>
                </div>
              </div>
            )}
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">閉じる</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // デスクトップ表示
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold mr-2">プリセット一覧</h1>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="relative"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing && <span className="sr-only">更新中...</span>}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* ゲストモードでログインしていない場合、かつhideLoginButtonsがfalseの場合にログインボタンを表示 */}
          {guestMode && !isAuthenticated && !hideLoginButtons && (
            <Link href="/login">
              <Button variant="default">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                ログイン
              </Button>
            </Link>
          )}
          {/* 新規作成ボタンは、ゲストモードでない場合か、ログイン済みの場合のみ表示 */}
          {(!guestMode || isAuthenticated) && (
            <Link href="/create">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                新規作成
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Qiitaスタイルのレイアウト - コンテンツとサイドバー */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* メインコンテンツエリア */}
        <div className="lg:w-3/4">
          {/* Search & Filter */}
          <div className="mb-8 bg-white rounded-lg shadow p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <div className="relative rounded-md shadow-sm">
                  <Input
                    type="text"
                    placeholder="キーワード検索"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/4">
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべてのタグ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのタグ</SelectItem>
                    {tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-1/4">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="並び順" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">作成日順（新しい順）</SelectItem>
                    <SelectItem value="oldest">作成日順（古い順）</SelectItem>
                    <SelectItem value="name">名前順</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Preset Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 h-52 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : presets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {presets.map((preset: PresetListType) => (
                <PresetCard key={preset.id} preset={preset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">プリセットが見つかりませんでした</h3>
              <p className="mt-2 text-sm text-gray-500">検索条件を変更するか、新しいプリセットを作成してください。</p>
            </div>
          )}

          {/* Pagination */}
          {presets.length > 0 && shouldShowPagination && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(pageNum);
                          }}
                          isActive={page === pageNum}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <PaginationItem>
                        <span className="px-4 py-2 pointer-events-none">...</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(totalPages);
                          }}
                          isActive={page === totalPages}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* サイドバー（Qiitaスタイル - デスクトップのみ） */}
        <div className="lg:w-1/4 mt-8 lg:mt-0">
          <div className="sticky top-6">
            <NewsFeed />
          </div>
        </div>
      </div>

      {/* プリセット詳細ダイアログ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent aria-describedby="preset-detail-description-desktop">
          <DialogHeader>
            <DialogTitle>プリセット詳細</DialogTitle>
            <DialogDescription id="preset-detail-description-desktop">
              選択したプリセットの詳細情報です。以下の内容をご確認ください。
            </DialogDescription>
          </DialogHeader>
          {selectedPreset && (
            <div className="mt-4 space-y-4">
              <div className="text-left">
                <h3 className="font-medium">プリセット名</h3>
                <p className="text-muted-foreground">{selectedPreset.name}</p>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline">閉じる</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
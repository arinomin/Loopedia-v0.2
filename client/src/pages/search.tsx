
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PresetCard } from "@/components/ui/card-preset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { PresetList as PresetListType, Tag } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowLeft, Search, Filter, User, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface UserSearchResult {
  id: number;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
}

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("presets");
  const pageSize = 10;
  const isMobile = useIsMobile();

  // URLパラメータからクエリパラメータを取得
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("q");
    const tab = urlParams.get("tab");
    
    if (query) {
      setSearchQuery(query);
    }
    
    if (tab && (tab === "presets" || tab === "users")) {
      setActiveTab(tab);
    }
  }, []);

  // 実際に使用されているタグのみを取得
  const { data: tags = [], isLoading: isLoadingTags } = useQuery<Tag[]>({
    queryKey: ["/api/tags/active"],
    queryFn: async () => {
      const response = await fetch("/api/tags/active");
      if (!response.ok) throw new Error("Failed to fetch active tags");
      return response.json();
    }
  });

  // プリセット検索
  const { data: presets = [], isLoading: isLoadingPresets } = useQuery({
    queryKey: ["/api/presets/search", searchQuery, tagFilter, page, activeTab],
    queryFn: async () => {
      if (!searchQuery && tagFilter === "all" && activeTab === "presets") return [];
      
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (tagFilter && tagFilter !== "all") params.append("tagId", tagFilter);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const response = await fetch(`/api/presets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch presets");
      return response.json();
    },
    enabled: activeTab === "presets" && (!!searchQuery || tagFilter !== "all"),
  });

  // ユーザー検索
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserSearchResult[]>({
    queryKey: ["/api/users-search", searchQuery, page, activeTab],
    queryFn: async () => {
      if (!searchQuery || activeTab !== "users") return [];
      
      const params = new URLSearchParams();
      params.append("query", searchQuery);
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      // 代替APIエンドポイントを使用
      const response = await fetch(`/api/users-search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    enabled: activeTab === "users" && !!searchQuery,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索実行時にURLを更新（ブックマーク可能に）
    const url = new URL(window.location.href);
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("tab", activeTab);
    window.history.pushState({}, "", url.toString());
    
    setPage(1); // 検索実行時にページをリセット
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setTagFilter("all");
    // URLからクエリパラメータを削除
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.history.pushState({}, "", url.toString());
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1); // タブ切り替え時にページをリセット
    
    // タブ変更時にURLを更新
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.pushState({}, "", url.toString());
  };

  return (
    <div className={isMobile ? "px-4 pb-20" : "max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"}>
      {/* ヘッダー */}
      <div className="flex items-center mb-6 gap-2">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">検索</h1>
      </div>

      {/* 検索フォーム */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="プリセット名、タグ、ユーザー名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            {searchQuery && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          <Button type="submit">検索</Button>
        </div>

        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="presets" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>プリセット</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>ユーザー</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presets">
            <div className="mb-4">
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="タグで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのタグ</SelectItem>
                  {isLoadingTags ? (
                    <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                  ) : (
                    tags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id.toString()}>
                        {tag.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* タブコンテンツ */}
      <div>
        {activeTab === "presets" && (
          <>
            {/* プリセット検索結果 */}
            {!searchQuery && tagFilter === "all" ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">キーワードやタグを指定して検索してください</p>
              </div>
            ) : isLoadingPresets ? (
              <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 h-48 animate-pulse">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="flex justify-between items-center mt-6">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : presets.length > 0 ? (
              <div className={isMobile ? "grid grid-cols-1 gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {presets.map((preset: PresetListType) => (
                  <PresetCard key={preset.id} preset={preset} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">プリセットが見つかりませんでした</h3>
                <p className="mt-2 text-sm text-gray-500">別のキーワードでお試しください</p>
              </div>
            )}

            {/* プリセット検索のページネーション */}
            {presets.length > 0 && (
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
                    {isMobile ? (
                      <PaginationItem>
                        <span className="px-2">ページ {page}</span>
                      </PaginationItem>
                    ) : (
                      <>
                        {[...Array(Math.min(5, Math.max(1, presets.length / pageSize)))].map((_, i) => {
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
                      </>
                    )}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(page + 1);
                        }}
                        className={presets.length < pageSize ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}

        {activeTab === "users" && (
          <>
            {/* ユーザー検索結果 */}
            {!searchQuery ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">ユーザー名またはニックネームで検索してください</p>
              </div>
            ) : isLoadingUsers ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg animate-pulse">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <Link key={user.id} href={`/users/${user.id}`}>
                    <div className="flex items-center gap-3 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition border border-gray-100">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {user.nickname?.charAt(0) || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.nickname || user.username}</div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">ユーザーが見つかりませんでした</h3>
                <p className="mt-2 text-sm text-gray-500">別のキーワードでお試しください</p>
              </div>
            )}

            {/* ユーザー検索のページネーション */}
            {users.length > 0 && (
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
                    {isMobile ? (
                      <PaginationItem>
                        <span className="px-2">ページ {page}</span>
                      </PaginationItem>
                    ) : (
                      <>
                        {[...Array(Math.min(5, Math.max(1, users.length / pageSize)))].map((_, i) => {
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
                      </>
                    )}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(page + 1);
                        }}
                        className={users.length < pageSize ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

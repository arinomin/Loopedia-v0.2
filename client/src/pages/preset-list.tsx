import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { PresetCard } from "@/components/ui/card-preset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PresetList as PresetListType, Tag } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlusCircle, Search, Filter, RefreshCw } from "lucide-react";
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

export default function PresetList() {
  const [,  navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const isMobile = useIsMobile();
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["/api/tags/active"],
    queryFn: async () => {
      const response = await fetch("/api/tags/active");
      if (!response.ok) throw new Error("Failed to fetch active tags");
      return response.json();
    }
  });

  const { data: presets = [], isLoading } = useQuery<PresetListType[]>({
    queryKey: ["/api/presets"],
    enabled: !!user,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMobile) {
      setFilterSheetOpen(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/presets"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/tags"] })
      ]);
    } catch (error) {
      console.error("データの更新に失敗しました:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  let filteredPresets = [...presets];
  
  if (search) {
    filteredPresets = filteredPresets.filter(preset =>
      preset.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (tagFilter && tagFilter !== "all") {
    filteredPresets = filteredPresets.filter(preset =>
      preset.tags.some(tag => tag.id.toString() === tagFilter)
    );
  }

  filteredPresets.sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortOrder === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  if (isMobile) {
    return (
      <div className="pb-20 px-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold mr-2">マイプリセット</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              className="relative"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" data-testid="button-filter">
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
                        data-testid="input-search"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">タグで絞り込み</label>
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger data-testid="select-tag-filter">
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
                      <SelectTrigger data-testid="select-sort-order">
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
            <Link href="/create">
              <Button size="icon" data-testid="button-create">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {!isLoading && filteredPresets.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <p className="text-lg text-muted-foreground mb-4">
              {search || tagFilter !== "all" 
                ? "条件に一致するプリセットが見つかりませんでした" 
                : "プリセットがまだありません"}
            </p>
            {!search && tagFilter === "all" && (
              <Link href="/create">
                <Button data-testid="button-create-first">
                  <PlusCircle className="h-5 w-5 mr-2" />
                  最初のプリセットを作成
                </Button>
              </Link>
            )}
          </div>
        )}

        {!isLoading && filteredPresets.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {filteredPresets.map((preset) => (
              <Link key={preset.id} href={`/presets/${preset.id}`}>
                <PresetCard preset={preset} />
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold mr-3">マイプリセット</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <Link href="/create">
          <Button data-testid="button-create">
            <PlusCircle className="h-5 w-5 mr-2" />
            新規作成
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger data-testid="select-tag-filter">
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
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger data-testid="select-sort-order">
            <SelectValue placeholder="並び順" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">作成日順（新しい順）</SelectItem>
            <SelectItem value="oldest">作成日順（古い順）</SelectItem>
            <SelectItem value="name">名前順</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}

      {!isLoading && filteredPresets.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-lg text-muted-foreground mb-4">
            {search || tagFilter !== "all" 
              ? "条件に一致するプリセットが見つかりませんでした" 
              : "プリセットがまだありません"}
          </p>
          {!search && tagFilter === "all" && (
            <Link href="/create">
              <Button data-testid="button-create-first">
                <PlusCircle className="h-5 w-5 mr-2" />
                最初のプリセットを作成
              </Button>
            </Link>
          )}
        </div>
      )}

      {!isLoading && filteredPresets.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => (
            <Link key={preset.id} href={`/presets/${preset.id}`}>
              <PresetCard preset={preset} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

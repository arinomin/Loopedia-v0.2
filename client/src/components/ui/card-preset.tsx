import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { formatDate } from "@/lib/utils";
import { PresetList } from "@shared/schema";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Bookmark } from "lucide-react";
import { usePresetReactions } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { UserBadge } from "@/components/user-badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PresetCardProps {
  preset: PresetList;
}

export function PresetCard({ preset }: PresetCardProps) {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // 現在のユーザー情報を取得
  const { data: currentUser } = useQuery<{ id: number; username: string } | null>({
    queryKey: ["/api/auth/me"],
  });

  // いいね・ブックマーク関連のフック
  // ここで最新のpretデータも取得する
  const { 
    toggleLike, 
    isTogglingLike, 
    toggleBookmark, 
    isTogglingBookmark,
    preset: latestPreset
  } = usePresetReactions(preset.id);

  // 最新データを優先的に使用 (型アサーション付き)
  const presetData = (latestPreset || preset) as PresetList;

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // クリックされた要素がLink（タグやユーザー名）の中にないか確認
    const target = e.target as HTMLElement;
    const isLinkClick = target.closest('a') || target.closest('span[role="button"]') || target.closest('button');

    // リンククリックでない場合のみプリセット詳細に移動
    if (!isLinkClick) {
      navigate(`/presets/${presetData.id}`);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントを防ぐ

    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "いいねするにはログインしてください。",
        variant: "destructive",
      });
      return;
    }

    toggleLike();
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントを防ぐ

    if (!currentUser) {
      toast({
        title: "ログインが必要です",
        description: "ブックマークするにはログインしてください。",
        variant: "destructive",
      });
      return;
    }

    toggleBookmark();
  };

  return (
    <Card 
      className={`bg-white overflow-hidden hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer ${
        isMobile ? 'mb-4' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className={`${isMobile ? "p-4 pb-2" : "p-6 pb-3"}`}>
        {/* ユーザー情報をプリセット名の上に配置 */}
        <div className="mb-1.5 flex items-center">
          <div className="flex-shrink-0 mr-1.5">
            {presetData.user.avatarUrl ? (
              <img 
                src={presetData.user.avatarUrl} 
                alt={presetData.user.nickname || presetData.user.username}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                {(presetData.user.nickname || presetData.user.username).substring(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <Link 
            href={`/users/${presetData.user.id}`} 
            className="hover:text-primary text-sm flex items-center"
            onClick={(e) => e.stopPropagation()} 
          >
            <UserBadge 
              user={presetData.user} 
              showUsername={false} 
              showNickname={true}
              size="xs" 
            />
          </Link>
        </div>

        <h3 className="text-lg leading-6 font-medium text-foreground">
          <Link href={`/presets/${presetData.id}`} className="hover:text-primary">
            {presetData.name}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap gap-2">
          {/* タイプをタグとして表示 */}
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
            {presetData.type}
          </Badge>

          {presetData.tags.map((tag) => (
            <Badge 
              key={tag.id} 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/20 cursor-pointer"
              role="button"
              onClick={(e) => {
                e.stopPropagation(); // カードのクリックイベントを防ぐ
                // タグフィルター機能が追加されたらここでタグ検索結果に飛ぶ
                console.log(`Filter by tag: ${tag.name}`);
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
        <div className="mt-2">
            {/* 作成日時を小さく薄く表示 */}
            <div className="flex items-center">
              <span className="text-xs text-gray-400 font-light">{formatDate(presetData.createdAt)}</span>
            </div>
          </div>
      </CardContent>

      <CardFooter className={`${isMobile ? "px-4 pt-0 pb-2" : "px-6 pt-0 pb-4"} flex justify-between border-t border-gray-100 mt-1`}>
        <div className="flex space-x-2">
          {/* いいねボタン */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 h-8 px-2"
                  onClick={handleLikeClick}
                  disabled={isTogglingLike}
                >
                  <Heart
                    className={`h-4 w-4 ${
                      presetData.isLiked ? "fill-red-500 text-red-500" : "text-gray-500"
                    }`}
                  />
                  <span className="text-xs">{presetData.likeCount || 0}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{presetData.isLiked ? "いいねを取り消す" : "いいね"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* ブックマークボタン */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1 h-8 px-2"
                  onClick={handleBookmarkClick}
                  disabled={isTogglingBookmark}
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      presetData.isBookmarked ? "fill-blue-500 text-blue-500" : "text-gray-500"
                    }`}
                  />
                  <span className="text-xs">{presetData.bookmarkCount || 0}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{presetData.isBookmarked ? "ブックマークを取り消す" : "ブックマーク"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/presets/${presetData.id}`);
          }}
        >
          詳細を見る
        </Button>
      </CardFooter>
    </Card>
  );
}
import { useState, useEffect } from "react";
import { News } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PinIcon, ExternalLinkIcon, CalendarIcon } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ja } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";

export function NewsFeed() {
  console.log("NewsFeedコンポーネントがマウントされました");
  const isMobile = useIsMobile();
  
  // APIからニュースを取得
  const { data: newsItems, isLoading, isError } = useQuery({
    queryKey: ["/api/news"],
    queryFn: async () => {
      const res = await fetch("/api/news", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include"
      });
      
      if (!res.ok) {
        throw new Error(`ニュースの取得に失敗しました: ${res.status}`);
      }
      
      return await res.json();
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5分ごとに自動更新
    retry: 2,
  });
  
  // 取得したニュースデータをピン留め/通常に分類
  const pinnedNews: News[] = newsItems?.filter((news: News) => news.pinned) || [];
  const regularNews: News[] = newsItems?.filter((news: News) => !news.pinned) || [];
  
  // 全てのニュースを結合（ピン留めを先頭に）
  const allNews = [...pinnedNews, ...regularNews].slice(0, 10); // 最大10件まで表示
  
  console.log("ニュースデータの状態:", {
    isLoading,
    isError,
    pinnedCount: pinnedNews.length,
    regularCount: regularNews.length,
    finalDataCount: allNews.length
  });

  // ローディング状態の表示
  if (isLoading && !isError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>お知らせ</h2>
        </div>
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className={`pb-2 ${isMobile ? 'p-3' : 'p-4'}`}>
              <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded-md w-1/3 mt-2"></div>
            </CardHeader>
            <CardContent className={isMobile ? 'p-3 pt-0' : 'pt-0'}>
              <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 空の状態の表示
  if (allNews.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>お知らせ</h2>
        <Card>
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center text-muted-foreground`}>
            現在お知らせはありません
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold`}>お知らせ</h2>
        {pinnedNews.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <PinIcon className="h-3 w-3 mr-1 opacity-70" />
            {pinnedNews.length}件の固定表示
          </Badge>
        )}
      </div>
      <div className="space-y-3">
        {allNews.map((newsItem) => (
          <NewsItem key={newsItem.id} newsItem={newsItem} />
        ))}
      </div>
    </div>
  );
}

function NewsItem({ newsItem }: { newsItem: News }) {
  const isMobile = useIsMobile();
  
  // NewsItem内の日付処理を安全に行う
  const createdAtDate = new Date(newsItem.createdAt);
  
  // Format date as "x days ago" in Japanese
  const relativeDate = formatDistanceToNow(createdAtDate, { 
    addSuffix: true,
    locale: ja 
  });
  
  // Format exact date
  const exactDate = format(createdAtDate, 'yyyy年MM月dd日', { locale: ja });

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md 
        ${newsItem.pinned ? "border-primary border-2 bg-primary/5" : ""}
      `}
    >
      <CardHeader className={`pb-2 relative ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} font-bold`}>
            {newsItem.title}
          </CardTitle>
          {newsItem.pinned && (
            <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30 shrink-0">
              <PinIcon className="h-3 w-3 mr-1" />
              固定
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center text-xs mt-1">
          <CalendarIcon className="h-3 w-3 mr-1 opacity-70" />
          <span title={exactDate}>{relativeDate}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className={isMobile ? 'p-3 pt-0 text-sm' : 'pt-0'}>
        <p className="whitespace-pre-wrap leading-relaxed">{newsItem.content}</p>
      </CardContent>
      
      {newsItem.linkUrl && (
        <CardFooter className={isMobile ? 'p-3 pt-0' : 'pt-0'}>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs hover:bg-primary/10 transition-colors" 
            asChild
          >
            <a 
              href={newsItem.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              {newsItem.linkText || "詳細を見る"}
              <ExternalLinkIcon className="h-3 w-3 ml-1" />
            </a>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
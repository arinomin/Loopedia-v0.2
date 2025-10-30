import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  title: string;
  description?: string;
  url: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
}

export function SocialShare({
  title,
  description,
  url,
  variant = "outline",
  size = "default",
}: SocialShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = description ? encodeURIComponent(description) : "";

  // ニックネームとプリセット名を取得（URL内の特殊文字に対応するためエンコード）
  const encodedNickname = encodeURIComponent(
    description?.split("さんが作成した")[0] || "ユーザー",
  );
  const encodedPresetName = encodeURIComponent(
    title.replace("RC505mk2プリセット 「", "").replace("」", ""),
  );

  // 改行は %0A でエンコード
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedNickname}さんが、「${encodedPresetName}」を共有しました！%0A${encodedUrl}&via=your_account_id&hashtags=RC505,Loopedia&in_reply_to=YOUR_TWEET_ID`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URLをコピーしました",
        duration: 1500,
      });
    } catch (err) {
      console.error("クリップボードへのコピーに失敗しました:", err);
      toast({
        title: "コピーに失敗しました",
        description: "再度お試しください",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Share2 className="h-4 w-4 mr-2" />
          共有
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>プリセットを共有</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            このプリセットをSNSで共有するか、リンクをコピーして友達に送ろう！
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-[#1DA1F2] text-white hover:bg-[#1DA1F2]/90 h-10 py-2 px-4"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </a>
            <a
              href={shareUrls.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-[#1877F2] text-white hover:bg-[#1877F2]/90 h-10 py-2 px-4"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </a>
            <Button
              onClick={copyToClipboard}
              className="inline-flex items-center justify-center"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              URLをコピー
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

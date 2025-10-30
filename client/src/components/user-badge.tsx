import React from "react";
import { User } from "@shared/schema";
import DevBadgeImg from "../assets/badges/DevBadge.png";
import LoopBadgeImg from "../assets/badges/LoopBadge.png";

type UserBadgeProps = {
  user: Partial<User> & { isAdmin?: boolean };
  size?: "sm" | "md" | "lg";
  showUsername?: boolean;
  showNickname?: boolean;
  className?: string;
};

/**
 * UserBadge コンポーネント - ユーザー名の横にバッジを表示する
 * isAdmin が true の場合は管理者バッジ (DevBadge) を表示
 * isVerified が true の場合は認証済みバッジ (LoopBadge) を表示
 */
export function UserBadge({ 
  user, 
  size = "md", 
  showUsername = true, 
  showNickname = true, 
  className = "" 
}: UserBadgeProps) {
  if (!user) return null;
  
  // ユーザーがadminかどうかをチェック
  const isAdmin = user.isAdmin || user.username === "admin";
  
  // サイズに応じたスタイルを設定
  const getBadgeSize = () => {
    switch (size) {
      case "sm":
        return "w-5 h-5";
      case "lg":
        return "w-6 h-6";
      case "md":
      default:
        return "w-8 h-8";
    }
  };

  const badgeSize = getBadgeSize();
  
  // 表示名（ニックネームかユーザー名）を決定
  const displayName = (showNickname && user.nickname) || (showUsername && user.username) || "";

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="sm:text-base text-sm max-w-full break-words">{displayName}</span>
      {isAdmin && (
        <img 
          src={DevBadgeImg}
          className={`ml-1 ${badgeSize} object-contain`}
          title="管理者"
          alt="管理者バッジ"
        />
      )}
      {!isAdmin && user.isVerified && (
        <img
          src={LoopBadgeImg}
          className={`ml-1 ${badgeSize} object-contain`}
          title="認証済みユーザー"
          alt="認証済みバッジ"
        />
      )}
    </span>
  );
}
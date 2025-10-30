import { useState, useEffect } from 'react';

// モバイルかどうかを判断するフック
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // 初期状態をセット
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px未満をモバイルと判断
    };

    // 初回チェック
    checkMobile();

    // リサイズイベントリスナー
    window.addEventListener('resize', checkMobile);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return isMobile;
}
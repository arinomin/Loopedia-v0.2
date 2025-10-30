import React from "react";

interface NoteImageProps {
  path: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * 音符画像を表示するコンポーネント
 * PNG形式の音符画像を表示
 *
 * @param path 音符の名前またはパス（notes1, notes2, notes3, notes4など）
 * @param alt 代替テキスト
 * @param className 追加のCSSクラス
 */
export function NoteImage({ path, alt = "", className = "" }: NoteImageProps) {
  // パスから音符ID（notes1, notes2, ...）またはMEAS値（4MEAS, 2MEAS, 1MEAS）を抽出
  let noteId = path;

  // "notes数字" パターンの検出
  const notesMatch = path.match(/notes(\d+)/);
  if (notesMatch) {
    noteId = `notes${notesMatch[1]}`;
  }
  // MEASは直接テキスト表示するため、画像は使用しない

  // PNG画像のパスを取得
  const imagePath = notesMatch ? `/src/assets/notes/${noteId}.png` : path;

  // MEASパターンの場合はテキスト表示
  if (path.match(/^\d+MEAS$/)) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <span className="text-center font-mono">{path}</span>
      </div>
    );
  }

  // PNG画像を表示
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={imagePath}
        alt={alt || noteId}
        className="object-contain max-w-full max-h-full"
      />
    </div>
  );
}

/**
 * 音符画像を表示するコンポーネント（インライン用・小さいサイズ）
 */
export function NoteInlineImage({
  path,
  alt = "",
  className = "",
}: Omit<NoteImageProps, "width" | "height">) {
  // パスから音符ID（notes1, notes2, ...）を抽出
  let noteId = path;

  // "notes数字" パターンの検出
  const notesMatch = path.match(/notes(\d+)/);
  if (notesMatch) {
    noteId = `notes${notesMatch[1]}`;
  }

  // PNG画像のパスを取得
  const imagePath = notesMatch ? `/src/assets/notes/${noteId}.png` : path;

  // MEASパターンの場合はテキスト表示
  if (path.match(/^\d+MEAS$/)) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <span className="text-center font-mono text-sm">{path}</span>
      </div>
    );
  }

  // PNG画像を表示
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src={imagePath}
        alt={alt || noteId}
        className="h-[1.1em] inline-block align-middle"
      />
    </div>
  );
}
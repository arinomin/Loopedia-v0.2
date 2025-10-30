/**
 * 音符画像のパス情報を提供するファイル
 * このファイルは音符画像のパスを管理し、SVG/PNG画像への参照を提供します
 */

import { getNoteImage as getAssetNoteImage } from '@/assets/note-images';

// SVG音符ファイルを使用する
export const useSvgNotes = true;

/**
 * 音符画像のパス情報
 * キー: 音符ID（notes1, notes2, ...）
 * 値: 画像のPath
 */
export const noteImagePaths: Record<string, string> = {
  notes1: "/images/notes_svg/notes1.svg",
  notes2: "/images/notes_svg/notes2.svg",
  notes3: "/images/notes_svg/notes3.svg",
  notes4: "/images/notes_svg/notes4.svg",
  notes5: "/images/notes_svg/notes5.svg",
  notes6: "/images/notes_svg/notes6.svg",
  notes7: "/images/notes_svg/notes7.svg",
  notes8: "/images/notes_svg/notes8.svg",
  notes9: "/images/notes_svg/notes9.svg",
  notes10: "/images/notes_svg/notes10.svg",
  notes11: "/images/notes_svg/notes11.svg"
};

/**
 * PNG形式の音符パス（フォールバック用）
 */
export const pngNoteImagePaths: Record<string, string> = {
  notes1: "/images/notes/notes1.png",
  notes2: "/images/notes/notes2.png",
  notes3: "/images/notes/notes3.png",
  notes4: "/images/notes/notes4.png",
  notes5: "/images/notes/notes5.png",
  notes6: "/images/notes/notes6.png",
  notes7: "/images/notes/notes7.png",
  notes8: "/images/notes/notes8.png",
  notes9: "/images/notes/notes9.png",
  notes10: "/images/notes/notes10.png",
  notes11: "/images/notes/notes11.png"
};

// 音符画像のプレースホルダーコンテンツ
// Base64エンコードした小さなSVG（必要に応じて）
export const noteImagePlaceholders: Record<string, string> = {
  // 2分音符
  notes1: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==`,
  
  // 付点4分音符
  notes2: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMSIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+`,
  
  // 3連符の2分音符
  notes3: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSAxMmExIDEgMCAxMS0yIDAgMSAxIDAgMDEyIDB6IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTggM3YxMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEyIDd2MyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjE0IiB5PSI5IiBmb250LXNpemU9IjYiIGZpbGw9ImN1cnJlbnRDb2xvciI+MzwvdGV4dD48L3N2Zz4=`,
  
  // 4分音符
  notes4: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjwvc3ZnPg==`,
  
  // 音符プレースホルダーの追加（notes5〜notes11）
  notes5: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iOSIgcj0iMSIgZmlsbD0iY3VycmVudENvbG9yIi8+PC9zdmc+`,
  
  notes6: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSAxMmExIDEgMCAxMS0yIDAgMSAxIDAgMDEyIDB6IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTggM3YxMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEyIDd2MyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjE0IiB5PSI5IiBmb250LXNpemU9IjYiIGZpbGw9ImN1cnJlbnRDb2xvciI+MzwvdGV4dD48L3N2Zz4=`,
  
  notes7: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xMiA2bDMgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PC9zdmc+`,
  
  notes8: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xMiA2bDMgMyIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PGNpcmNsZSBjeD0iMTQiIGN5PSI2IiByPSIxIiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3N2Zz4=`,
  
  notes9: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNOSAxMmExIDEgMCAxMS0yIDAgMSAxIDAgMDEyIDB6IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0iY3VycmVudENvbG9yIi8+PHBhdGggZD0iTTggM3YxMSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEyIDZsMiAyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48dGV4dCB4PSIxNSIgeT0iOSIgZm9udC1zaXplPSI2IiBmaWxsPSJjdXJyZW50Q29sb3IiPjM8L3RleHQ+PC9zdmc+`,
  
  notes10: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xMiA2bDIgMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEyIDhsMiAyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=`,
  
  notes11: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAgMTJhMSAxIDAgMTEtMiAwIDEgMSAwIDAxMiAweiIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9ImN1cnJlbnRDb2xvciIvPjxwYXRoIGQ9Ik05IDN2MTEiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxwYXRoIGQ9Ik0xMiA2bDIgMiIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHBhdGggZD0iTTEyIDhsMiAyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cGF0aCBkPSJNMTIgMTBsMiAyIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48L3N2Zz4=`
};


/**
 * 音符IDから画像パスを取得する関数
 * @param noteId 音符ID (notes1, notes2, ...) または任意のパスから抽出
 * @param forcePng PNG画像のパスを強制的に取得する場合はtrue
 * @returns 画像パス（SVGかPNG）
 */
export function getNoteImagePath(noteId: string, forcePng: boolean = false): string | undefined {
  if (!noteId) return undefined;

  // 1. まず新しいassets/note-images.tsからパスを取得を試みる
  const assetPath = getAssetNoteImage(noteId);
  if (assetPath) return assetPath;

  // パターンの抽出 (notes1, notes2, ...)
  const match = noteId.match(/notes(\d+)/);
  if (!match) {
    // パスがすでに完全な形式の場合はそのまま返す
    if (noteId.startsWith('/') || noteId.startsWith('data:')) {
      return noteId;
    }
    return undefined;
  }

  const number = match[1];
  const key = `notes${number}` as keyof typeof noteImagePaths;

  // SVGとPNGのどちらを使用するか
  if (forcePng || !useSvgNotes) {
    return pngNoteImagePaths[key];
  } else {
    // プレースホルダーに基本的なSVGデータURIを提供
    if (key in noteImagePlaceholders && !(key in noteImagePaths)) {
      return noteImagePlaceholders[key as keyof typeof noteImagePlaceholders];
    }
    return noteImagePaths[key];
  }
}

/**
 * 音符ID文字列が有効かチェックする関数
 * @param noteId チェックする音符ID文字列
 * @returns 有効な音符IDの場合はtrue
 */
export function isValidNoteId(noteId: string): boolean {
  if (noteId.startsWith('/') || noteId.startsWith('data:')) {
    return true;
  }
  return noteId in noteImagePaths || noteId in pngNoteImagePaths || noteId in noteImagePlaceholders;
}
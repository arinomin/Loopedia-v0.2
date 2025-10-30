
// 直接公開URLパスを使用
const notes1Image = '/src/assets/notes/notes1.png';
const notes2Image = '/src/assets/notes/notes2.png';
const notes3Image = '/src/assets/notes/notes3.png';
const notes4Image = '/src/assets/notes/notes4.png';
const notes5Image = '/src/assets/notes/notes5.png';
const notes6Image = '/src/assets/notes/notes6.png';
const notes7Image = '/src/assets/notes/notes7.png';
const notes8Image = '/src/assets/notes/notes8.png';
const notes9Image = '/src/assets/notes/notes9.png';
const notes10Image = '/src/assets/notes/notes10.png';
const notes11Image = '/src/assets/notes/notes11.png';

// 画像のマッピング
export const noteImages = {
  notes1: notes1Image,
  notes2: notes2Image,
  notes3: notes3Image,
  notes4: notes4Image,
  notes5: notes5Image,
  notes6: notes6Image,
  notes7: notes7Image,
  notes8: notes8Image,
  notes9: notes9Image,
  notes10: notes10Image,
  notes11: notes11Image,
};

// 音符IDから画像を取得する関数
export function getNoteImage(noteId: string): string | undefined {
  // 'notes数字' 形式かチェック
  const match = noteId.match(/notes(\d+)/);
  if (match) {
    const key = `notes${match[1]}` as keyof typeof noteImages;
    return noteImages[key];
  }
  return undefined;
}

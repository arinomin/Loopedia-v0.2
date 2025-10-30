import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// アップロードされたファイルの保存先ディレクトリを作成
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

// ディレクトリが存在しない場合は作成（実行時にも確認する）
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory:', uploadsDir);
  }
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
    console.log('Created avatars directory:', avatarsDir);
  }
  console.log('Upload directories verified:', {
    uploadsDir,
    avatarsDir,
    uploadsExists: fs.existsSync(uploadsDir),
    avatarsExists: fs.existsSync(avatarsDir)
  });
} catch (error) {
  console.error('Error creating upload directories:', error);
}

// ストレージ設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'avatar') {
      cb(null, avatarsDir);
    } else {
      cb(null, uploadsDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// ファイルフィルタリング
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 画像ファイルのみ許可 (JPEG, PNG, GIF)
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('画像ファイルのみアップロード可能です'));
  }
};

// 5MBのサイズ制限
const limits = {
  fileSize: 5 * 1024 * 1024 // 5MB
};

// アバター用のアップローダー
export const avatarUpload = multer({
  storage,
  fileFilter,
  limits
}).single('avatar');

// 一般ファイル用のアップローダー
export const fileUpload = multer({
  storage,
  limits
}).single('file');
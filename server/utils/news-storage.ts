import fs from 'fs';
import path from 'path';
import { News, InsertNews } from '@shared/schema';

// JSONファイルのパス
const NEWS_FILE_PATH = path.join(process.cwd(), 'data', 'news.json');

// ファイルの存在確認と初期化
export function ensureNewsFileExists() {
  if (!fs.existsSync(path.dirname(NEWS_FILE_PATH))) {
    fs.mkdirSync(path.dirname(NEWS_FILE_PATH), { recursive: true });
  }
  
  if (!fs.existsSync(NEWS_FILE_PATH)) {
    fs.writeFileSync(NEWS_FILE_PATH, '[]', 'utf8');
    console.log(`News file created at: ${NEWS_FILE_PATH}`);
  } else {
    console.log(`News file exists at: ${NEWS_FILE_PATH}`);
  }
}

// ニュース一覧の取得
export async function getAllNews(options?: { pinned?: boolean, limit?: number, offset?: number }): Promise<News[]> {
  try {
    ensureNewsFileExists();
    
    const jsonData = fs.readFileSync(NEWS_FILE_PATH, 'utf8');
    let newsItems: News[] = JSON.parse(jsonData);
    
    console.log(`読み込まれたニュース項目: ${newsItems.length}件`);
    
    // 作成日順に並べ替え（新しい順）- 日付文字列の比較
    newsItems.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    // 固定表示のフィルタリング
    if (options?.pinned !== undefined) {
      newsItems = newsItems.filter(item => item.pinned === options.pinned);
      console.log(`ピン留めフィルター (${options.pinned}) 適用後: ${newsItems.length}件`);
    }
    
    // ページネーション
    if (options?.offset !== undefined && options?.limit !== undefined) {
      newsItems = newsItems.slice(options.offset, options.offset + options.limit);
    } else if (options?.limit !== undefined) {
      newsItems = newsItems.slice(0, options.limit);
    }
    
    if (options?.limit || options?.offset) {
      console.log(`ページネーション適用後: ${newsItems.length}件`);
    }
    
    return newsItems;
  } catch (error) {
    console.error('Error reading news file:', error);
    return [];
  }
}

// 特定のニュースの取得
export async function getNewsById(id: number): Promise<News | undefined> {
  try {
    const newsItems = await getAllNews();
    return newsItems.find(item => item.id === id);
  } catch (error) {
    console.error('Error getting news by ID:', error);
    return undefined;
  }
}

// 新しいニュースの作成
export async function createNews(newsData: InsertNews): Promise<News> {
  try {
    ensureNewsFileExists();
    
    const jsonData = fs.readFileSync(NEWS_FILE_PATH, 'utf8');
    const newsItems: News[] = JSON.parse(jsonData);
    
    // 新しいIDを割り当て
    const newId = newsItems.length > 0 
      ? Math.max(...newsItems.map(item => item.id)) + 1 
      : 1;
    
    const newNews: News = {
      id: newId,
      title: newsData.title,
      content: newsData.content,
      linkText: newsData.linkText || null,
      linkUrl: newsData.linkUrl || null,
      pinned: newsData.pinned || false,
      userId: newsData.userId || null,
      createdAt: new Date().toISOString(),
    };
    
    newsItems.push(newNews);
    
    fs.writeFileSync(NEWS_FILE_PATH, JSON.stringify(newsItems, null, 2), 'utf8');
    
    return newNews;
  } catch (error) {
    console.error('Error creating news:', error);
    throw error;
  }
}

// ニュースの更新
export async function updateNews(id: number, newsData: Partial<InsertNews>): Promise<News | undefined> {
  try {
    ensureNewsFileExists();
    
    const jsonData = fs.readFileSync(NEWS_FILE_PATH, 'utf8');
    const newsItems: News[] = JSON.parse(jsonData);
    
    const newsIndex = newsItems.findIndex(item => item.id === id);
    if (newsIndex === -1) {
      return undefined;
    }
    
    // 更新データを既存のニュースに適用
    const updatedNews: News = {
      ...newsItems[newsIndex],
      ...newsData,
      // createdAtは更新しない
    };
    
    newsItems[newsIndex] = updatedNews;
    
    fs.writeFileSync(NEWS_FILE_PATH, JSON.stringify(newsItems, null, 2), 'utf8');
    
    return updatedNews;
  } catch (error) {
    console.error('Error updating news:', error);
    throw error;
  }
}

// ニュースの削除
export async function deleteNews(id: number): Promise<boolean> {
  try {
    ensureNewsFileExists();
    
    const jsonData = fs.readFileSync(NEWS_FILE_PATH, 'utf8');
    const newsItems: News[] = JSON.parse(jsonData);
    
    const newsIndex = newsItems.findIndex(item => item.id === id);
    if (newsIndex === -1) {
      return false;
    }
    
    // 指定されたIDのニュースを削除
    newsItems.splice(newsIndex, 1);
    
    fs.writeFileSync(NEWS_FILE_PATH, JSON.stringify(newsItems, null, 2), 'utf8');
    
    return true;
  } catch (error) {
    console.error('Error deleting news:', error);
    throw error;
  }
}

// ニュースの固定表示切り替え
export async function toggleNewsPin(id: number): Promise<News | undefined> {
  try {
    ensureNewsFileExists();
    
    const jsonData = fs.readFileSync(NEWS_FILE_PATH, 'utf8');
    const newsItems: News[] = JSON.parse(jsonData);
    
    const newsIndex = newsItems.findIndex(item => item.id === id);
    if (newsIndex === -1) {
      return undefined;
    }
    
    // 固定表示状態を反転
    newsItems[newsIndex].pinned = !newsItems[newsIndex].pinned;
    
    fs.writeFileSync(NEWS_FILE_PATH, JSON.stringify(newsItems, null, 2), 'utf8');
    
    return newsItems[newsIndex];
  } catch (error) {
    console.error('Error toggling news pin:', error);
    throw error;
  }
}
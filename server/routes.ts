import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import { z } from "zod";
import path from "path";
import { 
  insertUserSchema, insertPresetSchema, insertCommentSchema, insertEffectSchema,
  updateUserProfileSchema, insertUserLooperSchema,
  updateContactSchema, insertNewsSchema, insertTitleSchema, insertUserTitleSchema,
  users, presets, effects, comments, likes, bookmarks, tags, presetTags, userLoopers,
  userFollows, notifications, userSettings, titles, userTitles
} from "@shared/schema";
import { configurePassport, hashPassword, verifyPassword } from "./auth";
import passport from "passport";
import MemoryStore from "memorystore";
import { avatarUpload } from "./utils/upload";
import { eq, gt, and, or, like, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  createContact, 
  getAllContacts, 
  getContactById, 
  updateContactStatus,
  addReplyToContact,
  getContactsByUserId,
  getRepliesByContactId
} from './utils/contactsJson';
import * as newsStorage from './utils/news-storage';

// 安定したセッション管理のためのセッションストアを設定
const SessionStore = MemoryStore(session);
// 環境変数からセッションシークレットキーを取得し、バックアップとしての値も設定
const SESSION_SECRET = process.env.SESSION_SECRET || "loopedia-session-secret-key-for-authentication";

const requireAuth = (req: Request, res: Response, next: Function) => {
  console.log("Auth check - Session ID:", req.sessionID);
  console.log("Auth check - isAuthenticated:", req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log("Authentication required but user is not logged in");
    return res.status(401).json({ message: "認証が必要です。ログインしてください。" });
  }
  
  console.log("User authenticated:", (req.user as any).username);
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // ニュースファイルの初期化とサンプルニュースの追加
  const initializeNewsStorage = async () => {
    try {
      // ニュースファイルの存在確認
      newsStorage.ensureNewsFileExists();
      
      // 既存のニュースをチェック
      const existingNews = await newsStorage.getAllNews();
      if (existingNews.length === 0) {
        console.log("サンプルニュースを作成します");
        
        // サンプルニュースを追加
        await newsStorage.createNews({
          title: "Loopediaへようこそ！",
          content: "Loopediaは、RC505mk2のプリセットを共有・探索できるプラットフォームです。皆さんの素晴らしいサウンドを世界中のループステーションユーザーと共有しましょう！",
          pinned: true,
          userId: null,
          linkText: null,
          linkUrl: null
        });
        
        await newsStorage.createNews({
          title: "新機能: ユーザータイトル機能",
          content: "活動や貢献に応じて獲得できるユーザータイトル機能を追加しました。プリセットを投稿したり、コメントしたりして、様々なタイトルを獲得しましょう！",
          pinned: false,
          userId: null,
          linkText: null,
          linkUrl: null
        });
        
        await newsStorage.createNews({
          title: "RC505mk2 ファームウェアアップデート",
          content: "BOSS社からRC505mk2の新しいファームウェアがリリースされました。新しいエフェクトや機能改善が含まれています。",
          pinned: false,
          userId: null,
          linkText: "詳細を見る",
          linkUrl: "https://www.boss.info/jp/"
        });
        
        console.log("サンプルニュースの作成が完了しました");
      } else {
        console.log(`既存のニュースが${existingNews.length}件見つかりました`);
      }
    } catch (error) {
      console.error("ニュースストレージの初期化に失敗しました:", error);
    }
  };
  
  // アプリケーション起動時にニュースストレージを初期化
  initializeNewsStorage();
  // PWAファイル用の明示的なルート設定
  app.get('/service-worker.js', (req, res) => {
    console.log('Serving service-worker.js directly');
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(process.cwd(), 'public', 'service-worker.js'));
  });
  
  app.get('/manifest.json', (req, res) => {
    console.log('Serving manifest.json directly');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(process.cwd(), 'public', 'manifest.json'));
  });
  // Set up session middleware with improved settings for production
  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'production' : 'development'} mode`);
  console.log(`Session secret length: ${SESSION_SECRET.length} characters`);
  
  // Robust session store configuration
  const sessionStore = new SessionStore({
    checkPeriod: 86400000, // プルーニング間隔: 1日
    stale: false, // 期限切れセッションを強制的に保持
    ttl: 14 * 24 * 60 * 60 * 1000, // TTL: 14日
  });
  
  // セッションストアの状態監視
  setInterval(() => {
    try {
      // @ts-ignore: メモリストアの内部プロパティにアクセス
      const sessionCount = Object.keys(sessionStore.sessions || {}).length;
      console.log(`Active sessions in store: ${sessionCount}`);
    } catch (e) {
      console.error('Failed to check session count:', e);
    }
  }, 60000); // 1分ごとにセッション数をログ出力
  
  // クロスオリジンリクエストのサポートを追加
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      console.log(`CORS request detected from: ${origin}`);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
    }
    next();
  });

  app.use(
    session({
      secret: SESSION_SECRET,
      resave: true, // クライアントが接続するたびにセッションを更新
      rolling: true, // リクエストのたびにcookie.maxAgeをリセット
      saveUninitialized: false, // 初期化されていないセッションは保存しない
      // Cookieの設定を環境に応じて適応
      cookie: {
        // 開発環境では secure: false に設定
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // JavaScriptからのアクセスを防止
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30日間の有効期限に延長
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 環境に応じて設定
        path: '/', // すべてのパスでアクセス可能に
      },
      store: sessionStore,
      name: 'loopedia.sid', // 明示的なセッション名
      unset: 'destroy', // ログアウト時にセッションを完全に削除
      proxy: true // プロキシ経由を許可（Replit環境での動作向上）
    })
  );

  // Initialize passport
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    console.log("Login attempt for username:", req.body.username);
    
    // ユーザー名とパスワードの入力チェック
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "ユーザー名とパスワードを入力してください" });
    }
    
    passport.authenticate("local", (err: Error, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      if (!user) {
        console.log("Authentication failed:", info?.message || "Unknown reason");
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return next(err);
        }
        
        // セッションを明示的に保存（非同期処理）
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return next(saveErr);
          }
          
          // セッションIDとセッション内容をログに出力（デバッグ用）
          console.log(`User logged in successfully: ${user.username} (Session ID: ${req.sessionID})`);
          console.log(`Session cookie set: ${req.headers.cookie}`);
          
          // ユーザー情報とセッションIDを返す
          return res.json({ 
            user: { id: user.id, username: user.username },
            sessionId: req.sessionID // セッションIDをクライアントに送信（デバッグ用）
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    // セッションIDをデバッグ用に記録
    const sessionId = req.sessionID;
    console.log(`Logout request. Session ID: ${sessionId}`);
    
    // ログアウト処理
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // セッションを完全に破棄
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destruction error:", destroyErr);
          return res.status(500).json({ message: "Failed to destroy session" });
        }
        
        console.log(`Session ${sessionId} destroyed successfully`);
        
        // クッキーを期限切れに設定
        res.clearCookie('loopedia.sid');
        
        res.json({ 
          message: "Logged out successfully",
          success: true
        });
      });
    });
  });

  // パスワード変更エンドポイント
  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "現在のパスワードと新しいパスワードを入力してください" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "パスワードは8文字以上である必要があります" });
      }

      // ユーザーを取得
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      // 現在のパスワードを検証
      const isPasswordValid = await verifyPassword(user.password, currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "現在のパスワードが正しくありません" });
      }

      // 新しいパスワードをハッシュ化
      const hashedPassword = await hashPassword(newPassword);

      // パスワードを更新
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      res.json({ message: "パスワードを変更しました" });
    } catch (error) {
      console.error("パスワード変更エラー:", error);
      res.status(500).json({ message: "パスワード変更に失敗しました" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    // リクエスト情報をログに記録（デバッグ用）
    console.log('Auth check request. Session ID:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());
    console.log('Cookie header:', req.headers.cookie);
    
    // セッションストアの状態をチェック（安全なアプローチ）
    try {
      // sessionStoreの一般的なメソッドを使用して確認
      sessionStore.get(req.sessionID, (err, session) => {
        if (err) {
          console.error('Error getting session from store:', err);
        } else if (session) {
          console.log('Session data exists in store for ID:', req.sessionID);
        } else {
          console.log('No session data found in store for ID:', req.sessionID);
        }
      });
    } catch (e) {
      console.error('Failed to check session data:', e);
    }
    
    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      
      // セッションを再確認して明示的に保存（万が一のため）
      req.session.touch();
      req.session.save((err) => {
        if (err) console.error('Session save error on auth check:', err);
        return res.json(null);
      });
      return;
    }
    
    // ユーザーが認証済みの場合
    const user = req.user as any;
    console.log('User authenticated:', user.id, user.username);
    
    // セッションを明示的に保存して延長
    req.session.touch();
    req.session.save((err) => {
      if (err) {
        console.error('Session save error on user fetch:', err);
        // エラーがあってもユーザー情報は返す
      }
      
      // より詳細なユーザー情報を返す
      return res.json({ 
        id: user.id, 
        username: user.username,
        sessionId: req.sessionID // デバッグ用
      });
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);

      // Auto login after registration with explicit session save
      req.login({ id: user.id, username: user.username }, (err) => {
        if (err) {
          console.error("Registration login error:", err);
          return res.status(500).json({ message: "Login failed after registration" });
        }
        
        // セッションを明示的に保存（非同期処理）
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Registration session save error:", saveErr);
            return res.status(500).json({ message: "Session save failed after registration" });
          }
          
          // セッションIDとセッション内容をログに出力（デバッグ用）
          console.log(`User registered and logged in: ${user.username} (Session ID: ${req.sessionID})`);
          console.log(`Registration session cookie: ${req.headers.cookie}`);
          
          // ユーザー情報とセッションIDを返す
          return res.status(201).json({ 
            user: { id: user.id, username: user.username },
            sessionId: req.sessionID // セッションIDをクライアントに送信（デバッグ用）
          });
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  // Preset routes
  app.get("/api/presets", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const presets = await storage.getPresets({ search, tagId, userId, page, limit });
      res.json(presets);
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  app.get("/api/presets/:id", async (req, res) => {
    try {
      const presetId = parseInt(req.params.id);
      const preset = await storage.getPresetById(presetId);

      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      res.json(preset);
    } catch (error) {
      console.error("Error fetching preset:", error);
      res.status(500).json({ message: "Failed to fetch preset" });
    }
  });

  app.delete("/api/presets/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      // 対象のプリセットを取得
      const preset = await storage.getPresetById(presetId);

      if (!preset) {
        return res.status(404).json({ message: "プリセットが見つかりません" });
      }

      // 作成者または管理者のみ削除可能
      const isAdmin = user.username === 'admin';
      
      console.log(`Delete request for preset ${presetId} by user ${user.id} (${user.username}), isAdmin: ${isAdmin}, preset owner: ${preset.userId}`);
      
      if (preset.userId !== user.id && !isAdmin) {
        return res.status(403).json({ message: "このプリセットを削除する権限がありません" });
      }

      // プリセットを削除
      const result = await storage.deletePreset(presetId);

      if (result) {
        console.log(`Preset ${presetId} deleted by user ${user.id} (${user.username})`);
        return res.status(200).json({ message: "プリセットを削除しました" });
      } else {
        console.error(`Failed to delete preset ${presetId}`);
        return res.status(500).json({ message: "プリセットの削除に失敗しました" });
      }
    } catch (error) {
      console.error("Error deleting preset:", error);
      res.status(500).json({ message: "Failed to delete preset" });
    }
  });

  app.patch("/api/presets/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);
      const { name } = req.body;

      // 対象のプリセットを取得
      const preset = await storage.getPresetById(presetId);

      if (!preset) {
        return res.status(404).json({ message: "プリセットが見つかりません" });
      }

      // 作成者以外は編集不可
      if (preset.userId !== user.id) {
        return res.status(403).json({ message: "このプリセットを編集する権限がありません" });
      }

      // プリセット名のみ更新
      const result = await storage.updatePresetName(presetId, name);

      if (result) {
        return res.status(200).json({ message: "プリセット名を更新しました", preset: result });
      } else {
        return res.status(500).json({ message: "プリセット名の更新に失敗しました" });
      }
    } catch (error) {
      console.error("Error updating preset name:", error);
      res.status(500).json({ message: "Failed to update preset name" });
    }
  });

  app.post("/api/presets", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { preset, tags, effects } = req.body;

      // リクエストデータの詳細なログ出力
      console.log("Creating preset request from user:", user.id);
      console.log("Preset data:", JSON.stringify(preset, null, 2));
      console.log("Tags:", JSON.stringify(tags, null, 2));
      console.log("Effects count:", effects?.length || 0);
      
      // Validate preset data
      try {
        const validatedPreset = insertPresetSchema.parse(preset);
        console.log("Preset validation successful");
      } catch (validationError) {
        console.error("Preset validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid preset data", 
            errors: validationError.errors 
          });
        }
        throw validationError;
      }
      
      // Validated preset
      const validatedPreset = insertPresetSchema.parse(preset);

      // Validate effects data
      if (!Array.isArray(effects) || effects.length === 0) {
        console.error("Effects array is empty or not an array:", effects);
        return res.status(400).json({ 
          message: "Effects are required",
          received: typeof effects
        });
      }

      // 各エフェクトデータを検証
      const validatedEffects = [];
      for (const effect of effects) {
        try {
          // エフェクトの詳細をログ出力
          console.log("Processing effect:", {
            position: effect.position,
            effectType: effect.effectType,
            parameters: {
              type: typeof effect.parameters,
              value: effect.parameters
            }
          });
          
          // presetId は後で追加するためバリデーションから除外
          const { position, effectType, sw, swMode, insert, parameters } = effect;
          
          // 必須フィールドのチェック
          if (!position || !effectType) {
            const missingFields = [];
            if (!position) missingFields.push('position');
            if (!effectType) missingFields.push('effectType');
            
            const errorMsg = `Missing required fields: ${missingFields.join(', ')} in effect`;
            console.error(errorMsg, effect);
            throw new Error(errorMsg);
          }

          // パラメータの正規化
          let normalizedParameters = parameters;
          
          // パラメータがない場合は空オブジェクトの文字列を使用
          if (parameters === undefined || parameters === null) {
            normalizedParameters = "{}";
          } 
          // 文字列でない場合はJSON文字列に変換
          else if (typeof parameters !== 'string') {
            try {
              normalizedParameters = JSON.stringify(parameters);
            } catch (jsonError) {
              console.error("JSON stringify error:", jsonError);
              normalizedParameters = "{}";
            }
          }
          // 文字列の場合はJSON形式かチェック
          else {
            try {
              // 一度パースして有効なJSONか確認
              JSON.parse(parameters);
              normalizedParameters = parameters;
            } catch (jsonError) {
              console.error("Invalid JSON string:", parameters);
              normalizedParameters = "{}";
            }
          }

          console.log("Normalized parameters:", normalizedParameters);

          // insertEffectSchemaでバリデーション（presetIdなしのスキーマを作成）
          const effectSchema = insertEffectSchema.omit({ presetId: true });
          const validatedEffect = effectSchema.parse({
            position,
            effectType,
            sw: sw !== undefined ? sw : false,
            swMode: swMode || "TOGGLE",
            insert: insert || "ALL",
            parameters: normalizedParameters
          });

          console.log("Effect validation successful:", validatedEffect.position);
          validatedEffects.push(validatedEffect);
        } catch (error) {
          console.error("Effect validation error:", error);
          
          // エラーの詳細情報を確認
          const errorDetails = {
            message: error instanceof Error ? error.message : 'Unknown error',
            effect: {
              position: effect.position,
              effectType: effect.effectType
            }
          };
          
          if (error instanceof z.ZodError) {
            return res.status(400).json({ 
              message: "Invalid effect data", 
              errors: error.errors,
              details: errorDetails
            });
          }
          
          return res.status(400).json({
            message: "Invalid effect data",
            error: errorDetails.message,
            details: errorDetails
          });
        }
      }

      console.log("All effects validated successfully, total:", validatedEffects.length);

      // Create preset with validated effects and tags
      try {
        const createdPreset = await storage.createPreset(
          validatedPreset, 
          user.id, 
          tags || [], 
          validatedEffects
        );
        
        console.log("Preset created successfully:", createdPreset.id);
        res.status(201).json(createdPreset);
      } catch (storageError) {
        console.error("Storage error creating preset:", storageError);
        
        // ストレージエラーの詳細を取得
        const storageErrorMessage = storageError instanceof Error 
          ? storageError.message 
          : "Unknown database error";
          
        throw new Error(`Database error: ${storageErrorMessage}`);
      }
    } catch (error) {
      console.error("Error creating preset:", error);
      
      // ZodErrorの場合は詳細なバリデーションエラーを返す
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data format", 
          errors: error.errors 
        });
      }
      
      // その他のエラーの場合
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // エラースタックを開発環境でのみ含める
      const errorDetails = process.env.NODE_ENV !== 'production' && error instanceof Error
        ? { stack: error.stack }
        : undefined;
        
      res.status(500).json({ 
        message: "Failed to create preset", 
        error: errorMessage,
        details: errorDetails
      });
    }
  });

  // Tag routes
  // すべてのタグの一覧を取得
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await db.query.tags.findMany();
      res.json(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      res.status(500).json({ error: 'Failed to fetch tags' });
    }
  });

  // アクティブなタグ（プリセットで使用されているタグ）の一覧を取得
  app.get('/api/tags/active', async (req, res) => {
    try {
      // プリセットに関連付けられているタグIDを取得
      const presetTags = await db.query.presetTags.findMany();

      if (presetTags.length === 0) {
        return res.json([]);
      }

      // ユニークなタグIDを抽出
      const uniqueTagIds = Array.from(new Set(presetTags.map(pt => pt.tagId)));

      // タグIDに対応するタグ情報を取得
      const activeTags = await db.query.tags.findMany({
        where: (tags, { inArray }) => inArray(tags.id, uniqueTagIds)
      });

      res.json(activeTags);
    } catch (error) {
      console.error('Error fetching active tags:', error);
      res.status(500).json({ error: 'Failed to fetch active tags' });
    }
  });

  // Comment routes
  app.get("/api/presets/:id/comments", async (req, res) => {
    try {
      const presetId = parseInt(req.params.id);
      const comments = await storage.getCommentsByPresetId(presetId);

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/presets/:id/comments", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      const commentData = insertCommentSchema.parse({
        content: req.body.content,
        presetId: presetId,
      });

      const comment = await storage.createComment(commentData, user.id);

      // プリセットの所有者を取得
      const preset = await storage.getPresetById(presetId);

      // コメント通知を作成（自分自身のプリセットにコメントした場合は通知しない）
      if (preset && preset.userId !== user.id) {
        try {
          await db.insert(notifications).values({
            userId: preset.userId,
            actorId: user.id,
            type: 'comment',
            presetId: presetId,
            commentId: comment.id,
            read: false
          });
        } catch (notifError) {
          console.error("Failed to create comment notification:", notifError);
          // 通知の失敗は全体の処理を中断しない
        }
      }

      // Get the user data to include in response
      const commentWithUser = {
        ...comment,
        user: { id: user.id, username: user.username },
      };

      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // いいねをトグルするAPI（追加または削除）
  app.post("/api/presets/:id/like", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      // Check if preset exists
      const preset = await storage.getPresetById(presetId);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      // いいね済みかチェック
      const isLiked = await storage.isPresetLikedByUser(presetId, user.id);

      if (isLiked) {
        // いいね済みの場合は削除
        const success = await storage.unlikePreset(presetId, user.id);
        const likeCount = (await storage.getLikesByPresetId(presetId)).length;
        return res.json({ 
          success, 
          action: 'unliked',
          likeCount,
          isLiked: false
        });
      } else {
        // いいねがなければ新規追加
        const like = await storage.likePreset(presetId, user.id);
        const likeCount = (await storage.getLikesByPresetId(presetId)).length;
        return res.json({ 
          success: true, 
          like,
          action: 'liked',
          likeCount,
          isLiked: true
        });
      }
    } catch (error) {
      console.error("Error toggling like preset:", error);
      res.status(500).json({ message: "Failed to toggle like for preset" });
    }
  });

  // いいねを削除するAPI
  app.delete("/api/presets/:id/like", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      // Check if preset exists
      const preset = await storage.getPresetById(presetId);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      const success = await storage.unlikePreset(presetId, user.id);
      res.json({ success });
    } catch (error) {
      console.error("Error unliking preset:", error);
      res.status(500).json({ message: "Failed to unlike preset" });
    }
  });

  // ブックマークをトグルするAPI（追加または削除）
  app.post("/api/presets/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      // Check if preset exists
      const preset = await storage.getPresetById(presetId);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      // ブックマーク済みかチェック
      const isBookmarked = await storage.isPresetBookmarkedByUser(presetId, user.id);

      if (isBookmarked) {
        // ブックマーク済みの場合は削除
        const success = await storage.unbookmarkPreset(presetId, user.id);
        // 現在のブックマーク数をカウント
        const bookmarkCount = (await storage.getBookmarksByUserId(user.id))
          .filter(b => b.presetId === presetId).length;
        return res.json({ 
          success, 
          action: 'unbookmarked',
          bookmarkCount,
          isBookmarked: false
        });
      } else {
        // ブックマークがなければ新規追加
        const bookmark = await storage.bookmarkPreset(presetId, user.id);
        // 現在のブックマーク数をカウント
        const bookmarkCount = (await storage.getBookmarksByUserId(user.id))
          .filter(b => b.presetId === presetId).length;
        return res.json({ 
          success: true, 
          bookmark,
          action: 'bookmarked',
          bookmarkCount,
          isBookmarked: true
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark preset:", error);
      res.status(500).json({ message: "Failed to toggle bookmark for preset" });
    }
  });

  // ブックマークを削除するAPI
  app.delete("/api/presets/:id/bookmark", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presetId = parseInt(req.params.id);

      // Check if preset exists
      const preset = await storage.getPresetById(presetId);
      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      const success = await storage.unbookmarkPreset(presetId, user.id);
      res.json({ success });
    } catch (error) {
      console.error("Error removing bookmark:", error);
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });

  // ユーザー設定を取得するAPI
  app.get("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const settings = await storage.getUserSettings(user.id);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching user settings:", error);
      res.status(500).json({ message: "Failed to fetch user settings" });
    }
  });

  // ユーザー設定を更新するAPI
  app.put("/api/user/settings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { showLikes } = req.body;

      const settings = await storage.updateUserSettings(user.id, { showLikes });
      res.json(settings);
    } catch (error) {
      console.error("Error updating user settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update user settings" });
    }
  });

  // お問い合わせ機能関連のAPI

  // お問い合わせを送信するAPI
  app.post("/api/contacts", async (req, res) => {
    try {
      const { name, contactMethod, contactDetail, category, message, isAnonymous } = req.body;

      // 必須項目の検証
      if (!category || !message) {
        return res.status(400).json({ message: "カテゴリーとメッセージは必須です" });
      }

      // ログインしていない場合は名前と連絡先情報が必要
      if (!req.isAuthenticated()) {
        if (!name) {
          return res.status(400).json({ message: "お名前を入力してください" });
        }
        if (!contactMethod || !contactDetail) {
          return res.status(400).json({ message: "連絡方法と連絡先情報を入力してください" });
        }
      }

      // 名前の設定 (ログインしている場合はユーザー名を使用)
      const displayName = req.isAuthenticated() ? (req.user as any).username : name;

      // ログインしている場合はユーザーIDを含める
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;

      // 匿名フラグの設定（未指定の場合は非ログインユーザーを匿名とみなす）
      const isAnonymousFlag = isAnonymous === undefined ? !req.isAuthenticated() : isAnonymous;

      // 新規お問い合わせをJSONファイルに保存
      const contact = createContact({
        name: displayName,
        userId,
        contactMethod,
        contactDetail,
        category,
        message,
        isAnonymous: isAnonymousFlag
      });

      // 管理者向けログ出力でデバッグ
      console.log("Contact created:", contact);

      res.status(201).json({ 
        success: true, 
        message: "お問い合わせが送信されました",
        contact
      });
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ message: "お問い合わせの送信に失敗しました" });
    }
  });

  // 管理者用API
  // 全ユーザーを取得するAPI
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // データベースから全ユーザーを取得
      // 実装例: ユーザー情報と、いいねやプリセット数を取得する
      // この実装は簡易版です
      const allUsers = await db.select().from(users).orderBy(users.createdAt);

      // パスワードを除外してレスポンス用のデータを作成
      const formattedUsers = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          // ダミーデータ - 実践ではここで実際の集計を行う
          presetCount: 0,
          commentCount: 0,
          likeCount: 0,
        };
      });

      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // ユーザーを削除するAPI
  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = parseInt(req.params.id);

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // 現在のユーザーは削除できないようにする
      if (userId === user.id) {
        return res.status(400).json({ message: "現在ログイン中のユーザーは削除できません" });
      }

      // 削除対象のユーザーが存在するか確認
      const userToDelete = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (userToDelete.length === 0) {
        return res.status(404).json({ message: "指定されたユーザーが見つかりません" });
      }

      // ユーザーの削除前に関連データを削除する
      try {
        // トランザクションを使用して関連データを削除
        await db.transaction(async (tx) => {
          console.log(`Deleting user with ID: ${userId} and related data`);

          // 1. ユーザーのいいねを削除
          await tx.delete(likes).where(eq(likes.userId, userId));

          // 2. ユーザーのブックマークを削除
          await tx.delete(bookmarks).where(eq(bookmarks.userId, userId));

          // 3. ユーザーのコメントを削除
          await tx.delete(comments).where(eq(comments.userId, userId));

          // 4. ユーザーのフォロー関係を削除
          await tx.delete(userFollows).where(eq(userFollows.followerId, userId));
          await tx.delete(userFollows).where(eq(userFollows.followedId, userId));

          // 5. ユーザーの通知を削除
          await tx.delete(notifications).where(eq(notifications.userId, userId));
          await tx.delete(notifications).where(eq(notifications.actorId, userId));

          // 6. ユーザーのループステーションを削除
          await tx.delete(userLoopers).where(eq(userLoopers.userId, userId));

          // 7. ユーザー設定を削除
          await tx.delete(userSettings).where(eq(userSettings.userId, userId));

          // 8. ユーザーのプリセットに関連するデータを削除
          const userPresets = await tx.select({ id: presets.id }).from(presets).where(eq(presets.userId, userId));

          for (const preset of userPresets) {
            // プリセットに関連するタグを削除
            await tx.delete(presetTags).where(eq(presetTags.presetId, preset.id));

            // プリセットに関連するエフェクトを削除
            await tx.delete(effects).where(eq(effects.presetId, preset.id));
          }

          // 9. ユーザーのプリセットを削除
          await tx.delete(presets).where(eq(presets.userId, userId));

          // 10. 最後にユーザーを削除
          await tx.delete(users).where(eq(users.id, userId));
        });

        return res.json({ 
          success: true,
          message: "ユーザーとその関連データを削除しました" 
        });
      } catch (error) {
        console.error("Error deleting user and related data:", error);
        return res.status(500).json({ 
          message: "ユーザーの削除に失敗しました",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "ユーザー削除処理中にエラーが発生しました" });
    }
  });

  // お問い合わせ一覧を取得するAPI
  app.get("/api/admin/contacts", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // JSONファイルから全てのお問い合わせを取得
      const contacts = getAllContacts();

      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ message: "お問い合わせ一覧の取得に失敗しました" });
    }
  });
  
  // ニュース関連のAPI =============================
  
  // 公開ニュース一覧を取得（ページング、ピン留め有無でフィルタリング可能）
  app.get("/api/news", async (req, res) => {
    console.log("GET /api/news リクエスト受信:", req.query);
    try {
      const pinned = req.query.pinned === "true" ? true : 
                    req.query.pinned === "false" ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;
      
      console.log("ニュース検索条件:", { pinned, limit, offset });
      const newsList = await newsStorage.getAllNews({ pinned, limit, offset });
      console.log(`ニュース取得成功: ${newsList.length}件`);
      
      res.json(newsList);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "ニュースの取得に失敗しました" });
    }
  });
  
  // 特定のニュースを取得
  app.get("/api/news/:id", async (req, res) => {
    console.log(`GET /api/news/${req.params.id} リクエスト受信`);
    try {
      const newsId = parseInt(req.params.id);
      console.log(`ニュースID: ${newsId} を検索中...`);
      
      const newsItem = await newsStorage.getNewsById(newsId);
      console.log(`検索結果:`, newsItem ? "ニュース見つかりました" : "ニュースが見つかりません");
      
      if (!newsItem) {
        return res.status(404).json({ message: "指定されたニュースが見つかりません" });
      }
      
      res.json(newsItem);
    } catch (error) {
      console.error("Error fetching news item:", error);
      res.status(500).json({ message: "ニュースの取得に失敗しました" });
    }
  });
  
  // 管理者用：ニュースを作成
  app.post("/api/admin/news", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // リクエストボディのバリデーション
      const validatedData = insertNewsSchema.parse(req.body);
      
      // 管理者のユーザーIDを設定
      validatedData.userId = user.id;
      
      const newsItem = await newsStorage.createNews(validatedData);
      console.log("ニュースが作成されました:", newsItem);
      res.status(201).json(newsItem);
    } catch (error) {
      console.error("Error creating news:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "ニュースの作成に失敗しました" });
    }
  });
  
  // 管理者用：ニュースを更新
  app.put("/api/admin/news/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const newsId = parseInt(req.params.id);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // ニュースの存在確認
      const existingNews = await newsStorage.getNewsById(newsId);
      if (!existingNews) {
        return res.status(404).json({ message: "指定されたニュースが見つかりません" });
      }
      
      // リクエストボディのバリデーション
      const validatedData = insertNewsSchema.partial().parse(req.body);
      
      console.log(`ニュースID: ${newsId} を更新します:`, validatedData);
      const updatedNews = await newsStorage.updateNews(newsId, validatedData);
      console.log("ニュースが更新されました:", updatedNews);
      res.json(updatedNews);
    } catch (error) {
      console.error("Error updating news:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "ニュースの更新に失敗しました" });
    }
  });
  
  // 管理者用：ニュースを削除
  app.delete("/api/admin/news/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const newsId = parseInt(req.params.id);
      
      console.log(`ニュースID: ${newsId} の削除リクエストを受信`);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // ニュースの存在確認
      const existingNews = await newsStorage.getNewsById(newsId);
      if (!existingNews) {
        console.log(`ニュースID: ${newsId} は見つかりませんでした`);
        return res.status(404).json({ message: "指定されたニュースが見つかりません" });
      }
      
      const result = await newsStorage.deleteNews(newsId);
      console.log(`ニュースID: ${newsId} の削除結果:`, result ? "成功" : "失敗");
      
      res.json({ success: result, message: result ? "ニュースを削除しました" : "ニュースの削除に失敗しました" });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "ニュースの削除に失敗しました" });
    }
  });
  
  // 管理者用：ニュースのピン留め状態を切り替え
  app.patch("/api/admin/news/:id/toggle-pin", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const newsId = parseInt(req.params.id);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // ニュースの存在確認
      const existingNews = await newsStorage.getNewsById(newsId);
      if (!existingNews) {
        return res.status(404).json({ message: "指定されたニュースが見つかりません" });
      }
      
      const updatedNews = await newsStorage.toggleNewsPin(newsId);
      console.log(`ニュースID: ${newsId} のピン留め状態を切り替えました:`, updatedNews?.pinned);
      res.json(updatedNews);
    } catch (error) {
      console.error("Error toggling news pin:", error);
      res.status(500).json({ message: "ニュースのピン留め状態の変更に失敗しました" });
    }
  });
  
  // 称号関連のAPI =============================
  
  // 全ての称号リストを取得
  app.get("/api/titles", async (req, res) => {
    try {
      const titles = await storage.getTitles();
      res.json(titles);
    } catch (error) {
      console.error("Error fetching titles:", error);
      res.status(500).json({ message: "称号リストの取得に失敗しました" });
    }
  });
  
  // 特定のユーザーの称号を取得
  app.get("/api/users/:userId/titles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // ユーザーの存在確認
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "指定されたユーザーが見つかりません" });
      }
      
      const userTitles = await storage.getUserTitles(userId);
      res.json(userTitles);
    } catch (error) {
      console.error("Error fetching user titles:", error);
      res.status(500).json({ message: "ユーザーの称号取得に失敗しました" });
    }
  });
  
  // 管理者用：新しい称号を作成
  app.post("/api/admin/titles", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // リクエストボディのバリデーション
      const validatedData = insertTitleSchema.parse(req.body);
      
      const title = await storage.createTitle(validatedData);
      res.status(201).json(title);
    } catch (error) {
      console.error("Error creating title:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "称号の作成に失敗しました" });
    }
  });
  
  // 管理者用：称号を更新
  app.put("/api/admin/titles/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const titleId = parseInt(req.params.id);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // 称号の存在確認
      const existingTitle = await storage.getTitleById(titleId);
      if (!existingTitle) {
        return res.status(404).json({ message: "指定された称号が見つかりません" });
      }
      
      // リクエストボディのバリデーション
      const validatedData = insertTitleSchema.partial().parse(req.body);
      
      const updatedTitle = await storage.updateTitle(titleId, validatedData);
      res.json(updatedTitle);
    } catch (error) {
      console.error("Error updating title:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "称号の更新に失敗しました" });
    }
  });
  
  // 管理者用：称号を削除
  app.delete("/api/admin/titles/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const titleId = parseInt(req.params.id);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // 称号の存在確認
      const existingTitle = await storage.getTitleById(titleId);
      if (!existingTitle) {
        return res.status(404).json({ message: "指定された称号が見つかりません" });
      }
      
      await storage.deleteTitle(titleId);
      res.json({ success: true, message: "称号を削除しました" });
    } catch (error) {
      console.error("Error deleting title:", error);
      res.status(500).json({ message: "称号の削除に失敗しました" });
    }
  });
  
  // 管理者用：ユーザーに称号を付与
  app.post("/api/admin/users/:userId/titles/:titleId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = parseInt(req.params.userId);
      const titleId = parseInt(req.params.titleId);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // ユーザーの存在確認
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "指定されたユーザーが見つかりません" });
      }
      
      // 称号の存在確認
      const title = await storage.getTitleById(titleId);
      if (!title) {
        return res.status(404).json({ message: "指定された称号が見つかりません" });
      }
      
      // 既に付与済みかチェック
      const hasTitle = await storage.hasUserTitle(userId, titleId);
      if (hasTitle) {
        return res.status(400).json({ message: "このユーザーはすでにこの称号を持っています" });
      }
      
      const userTitle = await storage.grantUserTitle(userId, titleId);
      res.status(201).json(userTitle);
    } catch (error) {
      console.error("Error granting title to user:", error);
      res.status(500).json({ message: "称号の付与に失敗しました" });
    }
  });
  
  // 管理者用：ユーザーから称号を剥奪
  app.delete("/api/admin/users/:userId/titles/:titleId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = parseInt(req.params.userId);
      const titleId = parseInt(req.params.titleId);
      
      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }
      
      // ユーザーの存在確認
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "指定されたユーザーが見つかりません" });
      }
      
      // 称号の存在確認
      const title = await storage.getTitleById(titleId);
      if (!title) {
        return res.status(404).json({ message: "指定された称号が見つかりません" });
      }
      
      // 付与されているかチェック
      const hasTitle = await storage.hasUserTitle(userId, titleId);
      if (!hasTitle) {
        return res.status(400).json({ message: "このユーザーはこの称号を持っていません" });
      }
      
      await storage.revokeUserTitle(userId, titleId);
      res.json({ success: true, message: "ユーザーから称号を剥奪しました" });
    } catch (error) {
      console.error("Error revoking title from user:", error);
      res.status(500).json({ message: "称号の剥奪に失敗しました" });
    }
  });

  // お問い合わせのステータスを更新するAPI
  app.patch("/api/admin/contacts/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const contactId = parseInt(req.params.id);
      const { status } = req.body;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // 有効なステータスかチェック
      if (!["new", "in_progress", "resolved"].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }

      // 問い合わせが存在するか確認
      const contact = getContactById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "指定されたお問い合わせが見つかりません" });
      }

      // 実際のステータス更新処理
      console.log(`Updating contact status: contactId=${contactId}, status=${status}`);
      const updatedContact = updateContactStatus(contactId, status as 'new' | 'in_progress' | 'resolved');
      console.log('Updated contact:', updatedContact);

      if (!updatedContact) {
        return res.status(500).json({ message: "ステータスの更新に失敗しました" });
      }

      res.json({ 
        success: true,
        contact: updatedContact
      });
    } catch (error) {
      console.error("Error updating contact status:", error);
      res.status(500).json({ message: "お問い合わせステータスの更新に失敗しました" });
    }
  });

  // シンプル化のため返信機能は非実装

  // ユーザーの認証状態を更新するAPI
  app.patch("/api/admin/users/:userId/verify", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const userId = parseInt(req.params.userId, 10);
      const { isVerified } = req.body;

      if (typeof isVerified !== 'boolean') {
        return res.status(400).json({ message: "無効なリクエストです。isVerified は boolean である必要があります" });
      }

      // ユーザーが存在するか確認
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!targetUser) {
        return res.status(404).json({ message: "指定されたユーザーが見つかりません" });
      }

      // ユーザーの認証状態を更新
      await db.update(users)
        .set({ isVerified })
        .where(eq(users.id, userId));

      // 更新後のユーザー情報を取得
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      // パスワードを除外
      const { password, ...userWithoutPassword } = updatedUser!;

      res.json({
        success: true,
        message: isVerified ? "ユーザーを認証しました" : "ユーザーの認証を解除しました",
        user: userWithoutPassword,
        isVerified
      });
    } catch (error) {
      console.error("Error updating user verification status:", error);
      res.status(500).json({ message: "ユーザーの認証状態の更新に失敗しました" });
    }
  });

  // パスワードをリセットするAPI
  app.post("/api/admin/users/:userId/reset-password", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const userId = parseInt(req.params.userId);

      // 対象ユーザーの存在確認
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      // ランダムな一時パスワードを生成（8文字）
      const tempPassword = require('crypto').randomBytes(4).toString('hex');

      // パスワードをハッシュ化
      const hashedPassword = await hashPassword(tempPassword);

      // ユーザーのパスワードを更新
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));

      res.status(200).json({ 
        message: "パスワードをリセットしました", 
        tempPassword
      });
    } catch (error) {
      console.error("Error resetting user password:", error);
      res.status(500).json({ message: "パスワードのリセットに失敗しました" });
    }
  });

  // システム統計情報を取得するAPI
  app.get("/api/admin/stats", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // データベースから実際の統計情報を取得
      // ユーザー納数を取得
      const [userCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);

      // プリセット総数を取得
      const [presetCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(presets);

      // プリセットの種類別統計
      const presetTypeStats = await db
        .select({
          type: presets.type,
          count: sql<number>`count(*)`
        })
        .from(presets)
        .groupBy(presets.type);

      // コメント数を取得
      const [commentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(comments);

      // 24時間以内の新規プリセット数
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [newPresetsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(presets)
        .where(gt(presets.createdAt, yesterday));

      // プリセットタイプ別の集計をオブジェクトに変換
      const presetsByType = presetTypeStats.reduce((acc, curr) => {
        acc[curr.type] = curr.count;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        totalUsers: userCount.count,
        activeUsers: Math.round(userCount.count * 0.5), // アクティブユーザーは便宜上全体の半分と仮定
        totalPresets: presetCount.count,
        newPresets24h: newPresetsCount.count,
        totalComments: commentCount.count,
        presetsByType
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ユーザープロフィール関連のAPI
  // ユーザー検索API - パラメータ付きルートの前に定義する必要があります
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!query) {
        return res.json([]);
      }

      // データベースからユーザーを検索 (usernameまたはnicknameにクエリが含まれるユーザーを検索)
      const searchResults = await db.select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.nickname, `%${query}%`)
        )
      )
      .limit(limit)
      .offset((page - 1) * limit);

      res.json(searchResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // ユーザー情報を取得するAPI
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // パスワードなど重要情報を除外
      const { password, ...userWithoutPassword } = user;

      // ログイン中のユーザーがこのユーザーをフォローしているかを確認
      let isFollowing = false;
      let followersCount = 0;
      let followingCount = 0;

      // フォロワーとフォロー中の数を取得
      followersCount = await storage.getFollowersCount(userId);
      followingCount = await storage.getFollowingCount(userId);

      // ログイン中の場合、フォロー状態を確認
      if (req.isAuthenticated() && req.user) {
        const currentUserId = (req.user as any).id;
        isFollowing = await storage.isFollowing(currentUserId, userId);
      }

      res.json({
        ...userWithoutPassword,
        followersCount,
        followingCount,
        isFollowing
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ユーザーのフォロワー一覧を取得
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const followers = await storage.getFollowers(userId);

      // パスワードなど重要情報を除外
      const safeFollowers = followers.map(follower => {
        const { password, ...userWithoutPassword } = follower;
        return userWithoutPassword;
      });

      res.json(safeFollowers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  // ユーザーのフォロー中一覧を取得
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const following = await storage.getFollowing(userId);

      // パスワードなど重要情報を除外
      const safeFollowing = following.map(followed => {
        const { password, ...userWithoutPassword } = followed;
        return userWithoutPassword;
      });

      res.json(safeFollowing);
    } catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });



  // ユーザーをフォローする
  app.post("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const userToFollowId = parseInt(req.params.id);

      // 自分自身をフォローしようとしていないか確認
      if (currentUserId === userToFollowId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      // フォロー処理
      const follow = await storage.followUser(currentUserId, userToFollowId);
      res.status(201).json(follow);
    } catch (error) {
      console.error("Error following user:", error);
      if (error instanceof Error && error.message === "Already following this user") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  // ユーザーのフォローを解除する
  app.delete("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const currentUserId = (req.user as any).id;
      const userToUnfollowId = parseInt(req.params.id);

      const result = await storage.unfollowUser(currentUserId, userToUnfollowId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  // 通知関連のAPI
  // 自分の通知一覧を取得
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const notifications = await storage.getNotifications(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // 未読の通知数を取得
  app.get("/api/notifications/unread/count", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Failed to fetch unread notification count" });
    }
  });

  // 通知を既読にする
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const result = await storage.markNotificationAsRead(notificationId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // すべての通知を既読にする
  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const result = await storage.markAllNotificationsAsRead(userId);
      res.json({ success: result });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ユーザープロフィールを更新するAPI
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profileData = updateUserProfileSchema.parse(req.body);

      // お気に入りアーティスト情報を処理
      const favoriteArtists = req.body.favoriteArtists;

      // まずユーザープロフィールを更新
      const updatedUser = await storage.updateUserProfile(user.id, profileData);

      // お気に入りアーティスト情報が含まれる場合は、既存のloopers情報を削除して新しく登録
      if (favoriteArtists && Array.isArray(favoriteArtists)) {
        // まず既存のお気に入りloopersを取得
        const existingLoopers = await storage.getUserLoopers(user.id);

        // 既存のloopersを削除
        for (const looper of existingLoopers) {
          await storage.deleteUserLooper(looper.id);
        }

        // 新しいloopersを追加（アーティスト情報として）
        for (const artist of favoriteArtists) {
          await storage.createUserLooper({
            userId: user.id,
            looperName: artist.looperName,
            displayOrder: artist.displayOrder
          });
        }
      }

      // パスワードなど重要情報を除外
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // ユーザー検索API - パラメータ付きルートの前に定義する必要があります
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!query) {
        return res.json([]);
      }

      // データベースからユーザーを検索 (usernameまたはnicknameにクエリが含まれるユーザーを検索)
      const userResults = await db.select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.nickname, `%${query}%`)
        )
      )
      .limit(limit)
      .offset((page - 1) * limit);

      res.json(userResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // ユーザーアバター画像をアップロードするAPI
  app.post("/api/users/avatar", requireAuth, (req, res) => {
    const user = req.user as any;
    console.log("Avatar upload request received for user:", user.id);

    avatarUpload(req, res, async (err) => {
      if (err) {
        console.error("Avatar upload error:", err);
        return res.status(400).json({ message: err.message });
      }

      // ファイルがアップロードされなかった場合
      if (!req.file) {
        console.error("No file uploaded in request");
        return res.status(400).json({ message: "画像ファイルが提供されていません" });
      }

      try {
        // ファイルのパスを取得
        const relativePath = `/uploads/avatars/${req.file.filename}`;
        console.log("Avatar file uploaded successfully:", req.file.filename);
        console.log("Relative path:", relativePath);

        // ユーザープロフィールのavatarUrlを更新
        const updatedUser = await storage.updateUserProfile(user.id, {
          avatarUrl: relativePath
        });

        console.log("User profile updated with new avatar");

        // パスワードなど重要情報を除外
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
          success: true,
          message: "アバター画像が正常にアップロードされました",
          avatarUrl: relativePath,
          user: userWithoutPassword
        });
      } catch (error) {
        console.error("Failed to update user avatar:", error);
        res.status(500).json({ message: "アバター画像の更新に失敗しました" });
      }
    });
  });

  // ユーザーのお気に入りループステーション一覧を取得するAPI
  app.get("/api/user/loopers", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const loopers = await storage.getUserLoopers(user.id);
      res.json(loopers);
    } catch (error) {
      console.error("Error fetching user loopers:", error);
      res.status(500).json({ message: "Failed to fetch user loopers" });
    }
  });

  // 特定ユーザーのお気に入りループステーション一覧を取得するAPI
  app.get("/api/users/:id/loopers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const loopers = await storage.getUserLoopers(userId);
      res.json(loopers);
    } catch (error) {
      console.error("Error fetching user loopers:", error);
      res.status(500).json({ message: "Failed to fetch user loopers" });
    }
  });

  // お気に入りループステーションを追加するAPI
  app.post("/api/user/loopers", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // 既存のお気に入りループステーションの数を取得
      const existingLoopers = await storage.getUserLoopers(user.id);
      if (existingLoopers.length >= 3) {
        return res.status(400).json({ message: "Maximum number of favorite loopers (3) reached" });
      }

      const looperData = insertUserLooperSchema.parse({
        ...req.body,
        userId: user.id,
        displayOrder: existingLoopers.length,
      });

      const looper = await storage.createUserLooper(looperData);
      res.status(201).json(looper);
    } catch (error) {
      console.error("Error creating user looper:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create user looper" });
    }
  });

  // お気に入りループステーションを更新するAPI
  app.put("/api/user/loopers/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const looperId = parseInt(req.params.id);

      // お気に入りループステーションの所有者かチェック
      const loopers = await storage.getUserLoopers(user.id);
      const looper = loopers.find(l => l.id === looperId);
      if (!looper) {
        return res.status(403).json({ message: "Not authorized to update this looper" });
      }

      const updatedLooper = await storage.updateUserLooper(looperId, req.body);
      res.json(updatedLooper);
    } catch (error) {
      console.error("Error updating user looper:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update user looper" });
    }
  });

  // お気に入りループステーションを削除するAPI
  app.delete("/api/user/loopers/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const looperId = parseInt(req.params.id);

      // お気に入りループステーションの所有者かチェック
      const loopers = await storage.getUserLoopers(user.id);
      const looper = loopers.find(l => l.id === looperId);
      if (!looper) {
        return res.status(403).json({ message: "Not authorized to delete this looper" });
      }

      const success = await storage.deleteUserLooper(looperId);

      if (success) {
        // 残りのお気に入りループステーションの表示順序を再調整
        const remainingLoopers = await storage.getUserLoopers(user.id);
        for (let i = 0; i < remainingLoopers.length; i++) {
          await storage.updateUserLooper(remainingLoopers[i].id, { displayOrder: i });
        }

        return res.json({ success: true });
      } else {
        return res.status(500).json({ message: "Failed to delete user looper" });
      }
    } catch (error) {
      console.error("Error deleting user looper:", error);
      res.status(500).json({ message: "Failed to delete user looper" });
    }
  });

  // 通知一覧の取得
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const notifications = await storage.getNotifications(user.id, limit, (page - 1) * limit);

      // 関連するユーザーとプリセットの情報を追加
      const enhancedNotifications = await Promise.all(
        notifications.map(async (notification) => {
          const result: any = { ...notification };

          if (notification.actorId) {
            const actor = await storage.getUser(notification.actorId);
            if (actor) {
              // パスワードなど重要情報を除外
              const { password, ...actorWithoutPassword } = actor;
              result.actor = actorWithoutPassword;
            }
          }

          if (notification.presetId) {
            const preset = await storage.getPresetById(notification.presetId);
            if (preset) {
              result.preset = {
                id: preset.id,
                name: preset.name
              };
            }
          }

          return result;
        })
      );

      res.json(enhancedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // 未読通知の数を取得
  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const count = await storage.getUnreadNotificationsCount(user.id);
      res.json(count);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
      res.status(500).json({ message: "Failed to fetch unread notifications count" });
    }
  });

  // 通知を既読にする
  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const notificationId = parseInt(req.params.id);

      // TODO: 通知の所有者チェックを追加

      const success = await storage.markNotificationAsRead(notificationId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // すべての通知を既読にする
  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const success = await storage.markAllNotificationsAsRead(user.id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(500).json({ message: "Failed to mark all notifications as read" });
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // ユーザー検索API - 別名でパス競合を回避
  app.get("/api/users-search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!query) {
        return res.json([]);
      }

      // データベースからユーザーを検索 (usernameまたはnicknameにクエリが含まれるユーザーを検索)
      const searchResults = await db.select({
        id: users.id,
        username: users.username,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(
        or(
          like(users.username, `%${query}%`),
          like(users.nickname, `%${query}%`)
        )
      )
      .limit(limit)
      .offset((page - 1) * limit);

      res.json(searchResults);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // お問い合わせに返信するAPI
  app.post("/api/admin/contacts/:id/reply", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const contactId = parseInt(req.params.id);
      const { reply } = req.body;

      // 管理者権限のチェック
      if (user.username !== "admin") {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      // お問い合わせが存在するか確認
      const contact = getContactById(contactId);
      if (!contact) {
        return res.status(404).json({ message: "お問い合わせが見つかりません" });
      }

      // 返信を追加
      const newReply = addReplyToContact(contactId, reply, true);

      if (!newReply) {
        return res.status(500).json({ message: "返信の追加に失敗しました" });
      }

      // ユーザーが存在する場合、通知を作成
      if (contact.userId) {
        try {
          // 通知を作成
          await db.insert(notifications).values({
            userId: contact.userId,
            type: 'contact_reply',
            contactId: contactId,
            read: false
          });
        } catch (error) {
          console.error("Failed to create notification for contact reply:", error);
          // 通知作成の失敗は全体の処理を失敗させない
        }
      }

      return res.status(200).json({ success: true, reply: newReply });
    } catch (error) {
      console.error("Error adding reply to contact:", error);
      res.status(500).json({ message: "Failed to add reply to contact" });
    }
  });

  // ユーザー自身のお問い合わせ一覧を取得するAPI
  app.get("/api/contacts/my", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      // ユーザーのお問い合わせを取得
      const contacts = getContactsByUserId(user.id);

      return res.json(contacts);
    } catch (error) {
      console.error("Error fetching user contacts:", error);
      res.status(500).json({ message: "Failed to fetch user contacts" });
    }
  });

  // 特定のお問い合わせとその返信を取得するAPI
  app.get("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const contactId = parseInt(req.params.id);

      // お問い合わせを取得
      const contact = getContactById(contactId);

      if (!contact) {
        return res.status(404).json({ message: "お問い合わせが見つかりません" });
      }

      // 管理者はすべて見られるが、一般ユーザーは自分の問い合わせのみ
      if (user.username !== "admin" && (!contact.userId || contact.userId !== user.id)) {
        return res.status(403).json({ message: "このお問い合わせを閲覧する権限がありません" });
      }

      return res.json(contact);
    } catch (error) {
      console.error("Error fetching contact:", error);
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  // ユーザーがお問い合わせに返信するAPI
  app.post("/api/contacts/:id/reply", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const contactId = parseInt(req.params.id);
      const { reply } = req.body;

      // お問い合わせを取得
      const contact = getContactById(contactId);

      if (!contact) {
        return res.status(404).json({ message: "お問い合わせが見つかりません" });
      }

      // 自分のお問い合わせか確認
      if (!contact.userId || contact.userId !== user.id) {
        return res.status(403).json({ message: "このお問い合わせに返信する権限がありません" });
      }

      // 返信を追加
      const newReply = addReplyToContact(contactId, reply, false);

      if (!newReply) {
        return res.status(500).json({ message: "返信の追加に失敗しました" });
      }

      return res.status(200).json({ success: true, reply: newReply });
    } catch (error) {
      console.error("Error adding user reply to contact:", error);
      res.status(500).json({ message: "Failed to add reply to contact" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
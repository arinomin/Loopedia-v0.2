import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import { z } from "zod";
import path from "path";
import { 
  insertUserSchema, insertPresetSchema, insertEffectSchema,
  updateUserProfileSchema, insertTitleSchema, insertUserTitleSchema
} from "@shared/schema";
import { configurePassport, hashPassword, verifyPassword } from "./auth";
import passport from "passport";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);
const SESSION_SECRET = process.env.SESSION_SECRET || "loopedia-session-secret-key-for-authentication";

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "認証が必要です。ログインしてください。" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
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

  const isProd = process.env.NODE_ENV === 'production';
  console.log(`Running in ${isProd ? 'production' : 'development'} mode`);
  console.log(`Session secret length: ${SESSION_SECRET.length} characters`);
  
  const sessionStore = new SessionStore({
    checkPeriod: 86400000,
    stale: false,
    ttl: 14 * 24 * 60 * 60 * 1000,
  });
  
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
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
      resave: true,
      rolling: true,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      },
      store: sessionStore,
      name: 'loopedia.sid',
      unset: 'destroy',
      proxy: true
    })
  );

  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "ユーザー名とパスワードを入力してください" });
    }
    
    passport.authenticate("local", (err: Error, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "認証に失敗しました" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        
        req.session.save((saveErr) => {
          if (saveErr) {
            return next(saveErr);
          }
          
          return res.json({ 
            user: { id: user.id, username: user.username },
            sessionId: req.sessionID
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    const sessionID = req.sessionID;
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "ログアウトに失敗しました" });
      }
      req.session.destroy((destroyErr) => {
        res.clearCookie('loopedia.sid');
        res.json({ message: "ログアウトしました" });
      });
    });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "現在のパスワードと新しいパスワードを入力してください" });
      }

      const dbUser = await storage.getUserByUsername(user.username);
      if (!dbUser) {
        return res.status(404).json({ message: "ユーザーが見つかりません" });
      }

      const isValid = await verifyPassword(currentPassword, dbUser.password);
      if (!isValid) {
        return res.status(401).json({ message: "現在のパスワードが正しくありません" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserProfile(user.id, { password: hashedPassword } as any);

      res.json({ message: "パスワードを変更しました" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "パスワード変更に失敗しました" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.json({ user: null });
    }

    const user = req.user as any;
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      return res.json({ user: null });
    }

    const userTitles = await storage.getUserTitles(user.id);

    res.json({
      user: {
        id: dbUser.id,
        username: dbUser.username,
        nickname: dbUser.nickname,
        profileText: dbUser.profileText,
        createdAt: dbUser.createdAt,
        isVerified: dbUser.isVerified,
        titles: userTitles,
      }
    });
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "このユーザー名は既に使用されています" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "ログインに失敗しました" });
        }
        res.json({ user: { id: user.id, username: user.username } });
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが不正です", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "ユーザー登録に失敗しました" });
    }
  });

  // Preset routes
  app.get("/api/presets", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const presets = await storage.getPresets({ userId: user.id });
      res.json(presets);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "プリセット一覧の取得に失敗しました" });
    }
  });

  app.get("/api/presets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const preset = await storage.getPresetById(id);
      
      if (!preset) {
        return res.status(404).json({ message: "プリセットが見つかりません" });
      }

      res.json(preset);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "プリセットの取得に失敗しました" });
    }
  });

  app.delete("/api/presets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      
      const preset = await storage.getPresetById(id);
      if (!preset) {
        return res.status(404).json({ message: "プリセットが見つかりません" });
      }

      if (preset.userId !== user.id) {
        return res.status(403).json({ message: "このプリセットを削除する権限がありません" });
      }

      await storage.deletePreset(id);
      res.json({ message: "プリセットを削除しました" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "プリセットの削除に失敗しました" });
    }
  });

  app.patch("/api/presets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const { name } = req.body;

      const preset = await storage.getPresetById(id);
      if (!preset) {
        return res.status(404).json({ message: "プリセットが見つかりません" });
      }

      if (preset.userId !== user.id) {
        return res.status(403).json({ message: "このプリセットを編集する権限がありません" });
      }

      const updated = await storage.updatePresetName(id, name);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "プリセットの更新に失敗しました" });
    }
  });

  app.post("/api/presets", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { preset, effects, tags } = req.body;

      const presetData = insertPresetSchema.parse(preset);
      const effectsData = z.array(insertEffectSchema).parse(effects);
      const tagsData = z.array(z.string()).parse(tags);

      const newPreset = await storage.createPreset(presetData, user.id, tagsData, effectsData);
      res.json(newPreset);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが不正です", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "プリセットの作成に失敗しました" });
    }
  });

  // Tag routes
  app.get('/api/tags', async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "タグの取得に失敗しました" });
    }
  });

  // Title routes
  app.get("/api/titles", async (req, res) => {
    try {
      const titles = await storage.getTitles();
      res.json(titles);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "称号の取得に失敗しました" });
    }
  });

  app.get("/api/users/:userId/titles", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const titles = await storage.getUserTitles(userId);
      res.json(titles);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "ユーザー称号の取得に失敗しました" });
    }
  });

  app.post("/api/admin/titles", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.username !== 'admin') {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const titleData = insertTitleSchema.parse(req.body);
      const title = await storage.createTitle(titleData);
      res.json(title);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが不正です", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "称号の作成に失敗しました" });
    }
  });

  app.put("/api/admin/titles/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.username !== 'admin') {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const id = parseInt(req.params.id);
      const titleData = insertTitleSchema.partial().parse(req.body);
      const title = await storage.updateTitle(id, titleData);
      
      if (!title) {
        return res.status(404).json({ message: "称号が見つかりません" });
      }

      res.json(title);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "称号の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/titles/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.username !== 'admin') {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const id = parseInt(req.params.id);
      await storage.deleteTitle(id);
      res.json({ message: "称号を削除しました" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "称号の削除に失敗しました" });
    }
  });

  app.post("/api/admin/users/:userId/titles/:titleId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.username !== 'admin') {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const userId = parseInt(req.params.userId);
      const titleId = parseInt(req.params.titleId);

      const userTitle = await storage.grantUserTitle(userId, titleId);
      res.json(userTitle);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "称号の付与に失敗しました" });
    }
  });

  app.delete("/api/admin/users/:userId/titles/:titleId", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (user.username !== 'admin') {
        return res.status(403).json({ message: "管理者権限が必要です" });
      }

      const userId = parseInt(req.params.userId);
      const titleId = parseInt(req.params.titleId);

      await storage.revokeUserTitle(userId, titleId);
      res.json({ message: "称号を剥奪しました" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "称号の剥奪に失敗しました" });
    }
  });

  // User profile routes
  app.put("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const profileData = updateUserProfileSchema.parse(req.body);

      const updatedUser = await storage.updateUserProfile(user.id, profileData);
      res.json(updatedUser);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "入力データが不正です", errors: error.errors });
      }
      res.status(500).json({ message: error.message || "プロフィールの更新に失敗しました" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

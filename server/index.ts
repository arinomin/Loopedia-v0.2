import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS設定 - セッションCookieの送受信を許可（改良版）
app.use((req, res, next) => {
  // リクエスト元のオリジンを許可（またはすべて許可）
  const origin = req.headers.origin || '';
  res.header('Access-Control-Allow-Origin', origin);
  
  // クロスオリジンCookieとクレデンシャルを有効化
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // 許可するヘッダーとメソッドを拡張
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie');
  
  // Cookieヘッダーの公開を許可
  res.header('Access-Control-Expose-Headers', 'Set-Cookie');
  
  // プリフライトリクエスト（OPTIONS）への対応 - 長めの有効期限
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400'); // プリフライトリクエストを24時間キャッシュ
    return res.sendStatus(204); // No Content
  }
  
  // デバッグ用にログを追加
  console.log(`CORS request from: ${origin || 'unknown'}, path: ${req.path}`);
  
  next();
});

// Serve static files from the public/uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // 静的ファイルを先に提供する
    serveStatic(app);
    
    // ヘルスチェック用のルートパスエンドポイント
    app.get("/", (req, res) => {
      res.status(200).send("OK");
    });
    
    // APIパスに一致しないリクエストのためのルーティング
    // これはAPI以外の未処理のリクエストにのみ適用される
    app.get("*", (req, res, next) => {
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        // すでに処理されていない場合はindexを返す
        res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
      } else {
        next();
      }
    });
  }

  // サーバーポートの設定
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`Server running at http://localhost:${port}`);
  });
})();
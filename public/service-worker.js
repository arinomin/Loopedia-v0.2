// RC505 PWA Service Worker - 最小実装版
const CACHE_NAME = 'rc505-app-cache-v4';

// 基本的なリソースのキャッシュリスト
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png', 
  './icons/icon-512x512.png'
];

// インストール時の処理
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  // キャッシュの設定と初期データの追加
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Installation Complete');
        return self.skipWaiting(); // アクティベーションを待たずに有効化
      })
  );
});

// アクティベーション時の処理
self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('Service Worker: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  // 待機中のクライアントをすぐに制御
  return self.clients.claim();
});

// フェッチイベントの処理
self.addEventListener('fetch', event => {
  // APIリクエストはキャッシュしない
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // その他のリクエストはキャッシュファーストで処理
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュになければネットワークから取得
        return fetch(event.request)
          .then(networkResponse => {
            // 正常なレスポンスのみキャッシュ
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // オフライン時にHTMLリクエストならホームページを返す
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./');
            }
            
            return new Response('Network error occurred', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
// 家庭记账 Service Worker v3 - 网络优先策略
const CACHE_NAME = 'jizhu-v3';

self.addEventListener('install', e => {
  // 立即激活，不等待旧SW关闭
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // 清除所有旧缓存
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // 只处理GET请求
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    // 网络优先：有网就用网络
    fetch(e.request).then(response => {
      return response;
    }).catch(() => {
      // 网络失败时才用缓存
      return caches.match(e.request).then(cached => {
        if (cached) return cached;
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('', {status: 503});
      });
    })
  );
  
  // 后台缓存更新（不阻塞响应）
  if (e.request.url.includes('index.html') || e.request.url.includes('sw.js') || e.request.url.includes('manifest.json')) {
    fetch(e.request).then(resp => {
      if (resp && resp.status === 200) {
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, resp));
      }
    }).catch(() => {});
  }
});

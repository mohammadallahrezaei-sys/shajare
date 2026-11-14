/* Service worker: فقط «پوستهٔ اپ» را کش می‌کند تا آفلاین هم باز شود.
   درخواست‌های Supabase (داده، عکس، احراز هویت) هرگز کش نمی‌شوند. */
const VERSION = 'shj-v2';
const SHELL = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Supabase و سایت‌های دیگر: بدون دخالت

  if (req.mode === 'navigate') {                              // صفحه: اول شبکه (نسخهٔ تازه)، بعد کش
    e.respondWith(
      fetch(req, {cache:'no-store'}).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  e.respondWith(                                              // فایل‌های ثابت: اول کش
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});

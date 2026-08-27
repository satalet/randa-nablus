const CACHE_NAME = 'randa-girls-diaries-v1';

// الملفات الثابتة للتخزين المؤقت
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './splash.jpg',
    './dad-randa.jpg',
    './icon-192.png'
];

self.addEventListener('install', (event) => {
    // تفعيل التحديث فوراً وتخطي الانتظار
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    // حذف كافة الكاشات القديمة للنسخ السابقة
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // استثناء طلبات Firebase وطلبات الترجمة/الصوت من الكاش
    if (
        event.request.url.includes('firestore.googleapis.com') ||
        event.request.url.includes('firebaseio.com') ||
        event.request.url.includes('api.mymemory.translated.net') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    // استراتيجية Network-First لملف index.html لضمان جلب أحدث كود دائماً
    if (event.request.url.endsWith('index.html') || event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return networkResponse;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // للملفات الثابتة الأخرى (الصور والأيقونات)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});

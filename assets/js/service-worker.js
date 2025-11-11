// Nome do cache
const CACHE_NAME = 'gerenciador-cache-v1';

// Arquivos que devem ser armazenados para uso offline
const URLS_TO_CACHE = [
  '../../index.html',
  '../../style.css',
  './scripts.js',
  '../audios/success-1-6297.mp3',
  '../audios/wah-wah-sad-trombone-6347.mp3',
  '../pic/target.png',
  '../pic/default.jpg',
  '../pic/task-icon.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Cacheando arquivos...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => console.error('[Service Worker] Erro ao cachear arquivos:', err))
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Intercepta as requisições (modo offline)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

 URLS_TO_CACHE = [
  '../../index.html',
  '../../style.css',
  './scripts.js',
  '../audios/success-1-6297.mp3',
  '../audios/wah-wah-sad-trombone-6347.mp3',
  '../pic/target.png',
  '../../manifest.json' // 👈 novo
];

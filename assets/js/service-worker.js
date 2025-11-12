// Nome do cache
const CACHE_NAME = 'gerenciador-cache-v1';

// Arquivos para cache offline
const URLS_TO_CACHE = [
  '../../index.html',
  '../../style.css',
  './scripts.js',
  '../audios/success-1-6297.mp3',
  '../audios/wah-wah-sad-trombone-6347.mp3',
  '../pic/target.png',
  '../pic/default.jpg',
  '../pic/task-icon.png',
  '../../manifest.json'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

// Estratégia: rede primeiro, cache fallback
self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

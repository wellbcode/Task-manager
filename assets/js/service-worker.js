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
  '../pic/task-icon.png',
  '../../manifest.json' // 👈 mantém o manifest também
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

// Intercepta as requisições (modo offline melhorado)
self.addEventListener('fetch', event => {
  // Evita interceptar chamadas do próprio navegador (ex: chrome-extension)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se online, atualiza o cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // Se der erro (offline), tenta servir do cache
        return caches.match(event.request);
      })
  );
});

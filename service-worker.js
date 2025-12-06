const CACHE_NAME = 'smart-task-counter-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/estilo.css',
  '/scriptlogica.js',
  '/manifest.json',
  // Rutas de íconos:
  '/icon-192.png', 
  '/icon-512.png'
];

// Instalar Service Worker y cachear archivos
self.addEventListener('install', event => {
  // Espera hasta que el cache se abra y cachee todos los archivos
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar solicitudes y servir desde cache (Estrategia Cache-First)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en cache, lo devolvemos inmediatamente
        if (response) {
          return response;
        }
        // Si no está en cache, vamos a la red
        return fetch(event.request);
      })
  );
});

// Limpieza de caches antiguos 
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Eliminar caches viejos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
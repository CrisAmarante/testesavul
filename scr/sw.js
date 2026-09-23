const CACHE_NAME = 'penso-cache-v3.2.0.0.0.1';
//Inclusão do modal de Tacógrafos
// Lista de arquivos para cache imediato (estáticos)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './scr/config/config.js',
  './scr/core/utils.js',
  './scr/api/api.js',
  './scr/auth/auth.js',
  './scr/modules/inspecao/inspecao.js',
  './scr/modules/envio/envio-base.js',
  './scr/modules/envio/envio-form.js',
  './scr/modules/envio/envio-actions.js',
   './scr/modules/tacografo/tacografo.js',
  './scr/main.js',
  './manifest.json',
  './icon.png',
  // Font Awesome 100% local (CSS + webfonts): elimina a dependência do
  // cdnjs.cloudflare.com, que era bloqueado por "Tracking Prevention" em
  // Edge/Chrome e quebrava os ícones. Bump da versão força o SW antigo
  // (que ainda referenciava o CDN) a se atualizar e limpar caches velhos.
  './fontawesome-all.min.css?v=6.5.0-local',
  './webfonts/fa-solid-900.woff2',
  './webfonts/fa-solid-900.ttf',
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-regular-400.ttf',
  './webfonts/fa-brands-400.woff2',
  './webfonts/fa-brands-400.ttf'
];

// Instalação: Cria o cache e armazena os arquivos base
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto e instalando assets');
      // addAll() aborta tudo se UM recurso falhar (ex.: CDN bloqueado por
      // Tracking Prevention). Cacheamos individualmente e ignoramos falhas.
      return Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Asset não cacheado:', url, err && err.message);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos quando houver atualização de versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Stale-While-Revalidate + cache específico para thumbnails do Drive
self.addEventListener('fetch', (event) => {
  // Ignorar requisições de API (Planilha Google)
  if (event.request.url.includes('script.google.com')) {
    return;
  }

  // Cache específico para thumbnails do Google Drive (pré-visualização de imagens)
  if (event.request.url.includes('drive.google.com/thumbnail')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Em caso de erro (offline), retorna uma imagem placeholder em base64
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="#999"><path d="M4 4h16v16H4z"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
          return response || fetchPromise;
        });
      })
    );
    return;
  }

  // Demais assets: Stale-While-Revalidate (com fallback offline seguro)
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        if (response) {
          // Serve o cache imediatamente e revalida em segundo plano
          fetchPromise.catch(() => {});
          return response;
        }
        return fetchPromise.then(r => r || respostaOffline(event.request));
      });
    })
  );
});

// Última barreira offline: nunca deixa a requisição morrer sem resposta
function respostaOffline(request) {
  if (request.mode === 'navigate') {
    return caches.match('./index.html').then(r => r || new Response('Você está offline.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }));
  }
  return new Response('', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

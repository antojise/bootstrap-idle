// Service worker — o jogo abre sem rede, mas nunca serve uma versão velha em silêncio.
//
// Estratégia: rede primeiro, cache como rede de segurança. O contrário (cache primeiro)
// deixa o celular preso numa versão antiga até o jogador desinstalar o app.
// Trocar VERSAO invalida tudo.

const VERSAO = 'bootstrap-v0.2.0';

const ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './ui/style.css',
  './ui/app.js',
  './ui/sprites.js',
  './src/engine/state.js',
  './src/engine/tick.js',
  './src/engine/economy.js',
  './src/engine/forge.js',
  './src/engine/daemons.js',
  './src/engine/offline.js',
  './src/engine/prestige.js',
  './src/engine/shop.js',
  './src/engine/acts.js',
  './src/engine/achievements.js',
  './src/data/commands.js',
  './src/data/acts.js',
  './src/data/upgrades.js',
  './src/data/prestige.js',
  './src/data/achievements.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(ESTATICOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req)
      .then(res => {
        // Guarda uma cópia fresca — só do que é nosso, não de CDN de fonte.
        if (res.ok && new URL(req.url).origin === location.origin) {
          const copia = res.clone();
          caches.open(VERSAO).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

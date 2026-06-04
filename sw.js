/**
 * sw.js — ABCL PDV Service Worker
 *
 * Garante que vendinha.html / livraria.html ABRAM mesmo sem internet
 * (ex.: operador dá refresh no sítio). Sem isto, "offline" só funciona
 * enquanto a aba nunca é recarregada.
 *
 * Estratégia:
 *  - App shell (HTML/CSS/JS + SDK Firebase): cache-first com atualização em background.
 *  - Chamadas dinâmicas ao Firebase (Firestore/Auth): SEMPRE rede (nunca cacheadas).
 *
 * IMPORTANTE: ao alterar arquivos do app, suba o número da versão (CACHE_VERSION)
 * para forçar a atualização do cache nos aparelhos.
 */
const CACHE_VERSION = 'abcl-pdv-v4';

const APP_SHELL = [
  'vendinha.html',
  'livraria.html',
  'css/style.css',
  'js/offline-sync.js',
  'js/vendas-firebase.js',
  'js/produtos-sync.js',
  'js/acampantes-sync.js',
  'js/firebase-auth-patch.js',
  'js/main.js',
  'assets/logo-abcl.svg',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js',
];

// Hosts dinâmicos do Firebase — nunca servir do cache
const FIREBASE_DINAMICO = /firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firebaseio\.com|firebasestorage\.googleapis\.com|firebaseinstallations\.googleapis\.com/;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Cacheia item a item para que UMA falha (ex.: CDN momentaneamente fora)
    // não derrube toda a instalação do service worker.
    await Promise.all(APP_SHELL.map((url) =>
      cache.add(url).catch((e) => console.warn('[SW] não cacheou', url, e && e.message))
    ));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const chaves = await caches.keys();
    await Promise.all(chaves.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Só lidamos com GET. POST/PUT (gravações) passam direto pela rede.
  if (req.method !== 'GET') return;

  // Chamadas dinâmicas ao Firebase: sempre rede, sem cache.
  if (FIREBASE_DINAMICO.test(req.url)) return;

  // Navegação (abrir/recarregar a página): tenta rede; se falhar (offline), usa cache.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const copia = fresh.clone();   // clona já, antes de qualquer await/return
        caches.open(CACHE_VERSION).then((c) => c.put(req, copia)).catch(() => {});
        return fresh;
      } catch (e) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // fallback pela URL relativa (ex.: vendinha.html)
        const fb = await caches.match(new URL(req.url).pathname.replace(/^\//, ''));
        return fb || Response.error();
      }
    })());
    return;
  }

  // Demais GET (CSS/JS/SDK/imagens do shell): cache-first + atualização em background.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const rede = fetch(req).then((resp) => {
      if (resp && (resp.ok || resp.type === 'opaque')) {
        // Clona ANTES de retornar a resposta. Se clonássemos dentro do .then
        // assíncrono do caches.open, o corpo já teria sido consumido → erro 'clone'.
        const copia = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copia)).catch(() => {});
      }
      return resp;
    }).catch(() => null);
    return cached || rede || Response.error();
  })());
});

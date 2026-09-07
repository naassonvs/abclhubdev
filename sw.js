/**
 * sw.js — ABCL Hub Service Worker
 *
 * Garante que as páginas do sistema ABRAM mesmo sem internet
 * (ex.: operador dá refresh no sítio). Sem isto, "offline" só funciona
 * enquanto a aba nunca é recarregada.
 *
 * Estratégia:
 *  - App shell (HTML/CSS/JS + SDK Firebase): cache-first com atualização em background.
 *  - Chamadas dinâmicas ao Firebase (Firestore/Auth): SEMPRE rede (nunca cacheadas).
 *
 * IMPORTANTE: ao alterar arquivos do app, suba o número da versão (CACHE_VERSION)
 * para forçar a atualização do cache nos aparelhos.
 *
 * v5: lista de páginas corrigida para cobrir o sistema inteiro (antes só
 * vendinha/livraria estavam no shell — admin, financeiro, formulario, index,
 * canticos e loja não abriam offline). Inclui js/export.js e
 * js/xlsx.full.min.js (exportação XLSX/CSV/PDF). gestao-acessos.html,
 * login.html e links.html foram removidos do projeto (funcionalidade
 * absorvida por admin.html / index.html) e não entram mais no shell.
 */
const CACHE_VERSION = 'abcl-hub-v5';

const APP_SHELL = [
  'index.html',
  'admin.html',
  'formulario.html',
  'financeiro.html',
  'vendinha.html',
  'livraria.html',
  'loja.html',
  'canticos.html',
  'css/style.css',
  'js/export.js',
  'js/xlsx.full.min.js',
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

  // Demais GET (CSS/JS/SDK/imagens do shell): cache-first puro.
  // Antes: mesmo com cache-hit, uma requisição de rede era sempre disparada em
  // paralelo (stale-while-revalidate) — gasta dados à toa em internet ruim.
  // Como o próprio CACHE_VERSION já é o mecanismo de atualização (sobe a
  // versão → reinstala o shell inteiro), um asset já em cache não precisa
  // revalidar sozinho: só busca da rede quando realmente falta no cache.
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const resp = await fetch(req);
      if (resp && (resp.ok || resp.type === 'opaque')) {
        const copia = resp.clone();
        caches.open(CACHE_VERSION).then((c) => c.put(req, copia)).catch(() => {});
      }
      return resp;
    } catch (e) {
      return Response.error();
    }
  })());
});

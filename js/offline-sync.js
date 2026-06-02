/**
 * offline-sync.js — ABCL PDV
 * Sincronização offline: LocalStorage + IndexedDB → Firestore
 */

(function (global) {
  'use strict';

  // ── Constantes ──────────────────────────────────────────────────────────────
  const DB_NAME      = 'abcl_offline';
  const DB_VERSION   = 1;
  const STORE_VENDAS = 'fila_vendas';
  const LS_KEY       = 'abcl_fila_offline';
  const MAX_RETRIES  = 5;
  const RETRY_DELAY  = 3000; // ms

  // ── Estado interno ──────────────────────────────────────────────────────────
  let _db          = null;
  let _status      = 'online';   // 'online' | 'offline' | 'sincronizando'
  let _tentativas  = {};         // { id_temporario: nro_tentativas }
  let _syncTimer   = null;
  let _listeners   = [];

  // ── Inicialização do IndexedDB ──────────────────────────────────────────────
  function initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_VENDAS)) {
          const store = db.createObjectStore(STORE_VENDAS, { keyPath: 'id_temporario' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('sincronizado', 'sincronizado');
        }
      };
      req.onsuccess  = (e) => { _db = e.target.result; resolve(_db); };
      req.onerror    = (e) => { console.error('[OfflineSync] IndexedDB error:', e); reject(e); };
    });
  }

  // ── UI — Indicador de status ────────────────────────────────────────────────
  function criarIndicadorUI() {
    if (document.getElementById('sync-indicator')) return;

    const el = document.createElement('div');
    el.id = 'sync-indicator';
    el.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0;
      height: 36px; z-index: 9999;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 1rem; font-family: Inter, sans-serif; font-size: .75rem;
      font-weight: 500; transition: background .3s, transform .3s;
      transform: translateY(-100%);
    `;

    const span = document.createElement('span');
    span.id = 'sync-msg';

    const btn = document.createElement('button');
    btn.id        = 'sync-btn-manual';
    btn.innerText = '↺ Sincronizar agora';
    btn.style.cssText = `
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
      border-radius: 5px; color: #fff; padding: .25rem .65rem; font-size: .7rem;
      cursor: pointer; font-family: inherit;
    `;
    btn.onclick = () => sincronizarAgora();

    el.appendChild(span);
    el.appendChild(btn);
    document.body.appendChild(el);
  }

  function atualizarUI() {
    const el  = document.getElementById('sync-indicator');
    const msg = document.getElementById('sync-msg');
    if (!el || !msg) return;

    const fila = obterFilaPendente();
    const n    = fila.length;

    if (_status === 'online' && n === 0) {
      el.style.transform  = 'translateY(-100%)';
      return;
    }

    el.style.transform = 'translateY(0)';

    if (_status === 'offline') {
      el.style.background = '#EF4444';
      el.style.color      = '#fff';
      msg.innerText       = `🔴 Offline — ${n} venda(s) pendente(s)`;
    } else if (_status === 'sincronizando') {
      el.style.background = '#F59E0B';
      el.style.color      = '#000';
      msg.innerText       = `🟡 Sincronizando...`;
    } else if (n > 0) {
      el.style.background = '#F59E0B';
      el.style.color      = '#000';
      msg.innerText       = `🟡 ${n} venda(s) aguardando sincronização`;
    } else {
      el.style.background = '#2D6A4F';
      el.style.color      = '#fff';
      msg.innerText       = `✅ Todas as vendas sincronizadas`;
      setTimeout(() => { if (_status === 'online') el.style.transform = 'translateY(-100%)'; }, 3000);
    }
  }

  function atualizarProgresso(atual, total) {
    const msg = document.getElementById('sync-msg');
    if (msg) msg.innerText = `🟡 Sincronizando ${atual} de ${total} vendas...`;
  }

  // ── LocalStorage helpers ────────────────────────────────────────────────────
  function lsGetFila() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
  }

  function lsSetFila(fila) {
    localStorage.setItem(LS_KEY, JSON.stringify(fila));
  }

  // ── IndexedDB helpers ───────────────────────────────────────────────────────
  async function idbAdicionarVenda(venda) {
    if (!_db) return;
    return new Promise((resolve, reject) => {
      const tx  = _db.transaction(STORE_VENDAS, 'readwrite');
      const req = tx.objectStore(STORE_VENDAS).put(venda);
      req.onsuccess = resolve;
      req.onerror   = reject;
    });
  }

  async function idbAtualizarVenda(id, dados) {
    if (!_db) return;
    return new Promise((resolve, reject) => {
      const tx    = _db.transaction(STORE_VENDAS, 'readwrite');
      const store = tx.objectStore(STORE_VENDAS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        if (!getReq.result) return resolve();
        const atualizado = Object.assign({}, getReq.result, dados);
        const putReq = store.put(atualizado);
        putReq.onsuccess = resolve;
        putReq.onerror   = reject;
      };
      getReq.onerror = reject;
    });
  }

  async function idbGetTodos() {
    if (!_db) return [];
    return new Promise((resolve, reject) => {
      const tx  = _db.transaction(STORE_VENDAS, 'readonly');
      const req = tx.objectStore(STORE_VENDAS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => resolve([]);
    });
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  /**
   * Adiciona uma venda à fila de sincronização.
   * @param {Object} venda — objeto de venda (com id_temporario gerado)
   */
  async function adicionarFilaSincronizacao(venda) {
    if (!venda.id_temporario) {
      venda.id_temporario = 'tmp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    venda.sincronizado = false;

    // LocalStorage (rápido)
    const fila = lsGetFila();
    fila.push(venda);
    lsSetFila(fila);

    // IndexedDB (backup robusto)
    await idbAdicionarVenda(venda);

    atualizarUI();
    notificarListeners();

    // Se online, tenta sincronizar imediatamente
    if (navigator.onLine) {
      agendarSincronizacao(500);
    }

    return venda.id_temporario;
  }

  /**
   * Executa sincronização agora.
   * Depende de `window.VendasFirebase.salvarVendaFirebase` estar disponível.
   */
  async function sincronizarAgora() {
    if (_status === 'sincronizando') return;
    if (!navigator.onLine) {
      _status = 'offline';
      atualizarUI();
      return;
    }

    const fila = obterFilaPendente();
    if (fila.length === 0) return;

    _status = 'sincronizando';
    atualizarUI();

    let sincronizadas = 0;
    const total = fila.length;

    for (const venda of fila) {
      const id = venda.id_temporario;
      _tentativas[id] = (_tentativas[id] || 0) + 1;

      try {
        // Verifica se VendasFirebase está disponível
        if (!window.VendasFirebase || !window.VendasFirebase.salvarVendaFirebase) {
          throw new Error('VendasFirebase não está carregado.');
        }

        await window.VendasFirebase.salvarVendaFirebase(venda, venda.tipo);

        // Marca como sincronizada
        marcarSincronizada(id);
        sincronizadas++;
        atualizarProgresso(sincronizadas, total);

      } catch (err) {
        console.error('[OfflineSync] Falha ao sincronizar venda:', id, err);

        if (_tentativas[id] >= MAX_RETRIES) {
          console.warn('[OfflineSync] Máx. tentativas atingido para:', id);
          marcarErro(id, err.message);
        } else {
          agendarSincronizacao(RETRY_DELAY * _tentativas[id]);
        }
      }
    }

    _status = navigator.onLine ? 'online' : 'offline';
    atualizarUI();
    notificarListeners();
  }

  /** Retorna o status atual */
  function obterStatusSincronizacao() {
    return {
      status:   _status,
      pendentes: obterFilaPendente().length,
      online:   navigator.onLine,
    };
  }

  /** Retorna vendas ainda não sincronizadas */
  function obterFilaPendente() {
    return lsGetFila().filter(v => !v.sincronizado && !v.erro_permanente);
  }

  /** Remove todas as vendas sincronizadas da fila */
  function limparFilaSincronizada() {
    const novaFila = lsGetFila().filter(v => !v.sincronizado);
    lsSetFila(novaFila);
    atualizarUI();
  }

  /** Registra um callback chamado quando o status muda */
  function onStatusChange(fn) {
    _listeners.push(fn);
  }

  // ── Internos ─────────────────────────────────────────────────────────────────

  function marcarSincronizada(id) {
    const fila = lsGetFila().map(v => {
      if (v.id_temporario === id) return Object.assign({}, v, { sincronizado: true });
      return v;
    });
    lsSetFila(fila);
    delete _tentativas[id];
    idbAtualizarVenda(id, { sincronizado: true });
  }

  function marcarErro(id, msg) {
    const fila = lsGetFila().map(v => {
      if (v.id_temporario === id) return Object.assign({}, v, { erro_permanente: true, erro_msg: msg });
      return v;
    });
    lsSetFila(fila);
    idbAtualizarVenda(id, { erro_permanente: true, erro_msg: msg });
  }

  function agendarSincronizacao(delay) {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(sincronizarAgora, delay || 1000);
  }

  function notificarListeners() {
    const status = obterStatusSincronizacao();
    _listeners.forEach(fn => { try { fn(status); } catch (_) {} });
  }

  // ── Eventos de rede ──────────────────────────────────────────────────────────
  window.addEventListener('online', () => {
    _status = 'online';
    atualizarUI();
    agendarSincronizacao(800);
  });

  window.addEventListener('offline', () => {
    _status = 'offline';
    atualizarUI();
    notificarListeners();
  });

  // ── Inicializar ───────────────────────────────────────────────────────────────
  async function init() {
    await initDB();
    criarIndicadorUI();

    _status = navigator.onLine ? 'online' : 'offline';

    // Recupera pendências do IDB (caso LS tenha sido limpo)
    const idbVendas = await idbGetTodos();
    const lsFila    = lsGetFila();
    const lsIds     = new Set(lsFila.map(v => v.id_temporario));

    idbVendas.filter(v => !v.sincronizado && !lsIds.has(v.id_temporario))
             .forEach(v => lsFila.push(v));
    lsSetFila(lsFila);

    atualizarUI();

    // Tenta sincronizar pendências ao abrir a página
    if (navigator.onLine && obterFilaPendente().length > 0) {
      agendarSincronizacao(2000);
    }
  }

  // ── Exportar ─────────────────────────────────────────────────────────────────
  global.OfflineSync = {
    init,
    adicionarFilaSincronizacao,
    sincronizarAgora,
    obterStatusSincronizacao,
    obterFilaPendente,
    limparFilaSincronizada,
    onStatusChange,
  };

  // Auto-init quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window));

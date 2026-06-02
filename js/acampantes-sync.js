/**
 * acampantes-sync.js — ABCL
 * Carrega lista de acampantes do Firestore (coleção inscricoes)
 * com fallback para localStorage e array fixo.
 * Disponibiliza window.AcampantesSync.getPessoas()
 */
(function (global) {
  'use strict';

  const LS_KEY    = 'abcl-acampantes-cache';
  const LS_TS_KEY = 'abcl-acampantes-cache-ts';
  const TTL_MS    = 5 * 60 * 1000; // recarrega do Firebase a cada 5 min

  let _lista = null; // cache em memória

  function db() { return firebase.firestore(); }

  // ── Carregar do Firebase ──────────────────────────────────────────────────
  async function carregarDoFirebase() {
    try {
      const snap = await db().collection('inscricoes').get();
      if (snap.empty) return [];

      const nomes = [];
      snap.docs.forEach(d => {
        const data = d.data();
        // Suporta campo 'nome' ou 'nomeCompleto'
        const nome = data.nome || data.nomeCompleto || data.name || '';
        if (nome.trim()) nomes.push(nome.trim());
      });

      const sorted = [...new Set(nomes)].sort();

      // Salvar no cache
      localStorage.setItem(LS_KEY,    JSON.stringify(sorted));
      localStorage.setItem(LS_TS_KEY, String(Date.now()));
      _lista = sorted;

      console.log(`[AcampantesSync] ✅ ${sorted.length} acampantes carregados do Firebase`);
      return sorted;
    } catch (err) {
      console.warn('[AcampantesSync] ⚠️ Offline ou erro — usando cache', err.message);
      return null;
    }
  }

  // ── getPessoas: retorna lista atualizada ──────────────────────────────────
  async function getPessoas() {
    // Cache em memória válido
    if (_lista) return _lista;

    // Cache localStorage válido (menos de 5 min)
    const ts    = parseInt(localStorage.getItem(LS_TS_KEY) || '0');
    const cache = localStorage.getItem(LS_KEY);
    if (cache && Date.now() - ts < TTL_MS) {
      try { _lista = JSON.parse(cache); return _lista; } catch {}
    }

    // Tentar Firebase
    const fbLista = await carregarDoFirebase();
    if (fbLista && fbLista.length > 0) return fbLista;

    // Fallback: unir todas as fontes locais disponíveis
    const p1 = _parseLS('abcl-pessoas')        || [];
    const p2 = _parseLS('abcl-acampantes')     || [];
    const p3 = (_parseLS('abcl-fin-inscricoes') || []).map(i => i.nome).filter(Boolean);
    const fallback = [...new Set([...p1, ...p2, ...p3])].filter(Boolean).sort();

    if (fallback.length) {
      _lista = fallback;
      return fallback;
    }

    return [];
  }

  // ── getPessoasSync: versão síncrona (só cache) ───────────────────────────
  function getPessoasSync() {
    if (_lista) return _lista;
    try {
      const cache = localStorage.getItem(LS_KEY);
      if (cache) { _lista = JSON.parse(cache); return _lista; }
    } catch {}
    // Fallback local
    const p1 = _parseLS('abcl-pessoas')    || [];
    const p2 = _parseLS('abcl-acampantes') || [];
    const p3 = (_parseLS('abcl-fin-inscricoes') || []).map(i => i.nome).filter(Boolean);
    return [...new Set([...p1, ...p2, ...p3])].filter(Boolean).sort();
  }

  function _parseLS(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  // ── Pré-carregar na inicialização ─────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    // Carregar em background sem bloquear a UI
    setTimeout(() => getPessoas().catch(() => {}), 500);
  });

  global.AcampantesSync = { getPessoas, getPessoasSync, carregarDoFirebase };

}(window));

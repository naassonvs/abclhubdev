/**
 * produtos-sync.js — ABCL
 * Sincronização bidirecional de produtos entre localStorage e Firestore.
 * Estratégia: localStorage como fonte de verdade local (operação nunca bloqueia),
 * Firestore como backup/sync. Last-write-wins por timestamp.
 */
(function (global) {
  'use strict';

  // ── Firestore lazy (evita erro se SDK ainda não carregou) ──
  function db() { return firebase.firestore(); }

  // ── Chave de sync no localStorage ──
  const LS_SYNC_KEY = 'abcl-produtos-sync-pendente';

  // ────────────────────────────────────────────────────────────────────────────
  // 1. CARREGAR DO FIREBASE → atualiza localStorage se Firebase for mais recente
  // ────────────────────────────────────────────────────────────────────────────
  async function carregarDoFirebase(colecao, lsKey) {
    try {
      const snap = await db().collection(colecao).get();
      if (snap.empty) return null;

      const produtosFirebase = snap.docs.map(d => ({ ...d.data(), _fbId: d.id }));

      // Comparar timestamp com o que está no localStorage
      const lsTimestamp = parseInt(localStorage.getItem(lsKey + '_ts') || '0');
      const fbTimestamp  = Math.max(...produtosFirebase.map(p => p.atualizado_em?.seconds || 0)) * 1000;

      if (fbTimestamp > lsTimestamp) {
        // Firebase tem dados mais recentes — atualiza localStorage
        const normalizados = produtosFirebase.map(p => _normalizarProduto(p, colecao));
        localStorage.setItem(lsKey, JSON.stringify(normalizados));
        localStorage.setItem(lsKey + '_ts', String(Date.now()));
        console.log(`[ProdutosSync] ✅ ${colecao}: ${normalizados.length} produtos carregados do Firebase`);
        return normalizados;
      }

      console.log(`[ProdutosSync] ℹ️ ${colecao}: localStorage já está atualizado`);
      return null; // localStorage está ok
    } catch (err) {
      console.warn(`[ProdutosSync] ⚠️ ${colecao}: offline ou erro — usando localStorage`, err.message);
      return null;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 2. SALVAR NO FIREBASE (background, não bloqueia a UI)
  // ────────────────────────────────────────────────────────────────────────────
  const _debounceTimers = {};
  async function salvarNoFirebase(colecao, produtos) {
    // Atualizar timestamp LOCAL imediatamente — garante que localStorage
    // ganha do Firebase na próxima comparação, mesmo se a página fechar antes do sync
    const lsKey = colecao === 'produtos_vendinha' ? 'abcl-produtos'
                : colecao === 'produtos_livraria' ? 'abcl-livraria-livros'
                : colecao === 'produtos_loja'     ? 'abcl-loja-produtos'
                : null;
    if (lsKey) localStorage.setItem(lsKey + '_ts', String(Date.now()));

    // Debounce: cancelar escrita anterior pendente para a mesma coleção
    if (_debounceTimers[colecao]) clearTimeout(_debounceTimers[colecao]);
    await new Promise(resolve => {
      _debounceTimers[colecao] = setTimeout(resolve, 800);
    });
    if (!navigator.onLine) {
      _enfileirarSync(colecao, produtos);
      return;
    }
    try {
      const batch = db().batch();
      const agora = firebase.firestore.FieldValue.serverTimestamp();

      produtos.forEach(p => {
        const id  = String(p._fbId || p.id);
        const ref = db().collection(colecao).doc(id);
        const dados = _prepararParaFirebase(p, agora);
        batch.set(ref, dados, { merge: true });
      });

      await batch.commit();
      localStorage.setItem((colecao === 'produtos_vendinha' ? 'abcl-produtos' : 'abcl-livraria-livros') + '_ts', String(Date.now()));
      console.log(`[ProdutosSync] ✅ ${colecao}: ${produtos.length} produtos salvos no Firebase`);
      _limparFilaSync(colecao);
    } catch (err) {
      console.warn(`[ProdutosSync] ⚠️ ${colecao}: falha ao salvar — enfileirando`, err.message);
      _enfileirarSync(colecao, produtos);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 3. DELETAR NO FIREBASE
  // ────────────────────────────────────────────────────────────────────────────
  async function deletarNoFirebase(colecao, produtoId) {
    if (!navigator.onLine) {
      _enfileirarDelete(colecao, produtoId);
      return;
    }
    try {
      await db().collection(colecao).doc(String(produtoId)).delete();
      console.log(`[ProdutosSync] 🗑️ ${colecao}: produto ${produtoId} deletado do Firebase`);
    } catch (err) {
      console.warn(`[ProdutosSync] ⚠️ ${colecao}: falha ao deletar — enfileirando`, err.message);
      _enfileirarDelete(colecao, produtoId);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 4. SINCRONIZAR FILA PENDENTE (chamado quando internet volta)
  // ────────────────────────────────────────────────────────────────────────────
  async function sincronizarPendentes() {
    const fila = JSON.parse(localStorage.getItem(LS_SYNC_KEY) || '[]');
    if (fila.length === 0) return;

    console.log(`[ProdutosSync] 🔄 Sincronizando ${fila.length} operações pendentes...`);
    const restante = [];

    for (const op of fila) {
      try {
        if (op.tipo === 'salvar') {
          await salvarNoFirebase(op.colecao, op.produtos);
        } else if (op.tipo === 'deletar') {
          await deletarNoFirebase(op.colecao, op.produtoId);
        }
      } catch {
        restante.push(op); // mantém na fila se ainda falhar
      }
    }

    localStorage.setItem(LS_SYNC_KEY, JSON.stringify(restante));
    if (restante.length === 0) {
      console.log('[ProdutosSync] ✅ Todos os pendentes sincronizados');
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // UTILS INTERNOS
  // ────────────────────────────────────────────────────────────────────────────
  function _normalizarProduto(p, colecao) {
    if (colecao === 'produtos_loja') {
      const img = p.imagem_url || p.imagem || '';
      // Preservar _todos_ os campos originais e só sobrescrever o que precisar normalizar
      const base = { ...p };
      delete base._fbId;
      return {
        ...base,
        id:         p._fbId || p.id,
        nome:       p.nome       || '',
        categoria:  p.categoria  || '',
        desc:       p.desc       || '',
        preco:      p.preco      || 0,
        custo:      p.custo      || 0,
        estoque:    p.estoque    || 0,
        estoque_minimo: p.estoque_minimo || 3,
        tamanhos:   p.tamanhos   || [],
        cores:      p.cores      || [],
        genero:     p.genero     || [],
        imagem:     img,
        imagem_url: img,
        ativo:      p.ativo !== false,
        novo:       p.novo       || false,
        variacaoEstoque: p.variacaoEstoque || {},
      };
    }
    if (colecao === 'produtos_vendinha') {
      return {
        id:      p._fbId || p.id,
        nome:    p.nome    || '',
        preco:   p.preco   || 0,
        estoque: p.estoque || 0,
        icon:    p.icon    || '📦',
        imagem:  p.imagem_url || p.imagem || '',
        _fbId:   p._fbId || p.id,
      };
    }
    // livraria
    const capaUrl = p.capa || p.imagem_url || p.imagem || '';
    return {
      id:        p._fbId || p.id,
      titulo:    p.titulo    || p.nome || '',
      autor:     p.autor     || '',
      editora:   p.editora   || '',
      categoria: p.categoria || '',
      isbn:      p.isbn      || '',
      preco:     p.preco     || 0,
      estoque:   p.estoque   || 0,
      alertaBaixo: p.alertaBaixo || 3,
      desc:      p.desc      || '',
      capa:      capaUrl,
      imagem:    capaUrl,
      _fbId:     p._fbId || p.id,
    };
  }

  function _prepararParaFirebase(p, agora) {
    const d = { ...p, atualizado_em: agora };
    delete d._fbId;
    // garantir imagem_url sempre preenchido
    if (!d.imagem_url) d.imagem_url = d.capa || d.imagem || '';
    if (!d.capa)       d.capa       = d.imagem_url;
    return d;
  }

  function _enfileirarSync(colecao, produtos) {
    const fila = JSON.parse(localStorage.getItem(LS_SYNC_KEY) || '[]');
    // substitui operação anterior do mesmo colecao (evita duplicata)
    const idx = fila.findIndex(op => op.tipo === 'salvar' && op.colecao === colecao);
    const entrada = { tipo: 'salvar', colecao, produtos, ts: Date.now() };
    if (idx >= 0) fila[idx] = entrada; else fila.push(entrada);
    localStorage.setItem(LS_SYNC_KEY, JSON.stringify(fila));
  }

  function _enfileirarDelete(colecao, produtoId) {
    const fila = JSON.parse(localStorage.getItem(LS_SYNC_KEY) || '[]');
    fila.push({ tipo: 'deletar', colecao, produtoId, ts: Date.now() });
    localStorage.setItem(LS_SYNC_KEY, JSON.stringify(fila));
  }

  function _limparFilaSync(colecao) {
    const fila = JSON.parse(localStorage.getItem(LS_SYNC_KEY) || '[]')
      .filter(op => op.colecao !== colecao || op.tipo === 'deletar');
    localStorage.setItem(LS_SYNC_KEY, JSON.stringify(fila));
  }

  // ── Listener de reconexão ──
  window.addEventListener('online', () => {
    console.log('[ProdutosSync] 🌐 Internet voltou — sincronizando pendentes...');
    setTimeout(sincronizarPendentes, 1500); // pequeno delay para estabilizar conexão
  });

  // ── Exportar ──
  global.ProdutosSync = {
    carregarDoFirebase,
    salvarNoFirebase,
    deletarNoFirebase,
    sincronizarPendentes,
  };

}(window));

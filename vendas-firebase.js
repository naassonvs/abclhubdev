/**
 * vendas-firebase.js — ABCL PDV
 * Integração Firestore: salvar, buscar, editar, cancelar vendas
 * Depende de: Firebase SDK (compat) já inicializado
 */

(function (global) {
  'use strict';

  // ── Firebase refs ────────────────────────────────────────────────────────────
  function db()        { return firebase.firestore(); }
  function colVendas() { return db().collection('vendas'); }
  function colEstoque(modulo) { return db().collection(modulo + '_estoque'); }
  function docFinanceiro(ano) { return db().collection('financeiro').doc(String(ano)); }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function gerarId() {
    return 'vnd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  }

  function dataHoje() {
    return new Date().toISOString().slice(0, 10);
  }

  function horaAgora() {
    return new Date().toTimeString().slice(0, 5);
  }

  function anoAtual() {
    return new Date().getFullYear();
  }

  /**
   * Monta o objeto completo da venda para salvar no Firestore.
   * @param {Object} dadosParciais - campos passados pelo PDV
   * @param {string} modulo - 'vendinha' | 'livraria' | 'loja'
   */
  function montarVenda(dadosParciais, modulo) {
    const agora = new Date();
    return {
      tipo:              modulo,
      produtos:          dadosParciais.produtos          || [],
      subtotal:          dadosParciais.subtotal          || 0,
      desconto:          dadosParciais.desconto          || 0,
      total:             dadosParciais.total             || 0,

      // Acampante (vendinha + livraria)
      acampante:         dadosParciais.pessoa            || dadosParciais.acampante || null,
      periodo:           dadosParciais.periodo           || null,

      // Ofertas (vendinha + livraria)
      eh_oferta:         dadosParciais.eh_oferta         || false,
      valor_oferta:      dadosParciais.valor_oferta      || null,
      status_oferta:     dadosParciais.status_oferta     || null,

      // Pagamento
      forma_pagamento:   dadosParciais.forma_pagamento   || 'dinheiro',
      cartao_tipo:       dadosParciais.cartao_tipo       || null,

      // Operador
      operador_uid:      dadosParciais.operador_uid      || null,
      operador_nome:     dadosParciais.operador_nome     || 'Anônimo',

      // Timestamps
      timestamp:         firebase.firestore.Timestamp.now(),
      data:              dadosParciais.data              || dataHoje(),
      hora:              dadosParciais.hora              || horaAgora(),
      ano_acampamento:   dadosParciais.ano_acampamento   || anoAtual(),

      // Status
      status:            'confirmada',
      sincronizado:      true,
      id_temporario:     dadosParciais.id_temporario     || null,
    };
  }

  // ── 1. Salvar venda ──────────────────────────────────────────────────────────

  /**
   * Salva uma venda no Firestore.
   * Se vier de offline-sync, usa o id_temporario como base do ID no Firestore.
   * @param {Object} dadosParciais
   * @param {string} modulo
   * @returns {Promise<string>} ID do documento salvo
   */
  async function salvarVendaFirebase(dadosParciais, modulo) {
    const venda   = montarVenda(dadosParciais, modulo);
    const docId   = dadosParciais.firestore_id || gerarId();
    const docRef  = colVendas().doc(docId);

    await docRef.set(venda);

    // Atualiza estoque (best-effort, não bloqueia o salvamento)
    try {
      await _atualizarEstoqueBatch(modulo, venda.produtos, 'subtrair');
    } catch (e) {
      console.warn('[VendasFirebase] Estoque não atualizado:', e);
    }

    // Atualiza resumo financeiro
    try {
      await atualizarResumoFinanceiro(venda.ano_acampamento, venda.total, modulo);
    } catch (e) {
      console.warn('[VendasFirebase] Resumo financeiro não atualizado:', e);
    }

    return docId;
  }

  // ── 2. Buscar vendas ─────────────────────────────────────────────────────────

  /**
   * Busca vendas do Firestore com filtros opcionais.
   * IMPORTANTE: Ordenação removida para evitar índice composto (status + timestamp).
   * A ordenação é feita no cliente após a busca.
   * @param {string} modulo - 'vendinha' | 'livraria' | 'loja' | null (todos)
   * @param {Object} filtros - { data, status, forma_pagamento, operador_uid }
   * @returns {Promise<Array>}
   */
  async function buscarVendasFirebase(modulo, filtros = {}) {
    let query = colVendas();

    // Filtro primário: status (mais seletivo, evita buscar vendas canceladas desnecessárias)
    if (filtros.status) query = query.where('status', '==', filtros.status);

    // Filtros adicionais aplicados no Firestore quando possível
    // Múltiplos .where() em campos diferentes NÃO requerem índice composto
    if (filtros.ano_acampamento) query = query.where('ano_acampamento', '==', filtros.ano_acampamento);

    // Limite antes de buscar (economia de leitura)
    if (filtros.limite) query = query.limit(filtros.limite);

    const snap = await query.get();
    let vendas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Filtros adicionais no cliente (evita múltiplos índices compostos)
    if (modulo) vendas = vendas.filter(v => v.tipo === modulo);
    if (filtros.data) {
      const dataFormatada = filtros.data.includes('-')
        ? filtros.data.split('-').reverse().join('/')
        : filtros.data;
      vendas = vendas.filter(v => v.data === dataFormatada || v.data === filtros.data);
    }
    if (filtros.forma_pagamento) vendas = vendas.filter(v => v.forma_pagamento === filtros.forma_pagamento);
    if (filtros.operador_uid) vendas = vendas.filter(v => v.operador_uid === filtros.operador_uid);

    // Ordenação no cliente: mais recentes primeiro
    vendas.sort((a, b) => {
      const ta = a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0;
      const tb = b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0;
      return tb - ta;
    });

    return vendas;
  }

  // ── 3. Editar venda ──────────────────────────────────────────────────────────

  /**
   * Edita uma venda existente.
   * Detecta conflito de estoque ao alterar produtos.
   * @param {string} vendaId
   * @param {Object} novosDados - campos a atualizar
   * @returns {Promise<void>}
   */
  async function editarVendaFirebase(vendaId, novosDados) {
    const docRef   = colVendas().doc(vendaId);
    const snapAnt  = await docRef.get();

    if (!snapAnt.exists) throw new Error('Venda não encontrada: ' + vendaId);

    const vendaAnt = snapAnt.data();
    if (vendaAnt.status === 'cancelada') throw new Error('Não é possível editar uma venda cancelada.');

    // Se produtos mudaram, ajusta estoque
    if (novosDados.produtos) {
      const modulo = vendaAnt.tipo;

      // Devolve o estoque dos produtos antigos
      await _atualizarEstoqueBatch(modulo, vendaAnt.produtos, 'somar');
      // Retira o estoque dos novos produtos
      await _atualizarEstoqueBatch(modulo, novosDados.produtos, 'subtrair');
    }

    const dados = Object.assign({}, novosDados, {
      editado_em:    firebase.firestore.Timestamp.now(),
      editado_por:   novosDados.operador_uid || vendaAnt.operador_uid,
    });

    await docRef.update(dados);

    // Recalcula resumo financeiro se total mudou
    if (novosDados.total !== undefined && novosDados.total !== vendaAnt.total) {
      const diff = novosDados.total - vendaAnt.total;
      await _incrementarResumo(vendaAnt.ano_acampamento, vendaAnt.tipo, diff);
    }
  }

  // ── 4. Cancelar venda ────────────────────────────────────────────────────────

  /**
   * Cancela uma venda e recoloca o estoque.
   * @param {string} vendaId
   * @param {string} motivoCancelamento
   * @returns {Promise<void>}
   */
  async function cancelarVendaFirebase(vendaId, motivoCancelamento = '') {
    const docRef = colVendas().doc(vendaId);
    const snap   = await docRef.get();

    if (!snap.exists) throw new Error('Venda não encontrada: ' + vendaId);

    const venda = snap.data();
    if (venda.status === 'cancelada') throw new Error('Venda já está cancelada.');

    // Devolve estoque
    try {
      await _atualizarEstoqueBatch(venda.tipo, venda.produtos, 'somar');
    } catch (e) {
      console.warn('[VendasFirebase] Estoque não restaurado:', e);
    }

    await docRef.update({
      status:              'cancelada',
      motivo_cancelamento: motivoCancelamento,
      cancelado_em:        firebase.firestore.Timestamp.now(),
    });

    // Subtrai do resumo financeiro
    await _incrementarResumo(venda.ano_acampamento, venda.tipo, -venda.total);
  }

  // ── 5. Estoque ───────────────────────────────────────────────────────────────

  /**
   * Atualiza o estoque de um produto específico.
   * @param {string} modulo
   * @param {string} produtoId
   * @param {number} novoEstoque - valor absoluto
   */
  async function atualizarEstoqueProduto(modulo, produtoId, novoEstoque) {
    await colEstoque(modulo).doc(produtoId).set(
      { estoque: novoEstoque, atualizado_em: firebase.firestore.Timestamp.now() },
      { merge: true }
    );
  }

  /**
   * Ajusta estoque de múltiplos produtos via batch.
   * @param {string} modulo
   * @param {Array} produtos - [{ id, nome, quantidade }]
   * @param {'somar'|'subtrair'} operacao
   */
  async function _atualizarEstoqueBatch(modulo, produtos, operacao) {
    // Garante que produtos é um array válido
    if (!produtos) return;
    if (!Array.isArray(produtos)) {
      console.warn('[VendasFirebase] produtos não é array, ignorando estoque:', typeof produtos);
      return;
    }
    if (produtos.length === 0) return;

    const batch  = db().batch();
    const inc    = firebase.firestore.FieldValue.increment;
    let temItens = false;

    for (const p of produtos) {
      const produtoId = p.id || p.produto_id || null;
      if (!produtoId) continue;
      const qtd  = parseInt(p.quantidade || p.qtd || 1, 10);
      if (isNaN(qtd) || qtd <= 0) continue;
      const diff = operacao === 'subtrair' ? -qtd : qtd;
      const ref  = colEstoque(modulo).doc(String(produtoId));
      batch.set(ref, {
        estoque:       inc(diff),
        nome:          p.nome || p.t || p.produto_nome || '',
        atualizado_em: firebase.firestore.Timestamp.now()
      }, { merge: true });
      temItens = true;
    }

    if (temItens) await batch.commit();
  }

  // ── 6. Resumo financeiro ─────────────────────────────────────────────────────

  /**
   * Recalcula e salva o resumo financeiro do ano via busca no Firestore.
   * Use com moderação (operação pesada).
   * @param {number} ano
   */
  async function atualizarResumoFinanceiro(ano) {
    // Usa _incrementarResumo (leve, sem query complexa e sem necessidade de índice)
    // Esta função é chamada internamente com os dados já conhecidos
    // Para recalculo completo, use recalcularResumoCompleto(ano)
    ano = ano || anoAtual();
    return await docFinanceiro(ano).get().then(s => s.exists ? s.data() : {});
  }

  /**
   * Recalcula o resumo completo — use apenas no financeiro.html, não no PDV.
   * Requer índice composto no Firestore (ano_acampamento + status).
   */
  async function recalcularResumoCompleto(ano) {
    ano = ano || anoAtual();
    try {
      // Busca por tipo separadamente — evita query composta com índice
      const modulos = ['vendinha', 'livraria', 'loja'];
      const resumo  = { vendinha: 0, livraria: 0, loja: 0, total: 0, qtd_vendas: 0 };

      for (const mod of modulos) {
        const snap = await colVendas()
          .where('tipo', '==', mod)
          .where('ano_acampamento', '==', ano)
          .where('status', '==', 'confirmada')
          .get();

        snap.forEach(d => {
          const v = d.data();
          resumo[mod]    += v.total || 0;
          resumo.total   += v.total || 0;
          resumo.qtd_vendas++;
        });
      }

      resumo.atualizado_em = firebase.firestore.Timestamp.now();
      await docFinanceiro(ano).set(resumo, { merge: true });
      return resumo;
    } catch (err) {
      console.warn('[VendasFirebase] Erro ao recalcular resumo:', err.message);
      return {};
    }
  }

  /**
   * Incrementa um módulo específico no resumo (operação leve, uso interno).
   */
  async function _incrementarResumo(ano, modulo, valor) {
    ano = ano || anoAtual();
    const inc = firebase.firestore.FieldValue.increment;
    const dados = {
      total:           inc(valor),
      atualizado_em:   firebase.firestore.Timestamp.now(),
      qtd_vendas:      inc(valor > 0 ? 1 : -1),
    };
    if (['vendinha', 'livraria', 'loja'].includes(modulo)) {
      dados[modulo] = inc(valor);
    }
    await docFinanceiro(ano).set(dados, { merge: true });
  }

  // ── 7. Buscar resumo para financeiro.html ────────────────────────────────────

  /**
   * Busca o resumo financeiro salvo para exibição na página financeiro.html.
   * @param {number} ano
   * @returns {Promise<Object>}
   */
  async function buscarResumoFinanceiro(ano) {
    ano = ano || anoAtual();
    const snap = await docFinanceiro(ano).get();
    if (snap.exists) return snap.data();

    // Se não existe, calcula agora
    return await atualizarResumoFinanceiro(ano);
  }

  /**
   * Escuta atualizações em tempo real do resumo financeiro.
   * @param {number} ano
   * @param {Function} callback - fn(resumo)
   * @returns {Function} unsubscribe
   */
  function escutarResumoFinanceiro(ano, callback) {
    ano = ano || anoAtual();
    return docFinanceiro(ano).onSnapshot((snap) => {
      if (snap.exists) callback(snap.data());
    });
  }

  /**
   * Escuta vendas em tempo real de um módulo.
   * Ordenação no cliente para evitar índice composto.
   * @param {string} modulo
   * @param {Function} callback - fn(vendas[])
   * @returns {Function} unsubscribe
   */
  function escutarVendasModulo(modulo, callback) {
    let q = colVendas()
      .where('ano_acampamento', '==', anoAtual())
      .limit(100);

    // NÃO adiciona .where('tipo') nem .orderBy() para evitar índice composto
    // Filtragem e ordenação feitas no callback

    return q.onSnapshot((snap) => {
      let vendas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filtra por módulo no cliente
      if (modulo) vendas = vendas.filter(v => v.tipo === modulo);
      
      // Ordena no cliente: mais recentes primeiro
      vendas.sort((a, b) => {
        const ta = a.timestamp?.toMillis?.() || a.timestamp?.seconds * 1000 || 0;
        const tb = b.timestamp?.toMillis?.() || b.timestamp?.seconds * 1000 || 0;
        return tb - ta;
      });

      callback(vendas);
    });
  }

  // ── Exportar ─────────────────────────────────────────────────────────────────
  global.VendasFirebase = {
    salvarVendaFirebase,
    buscarVendasFirebase,
    editarVendaFirebase,
    cancelarVendaFirebase,
    atualizarEstoqueProduto,
    atualizarResumoFinanceiro,
    recalcularResumoCompleto,
    buscarResumoFinanceiro,
    escutarResumoFinanceiro,
    escutarVendasModulo,
  };

}(window));

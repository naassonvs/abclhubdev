// Database Helper - CDN Version (sem módulos ES6)
// Use window.db.salvarVenda(), window.db.buscarVendasPorAno(), etc.

const DatabaseHelper = {
  
  // ============ FUNÇÕES GENÉRICAS ============

  /**
   * Salvar um novo documento em uma coleção
   * @param {string} colecao - Nome da coleção
   * @param {object} dados - Dados do documento
   * @returns {Promise<string>} ID do documento
   */
  salvarDocumento: async function(colecao, dados) {
    try {
      const db = window.firebaseApp.db;
      const docRef = await db.collection(colecao).add({
        ...dados,
        criado_em: firebase.firestore.Timestamp.now(),
        atualizado_em: firebase.firestore.Timestamp.now()
      });
      console.log(`✅ Documento salvo em ${colecao}:`, docRef.id);
      return docRef.id;
    } catch (erro) {
      console.error(`❌ Erro ao salvar em ${colecao}:`, erro);
      throw erro;
    }
  },

  /**
   * Buscar um documento por ID
   * @param {string} colecao - Nome da coleção
   * @param {string} docId - ID do documento
   * @returns {Promise<object|null>}
   */
  buscarPorId: async function(colecao, docId) {
    try {
      const db = window.firebaseApp.db;
      const docSnap = await db.collection(colecao).doc(docId).get();
      
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.warn(`⚠️ Documento não encontrado: ${colecao}/${docId}`);
        return null;
      }
    } catch (erro) {
      console.error(`❌ Erro ao buscar ${colecao}/${docId}:`, erro);
      throw erro;
    }
  },

  /**
   * Buscar todos os documentos com filtros opcionais
   * @param {string} colecao - Nome da coleção
   * @param {array} filtros - Array de {campo, operador, valor}
   * @param {string} ordenarPor - Campo para ordenar
   * @param {number} limite - Quantidade máxima
   * @returns {Promise<array>}
   */
  buscarTodos: async function(colecao, filtros = [], ordenarPor = null, limite = null) {
    try {
      const db = window.firebaseApp.db;
      let query = db.collection(colecao);

      // Adicionar filtros
      if (filtros && filtros.length > 0) {
        filtros.forEach(f => {
          query = query.where(f.campo, f.operador, f.valor);
        });
      }

      // Adicionar ordenação
      if (ordenarPor) {
        query = query.orderBy(ordenarPor, 'desc');
      }

      // Adicionar limite
      if (limite) {
        query = query.limit(limite);
      }

      const querySnapshot = await query.get();
      const documentos = [];
      querySnapshot.forEach(doc => {
        documentos.push({ id: doc.id, ...doc.data() });
      });

      console.log(`✅ ${documentos.length} documentos encontrados em ${colecao}`);
      return documentos;
    } catch (erro) {
      console.error(`❌ Erro ao buscar em ${colecao}:`, erro);
      throw erro;
    }
  },

  /**
   * Atualizar um documento
   * @param {string} colecao - Nome da coleção
   * @param {string} docId - ID do documento
   * @param {object} dados - Dados a atualizar
   * @returns {Promise<void>}
   */
  atualizarDocumento: async function(colecao, docId, dados) {
    try {
      const db = window.firebaseApp.db;
      await db.collection(colecao).doc(docId).update({
        ...dados,
        atualizado_em: firebase.firestore.Timestamp.now()
      });
      console.log(`✅ Documento atualizado: ${colecao}/${docId}`);
    } catch (erro) {
      console.error(`❌ Erro ao atualizar ${colecao}/${docId}:`, erro);
      throw erro;
    }
  },

  /**
   * Deletar um documento
   * @param {string} colecao - Nome da coleção
   * @param {string} docId - ID do documento
   * @returns {Promise<void>}
   */
  deletarDocumento: async function(colecao, docId) {
    try {
      const db = window.firebaseApp.db;
      await db.collection(colecao).doc(docId).delete();
      console.log(`✅ Documento deletado: ${colecao}/${docId}`);
    } catch (erro) {
      console.error(`❌ Erro ao deletar ${colecao}/${docId}:`, erro);
      throw erro;
    }
  },

  // ============ FUNÇÕES ESPECÍFICAS ABCL HUB ============

  /**
   * Salvar uma venda
   * @param {object} venda
   * @returns {Promise<string>} ID da venda
   */
  salvarVenda: async function(venda) {
    return this.salvarDocumento('vendas', {
      ...venda,
      timestamp: firebase.firestore.Timestamp.now(),
      status: 'confirmada'
    });
  },

  /**
   * Buscar vendas por ano
   * @param {number} ano
   * @returns {Promise<array>}
   */
  buscarVendasPorAno: async function(ano) {
    return this.buscarTodos('vendas', [
      { campo: 'ano_acampamento', operador: '==', valor: ano }
    ], 'timestamp');
  },

  /**
   * Salvar uma inscrição
   * @param {object} inscricao
   * @returns {Promise<string>}
   */
  salvarInscricao: async function(inscricao) {
    return this.salvarDocumento('inscricoes', {
      ...inscricao,
      timestamp: firebase.firestore.Timestamp.now(),
      status: 'pendente',
      aprovada: false
    });
  },

  /**
   * Salvar um produto
   * @param {string} modulo - 'vendinha' | 'livraria' | 'loja'
   * @param {object} produto
   * @returns {Promise<string>}
   */
  salvarProduto: async function(modulo, produto) {
    return this.salvarDocumento(`produtos_${modulo}`, {
      ...produto,
      ativo: true,
      timestamp: firebase.firestore.Timestamp.now()
    });
  },

  /**
   * Salvar um hino
   * @param {object} hino
   * @returns {Promise<string>}
   */
  salvarHino: async function(hino) {
    return this.salvarDocumento('hinos', {
      ...hino,
      timestamp: firebase.firestore.Timestamp.now(),
      visualizacoes: 0
    });
  },

  /**
   * Buscar usuário por UID
   * @param {string} uid
   * @returns {Promise<object|null>}
   */
  buscarUsuario: async function(uid) {
    return this.buscarPorId('usuarios', uid);
  },

  /**
   * Salvar perfil do usuário
   * @param {string} uid
   * @param {object} perfil
   * @returns {Promise<void>}
   */
  salvarPerfil: async function(uid, perfil) {
    try {
      const db = window.firebaseApp.db;
      await db.collection('usuarios').doc(uid).update({
        ...perfil,
        atualizado_em: firebase.firestore.Timestamp.now()
      });
    } catch (erro) {
      // Se não existe, criar novo
      await this.salvarDocumento('usuarios', {
        uid,
        ...perfil,
        criado_em: firebase.firestore.Timestamp.now()
      });
    }
  },

  /**
   * Buscar resumo financeiro
   * @param {number} ano
   * @returns {Promise<object>}
   */
  buscarResumoFinanceiro: async function(ano) {
    try {
      const vendas = await this.buscarVendasPorAno(ano);
      const inscricoes = await this.buscarTodos('inscricoes', [
        { campo: 'ano_acampamento', operador: '==', valor: ano }
      ]);

      let totalVendas = 0;
      let totalInscricoes = 0;
      let vendasPorModulo = { vendinha: 0, livraria: 0, loja: 0 };
      let vendasPorFormaPagamento = { dinheiro: 0, pix: 0, cartao: 0 };

      vendas.forEach(v => {
        totalVendas += v.valor || 0;
        vendasPorModulo[v.tipo] = (vendasPorModulo[v.tipo] || 0) + (v.valor || 0);
        vendasPorFormaPagamento[v.forma_pagamento] = (vendasPorFormaPagamento[v.forma_pagamento] || 0) + (v.valor || 0);
      });

      inscricoes.forEach(i => {
        totalInscricoes += i.valor_pago || 0;
      });

      return {
        ano,
        totalVendas,
        totalInscricoes,
        totalArrecadado: totalVendas + totalInscricoes,
        vendasPorModulo,
        vendasPorFormaPagamento,
        quantidadeInscricoes: inscricoes.length,
        quantidadeVendas: vendas.length
      };
    } catch (erro) {
      console.error(`❌ Erro ao buscar resumo financeiro:`, erro);
      throw erro;
    }
  }
};

// Exportar para uso global
window.db = DatabaseHelper;
console.log('✅ Database Helper carregado!');

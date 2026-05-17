// Database Helper - db.js
// Funções reutilizáveis para interagir com Firestore

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase-config.js";

// ============ FUNÇÕES GENÉRICAS ============

/**
 * Salvar um novo documento em uma coleção
 * @param {string} colecao - Nome da coleção (ex: 'vendas', 'produtos')
 * @param {object} dados - Dados do documento
 * @returns {Promise<string>} ID do documento criado
 */
export async function salvarDocumento(colecao, dados) {
  try {
    const docRef = await addDoc(collection(db, colecao), {
      ...dados,
      criado_em: Timestamp.now(),
      atualizado_em: Timestamp.now()
    });
    console.log(`✅ Documento salvo em ${colecao}:`, docRef.id);
    return docRef.id;
  } catch (erro) {
    console.error(`❌ Erro ao salvar em ${colecao}:`, erro);
    throw erro;
  }
}

/**
 * Buscar um documento por ID
 * @param {string} colecao - Nome da coleção
 * @param {string} docId - ID do documento
 * @returns {Promise<object|null>} Dados do documento ou null
 */
export async function buscarPorId(colecao, docId) {
  try {
    const docRef = doc(db, colecao, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`⚠️ Documento não encontrado: ${colecao}/${docId}`);
      return null;
    }
  } catch (erro) {
    console.error(`❌ Erro ao buscar ${colecao}/${docId}:`, erro);
    throw erro;
  }
}

/**
 * Buscar todos os documentos de uma coleção (com opções de filtro)
 * @param {string} colecao - Nome da coleção
 * @param {array} filtros - Array de objetos {campo, operador, valor} (opcional)
 * @param {string} ordenarPor - Campo para ordenar (opcional)
 * @param {number} limite - Quantidade máxima de documentos (opcional)
 * @returns {Promise<array>} Array de documentos
 */
export async function buscarTodos(colecao, filtros = [], ordenarPor = null, limite = null) {
  try {
    let q = collection(db, colecao);
    let constraints = [];

    // Adicionar filtros
    if (filtros.length > 0) {
      filtros.forEach(f => {
        constraints.push(where(f.campo, f.operador, f.valor));
      });
    }

    // Adicionar ordenação
    if (ordenarPor) {
      constraints.push(orderBy(ordenarPor, 'desc'));
    }

    // Adicionar limite
    if (limite) {
      constraints.push(limit(limite));
    }

    // Criar query
    if (constraints.length > 0) {
      q = query(q, ...constraints);
    }

    const querySnapshot = await getDocs(q);
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
}

/**
 * Atualizar um documento
 * @param {string} colecao - Nome da coleção
 * @param {string} docId - ID do documento
 * @param {object} dados - Dados a atualizar
 * @returns {Promise<void>}
 */
export async function atualizarDocumento(colecao, docId, dados) {
  try {
    const docRef = doc(db, colecao, docId);
    await updateDoc(docRef, {
      ...dados,
      atualizado_em: Timestamp.now()
    });
    console.log(`✅ Documento atualizado: ${colecao}/${docId}`);
  } catch (erro) {
    console.error(`❌ Erro ao atualizar ${colecao}/${docId}:`, erro);
    throw erro;
  }
}

/**
 * Deletar um documento
 * @param {string} colecao - Nome da coleção
 * @param {string} docId - ID do documento
 * @returns {Promise<void>}
 */
export async function deletarDocumento(colecao, docId) {
  try {
    const docRef = doc(db, colecao, docId);
    await deleteDoc(docRef);
    console.log(`✅ Documento deletado: ${colecao}/${docId}`);
  } catch (erro) {
    console.error(`❌ Erro ao deletar ${colecao}/${docId}:`, erro);
    throw erro;
  }
}

// ============ FUNÇÕES ESPECÍFICAS DO ABCL HUB ============

/**
 * Salvar uma venda
 * @param {object} venda - {tipo, produto, quantidade, valor, forma_pagamento, operador_uid, ano_acampamento}
 * @returns {Promise<string>} ID da venda
 */
export async function salvarVenda(venda) {
  return salvarDocumento('vendas', {
    ...venda,
    timestamp: Timestamp.now(),
    status: 'confirmada'
  });
}

/**
 * Buscar vendas por período (ano do acampamento)
 * @param {number} ano - Ano do acampamento
 * @returns {Promise<array>} Vendas do ano
 */
export async function buscarVendasPorAno(ano) {
  return buscarTodos('vendas', [
    { campo: 'ano_acampamento', operador: '==', valor: ano }
  ], 'timestamp');
}

/**
 * Salvar uma inscrição
 * @param {object} inscricao - {nome, responsavel, idade, grupo, valor_pago, forma_pagamento}
 * @returns {Promise<string>} ID da inscrição
 */
export async function salvarInscricao(inscricao) {
  return salvarDocumento('inscricoes', {
    ...inscricao,
    timestamp: Timestamp.now(),
    status: 'pendente',
    aprovada: false
  });
}

/**
 * Salvar um produto (Vendinha, Livraria ou Loja)
 * @param {string} modulo - 'vendinha' | 'livraria' | 'loja'
 * @param {object} produto - {nome, preco, estoque, categoria, imagem_url, descricao}
 * @returns {Promise<string>} ID do produto
 */
export async function salvarProduto(modulo, produto) {
  return salvarDocumento(`produtos_${modulo}`, {
    ...produto,
    ativo: true,
    timestamp: Timestamp.now()
  });
}

/**
 * Salvar um hino
 * @param {object} hino - {titulo, letra, cifra, categoria, artista}
 * @returns {Promise<string>} ID do hino
 */
export async function salvarHino(hino) {
  return salvarDocumento('hinos', {
    ...hino,
    timestamp: Timestamp.now(),
    visualizacoes: 0
  });
}

/**
 * Buscar usuário por UID
 * @param {string} uid - UID do usuário (do Firebase Auth)
 * @returns {Promise<object|null>} Dados do usuário
 */
export async function buscarUsuario(uid) {
  return buscarPorId('usuarios', uid);
}

/**
 * Salvar perfil do usuário
 * @param {string} uid - UID do usuário
 * @param {object} perfil - {nome, email, foto_url, perfil_tipo, aprovado, ultimo_acesso}
 * @returns {Promise<void>}
 */
export async function salvarPerfil(uid, perfil) {
  try {
    const docRef = doc(db, 'usuarios', uid);
    await updateDoc(docRef, {
      ...perfil,
      atualizado_em: Timestamp.now()
    });
  } catch (erro) {
    // Se o documento não existe, criar um novo
    await salvarDocumento('usuarios', {
      uid,
      ...perfil,
      criado_em: Timestamp.now()
    });
  }
}

/**
 * Buscar resumo financeiro de um ano
 * @param {number} ano - Ano do acampamento
 * @returns {Promise<object>} Resumo com totais
 */
export async function buscarResumoFinanceiro(ano) {
  try {
    const vendas = await buscarVendasPorAno(ano);
    const inscricoes = await buscarTodos('inscricoes', [
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
      totalInscricoes: inscricoes.length,
      totalVendas: vendas.length
    };
  } catch (erro) {
    console.error(`❌ Erro ao buscar resumo financeiro de ${ano}:`, erro);
    throw erro;
  }
}

export default {
  salvarDocumento,
  buscarPorId,
  buscarTodos,
  atualizarDocumento,
  deletarDocumento,
  salvarVenda,
  buscarVendasPorAno,
  salvarInscricao,
  salvarProduto,
  salvarHino,
  buscarUsuario,
  salvarPerfil,
  buscarResumoFinanceiro
};

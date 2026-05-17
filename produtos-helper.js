// produtos-helper.js — Helper para buscar e usar produtos nos formulários
// Use em: vendinha.html, livraria.html, loja.html, vendas.html

if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyAGENra-_4GMgwhk-C7d26hEMCqmuQcecU",
    authDomain: "abcl-hub-dev.firebaseapp.com",
    projectId: "abcl-hub-dev",
    storageBucket: "abcl-hub-dev.firebasestorage.app",
    messagingSenderId: "243573406078",
    appId: "1:243573406078:web:57c0257a9b7e6bf04b9b2f"
  });
}

const db = firebase.firestore();

// ── BUSCAR PRODUTOS ──
window.buscarProdutos = async function(modulo) {
  try {
    const snap = await db.collection(`produtos_${modulo}`)
      .where('ativo', '==', true)
      .orderBy('criado_em', 'desc')
      .get();

    const produtos = [];
    snap.forEach(doc => {
      produtos.push({ id: doc.id, ...doc.data() });
    });

    return produtos;
  } catch (erro) {
    console.error(`Erro ao buscar produtos_${modulo}:`, erro);
    return [];
  }
};

// ── BUSCAR PRODUTO POR ID ──
window.buscarProdutoPorId = async function(modulo, id) {
  try {
    const doc = await db.collection(`produtos_${modulo}`).doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (erro) {
    console.error(`Erro ao buscar produto ${id}:`, erro);
    return null;
  }
};

// ── ATUALIZAR ESTOQUE ──
window.atualizarEstoque = async function(modulo, produtoId, novoEstoque) {
  try {
    await db.collection(`produtos_${modulo}`).doc(produtoId).update({
      estoque: Math.max(0, novoEstoque),
      atualizado_em: firebase.firestore.Timestamp.now()
    });
    return true;
  } catch (erro) {
    console.error('Erro ao atualizar estoque:', erro);
    return false;
  }
};

// ── VERIFICAR ESTOQUE BAIXO ──
window.verificarEstoqueBaixo = function(produto) {
  const estoque = produto.estoque ?? 0;
  const minimo = produto.estoque_minimo ?? 0;
  return estoque <= minimo;
};

// ── LISTAR PRODUTOS EM SELECT ──
// Usa em um select HTML: id="produtos-select"
window.preencherSelectProdutos = async function(modulo, selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um produto...</option>';

  const produtos = await window.buscarProdutos(modulo);
  produtos.forEach(p => {
    const nome = p.nome || p.titulo || '—';
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${nome} (R$ ${(p.preco || 0).toFixed(2)})`;
    opt.dataset.preco = p.preco;
    opt.dataset.estoque = p.estoque;
    select.appendChild(opt);
  });
};

// ── PREENCHER DADOS AO SELECIONAR PRODUTO ──
// Coloque um ouvinte no select: onchange="preencherDadosProduto(this, 'vendinha', 'preço-input-id')"
window.preencherDadosProduto = async function(selectEl, modulo, precoInputId) {
  const produtoId = selectEl.value;
  if (!produtoId) return;

  const produto = await window.buscarProdutoPorId(modulo, produtoId);
  if (!produto) return;

  // Preencher preço
  const precoInput = document.getElementById(precoInputId);
  if (precoInput) {
    precoInput.value = (produto.preco || 0).toFixed(2);
  }

  // Avisar se estoque está baixo
  if (window.verificarEstoqueBaixo(produto)) {
    console.warn(`⚠️ Estoque baixo: ${produto.estoque} unidades`);
  }

  return produto;
};

// ── FORMATAR PREÇO ──
window.formatarPreco = function(valor) {
  return parseFloat(valor || 0).toFixed(2).replace('.', ',');
};

// ── VALIDAR DISPONIBILIDADE ──
window.validarDisponibilidade = function(produto, quantidade) {
  if (!produto) return { ok: false, msg: 'Produto não encontrado.' };
  if ((produto.estoque || 0) < (quantidade || 0)) {
    return { ok: false, msg: `Estoque insuficiente. Disponível: ${produto.estoque}` };
  }
  return { ok: true, msg: 'OK' };
};

console.log('✅ Produtos Helper carregado!');

# 🔧 Guia de Integração — Bloco 4

## 📌 Resumo dos 3 Arquivos Gerados pelo Haiku

1. **`offline-sync.js`** — Sincronização offline
2. **`vendas-firebase.js`** — Integração Firestore
3. **`snippets-integracao.html`** — Guia visual (pode deletar após entender)

---

## ✅ Checklist de Implementação

### **Passo 1 — Copiar os 3 arquivos para raiz do projeto**

```
seu-projeto/
├── offline-sync.js ✅ (novo)
├── vendas-firebase.js ✅ (novo)
├── vendinha.html (MODIFICAR)
├── livraria.html (MODIFICAR)
├── loja.html (MODIFICAR)
├── admin.html (MODIFICAR)
├── financeiro.html (CRIAR ou MODIFICAR)
└── ...
```

---

### **Passo 2 — Adicionar scripts base em TODAS as páginas PDV**

Abra `vendinha.html`, `livraria.html` e `loja.html`.

No `<head>` ou logo após `<body>`, **antes de qualquer outro script**, adicione:

```html
<!-- Firebase SDK (compat) -->
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>

<!-- Firebase Init -->
<script>
const firebaseConfig = {
  apiKey:            "AIzaSyAGENra-_4GMgwhk-C7d26hEMCqmuQcecU",
  authDomain:        "abcl-hub-dev.firebaseapp.com",
  projectId:         "abcl-hub-dev",
  storageBucket:     "abcl-hub-dev.firebasestorage.app",
  messagingSenderId: "243573406078",
  appId:             "1:243573406078:web:57c0257a9b7e6bf04b9b2f"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
</script>

<!-- Módulos ABCL -->
<script src="offline-sync.js"></script>
<script src="vendas-firebase.js"></script>
```

---

### **Passo 3 — Modificar `vendinha.html`**

#### **3a. Adicionar HTML (no carrinho, antes do botão Confirmar)**

Procure pela seção do carrinho (procure por `#cart-items` ou `pedido-itens`).

**Adicione este bloco antes do botão de confirmar venda:**

```html
<!-- ── Forma de pagamento ── -->
<div class="campo-grupo" style="margin:1rem 0 .5rem;">
  <label style="font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--suave);display:block;margin-bottom:.35rem;">
    Forma de pagamento
  </label>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
    <button class="btn-pgto active" data-pgto="dinheiro" onclick="selecionarPgto(this)" type="button">💵 Dinheiro</button>
    <button class="btn-pgto" data-pgto="pix" onclick="selecionarPgto(this)" type="button">📲 PIX</button>
    <button class="btn-pgto" data-pgto="credito" onclick="selecionarPgto(this)" type="button">💳 Crédito</button>
    <button class="btn-pgto" data-pgto="debito" onclick="selecionarPgto(this)" type="button">💳 Débito</button>
  </div>
</div>

<!-- ── Desconto (valor fixo R$) ── -->
<div style="display:flex;align-items:center;gap:.75rem;margin:.75rem 0;">
  <label style="font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--suave);white-space:nowrap;">
    Desconto (R$)
  </label>
  <input type="number" id="campo-desconto" min="0" step="1" value="0"
    style="width:90px;background:rgba(255,255,255,.04);border:1px solid var(--borda);
           border-radius:6px;padding:.5rem .75rem;color:var(--texto);font-family:inherit;font-size:.9rem;"
    oninput="recalcularTotal()" />
</div>

<!-- ── Oferta ── -->
<div id="bloco-oferta" style="background:rgba(245,158,11,.07);border:1px solid rgba(245,158,11,.25);border-radius:8px;padding:.85rem 1rem;margin:.75rem 0;">
  <label style="display:flex;align-items:center;gap:.5rem;cursor:pointer;font-size:.82rem;font-weight:600;color:#fbbf24;">
    <input type="checkbox" id="chk-oferta" onchange="toggleOferta()" />
    🎁 Esta venda é uma oferta
  </label>
  <div id="detalhe-oferta" style="display:none;margin-top:.65rem;">
    <label style="font-size:.68rem;text-transform:uppercase;letter-spacing:.1em;color:var(--suave);display:block;margin-bottom:.3rem;">
      Valor da oferta (R$)
    </label>
    <input type="number" id="campo-valor-oferta" min="0" step="1" placeholder="0"
      style="width:120px;background:rgba(255,255,255,.04);border:1px solid rgba(245,158,11,.4);
             border-radius:6px;padding:.5rem .75rem;color:var(--texto);font-family:inherit;font-size:.9rem;" />
    <div style="font-size:.68rem;color:var(--suave);margin-top:.35rem;">
      Status da oferta:
      <span id="status-oferta-label" style="color:#fbbf24;font-weight:600;">pendente</span>
    </div>
  </div>
</div>
```

#### **3b. Adicionar CSS (na seção `<style>`)**

```css
.btn-pgto {
  padding:.45rem .9rem; border-radius:7px; font-size:.78rem; font-family:inherit;
  border:1px solid var(--borda); background:transparent; color:var(--suave);
  cursor:pointer; transition:all .18s;
}
.btn-pgto.active {
  background:var(--verde-mid); border-color:var(--verde-mid); color:#fff; font-weight:600;
}
.btn-pgto:hover:not(.active) { border-color:var(--verde-cl); color:var(--texto); }
```

#### **3c. Adicionar JavaScript (antes do último `</script>`)**

Substitua `'vendinha'` pelo nome do módulo:

```javascript
// ── Configuração ────────────────────────────────────────────────────────────
const MODULO = 'vendinha'; // ← ALTERAR CONFORME A PÁGINA
let formaPgtoSelecionada = 'dinheiro';

function selecionarPgto(btn) {
  document.querySelectorAll('.btn-pgto').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  formaPgtoSelecionada = btn.dataset.pgto;
}

function toggleOferta() {
  const chk = document.getElementById('chk-oferta');
  document.getElementById('detalhe-oferta').style.display = chk.checked ? 'block' : 'none';
}

function recalcularTotal() {
  // Adapte para o seu sistema existente
  const subtotal = 0; // ← ALTERAR: calcular subtotal do carrinho
  const desconto = parseInt(document.getElementById('campo-desconto').value) || 0;
  const total = Math.max(0, subtotal - desconto);
  // Atualizar elemento total ← ADAPTAR AO SEU HTML
}

async function confirmarVendaComFirebase() {
  // 1. Montar objeto da venda
  const venda = {
    tipo: MODULO,
    produtos: [], // ← ALTERAR: pegar do carrinho existente
    subtotal: 0, // ← ALTERAR
    desconto: parseInt(document.getElementById('campo-desconto').value) || 0,
    total: 0, // ← ALTERAR
    
    eh_oferta: document.getElementById('chk-oferta')?.checked || false,
    valor_oferta: parseInt(document.getElementById('campo-valor-oferta')?.value) || 0,
    status_oferta: document.getElementById('chk-oferta')?.checked ? 'pendente' : null,
    
    forma_pagamento: formaPgtoSelecionada,
    cartao_tipo: ['credito', 'debito'].includes(formaPgtoSelecionada) ? formaPgtoSelecionada : null,
    
    operador_uid: 'uid_do_operador_logado', // ← ALTERAR
    operador_nome: 'Nome do Operador', // ← ALTERAR
    ano_acampamento: new Date().getFullYear(),
  };

  try {
    // 2. Se online, tenta Firebase
    if (navigator.onLine) {
      const vendaId = await VendasFirebase.salvarVendaFirebase(venda, MODULO);
      console.log('✅ Venda salva no Firebase:', vendaId);
    } else {
      // Se offline, enfileira
      const id = await OfflineSync.adicionarFilaSincronizacao(venda);
      console.log('📦 Venda enfileirada para sincronização:', id);
    }

    // 3. Limpar formulário
    document.getElementById('campo-desconto').value = '0';
    document.getElementById('chk-oferta').checked = false;
    document.getElementById('detalhe-oferta').style.display = 'none';
    // Limpar carrinho ← ADAPTAR

    alert('✅ Venda confirmada!');
  } catch (err) {
    console.error('❌ Erro ao confirmar venda:', err);
    alert('Erro: ' + err.message);
  }
}
```

---

### **Passo 4 — Modificar `livraria.html`**

**Exatamente os mesmos passos da Vendinha (3a, 3b, 3c), apenas alterando:**

```javascript
const MODULO = 'livraria'; // ← em vez de 'vendinha'
```

---

### **Passo 5 — Modificar `loja.html`**

Como a loja é um e-commerce (para clientes), faça mudanças mínimas:

#### **5a. Adicionar scripts base (igual aos PDVs)**

Adicione no `<head>` os mesmos scripts do Passo 2.

#### **5b. Integrar ao carrinho existente**

No carrinho da loja, ao clicar em "Finalizar Compra", adicione:

```javascript
async function finalizarCompraLoja() {
  const venda = {
    tipo: 'loja',
    produtos: carrinho, // seu array de produtos
    subtotal: calcularSubtotal(),
    desconto: 0,
    total: calcularTotal(),
    
    eh_oferta: false,
    valor_oferta: null,
    status_oferta: null,
    
    forma_pagamento: document.getElementById('metodo-pagamento').value || 'dinheiro',
    cartao_tipo: null,
    
    operador_uid: 'cliente_' + gerarIdCliente(), // cliente anônimo
    operador_nome: document.getElementById('nome-cliente')?.value || 'Cliente',
    ano_acampamento: new Date().getFullYear(),
  };

  try {
    if (navigator.onLine) {
      const vendaId = await VendasFirebase.salvarVendaFirebase(venda, 'loja');
      // Limpar carrinho, redirecionar, etc
    } else {
      await OfflineSync.adicionarFilaSincronizacao(venda);
      // Avisar que será processado ao conectar
    }
  } catch (err) {
    alert('Erro ao finalizar compra: ' + err.message);
  }
}
```

---

### **Passo 6 — Modificar `admin.html`**

Adicione um card/seção para monitorar sincronização:

#### **6a. HTML**

```html
<!-- Adicionar no menu do admin -->
<a href="financeiro.html" class="admin-card">
  🛒 Ver Vendas por Módulo
</a>

<div class="admin-card" style="cursor:pointer;" onclick="mostrarStatusSync()">
  <div id="admin-sync-status">🔄 Status Sincronização</div>
</div>
```

#### **6b. JavaScript (no admin.html)**

```javascript
function mostrarStatusSync() {
  const s = OfflineSync.obterStatusSincronizacao();
  const icone = s.online ? (s.pendentes === 0 ? '✅' : '🟡') : '🔴';
  alert(icone + ' Status: ' + s.status + '\nVendas pendentes: ' + s.pendentes + '\nOnline: ' + s.online);
}

// Atualiza o card de status a cada 5s
setInterval(() => {
  const s = document.getElementById('admin-sync-status');
  if (!s) return;
  const info = OfflineSync.obterStatusSincronizacao();
  s.textContent = info.online
    ? (info.pendentes === 0 ? '✅ Tudo sincronizado' : '🟡 ' + info.pendentes + ' pendentes')
    : '🔴 Offline — ' + info.pendentes + ' pendentes';
}, 5000);
```

---

### **Passo 7 — Criar ou Modificar `financeiro.html`**

Se a página existir, adicione:

#### **7a. Scripts base (Passo 2)**

#### **7b. Seção para mostrar vendas por módulo**

```html
<div id="pdv-container" style="margin-top:2rem;">
  <h2>💰 Vendas por Módulo</h2>
  
  <div style="display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
    <button onclick="filtrarPorModulo('vendinha')">🛒 Vendinha</button>
    <button onclick="filtrarPorModulo('livraria')">📚 Livraria</button>
    <button onclick="filtrarPorModulo('loja')">👕 Loja</button>
    <button onclick="filtrarPorModulo(null)">📋 Todas</button>
  </div>

  <table id="pdv-tabela-vendas" style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="font-size:.75rem;border-bottom:1px solid var(--borda);">
        <th style="padding:.5rem;text-align:left;">Data/Hora</th>
        <th>Módulo</th>
        <th>Produtos</th>
        <th>Pagamento</th>
        <th>Status</th>
        <th style="text-align:right;">Valor</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <div id="pdv-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:999;align-items:center;justify-content:center;">
    <div style="background:var(--card);padding:1.5rem;border-radius:10px;max-width:600px;width:90%;">
      <div id="pdv-modal-body"></div>
      <div style="margin-top:1rem;display:flex;gap:.5rem;">
        <button onclick="fecharModalVenda()" style="flex:1;">Fechar</button>
        <button id="pdv-btn-cancelar-venda" onclick="cancelarVendaPDV()" style="flex:1;background:#EF4444;">Cancelar Venda</button>
      </div>
    </div>
  </div>
</div>
```

#### **7c. JavaScript (no financeiro.html)**

Veja o arquivo `snippets-integracao.html` linhas 280-602 para todo o JavaScript necessário.

Essencialmente, você precisa de funções como:
- `filtrarPorModulo(modulo)`
- `renderTabelaVendasPDV(vendas)`
- `abrirModalVenda(id)`
- `cancelarVendaPDV(id)`

---

## 🧪 Teste Rápido

1. **Abra `vendinha.html`** em `http://localhost:8080/vendinha.html`
2. **Desconecte a internet** (ou abra DevTools → Network → Offline)
3. **Faça uma venda** (preencha formulário, clique Confirmar)
4. **Verifique o indicador** no topo (deve mostrar 🔴 Offline)
5. **Reconecte** a internet
6. **O indicador deve mudar** para ✅ Sincronizado
7. **Cheque o Firestore Console** — a venda deve estar lá!

---

## 🎯 Próximos Passos

Após testar tudo funcionando:
1. ✅ Confirma que as vendas salvam offline
2. ✅ Confirma que sincroniza ao conectar
3. ✅ Confirma que ofertas funcionam
4. ✅ Confirma que cancelamento restaura estoque

Aí partimos pro **Bloco 5 — Formulário de Inscrição + Financeiro completo**! 🚀


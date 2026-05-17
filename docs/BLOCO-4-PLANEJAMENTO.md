# 💰 Bloco 4 — Registro de Vendas — ABCL Hub

## 📋 Visão Geral

O Bloco 4 integra um sistema de **PDV (Ponto de Venda)** nas três telas existentes:
- `vendinha.html` — Registra vendas da vendinha
- `livraria.html` — Registra vendas da livraria
- `loja.html` — Registra vendas da loja

Cada tela terá:
1. **Formulário de Venda** (à esquerda)
2. **Lista de Produtos** (disponíveis para venda)
3. **Histórico do Dia** (vendas feitas)
4. **Resumo de Caixa** (total do dia)

---

## 🎯 Fluxo de Venda

```
1. Operador abre vendinha.html (ou livraria/loja)
   ↓
2. Clica em um produto da lista
   ↓
3. Sistema preenche nome + preço automaticamente
   ↓
4. Operador coloca quantidade (números inteiros)
   ↓
5. Sistema calcula: preco × quantidade = total
   ↓
6. Operador pode aplicar desconto (valor fixo em R$)
   ↓
7. Seleciona forma de pagamento:
   - Dinheiro
   - PIX
   - Cartão (estrutura pronta, sem gateway por enquanto)
   ↓
8. Clica em "Confirmar Venda"
   ↓
9. Sistema:
   - Salva venda no Firestore
   - Diminui estoque do produto
   - Mostra na lista "Vendas do Dia"
   - Atualiza resumo de caixa
   ↓
10. Operador pode:
    - Cancelar venda (volta estoque)
    - Editar venda (altera quantidade, desconto, forma pagamento)
```

---

## 📊 Estrutura de Dados

### **Coleção: `vendas`**
```javascript
{
  tipo: "vendinha" | "livraria" | "loja",
  
  // Produto
  produto_id: "id_do_produto",
  produto_nome: "Nome do Produto",
  preco_unitario: 10.00,
  quantidade: 5,
  
  // Valores
  subtotal: 50.00,           // preco × quantidade
  desconto: 5.00,            // valor fixo
  total: 45.00,              // subtotal - desconto
  
  // Pagamento
  forma_pagamento: "dinheiro" | "pix" | "cartao",
  cartao_tipo: "credito" | "debito" | null,  // se cartão
  
  // Operador
  operador_uid: "user_id",
  operador_nome: "João Silva",
  
  // Timestamp
  timestamp: Timestamp,
  data: "2025-01-15",        // para facilitar filtros
  hora: "14:30",
  ano_acampamento: 2025,
  
  // Status
  status: "confirmada" | "cancelada",
  motivo_cancelamento: "",
  
  // Edição
  editado_em: null | Timestamp,
  editado_por: null | user_id
}
```

---

## 🎨 Layout de Cada Tela

### **Vendinha / Livraria / Loja**

```
┌──────────────────────────────────────────────────┐
│  ABCL Hub — Vendinha           [⚙️ Voltar]      │
├──────────────────────────────────────────────────┤
│                                                   │
│  FORMULÁRIO DE VENDA  │  LISTA DE PRODUTOS      │
│  ┌─────────────────┐  │  ┌──────────────────────┤
│  │ Produto         │  │  │ 🛒 Água 500ml        │
│  │ [Selecione...] │  │  │    R$ 5.00           │
│  │ ─────────────── │  │  │    Est: 45           │
│  │ Quantidade      │  │  │ 🛒 Suco 300ml        │
│  │ [1]             │  │  │    R$ 3.50           │
│  │ ─────────────── │  │  │    Est: 32           │
│  │ Subtotal: R$ — │  │  │ ...                  │
│  │ Desconto (R$)   │  │  └──────────────────────┤
│  │ [0.00]          │  │                         │
│  │ ─────────────── │  │  VENDAS DO DIA         │
│  │ TOTAL: R$ —     │  │  ┌──────────────────────┤
│  │ ─────────────── │  │  │ Água 500ml × 2       │
│  │ Forma Pag:      │  │  │ R$ 10.00 [PIX]      │
│  │ ◯ Dinheiro      │  │  │ [Editar] [Cancelar] │
│  │ ◯ PIX           │  │  │                      │
│  │ ◯ Cartão        │  │  │ Suco × 1             │
│  │ ─────────────── │  │  │ R$ 3.50 [Dinheiro]  │
│  │ [✓ Confirmar]   │  │  │ [Editar] [Cancelar] │
│  │ [Limpar Form]   │  │  │                      │
│  └─────────────────┘  │  └──────────────────────┤
│                       │                         │
│  RESUMO DO DIA        │                         │
│  ┌────────────────┐   │                         │
│  │ Total: R$ 13.50│   │                         │
│  │ Dinheiro: R$ 3.50  │   │                         │
│  │ PIX: R$ 10.00  │   │                         │
│  │ Cartão: R$ 0.00│   │                         │
│  │ Itens: 3       │   │                         │
│  └────────────────┘   │                         │
└──────────────────────────────────────────────────┘
```

---

## 🔧 Funcionalidades

### **Ao Selecionar um Produto**
- Nome preenche automaticamente
- Preço preenche automaticamente
- Quantidade começa em 1
- Sistema calcula subtotal ao mudar quantidade

### **Desconto**
- Campo para valor fixo em R$
- Recalcula total automaticamente
- Pode deixar 0 (sem desconto)

### **Forma de Pagamento**
- Rádio buttons: Dinheiro, PIX, Cartão
- Se Cartão, aparece campo extra: "Tipo" (Crédito/Débito)
- Salva no Firebase com essas informações

### **Confirmar Venda**
- Valida: produto selecionado, quantidade > 0
- Verifica disponibilidade de estoque
- Se OK: salva no Firestore + diminui estoque
- Mostra mensagem de sucesso
- Limpa formulário
- Atualiza lista de vendas e resumo

### **Editar Venda**
- Clica em "[Editar]" ao lado da venda
- Formulário se preenche com dados da venda
- Pode alterar: quantidade, desconto, forma pagamento
- Clica "Atualizar Venda"
- Sistema: reajusta estoque da venda antiga + nova
- Atualiza no Firestore

### **Cancelar Venda**
- Clica em "[Cancelar]" ao lado da venda
- Pergunta confirmação
- Se OK: marca venda como cancelada
- Recoloca estoque de volta
- Remove da lista visível (ou marca como cinza)

### **Resumo do Dia**
- Total de vendas
- Total por forma de pagamento
- Quantidade de itens vendidos
- Atualiza em tempo real

---

## 🔐 Permissões

- **Admin**: Acessa tudo (vendinha, livraria, loja), pode editar/cancelar qualquer venda
- **Coordenação**: Acessa vendinha, livraria, loja; pode editar/cancelar apenas suas próprias vendas
- **Participante**: Sem acesso

---

## 📱 Responsividade

- Desktop: Layout 2 colunas (formulário | lista + histórico)
- Mobile: Layout 1 coluna (formulário, depois lista, depois histórico)

---

## 🔄 Sincronização com Firestore

**Quando salva uma venda:**
1. Cria documento em `/vendas/{novo_id}`
2. Atualiza `/produtos_{modulo}/{produto_id}` → diminui estoque
3. Atualiza `/financeiro_resumo/{ano}` → incrementa totais

**Quando cancela:**
1. Marca venda como cancelada em `/vendas/{id}`
2. Recoloca estoque em `/produtos_{modulo}/{produto_id}`
3. Atualiza `/financeiro_resumo/{ano}` → diminui totais

**Quando edita:**
1. Ajusta `/produtos_{modulo}/{produto_id}` (reajusta estoque)
2. Atualiza `/vendas/{id}` com novos dados
3. Recalcula `/financeiro_resumo/{ano}`

---

## 📝 Próximos Passos

1. Gerar `vendas-form.html` (componente reutilizável)
2. Integrar em `vendinha.html`
3. Integrar em `livraria.html`
4. Integrar em `loja.html`
5. Gerar `vendas-helper.js` (funções de venda)
6. Testar fluxo completo

---

## ⚡ Stack Técnico

- **Frontend**: HTML + CSS + JavaScript vanilla
- **Backend**: Firebase Firestore
- **Auth**: Firebase Auth (já integrado)
- **Real-time**: Firestore listeners

---

**Pronto? Vou gerar os arquivos agora!** 🚀

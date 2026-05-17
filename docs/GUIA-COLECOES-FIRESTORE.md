# 🔥 Guia de Criação das Coleções no Firebase Console
## Projeto: abcl-hub-dev

---

## ⚠️ ANTES DE COMEÇAR

1. Acesse https://console.firebase.google.com
2. Clique no projeto **abcl-hub-dev**
3. No menu esquerdo, clique em **Firestore Database**
4. Se ainda não criou, clique em **"Criar banco de dados"**
   - Modo: **Produção** (não teste)
   - Região: **southamerica-east1**

---

## 📋 COLEÇÕES A CRIAR

Para criar uma coleção no Firestore:
1. Clique em **"+ Iniciar coleção"**
2. Digite o **ID da coleção**
3. Clique em **"Próxima"**
4. Preencha o **primeiro documento** conforme abaixo
5. Clique em **"Salvar"**

---

## 1️⃣ Coleção: `configs`

**ID da coleção:** `configs`

**Documento ID:** `geral`

**Campos:**
```
nome_evento        → string  → "Acampamento ABCL 2025"
ano                → number  → 2025
data_inicio        → string  → "2025-01-15"
data_fim           → string  → "2025-01-18"
local              → string  → "Nome do local do evento"
descricao          → string  → "Descrição do acampamento"
email_contato      → string  → "contato@abcl.com"
telefone           → string  → ""
whatsapp           → string  → ""
instagram          → string  → ""
facebook           → string  → ""
youtube            → string  → ""
valor_inscricao    → number  → 0
valor_meia         → number  → 0
inscricoes_abertas → boolean → true
cor_primaria       → string  → "#FF6B35"
cor_secundaria     → string  → "#004E89"
logo_url           → string  → ""
atualizado_em      → timestamp → (agora)
```

---

## 2️⃣ Coleção: `usuarios`

**ID da coleção:** `usuarios`

**Documento ID:** (deixe automático por enquanto)

**Campos:**
```
uid           → string  → "placeholder"
nome          → string  → "Admin ABCL"
email         → string  → "seu_email@gmail.com"
foto_url      → string  → ""
provedor      → string  → "google"
perfil_tipo   → string  → "admin"
aprovado      → boolean → true
ativo         → boolean → true
criado_em     → timestamp → (agora)
ultimo_acesso → timestamp → (agora)
```

---

## 3️⃣ Coleção: `vendas`

**ID da coleção:** `vendas`

**Documento ID:** (automático)

**Campos:**
```
tipo              → string    → "vendinha"
produto           → string    → "Produto Teste"
quantidade        → number    → 1
valor_unitario    → number    → 10.00
valor_total       → number    → 10.00
forma_pagamento   → string    → "dinheiro"
operador_uid      → string    → ""
operador_nome     → string    → "Operador Teste"
ano_acampamento   → number    → 2025
status            → string    → "confirmada"
observacoes       → string    → ""
timestamp         → timestamp → (agora)
```

---

## 4️⃣ Coleção: `inscricoes`

**ID da coleção:** `inscricoes`

**Documento ID:** (automático)

**Campos:**
```
nome                → string    → "Inscrito Teste"
email               → string    → ""
telefone            → string    → ""
data_nascimento     → string    → ""
cpf                 → string    → ""
responsavel         → string    → ""
email_responsavel   → string    → ""
grupo               → string    → "Adolescentes"
valor_inscricao     → number    → 0
valor_pago          → number    → 0
forma_pagamento     → string    → "pix"
desconto_aplicado   → number    → 0
status              → string    → "pendente"
aprovada            → boolean   → false
observacoes         → string    → ""
ano_acampamento     → number    → 2025
timestamp           → timestamp → (agora)
```

---

## 5️⃣ Coleção: `produtos_vendinha`

**ID da coleção:** `produtos_vendinha`

**Documento ID:** (automático)

**Campos:**
```
nome            → string  → "Produto Vendinha Teste"
preco           → number  → 5.00
estoque         → number  → 0
estoque_minimo  → number  → 5
categoria       → string  → "Geral"
imagem_url      → string  → ""
descricao       → string  → ""
ativo           → boolean → true
criado_em       → timestamp → (agora)
atualizado_em   → timestamp → (agora)
```

---

## 6️⃣ Coleção: `produtos_livraria`

**ID da coleção:** `produtos_livraria`

**Documento ID:** (automático)

**Campos:**
```
titulo          → string  → "Livro Teste"
autor           → string  → ""
preco           → number  → 0
estoque         → number  → 0
estoque_minimo  → number  → 2
categoria       → string  → "Geral"
imagem_url      → string  → ""
descricao       → string  → ""
isbn            → string  → ""
editora         → string  → ""
ativo           → boolean → true
criado_em       → timestamp → (agora)
atualizado_em   → timestamp → (agora)
```

---

## 7️⃣ Coleção: `produtos_loja`

**ID da coleção:** `produtos_loja`

**Documento ID:** (automático)

**Campos:**
```
nome            → string  → "Produto Loja Teste"
preco           → number  → 0
estoque         → number  → 0
estoque_minimo  → number  → 2
categoria       → string  → "Geral"
imagem_url      → string  → ""
descricao       → string  → ""
tamanhos        → string  → "P,M,G,GG"
cores           → string  → ""
ativo           → boolean → true
criado_em       → timestamp → (agora)
atualizado_em   → timestamp → (agora)
```

---

## 8️⃣ Coleção: `canticos`

**ID da coleção:** `canticos`

**Documento ID:** (automático)

**Campos:**
```
numero          → number  → 1
titulo          → string  → "Cântico Teste"
letra           → string  → ""
cifra           → string  → ""
categoria       → string  → "Louvor"
artista         → string  → ""
tonalidade      → string  → ""
visualizacoes   → number  → 0
favoritos_count → number  → 0
ativo           → boolean → true
criado_em       → timestamp → (agora)
atualizado_em   → timestamp → (agora)
```

---

## 9️⃣ Coleção: `hub_links`

**ID da coleção:** `hub_links`

**Documento ID:** `principal`

**Campos:**
```
titulo      → string → "ABCL Hub"
descricao   → string → "Central de recursos do acampamento"
```

> ⚠️ Os links vão ficar numa **subcoleção** dentro desse documento.
> Por ora, só crie esse documento base.

---

## 🔟 Coleção: `conteudo`

**ID da coleção:** `conteudo`

**Documento ID:** `sobre_evento`

**Campos:**
```
titulo        → string  → "Sobre o Evento"
descricao     → string  → ""
imagem_url    → string  → ""
ativo         → boolean → true
ordem         → number  → 1
atualizado_em → timestamp → (agora)
```

---

## 1️⃣1️⃣ Coleção: `financeiro_resumo`

**ID da coleção:** `financeiro_resumo`

**Documento ID:** `2025`

**Campos:**
```
ano                    → number → 2025
total_vendas           → number → 0
total_inscricoes       → number → 0
total_arrecadado       → number → 0
quantidade_vendas      → number → 0
quantidade_inscricoes  → number → 0
atualizado_em          → timestamp → (agora)
```

---

## 1️⃣2️⃣ Coleção: `ferramentas`

**ID da coleção:** `ferramentas`

**Documento ID:** `config`

**Campos:**
```
notificacoes_ativo    → boolean → false
checkin_qrcode_ativo  → boolean → false
sorteios_ativo        → boolean → false
enquetes_ativo        → boolean → false
chat_suporte_ativo    → boolean → false
atualizado_em         → timestamp → (agora)
```

---

## ✅ RESUMO DAS COLEÇÕES

| # | Coleção | Documento Inicial |
|---|---------|-------------------|
| 1 | `configs` | `geral` |
| 2 | `usuarios` | (automático) |
| 3 | `vendas` | (automático) |
| 4 | `inscricoes` | (automático) |
| 5 | `produtos_vendinha` | (automático) |
| 6 | `produtos_livraria` | (automático) |
| 7 | `produtos_loja` | (automático) |
| 8 | `canticos` | (automático) |
| 9 | `hub_links` | `principal` |
| 10 | `conteudo` | `sobre_evento` |
| 11 | `financeiro_resumo` | `2025` |
| 12 | `ferramentas` | `config` |

---

## 🔐 REGRAS DE SEGURANÇA

Após criar todas as coleções, vá em:
**Firestore → Regras** e cole isso:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Configs, conteúdo, links, ferramentas: todos leem, admin escreve
    match /configs/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /hub_links/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /conteudo/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /ferramentas/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Produtos: todos leem, admin e coordenação escrevem
    match /produtos_vendinha/{doc} {
      allow read: if true;
      allow write: if isAdminOuCoordenacao();
    }
    match /produtos_livraria/{doc} {
      allow read: if true;
      allow write: if isAdminOuCoordenacao();
    }
    match /produtos_loja/{doc} {
      allow read: if true;
      allow write: if isAdminOuCoordenacao();
    }

    // Vendas: coordenação e admin criam/leem
    match /vendas/{doc} {
      allow read: if isAdminOuCoordenacao();
      allow create: if isAdminOuCoordenacao();
      allow update, delete: if isAdmin();
    }

    // Inscrições: qualquer um cria, coordenação e admin leem/gerenciam
    match /inscricoes/{doc} {
      allow create: if true;
      allow read, update, delete: if isAdminOuCoordenacao();
    }

    // Cânticos: todos leem, admin escreve
    match /canticos/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Usuários: cada um acessa o próprio, admin gerencia todos
    match /usuarios/{uid} {
      allow read: if request.auth.uid == uid || isAdmin();
      allow write: if request.auth.uid == uid || isAdmin();
    }

    // Financeiro: só admin lê
    match /financeiro_resumo/{doc} {
      allow read: if isAdmin();
      allow write: if false;
    }

    // Funções auxiliares
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo == "admin";
    }

    function isAdminOuCoordenacao() {
      let tipo = get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo;
      return request.auth != null && (tipo == "admin" || tipo == "coordenacao");
    }
  }
}
```

---

## 🚀 PRÓXIMO PASSO

Após criar todas as coleções, avise e seguimos para o **Bloco 2 — Autenticação**.

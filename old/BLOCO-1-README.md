# 🔧 Bloco 1 — Firebase Setup — ABCL Hub Dev

## ✅ Arquivos Gerados

1. **firebase-config.js** — Configuração do Firebase com API Key
2. **db.js** — Camada de acesso a dados com funções reutilizáveis
3. **README.md** — Este arquivo

---

## 📋 Próximos Passos no Firebase Console

### 1️⃣ Ativar Firestore

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique no projeto `abcl-hub-dev`
3. No menu esquerdo, clique em **Firestore Database**
4. Clique em **"Criar banco de dados"**
5. Escolha:
   - **Localização:** `southamerica-east1` (São Paulo)
   - **Modo de segurança:** Começar em modo teste (após, usaremos regras de segurança)
6. Clique em **Criar**

**✅ Firestore está pronto!**

---

### 2️⃣ Ativar Firebase Storage (para imagens)

1. No menu esquerdo, clique em **Storage**
2. Clique em **"Começar"**
3. Escolha:
   - **Localização:** `southamerica-east1`
   - **Modo de segurança:** Começar em modo teste
4. Clique em **Criar**

**✅ Storage está pronto!**

---

### 3️⃣ Ativar Firebase Authentication

1. No menu esquerdo, clique em **Authentication**
2. Clique em **"Primeiros passos"**
3. Na aba **"Provedores de login"**, clique em **"Email/Senha"**
   - Ative e clique **Salvar**
4. Adicione provedores (clique no "+" para adicionar):
   - **Google** → Clique em Google, ative e salve (vai abrir o Google Cloud Console)
   - **Facebook** → Clique em Facebook, ative e salve (precisa de App ID do Facebook)
   - **Apple** → Clique em Apple, ative e salve (precisa de Apple Developer account)

**Configuração mínima:** Email/Senha + Google (é o suficiente para começar)

**✅ Auth está pronto!**

---

### 4️⃣ Estruturar as Coleções no Firestore

Execute essas queries no **Firestore Console** para criar a estrutura de coleções vazia (opcional, mas recomendado):

**Coleção: `usuarios`**
```
Exemplo de documento:
{
  uid: "usuario_123",
  nome: "João Silva",
  email: "joao@example.com",
  foto_url: "https://...",
  perfil_tipo: "admin", // "admin" | "operador" | "participante"
  aprovado: true,
  criado_em: (timestamp),
  atualizado_em: (timestamp)
}
```

**Coleção: `vendas`**
```
Exemplo de documento:
{
  tipo: "vendinha", // "vendinha" | "livraria" | "loja"
  produto: "Água 500ml",
  quantidade: 5,
  valor: 25.00,
  forma_pagamento: "dinheiro", // "dinheiro" | "pix" | "cartao"
  operador_uid: "usuario_123",
  ano_acampamento: 2025,
  timestamp: (timestamp),
  status: "confirmada"
}
```

**Coleção: `inscricoes`**
```
Exemplo de documento:
{
  nome: "Maria Santos",
  responsavel: "João Santos",
  idade: 15,
  grupo: "Adolescentes",
  valor_pago: 150.00,
  forma_pagamento: "pix",
  ano_acampamento: 2025,
  timestamp: (timestamp),
  status: "pendente", // "pendente" | "confirmada"
  aprovada: false
}
```

**Coleção: `produtos_vendinha`** (repetir para `produtos_livraria` e `produtos_loja`)
```
Exemplo de documento:
{
  nome: "Água 500ml",
  preco: 5.00,
  estoque: 50,
  categoria: "Bebidas",
  imagem_url: "https://...",
  descricao: "Água mineral natural",
  ativo: true,
  timestamp: (timestamp)
}
```

**Coleção: `hinos`**
```
Exemplo de documento:
{
  titulo: "Graça Maravilhosa",
  letra: "Graça maravilhosa do Senhor...",
  cifra: "C Am F G", // acordes
  categoria: "Louvor",
  artista: "Autor desconhecido",
  visualizacoes: 0,
  timestamp: (timestamp)
}
```

---

## 🛡️ Regras de Segurança do Firestore

Depois que testar tudo, **substitua as regras de teste** por estas (no Firebase Console → Firestore → Regras):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuários podem ver seu próprio perfil
    match /usuarios/{uid} {
      allow read: if request.auth.uid == uid;
      allow write: if request.auth.uid == uid || isAdmin();
    }

    // Apenas operadores podem escrever vendas
    match /vendas/{document=**} {
      allow read: if isOperador() || isAdmin();
      allow create: if isOperador() || isAdmin();
      allow update, delete: if isAdmin();
    }

    // Qualquer um autenticado pode ler inscrições, admins escrevem
    match /inscricoes/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }

    // Produtos: todos leem, admins escrevem
    match /produtos_{modulo}/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Hinos: todos leem, operadores+ escrevem
    match /hinos/{document=**} {
      allow read: if true;
      allow write: if isOperador() || isAdmin();
    }

    // Funções auxiliares
    function isAdmin() {
      return request.auth != null && get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo == "admin";
    }

    function isOperador() {
      return request.auth != null && (get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo == "operador" || isAdmin());
    }
  }
}
```

---

## 💻 Como Usar no Seu Projeto

### 1. Copiar os arquivos

Copie `firebase-config.js` e `db.js` para a raiz do seu projeto:

```
seu-projeto/
├── firebase-config.js
├── db.js
├── index.html
├── vendas.html
├── financeiro.html
└── ...
```

### 2. Importar no seu HTML

Em qualquer arquivo que precise usar Firestore:

```html
<script type="module">
  import { salvarVenda, buscarVendasPorAno } from './db.js';
  
  // Exemplo: salvar uma venda
  await salvarVenda({
    tipo: 'vendinha',
    produto: 'Água 500ml',
    quantidade: 2,
    valor: 10.00,
    forma_pagamento: 'pix',
    operador_uid: 'usuario123',
    ano_acampamento: 2025
  });

  // Exemplo: buscar vendas
  const vendas = await buscarVendasPorAno(2025);
  console.log(vendas);
</script>
```

### 3. Funções Disponíveis em `db.js`

**Genéricas:**
- `salvarDocumento(colecao, dados)` → salva qualquer documento
- `buscarPorId(colecao, docId)` → busca um documento por ID
- `buscarTodos(colecao, filtros, ordenarPor, limite)` → busca múltiplos documentos
- `atualizarDocumento(colecao, docId, dados)` → atualiza um documento
- `deletarDocumento(colecao, docId)` → deleta um documento

**Específicas para ABCL Hub:**
- `salvarVenda(venda)` → salva uma venda
- `buscarVendasPorAno(ano)` → busca vendas de um ano
- `salvarInscricao(inscricao)` → salva uma inscrição
- `salvarProduto(modulo, produto)` → salva um produto
- `salvarHino(hino)` → salva um hino
- `buscarUsuario(uid)` → busca perfil do usuário
- `salvarPerfil(uid, perfil)` → salva perfil do usuário
- `buscarResumoFinanceiro(ano)` → busca resumo financeiro de um ano

---

## 🚀 Próximo Bloco

Quando terminar esse, avance para **Bloco 2 — Autenticação**.

Lá você criará:
- `login.html` com Google, Facebook, Apple, Email/Senha
- `auth.js` com lógica de login e redirecionamento por perfil

---

## ⚠️ Dúvidas ou Erros?

Se algo não funcionar:
1. Verifica se Firebase está ativado no Console
2. Testa se a chave API está correta (copia de novo do Firebase)
3. Testa no **Console do Browser** (F12) para ver logs de erro
4. Volta aqui pro Sonnet se travar em algo

**✅ Bloco 1 concluído! Pronto para o Bloco 2?**

# 📦 Bloco 3 — Cadastro de Produtos — ABCL Hub

## ✅ O que foi criado

**`produtos.html`** — Página completa de cadastro com:
- Interface com 3 abas (Vendinha / Livraria / Loja)
- Formulário dinâmico por módulo
- Lista ao vivo dos produtos cadastrados
- Edição e exclusão de produtos
- Validação de dados
- Design responsivo

---

## 🛒 Especificações por Módulo

### **Vendinha**
```
- Nome (inclui tamanho/ml/sabor: "Água 500ml", "Suco Laranja 300ml")
- Preço de venda (R$)
- Estoque inicial
- Alerta de estoque baixo
- Observação (opcional)
```

### **Livraria**
```
- Título do livro
- Autor
- Editora
- Categoria (select com opções predefinidas)
- ISBN
- Preço de venda (R$)
- Custo (R$)
- Estoque inicial
- Alerta de estoque baixo
- URL da capa (ou buscar automaticamente depois)
- Descrição/Resumo (aparece no preview)
```

### **Loja**
```
- Nome do produto
- Preço de venda (R$)
- Custo (R$)
- Estoque geral
- Alerta de estoque baixo
- Tamanhos (PP, P, M, G, GG, XGG, XXGG, XXXGG, infantil 2-12 anos)
- Cores (Preto, Branco, Cinza, Verde)
- URL da imagem (opcional)
- Descrição (opcional)
```

---

## 📁 Estrutura no Firestore

### **Coleção: `produtos_vendinha`**
```javascript
{
  nome: "Água 500ml",
  preco: 5.00,
  estoque: 50,
  estoque_minimo: 10,
  observacao: "",
  ativo: true,
  criado_em: Timestamp,
  atualizado_em: Timestamp
}
```

### **Coleção: `produtos_livraria`**
```javascript
{
  titulo: "Bíblia de Estudo NVI",
  autor: "Autor",
  editora: "Editora",
  categoria: "Bíblias",
  isbn: "978-...",
  preco: 89.90,
  custo: 50.00,
  estoque: 10,
  estoque_minimo: 2,
  capa_url: "https://...",
  descricao: "Resumo do livro",
  ativo: true,
  criado_em: Timestamp,
  atualizado_em: Timestamp
}
```

### **Coleção: `produtos_loja`**
```javascript
{
  nome: "Camiseta ABCL 2025",
  preco: 45.00,
  custo: 15.00,
  estoque: 100,
  estoque_minimo: 5,
  tamanhos: ["P", "M", "G", "GG"],
  cores: ["Preto", "Branco"],
  imagem_url: "https://...",
  descricao: "Descrição",
  ativo: true,
  criado_em: Timestamp,
  atualizado_em: Timestamp
}
```

---

## 🚀 Como Usar

### **1. Adicionar ao Projeto**

Copie o arquivo `produtos.html` para a raiz do seu projeto:

```
seu-projeto/
├── login.html
├── admin.html
├── produtos.html  ← NOVO
├── vendinha.html
├── livraria.html
├── loja.html
└── ...
```

### **2. Link no Admin**

No seu `admin.html`, adicione um botão/link para a página de produtos:

```html
<a href="produtos.html">Gerenciar Produtos</a>
```

Ou você pode colocar um iframe se quiser:

```html
<div style="width:100%; height:600px;">
  <iframe src="produtos.html" style="width:100%; height:100%; border:none;"></iframe>
</div>
```

### **3. Proteger a Página**

Se quiser que apenas **Admin e Coordenação** acessem, adicione no topo de `produtos.html`:

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
<script src="auth.js"></script>
<script>
  verificarSessao(['admin', 'coordenacao']);
</script>
```

(Coloque esses scripts **antes** do `<body>` ou no início do script Firebase existente)

---

## 🎯 Funcionalidades Principais

### **Cadastro**
- Preenche formulário por módulo
- Clica em "Salvar Produto"
- Produto aparece imediatamente na lista

### **Edição**
- Clica no botão ✏️ (editar) no card do produto
- Formulário se preenche automaticamente
- Faz as alterações
- Clica "Salvar Produto" (botão muda para "Atualizar")

### **Exclusão**
- Clica no botão 🗑️ (deletar)
- Confirma a exclusão
- Produto é removido

### **Validação**
- Nome/Título e Preço são obrigatórios
- Se faltar, mostra mensagem de erro
- Impede salvar sem os dados essenciais

### **Alertas de Estoque**
- Se estoque ≤ estoque_minimo, a lista mostra em **vermelho**
- Ajuda a identificar o que precisa repor

---

## 🔐 Permissões no Firestore

As regras já criadas (Bloco 1) permitem que:
- **Admin**: Cria, edita, deleta produtos de todos os módulos
- **Coordenação**: Cria, edita, deleta produtos de vendinha, livraria e loja
- **Participante**: Apenas lê (se implementar exibição)

---

## 💡 Dicas de Uso

### **Vendinha — Nomes com Tamanhos**
```
❌ Errado: "Água", "Suco"
✅ Certo: "Água 500ml", "Suco Laranja 300ml", "Refrigerante Coca 2L"
```

### **Livraria — Buscar Capa Automaticamente**
Por enquanto, a URL da capa é manual. Depois implementamos uma função que busca automaticamente pelo ISBN no Google Books API.

### **Loja — Combinações**
O sistema salva tamanhos e cores selecionados, mas **não controla estoque por combinação**. É estoque geral. Se precisar no futuro, a gente adiciona.

---

## 📊 Próximos Passos

### **Imediatamente após Bloco 3:**
1. Testar cadastro de produtos em cada módulo
2. Verificar se aparecem na lista ao vivo
3. Testar edição e exclusão

### **Bloco 4 — Registro de Vendas**
Quando chegar lá, a tela de vendas vai:
- Buscar os produtos cadastrados aqui
- Permitir selecionar um produto + quantidade
- Registrar a venda no Firestore
- Atualizar o resumo financeiro automaticamente

---

## ⚡ Teste Rápido

1. Acesse `http://localhost:8080/produtos.html`
2. Faça login
3. Cadastre um produto em cada módulo (vendinha, livraria, loja)
4. Veja aparecer na lista ao lado
5. Tente editar (clique ✏️)
6. Tente deletar (clique 🗑️)

Se tudo funcionar, **Bloco 3 está 100% completo!** 🎉

---

## 🐛 Se der erro:

**Erro: "Você não tem permissão"**
- Verifique se seu usuário tem `perfil_tipo: "admin"` no Firestore
- Admin acessa tudo, Coordenação acessa vendinha/livraria/loja

**Erro: "Falha ao salvar"**
- Verifique se as coleções foram criadas (Bloco 1)
- Verifique as regras de segurança do Firestore

**Produtos não aparecem na lista**
- Recarregue a página (F5)
- Verifique se o documento foi criado no Firestore Console

---

## ✅ Checklist Bloco 3

- [ ] Arquivo `produtos.html` adicionado ao projeto
- [ ] Testado cadastro de vendinha
- [ ] Testado cadastro de livraria
- [ ] Testado cadastro de loja
- [ ] Testado edição de produto
- [ ] Testado exclusão de produto
- [ ] Verificado se aparecem no Firestore Console
- [ ] Criado link no admin.html

**Quando tudo estiver funcionando, avisa e partimos pro Bloco 4!** 🚀

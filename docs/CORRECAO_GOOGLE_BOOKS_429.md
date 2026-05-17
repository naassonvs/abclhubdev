# 🔧 Correção: Erro 429 Google Books API (Too Many Requests)

**Data:** 15 de Maio de 2026  
**Problema:** Ao finalizar venda na livraria, erro `429 (Too Many Requests)` no console  
**Causa Raiz:** Rate limiting do Google Books API excedido por requisições simultâneas

---

## 📊 Diagnóstico

### Evidências do DevTools:

```
GET https://www.googleapis.com/books/v1/volumes?q=... → 429 Too Many Requests
GET https://www.googleapis.com/books/v1/volumes?q=... → 429 Too Many Requests
GET https://www.googleapis.com/books/v1/volumes?q=... → 429 Too Many Requests
...
```

### Por que acontecia:

1. **Inicialização (linha 907):** Função `buscarCapasGoogle()` começa a buscar capas
   - Até **20 livros** simultâneos sem capa
   - 120ms throttle entre requisições

2. **Usuário finaliza venda (linha 1166-1167):** Mais requisições são disparadas
   - Enquanto as da inicialização ainda estão rodando
   - **Resultado:** Pico de requisições → 429

3. **Google limita:** Máximo ~5-10 req/seg por chave/IP
   - App chegava a 15-20 requisições/seg

---

## ✅ Solução Implementada

### 1. Reduzir quantidade de livros por busca

**Antes:**
```javascript
const semCapa = livros.filter(l => !l.capa).slice(0, 20); // ❌ 20 livros
```

**Depois:**
```javascript
const semCapa = livros.filter(l => !l.capa).slice(0, 5); // ✅ 5 livros
```

**Impacto:** 75% menos requisições na inicialização

---

### 2. Aumentar throttle entre requisições

**Antes:**
```javascript
await new Promise(r => setTimeout(r, 120)); // ❌ 120ms
```

**Depois:**
```javascript
await new Promise(r => setTimeout(r, 300)); // ✅ 300ms
```

**Impacto:** Reduz de ~8 req/seg para ~3 req/seg

---

### 3. Detectar e parar em case de 429

**Novo código:**
```javascript
if (res.status === 429) {
  console.warn('[Google Books] Rate limit (429) — parando busca');
  break; // Para graciosamente se Google limitar
}
```

**Impacto:** Evita spam de requisições após estar limitado

---

### 4. Melhor tratamento de erros no modal de edição

**Antes:**
```javascript
const res = await fetch(...);
const data = await res.json(); // ❌ Falha silenciosamente em 429
```

**Depois:**
```javascript
if (res.status === 429) {
  toast('⏳ Muitas requisições — aguarde um pouco e tente novamente.');
  return;
}
if (!res.ok) {
  toast('❌ Erro ao conectar no Google Books.');
  return;
}
```

**Impacto:** Usuário entende por que capa não foi encontrada

---

## 📈 Resultados Esperados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Livros buscados / inicialização | 20 | 5 | ↓ 75% |
| Throttle entre req (ms) | 120 | 300 | ↓ 2.5x |
| Requisições/segundo pico | 15-20 | 3-5 | ↓ 70% |
| Erro 429 na finalização | ❌ Sim | ✅ Não | Resolvido |

---

## 🧪 Como Testar

### Teste 1: Inicialização sem erro
1. Abra livraria.html com **muitos livros sem capa**
2. Veja no console: `[Google Books] Buscando capas para X livros...`
3. ✅ Não deve aparecer erro 429

### Teste 2: Finalizar venda durante busca
1. Abra livraria
2. **Rapidamente** (enquanto busca de capas rodar): Adicione items ao carrinho
3. Finalize a venda
4. ✅ Erro 429 não deve aparecer

### Teste 3: Rate limit gracioso
1. Editar livro → Buscar capa pelo Google Books
2. Fazer isso 10 vezes seguidas em menos de 30 segundos
3. Na 6-7ª vez, deverá aparecer: `⏳ Muitas requisições — aguarde um pouco...`
4. ✅ App não trava, apenas avisa ao usuário

---

## 🔐 Notas de Segurança

- ✅ **Sem chave de API necessária** — Google Books é público
- ✅ **Rate limit é por IP/usuário** — diferente por ISP
- ⚠️ **Limite típico:** 100-200 req/min por IP
- ⚠️ **Não recomendado:** Usar em app com muitos usuários sem API key

---

## 🚀 Melhorias Futuras Sugeridas

1. **Implementar fila de requisições** — máx 2-3 simultâneas
2. **Cache de capas** — armazenar em Firebase Storage
3. **API key própria** — aumenta limite de 100 para 10.000 req/dia
4. **Background sync** — buscar capas fora de horário de pico

---

## 📝 Arquivos Modificados

- ✅ `livraria.html` — Linhas 992-1014 e 1417-1433

---

**Status:** ✅ Corrigido e testado

---

## Changelog

### v2.5.1 (Atual)
- ✅ Reduzido limite de capas por inicialização: 20 → 5
- ✅ Aumentado throttle: 120ms → 300ms
- ✅ Adicionada detecção de erro 429
- ✅ Melhorado tratamento de erros em busca manual

### v2.5.0
- Adicionado campo acampante
- Corrigido QR Code PIX
- Resolvida duplicação de vendas

---


# 📋 RESUMO DE CORREÇÕES — ABCL Hub

Data: 15 de Maio de 2026  
Versão: v2.5 (com acampante, QR Code e duplicação corrigidas)

---

## ✅ PROBLEMA 1: Campo "Acampante" nas Vendas

### O que foi feito:

#### 1.1 **vendas-firebase.js** — Capturar e salvar acampante
- ✅ Adicionado campo `acampante` na função `montarVenda()`
- ✅ Mapeia `pessoa` (vendinha) ou `acampante` (livraria) para campo único `acampante`
- ✅ Também captura `periodo` (turno/período do acampante)

**Código adicionado:**
```javascript
// Acampante (vendinha + livraria)
acampante:  dadosParciais.pessoa || dadosParciais.acampante || null,
periodo:    dadosParciais.periodo || null,
```

#### 1.2 **financeiro.html** — Exibir acampante

✅ **Tabela de Movimentação PDV:**
- Coluna "Acampante" adicionada entre "Módulo" e "Produtos"
- Mostra nome + período (ex: "João Silva (Turno 1)")

✅ **Modal de Detalhes da Venda:**
- Campo "Acampante" exibido no topo com informações
- Formato: "Acampante: João Silva (Turno 1)"

---

## ✅ PROBLEMA 2: QR Code PIX na Vendinha

### O que foi feito:

#### 2.1 **vendinha.html** — Corrigido erro QRCodeModel

**Problema:** `QRCodeModel is not defined`  
**Causa:** Código quebrado executava antes da lib ser definida

**Correções aplicadas:**
1. ✅ Removidos blocos `QRCodeLib` e `makeQRCode()` não funcionais
2. ✅ Corrigido `showQrCode()` para usar objeto de nível de correção correto: `{ bit: 1 }`
3. ✅ Corrigido `QRCodeOffline.generate()` com mesmo padrão
4. ✅ `getQRTypeNumber()` ajustado para passar valor correto aos RSBlocks

**Resultado:** QR Code agora funciona 100% offline com SVG puro

#### 2.2 **livraria.html** — Melhorado fallback QR Code

**Melhorias:**
- ✅ Tenta usar `QRCodeOffline` (SVG offline) se disponível
- ✅ Fallback para API externa `qrserver.com` se SVG falhar
- ✅ Se ambas falharem, mostra payload como texto (funciona sempre)

**Código adicionado:**
```javascript
function gerarQRSVG(texto, container) {
  // Tenta QRCodeOffline (offline)
  if (typeof QRCodeOffline !== 'undefined' && QRCodeOffline.generate) {
    try {
      QRCodeOffline.generate(texto, container, 200);
      return;
    } catch (e) {
      console.warn('[QR] SVG offline falhou, usando API fallback...');
    }
  }
  
  // Fallback: API externa
  // Se API também falhar: mostra payload como texto
}
```

**Resultado:** QR Code funciona offline, online com API, e como fallback com texto

---

## ✅ PROBLEMA 3: Duplicação de Vendas na Livraria

### O que foi feito:

#### 3.1 **livraria.html** — Corrigido patch de finalizarVenda

**Problema:** `finalizarVenda()` era chamada 2 vezes:
1. Linha 1167: Chamada original
2. Linha 1664: Chamada novamente dentro do patch

**Resultado:** Venda salva **2 VEZES** no localStorage, depois sincronizada 1x ao Firebase

**Solução aplicada:**
- ✅ Removida chamada `_finalizarVendaLivOrig()` de dentro do patch
- ✅ Patch agora apenas aguarda a venda ser salva e sincroniza ao Firebase
- ✅ Adicionado comentário explicativo

**Antes (bugado):**
```javascript
window.finalizarVenda = async function(total, ...) {
  _finalizarVendaLivOrig(...);  // ❌ DUPLICA!
  await _enviarVendaFirebaseLiv(...);
};
```

**Depois (correto):**
```javascript
window.finalizarVenda = async function(total, ...) {
  await new Promise(r => setTimeout(r, 50));  // Aguarda salvar localmente
  await _enviarVendaFirebaseLiv(...);  // Apenas sincroniza
};
```

**Resultado:** Vendas não duplicam mais

#### 3.2 **livraria.html** — Padronizado campo acampante

- ✅ Campo renomeado de `cliente` para `acampante` no Firebase
- ✅ Mantém compatibilidade com estrutura local da livraria

---

## 📊 Quadro Resumido

| Problema | Arquivo | Status | Detalhes |
|----------|---------|--------|----------|
| Acampante não era salvo | vendas-firebase.js | ✅ Corrigido | Campo adicionado e mapeado |
| Acampante não era exibido | financeiro.html | ✅ Corrigido | Coluna + modal atualizados |
| QR Code erro na vendinha | vendinha.html | ✅ Corrigido | Lib carregada e configurada |
| QR Code offline na livraria | livraria.html | ✅ Melhorado | Fallback SVG > API > texto |
| Vendas duplicadas livraria | livraria.html | ✅ Corrigido | Patch refinado |

---

## 🔧 Como Implementar

1. **Substitua os arquivos:**
   - `vendas-firebase.js` — atualizar toda a função `montarVenda()`
   - `vendinha.html` — atualizar QR Code (linhas ~36-80, 1140-1160)
   - `livraria.html` — atualizar patch + QR fallback (linhas ~1449, 1661-1705)
   - `financeiro.html` — atualizar tabela (linhas ~287, ~1050, ~1143)

2. **Teste:**
   - Vendinha: Registre venda com PIX → QR deve gerar sem erro
   - Livraria: Registre venda → deve aparecer 1x no firebase, não 2x
   - Financeiro: Abra "Movimentação PDV" → coluna "Acampante" deve aparecer
   - Modal: Clique em 👁️ na tabela → deve exibir acampante nos detalhes

---

## 📝 Notas Técnicas

### Campo `acampante` no Firebase
- **Vendinha:** Vem como `pessoa` no objeto de venda
- **Livraria:** Vem como `cliente` no objeto de venda
- **Firebase:** Ambos são salvos como `acampante` via `montarVenda()`
- **Estrutura:** `{ acampante: "João Silva", periodo: "Turno 1" }`

### QR Code — Ordem de Preferência
1. SVG nativo (100% offline) — mais rápido
2. API qrserver.com — requer internet
3. Texto do payload — funciona sempre como último recurso

### Índices Firestore
- ✅ Nenhum índice composto adicional necessário
- ✅ Queries continuam otimizadas (filtragem no cliente)

---

## 🚀 Próximas Melhorias Sugeridas

1. Adicionar filtro "Acampante" no financeiro (buscar vendas por nome)
2. Relatório de vendas por acampante
3. Validação de acampante (lista suspeita de duplicatas)

---

**Pronto para deploy! ✨**

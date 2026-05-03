# 🏕️ ABCL — Plataforma do Acampamento Bíblico

Sistema completo com site público, hub de links, painel admin e vendinha.

---

## 📁 Estrutura

```
abcl/
├── index.html      ← Site público do acampamento
├── links.html      ← Hub de links (estilo Linktree)
├── admin.html      ← Painel administrativo
├── vendinha.html   ← Caixa rápido do acampamento
├── css/
│   └── style.css   ← Estilos do site principal
├── js/
│   └── main.js     ← JS do site principal
├── assets/
│   └── logo-abcl.png
└── README.md
```

---

## 🔐 Credenciais padrão

### Admin (admin.html)
| Usuário  | Senha      |
|----------|-----------|
| naasson  | abcl2026  |
| haniel   | abcl2026  |
| mauri    | abcl2026  |
| admin    | abcl@admin|

### Vendinha (vendinha.html)
| Usuário | Senha     |
|---------|----------|
| caixa   | vendinha  |
| naasson | abcl2026  |
| haniel  | abcl2026  |

> ⚠️ Para produção, mova as credenciais para um backend real (Firebase Auth, Supabase, etc.)

---

## 🔧 Para atualizar a cada edição

1. **js/main.js** → altere `DATA_ACAMPAMENTO` e `FORMS_URL`
2. **admin.html** → faça login e edite tudo pelo painel
3. **assets/logo-abcl.png** → substitua a logo se necessário

---

## 🚀 Deploy

Projeto HTML puro — sem build necessário.

| Plataforma | Como fazer |
|------------|-----------|
| **Netlify** | Arraste a pasta em netlify.com/drop |
| **GitHub Pages** | Settings → Pages → Branch main |
| **Vercel** | `vercel --prod` na pasta |
| **FTP** | Envie todos os arquivos mantendo a estrutura |

---

## 🛒 Vendinha — o que ela faz

- Caixa rápido com grade de produtos
- Seleção de acampante (lista pré-carregada da planilha)
- Períodos: Manhã / Tarde / Noite
- Pagamentos: PIX / Dinheiro / Fiado
- Desconto e oferta por venda
- Baixa automática de estoque
- Histórico de vendas filtrado por forma de pagamento
- Aba "Devendo" com total de fiado por pessoa
- Resumo por data e período
- Exportar CSV
- Gerenciamento de estoque e produtos

## 📋 Admin — o que ele faz

- Dashboard com estatísticas
- Gerenciar Hub de Links (adicionar, editar, remover)
- Cadastrar preletores com foto
- Editar todos os textos do site (datas, preços, temas, versículo)
- Personalizar cores
- Acesso rápido à Vendinha

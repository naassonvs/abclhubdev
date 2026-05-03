# 🏕️ ABCL — Plataforma do Acampamento Bíblico

Sistema completo com site público, hub de links, painel administrativo e módulos operacionais (vendinha, financeiro, livraria).

---

## 📁 Estrutura

```
abcl/
├── index.html ← Site público do acampamento
├── links.html ← Hub de links (estilo Linktree)
├── admin.html ← Painel administrativo
├── vendinha.html ← Caixa rápido (vendinha)
├── financeiro.html ← Controle financeiro (em evolução)
├── livraria.html ← Controle de livraria (em evolução)
├── css/
│ └── style.css ← Estilos globais
├── js/
│ └── main.js ← JS principal
├── assets/
│ └── logo-abcl.png
└── README.md
```

---


---

## 🧩 Módulos do sistema

### 🌐 Site público (`index.html`)
- Página oficial do acampamento
- Informações gerais (data, tema, inscrição)
- Integração com formulário externo

---

### 🔗 Hub de Links (`links.html`)
- Central de acessos rápidos
- Estilo Linktree
- Gerenciável pelo painel admin

---

### 🛠️ Painel Admin (`admin.html`)
- Dashboard com estatísticas
- Gerenciamento de conteúdo do site
- Cadastro de preletores
- Controle do hub de links
- Personalização visual
- Acesso aos módulos internos

---

### 🛒 Vendinha (`vendinha.html`)
- Caixa rápido com interface otimizada
- Seleção de acampante
- Controle por período (manhã/tarde/noite)
- Formas de pagamento:
  - PIX
  - Dinheiro
  - Fiado
- Descontos e ofertas
- Controle de estoque
- Histórico de vendas
- Controle de devedores
- Exportação CSV

---

### 💰 Financeiro (`financeiro.html`)
- Controle geral de entradas e saídas
- Consolidação de dados da vendinha
- Organização financeira do evento
- *(em desenvolvimento)*

---

### 📚 Livraria (`livraria.html`)
- Controle de vendas de livros
- Gestão de estoque separado da vendinha
- *(em desenvolvimento)*

---

## 🔐 Credenciais padrão

### Admin
| Usuário  | Senha      |
|----------|-----------|
| naasson  | abcl2026  |
| haniel   | abcl2026  |
| mauri    | abcl2026  |
| admin    | abcl@admin|

---

### Vendinha
| Usuário | Senha     |
|---------|----------|
| caixa   | vendinha |
| naasson | abcl2026 |
| haniel  | abcl2026 |

> ⚠️ Em produção, utilizar autenticação real (Firebase Auth, Supabase, etc.)

---

## 🔧 Configurações importantes

Após clonar o projeto:

1. Editar `js/main.js`
   - `DATA_ACAMPAMENTO`
   - `FORMS_URL`

2. Atualizar conteúdos via `admin.html`

3. Substituir logo em:

assets/logo-abcl.png


---

## 🚀 Deploy

Projeto estático (HTML, CSS, JS puro)

| Plataforma       | Instrução |
|----------------|----------|
| Netlify         | Arrastar pasta no painel |
| GitHub Pages    | Settings → Pages → main |
| Vercel          | `vercel --prod` |
| Hospedagem FTP  | Upload direto |

---

## ⚠️ Limitações atuais

- Autenticação local (não segura para produção)
- Dados armazenados localmente (localStorage)
- Sem backend integrado

---

## 🔮 Próximos passos (Roadmap)

- [ ] Implementar backend (Firebase ou Supabase)
- [ ] Autenticação segura
- [ ] Sincronização em tempo real
- [ ] Integração entre vendinha e financeiro
- [ ] Melhorar separação de módulos
- [ ] Evoluir para PWA (modo offline confiável)

---

## 📌 Visão do projeto

O ABCLHub evolui de um site simples para uma **plataforma completa de gestão de acampamentos**, integrando:

- Comunicação
- Operação (vendas)
- Administração
- Controle financeiro

---

## 👤 Autor

Naasson Vieira  
GitHub: https://github.com/naassonvs

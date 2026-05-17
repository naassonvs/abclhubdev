# 📊 Estrutura Completa do Firestore - ABCL Hub

## 🗂️ Coleções e Documentos

### 1️⃣ **configs** (Configurações Gerais)
```
/configs/geral → {
  nome_evento: "Acampamento ABCL 2025",
  ano: 2025,
  data_inicio: "2025-01-15",
  data_fim: "2025-01-18",
  local: "Endereço do local",
  descricao: "Descrição do evento",
  
  // Contato
  email_contato: "contato@abcl.com",
  telefone: "+55 31 XXXXX-XXXX",
  whatsapp: "+55 31 XXXXX-XXXX",
  
  // Redes Sociais
  instagram: "@abclhub",
  facebook: "abclhub",
  youtube: "abclhub",
  
  // Visual (fixo, mas pode ter uma ou outra alteração)
  cor_primaria: "#FF6B35",
  cor_secundaria: "#004E89",
  logo_url: "https://storage.../logo.png",
  
  // Valores
  valor_inscricao: 150.00,
  valor_meia_entrada: 75.00,
  
  // Status
  inscricoes_abertas: true,
  data_fechamento_inscricoes: "2025-01-10",
  
  atualizado_em: (timestamp)
}
```

---

### 2️⃣ **hub_links** (Hub Único de Links)
```
/hub_links/principal → {
  titulo: "ABCL Hub",
  descricao: "Central de recursos do acampamento",
  
  links: [
    {
      id: "1",
      titulo: "Inscrições",
      url: "/formulario.html",
      icone: "📝",
      ordem: 1
    },
    {
      id: "2",
      titulo: "Hinos",
      url: "/hinos.html",
      icone: "🎵",
      ordem: 2
    },
    {
      id: "3",
      titulo: "Vendas",
      url: "/vendas.html",
      icone: "🛒",
      ordem: 3,
      requer_autenticacao: true
    },
    // ... mais links
  ],
  
  atualizado_em: (timestamp)
}
```

---

### 3️⃣ **conteudo** (Dados do Evento - Admin)
```
/conteudo/sobre_evento → {
  titulo: "Sobre o Evento",
  descricao: "Texto descritivo longo",
  imagem_url: "https://storage.../about.jpg",
  ordem: 1,
  ativo: true,
  criado_em: (timestamp),
  atualizado_em: (timestamp)
}

/conteudo/programacao → {
  titulo: "Programação",
  dias: [
    {
      data: "2025-01-15",
      eventos: [
        {
          horario: "09:00",
          titulo: "Abertura",
          descricao: "Abertura oficial",
          local: "Auditório",
          responsavel: "João Silva"
        }
      ]
    }
  ],
  atualizado_em: (timestamp)
}

/conteudo/temas → {
  titulo: "Temas do Acampamento",
  temas: [
    {
      id: "1",
      nome: "Tema 1: Fé e Esperança",
      descricao: "...",
      cor: "#FF6B35",
      icone: "url"
    }
  ],
  atualizado_em: (timestamp)
}

/conteudo/equipe → {
  titulo: "Nossa Equipe",
  membros: [
    {
      id: "1",
      nome: "Coordenador",
      cargo: "Coordenação Geral",
      foto_url: "...",
      bio: "..."
    }
  ],
  atualizado_em: (timestamp)
}
```

---

### 4️⃣ **vendas** (Registro de Vendas)
```
/vendas/{id} → {
  tipo: "vendinha" | "livraria" | "loja",
  produto: "Nome do produto",
  quantidade: 5,
  valor_unitario: 10.00,
  valor_total: 50.00,
  forma_pagamento: "dinheiro" | "pix" | "cartao",
  operador_uid: "user_123",
  operador_nome: "João Silva",
  ano_acampamento: 2025,
  timestamp: (timestamp),
  status: "confirmada" | "cancelada",
  observacoes: ""
}
```

---

### 5️⃣ **produtos_{modulo}** (Vendinha, Livraria, Loja)
```
/produtos_vendinha/{id} → {
  nome: "Água 500ml",
  preco: 5.00,
  estoque: 50,
  estoque_minimo: 10,
  categoria: "Bebidas",
  imagem_url: "https://storage.../produto.jpg",
  descricao: "Água mineral natural",
  ativo: true,
  criado_em: (timestamp),
  atualizado_em: (timestamp)
}

// Repetir estrutura para:
/produtos_livraria/{id}
/produtos_loja/{id}
```

---

### 6️⃣ **inscricoes** (Formulário de Inscrição)
```
/inscricoes/{id} → {
  // Dados do Participante
  nome: "Maria Santos",
  email: "maria@example.com",
  telefone: "+55 31 XXXXX-XXXX",
  data_nascimento: "2010-05-15",
  cpf: "XXX.XXX.XXX-XX",
  
  // Responsável (se menor de idade)
  responsavel: "João Santos",
  email_responsavel: "joao@example.com",
  
  // Dados da Inscrição
  grupo: "Adolescentes" | "Crianças" | "Adultos" | "Líderes",
  tema_interesse: "Tema 1",
  
  // Valores
  valor_inscricao: 150.00,
  valor_pago: 150.00,
  forma_pagamento: "pix" | "dinheiro" | "cartao" | "boleto",
  desconto_aplicado: 0,
  motivo_desconto: "",
  
  // Status
  status: "pendente" | "confirmada" | "cancelada",
  aprovada: true | false,
  
  // Meta
  needs_follow_up: false,
  observacoes: "",
  
  timestamp: (timestamp),
  ano_acampamento: 2025
}
```

---

### 7️⃣ **hinos** (Hinário)
```
/hinos/{id} → {
  numero: 1,
  titulo: "Graça Maravilhosa",
  letra: "Graça maravilhosa...",
  cifra: "C Am F G",
  categoria: "Louvor" | "Consagração" | "Infantil",
  artista: "Autor desconhecido",
  tonalidade: "Dó Maior",
  visualizacoes: 1250,
  favoritos_count: 45,
  timestamp: (timestamp),
  atualizado_em: (timestamp)
}
```

---

### 8️⃣ **usuarios** (Perfis de Usuários)
```
/usuarios/{uid} → {
  uid: "user_firebase_id",
  nome: "João Silva",
  email: "joao@example.com",
  foto_url: "https://lh3.googleusercontent.com/...",
  
  // Autenticação
  provedor: "google" | "facebook" | "apple" | "email",
  
  // Perfil
  perfil_tipo: "admin" | "operador" | "participante",
  
  // Status
  aprovado: true,
  ativo: true,
  
  // Timestamps
  criado_em: (timestamp),
  ultimo_acesso: (timestamp),
  atualizado_em: (timestamp)
}
```

---

### 9️⃣ **favoritos_hinos** (Hinos Favoritados por Usuário)
```
/favoritos_hinos/{uid}/{hino_id} → {
  uid: "user_123",
  hino_id: "hino_456",
  hino_titulo: "Graça Maravilhosa",
  salvo_em: (timestamp)
}
```

---

### 🔟 **analytics** (Visitas e Insights - Opcional)
```
/analytics/visitas → {
  data: "2025-01-15",
  total_visitas: 1250,
  visitantes_unicos: 450,
  tempo_medio_sessao_segundos: 420,
  paginas_mais_visitadas: [
    { pagina: "/hinos.html", visitas: 320 },
    { pagina: "/formulario.html", visitas: 280 }
  ],
  timestamp: (timestamp)
}

/analytics/eventos → {
  tipo: "inscricao_completa" | "venda" | "visualizacao_hino",
  data: "2025-01-15",
  total: 45,
  timestamp: (timestamp)
}
```

---

### 1️⃣1️⃣ **financeiro_resumo** (Resumo para Relatório)
```
/financeiro_resumo/{ano} → {
  ano: 2025,
  
  // Vendas
  total_vendas: 5240.50,
  quantidade_vendas: 480,
  vendas_por_modulo: {
    vendinha: 2100.00,
    livraria: 1840.50,
    loja: 1300.00
  },
  vendas_por_forma_pagamento: {
    dinheiro: 2500.00,
    pix: 2240.50,
    cartao: 500.00
  },
  
  // Inscrições
  total_inscricoes: 3600.00,
  quantidade_inscricoes: 24,
  inscrições_por_grupo: {
    adolescentes: 10,
    criancas: 8,
    adultos: 4,
    lideres: 2
  },
  
  // Total
  total_arrecadado: 8840.50,
  
  atualizado_em: (timestamp)
}
```

---

### 1️⃣2️⃣ **ferramentas** (Funcionalidades Adicionais)
```
/ferramentas/notificacoes → {
  titulo: "Sistema de Notificações",
  ativo: true,
  configuracoes: {
    email_notificacoes: true,
    push_notificacoes: false,
    whatsapp_notificacoes: false
  }
}

/ferramentas/qrcode_checkin → {
  titulo: "QR Code Check-in",
  ativo: true,
  configuracoes: {
    presenca_obrigatoria: true,
    gerar_relatorio: true
  }
}

/ferramentas/sorteios → {
  titulo: "Sorteios e Brindes",
  ativo: true,
  sorteios: [
    {
      id: "1",
      nome: "Sorteio de Bíblias",
      descricao: "Sorteio entre inscritos",
      premios: ["Bíblia NVI", "Bíblia ARA"],
      data_sorteio: "2025-01-18",
      participantes_uid: ["uid1", "uid2", "uid3"],
      vencedores: ["uid1"]
    }
  ]
}

/ferramentas/chat_suporte → {
  titulo: "Chat/Suporte",
  ativo: false,
  configuracoes: {
    resposta_automatica: "Olá! Assim que possível responderemos.",
    email_destino: "suporte@abcl.com"
  }
}

/ferramentas/enquetes → {
  titulo: "Enquetes e Votações",
  ativo: true,
  enquetes: [
    {
      id: "1",
      pergunta: "Como foi sua experiência?",
      opcoes: ["Excelente", "Bom", "Regular", "Ruim"],
      respostas: { "uid1": "Excelente", "uid2": "Bom" }
    }
  ]
}
```

---

## 🔐 Regras de Segurança (Firestore)

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Configs: todos leem, só admin escreve
    match /configs/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Hub Links: todos leem, admin escreve
    match /hub_links/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Conteúdo: todos leem, admin escreve
    match /conteudo/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Vendas: operadores leem/criam, admin gerencia
    match /vendas/{document=**} {
      allow read: if isAutenticado();
      allow create: if isOperador();
      allow update, delete: if isAdmin();
    }

    // Produtos: todos leem, admin escreve
    match /produtos_{modulo}/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Inscrições: todos criam, admin lê/gerencia
    match /inscricoes/{document=**} {
      allow read: if isAdmin();
      allow create: if true; // Qualquer um pode se inscrever
      allow update, delete: if isAdmin();
    }

    // Hinos: todos leem
    match /hinos/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Usuários: cada um lê seu próprio, admin gerencia
    match /usuarios/{uid} {
      allow read: if request.auth.uid == uid || isAdmin();
      allow write: if request.auth.uid == uid || isAdmin();
    }

    // Favoritos hinos: cada um gerencia seus
    match /favoritos_hinos/{uid}/{document=**} {
      allow read, write: if request.auth.uid == uid;
    }

    // Analytics: todos leem, sistema escreve
    match /analytics/{document=**} {
      allow read: if true;
      allow write: if false; // Apenas backend escreve
    }

    // Resumo financeiro: admin lê, sistema atualiza
    match /financeiro_resumo/{document=**} {
      allow read: if isAdmin();
      allow write: if false; // Função do Cloud Function atualiza
    }

    // Ferramentas: todos leem, admin escreve
    match /ferramentas/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Funções auxiliares
    function isAutenticado() {
      return request.auth != null;
    }

    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo == "admin";
    }

    function isOperador() {
      let userType = get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.perfil_tipo;
      return request.auth != null && (userType == "operador" || userType == "admin");
    }
  }
}
```

---

## 📋 Resumo das Coleções

| Coleção | Função | Público | Admin Escreve |
|---------|--------|--------|--------------|
| configs | Configurações gerais | ✅ Lê | ✅ |
| hub_links | Hub único de links | ✅ Lê | ✅ |
| conteudo | Dados do evento | ✅ Lê | ✅ |
| vendas | Registro de vendas | ✅ Operador | ✅ |
| produtos_* | Catálogo | ✅ Lê | ✅ |
| inscricoes | Formulário | ✅ Envia | ✅ |
| hinos | Hinário | ✅ Lê | ✅ |
| usuarios | Perfis | ✅ Seu próprio | ✅ |
| favoritos_hinos | Hinos salvos | ✅ Seu próprio | - |
| analytics | Visitas | ✅ Lê | Sistema |
| financeiro_resumo | Resumo financeiro | ❌ | Sistema |
| ferramentas | Funcionalidades | ✅ Lê | ✅ |

---

## ✅ Próximos Passos

1. **Revisar essa estrutura** — Falta algo? Tem algo errado?
2. **Criar coleções vazias** no Firebase (opcional, mas recomendado para organizar)
3. **Implementar no `db.js`** — Adicionar funções específicas para cada coleção
4. **Seguir para Bloco 2** — Autenticação

Quer que eu atualize o `db.js` com funções para todas essas coleções?

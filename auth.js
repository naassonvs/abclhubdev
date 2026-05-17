// auth.js — Proteção de páginas e verificação de sessão
// Inclua esse script em todas as páginas que precisam de autenticação

// Configuração Firebase (compat)
const firebaseConfig = {
  apiKey: "AIzaSyAGENra-_4GMgwhk-C7d26hEMCqmuQcecU",
  authDomain: "abcl-hub-dev.firebaseapp.com",
  projectId: "abcl-hub-dev",
  storageBucket: "abcl-hub-dev.firebasestorage.app",
  messagingSenderId: "243573406078",
  appId: "1:243573406078:web:57c0257a9b7e6bf04b9b2f"
};

// Inicializar somente se não foi inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// ── ESTADO GLOBAL DO USUÁRIO ──
window.usuarioAtual = null;
window.perfilAtual = null;

// ── VERIFICAR SESSÃO ──
// Chame isso no início de cada página protegida
// Parâmetros:
//   perfisPermitidos: array de perfis que podem acessar (ex: ['admin', 'coordenacao'])
//   redirecionarSe: para onde ir se não tiver permissão (default: 'login.html')
window.verificarSessao = async function(perfisPermitidos = [], redirecionarSe = 'login.html') {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        // Não está logado
        window.location.href = redirecionarSe;
        return;
      }

      try {
        const doc = await db.collection('usuarios').doc(user.uid).get();

        if (!doc.exists) {
          await auth.signOut();
          window.location.href = redirecionarSe;
          return;
        }

        const perfil = doc.data();

        if (!perfil.aprovado) {
          await auth.signOut();
          alert('Sua conta ainda não foi aprovada pelo administrador.');
          window.location.href = redirecionarSe;
          return;
        }

        // Verificar se o perfil tem permissão para essa página
        if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(perfil.perfil_tipo)) {
          alert('Você não tem permissão para acessar essa página.');
          window.location.href = 'index.html';
          return;
        }

        // Salvar estado global
        window.usuarioAtual = user;
        window.perfilAtual = perfil;

        // Atualizar último acesso
        await db.collection('usuarios').doc(user.uid).update({
          ultimo_acesso: firebase.firestore.Timestamp.now()
        });

        resolve({ user, perfil });

      } catch (erro) {
        console.error('Erro ao verificar sessão:', erro);
        window.location.href = redirecionarSe;
      }
    });
  });
};

// ── LOGOUT ──
window.logout = async function() {
  try {
    await auth.signOut();
    window.location.href = 'login.html';
  } catch (erro) {
    console.error('Erro ao sair:', erro);
  }
};

// ── VERIFICAR SE É ADMIN ──
window.isAdmin = function() {
  return window.perfilAtual?.perfil_tipo === 'admin';
};

// ── VERIFICAR SE É COORDENAÇÃO ──
window.isCoordenacao = function() {
  return ['admin', 'coordenacao'].includes(window.perfilAtual?.perfil_tipo);
};

// ── PREENCHER DADOS DO USUÁRIO NA PÁGINA ──
// Use IDs: #usuario-nome, #usuario-email, #usuario-foto, #usuario-perfil
window.preencherDadosUsuario = function() {
  const perfil = window.perfilAtual;
  const user = window.usuarioAtual;
  if (!perfil) return;

  const nome = document.getElementById('usuario-nome');
  const email = document.getElementById('usuario-email');
  const foto = document.getElementById('usuario-foto');
  const tipo = document.getElementById('usuario-perfil');

  if (nome) nome.textContent = perfil.nome || user.displayName || 'Usuário';
  if (email) email.textContent = perfil.email || user.email;
  if (foto && perfil.foto_url) foto.src = perfil.foto_url;
  if (tipo) tipo.textContent = perfil.perfil_tipo === 'admin' ? 'Administrador' : 'Coordenação';
};

console.log('✅ Auth helper carregado!');

// auth.js — Proteção de páginas e verificação de sessão com suporte offline
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

// Habilitar persistência offline do Firestore
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência: múltiplas abas abertas');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistência: não suportada neste navegador');
    }
  });

// ── ESTADO GLOBAL DO USUÁRIO ──
window.usuarioAtual = null;
window.perfilAtual = null;

// ── VERIFICAR SESSÃO (com suporte offline) ──
window.verificarSessao = async function(perfisPermitidos = [], redirecionarSe = 'admin-login.html') {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      // ── CENÁRIO 1: Online + Logado ──
      if (user && navigator.onLine) {
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

          if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(perfil.perfil_tipo)) {
            alert('Você não tem permissão para acessar essa página.');
            window.location.href = 'index.html';
            return;
          }

          window.usuarioAtual = user;
          window.perfilAtual = perfil;

          // Atualizar último acesso
          await db.collection('usuarios').doc(user.uid).update({
            ultimo_acesso: firebase.firestore.Timestamp.now()
          }).catch(() => {}); // Ignora erro se offline

          resolve({ user, perfil });

        } catch (erro) {
          console.error('Erro ao verificar sessão online:', erro);
          // Fallback offline se falhar
          if (validarSessaoOffline(perfisPermitidos)) {
            resolve({ user, perfil: window.perfilAtual });
          } else {
            window.location.href = redirecionarSe;
          }
        }
      }
      // ── CENÁRIO 2: Offline + Credenciais salvas ──
      else if (!navigator.onLine && validarSessaoOffline(perfisPermitidos)) {
        resolve({ user: null, perfil: window.perfilAtual });
      }
      // ── CENÁRIO 3: Sem login ──
      else {
        window.location.href = redirecionarSe;
      }
    });
  });
};

// ── VALIDAR SESSÃO OFFLINE ──
function validarSessaoOffline(perfisPermitidos) {
  const saved = localStorage.getItem('abcl_auth_fallback');
  if (!saved) return false;

  try {
    const data = JSON.parse(saved);
    
    // Verifica expiração (30 dias)
    const expired = (Date.now() - data.timestamp) > (30 * 24 * 60 * 60 * 1000);
    if (expired) return false;

    // Verifica permissão
    if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(data.perfil.perfil_tipo)) {
      return false;
    }

    // Restaura perfil global
    window.perfilAtual = data.perfil;
    return true;

  } catch {
    return false;
  }
}

// ── LOGOUT ──
window.logout = async function() {
  try {
    await auth.signOut();
    localStorage.removeItem('abcl_auth_fallback'); // Limpa cache offline
    window.location.href = 'admin-login.html';
  } catch (erro) {
    console.error('Erro ao sair:', erro);
    // Força logout mesmo offline
    localStorage.removeItem('abcl_auth_fallback');
    window.location.href = 'admin-login.html';
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
window.preencherDadosUsuario = function() {
  const perfil = window.perfilAtual;
  const user = window.usuarioAtual;
  if (!perfil) return;

  const nome = document.getElementById('usuario-nome');
  const email = document.getElementById('usuario-email');
  const foto = document.getElementById('usuario-foto');
  const tipo = document.getElementById('usuario-perfil');

  if (nome) nome.textContent = perfil.nome || user?.displayName || 'Usuário';
  if (email) email.textContent = perfil.email || user?.email || '';
  if (foto && perfil.foto_url) foto.src = perfil.foto_url;
  if (tipo) tipo.textContent = perfil.perfil_tipo === 'admin' ? 'Administrador' : 'Coordenação';
};

console.log('✅ Auth helper carregado (com suporte offline)!');

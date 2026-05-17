// Firebase Configuration - CDN Version
// Este arquivo deve ser carregado DEPOIS dos scripts CDN do Firebase no HTML

console.log('🔄 Carregando Firebase Config...');
console.log('Firebase disponível?', typeof firebase !== 'undefined');

// Aguardar Firebase ser carregado (com timeout de segurança)
function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase ainda não foi carregado. Aguardando...');
    setTimeout(initFirebase, 100);
    return;
  }

  console.log('✅ Firebase detectado!');

  // Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAGENra-_4GMgwhk-C7d26hEMCqmuQcecU",
    authDomain: "abcl-hub-dev.firebaseapp.com",
    projectId: "abcl-hub-dev",
    storageBucket: "abcl-hub-dev.firebasestorage.app",
    messagingSenderId: "243573406078",
    appId: "1:243573406078:web:57c0257a9b7e6bf04b9b2f",
    measurementId: "G-XELDGP5N5G"
  };

  try {
    // Inicializar Firebase
    const app = firebase.initializeApp(firebaseConfig);
    console.log('✅ App Firebase inicializado');

    // Inicializar serviços
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    console.log('✅ Auth inicializado:', typeof auth);
    console.log('✅ Firestore inicializado:', typeof db);
    console.log('✅ Storage inicializado:', typeof storage);

    // Exportar para uso global
    window.firebaseApp = {
      auth,
      db,
      storage,
      firebase
    };

    console.log('✅ Firebase inicializado com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao inicializar Firebase:', erro);
  }
}

// Chamar função quando o documento estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebase);
} else {
  initFirebase();
}

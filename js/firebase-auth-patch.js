/**
 * firebase-auth-patch.js — ABCL PDV
 * 
 * Resolve o erro "Missing or insufficient permissions" ao sincronizar.
 * 
 * O login da vendinha/livraria é local (usuário/senha hardcoded).
 * Para o Firebase aceitar as operações, precisamos autenticar
 * anonimamente ou com uma conta de serviço assim que o usuário
 * faz login local.
 * 
 * INSTRUÇÕES DE USO:
 * 1. Ative "Login Anônimo" no Firebase Console → Authentication → Provedores
 * 2. Adicione este script APÓS os scripts Firebase no HTML:
 *    <script src="firebase-auth-patch.js"></script>
 * 3. Chame loginFirebaseLocal() logo após o login local ser validado
 */

(function(global) {
  'use strict';

  /**
   * Faz login anônimo no Firebase se o usuário ainda não estiver autenticado.
   * Chame isso logo após validar o login local (usuário/senha hardcoded).
   */
  async function loginFirebaseLocal() {
    try {
      const auth = firebase.auth();
      const user = auth.currentUser;

      if (user) {
        console.log('[AuthPatch] Já autenticado no Firebase:', user.uid);
        return user;
      }

      // Login anônimo — permite operações autenticadas sem expor credenciais
      const result = await auth.signInAnonymously();
      console.log('[AuthPatch] Login anônimo Firebase OK:', result.user.uid);
      return result.user;

    } catch (err) {
      console.error('[AuthPatch] Erro ao autenticar no Firebase:', err.message);
      // Não bloqueia o fluxo — venda continua funcionando offline
    }
  }

  /**
   * Verifica se está autenticado no Firebase.
   * Retorna o usuário atual ou null.
   */
  function getFirebaseUser() {
    try {
      return firebase.auth().currentUser;
    } catch {
      return null;
    }
  }

  /**
   * Aguarda o Firebase resolver o estado de autenticação.
   * Útil para garantir que o estado está pronto antes de sincronizar.
   */
  function aguardarAuthFirebase() {
    return new Promise((resolve) => {
      try {
        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
      } catch {
        resolve(null);
      }
    });
  }

  // Exportar globalmente
  global.FirebaseAuthPatch = {
    loginFirebaseLocal,
    getFirebaseUser,
    aguardarAuthFirebase,
  };

}(window));

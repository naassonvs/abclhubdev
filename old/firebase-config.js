// Firebase Configuration - abcl-hub-dev
// Importar os SDKs necessários
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Exportar app para uso em outros módulos
export default app;

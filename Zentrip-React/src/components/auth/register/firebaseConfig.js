// Importa las funciones que necesitas del SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Tu configuración de Firebase Web App
// ¡Reemplaza con tu propia configuración!
const firebaseConfig = {
  apiKey: "AIzaSyBn9vbv3mXbfVlywdn_cMWDgkaCQPx_a2I",
  authDomain: "zentrip-c8f9a.firebaseapp.com",
  projectId: "zentrip-c8f9a",
  storageBucket: "zentrip-c8f9a.firebasestorage.app",
  messagingSenderId: "1008590699656",
  appId: "1:1008590699656:web:bf237fbd2b81b8c9a3f33d"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la instancia de autenticación
export const auth = getAuth(app);
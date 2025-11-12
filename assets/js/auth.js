// assets/js/auth.js

import { auth } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

/**
 * Inicializa persistência local do usuário (permanece logado após recarregar)
 */
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("🧠 Persistência local ativada"))
  .catch(err => console.error("Erro ao configurar persistência:", err));

/**
 * Cria um novo usuário com email e senha
 * @param {string} email 
 * @param {string} senha 
 */
export async function criarConta(email, senha) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    console.log("✅ Conta criada:", userCredential.user.email);
    alert("Conta criada com sucesso!");
    return userCredential.user;
  } catch (error) {
    console.error("Erro ao criar conta:", error.message);
    alert("Erro ao criar conta: " + error.message);
  }
}

/**
 * Faz login com email e senha
 * @param {string} email 
 * @param {string} senha 
 */
export async function login(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    console.log("🔑 Login bem-sucedido:", userCredential.user.email);
    alert("Login realizado com sucesso!");
    return userCredential.user;
  } catch (error) {
    console.error("Erro ao fazer login:", error.message);
    alert("Erro ao logar: " + error.message);
  }
}

/**
 * Faz logout do usuário atual
 */
export async function logout() {
  try {
    await signOut(auth);
    console.log("👋 Logout realizado");
    alert("Você saiu da conta.");
  } catch (error) {
    console.error("Erro ao sair:", error.message);
    alert("Erro ao sair: " + error.message);
  }
}

/**
 * Escuta mudanças de autenticação (login/logout)
 * @param {Function} callback - função que recebe o usuário logado ou null
 */
export function observarUsuario(callback) {
  onAuthStateChanged(auth, user => {
    if (user) {
      console.log("👤 Usuário logado:", user.email);
    } else {
      console.log("🚪 Nenhum usuário logado");
    }
    callback(user);
  });
}

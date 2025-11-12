// assets/js/auth_pin.js
import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/**
 * Gera um email “fictício” baseado no nome de usuário
 * (Firebase exige um formato de email, então criamos um com domínio fixo)
 */
function gerarEmail(usuario) {
  return `${usuario.toLowerCase()}@taskmanager.com`;
}


 /* Cadastra novo usuário (nome + usuário + PIN + gênero + foto)
 */
export async function cadastrarUsuario(nomeCompleto, usuario, pin, genero = "", foto = "") {
  const email = gerarEmail(usuario);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
    const user = userCredential.user;

    // Salva dados adicionais no Firestore
    await setDoc(doc(db, "usuarios", user.uid), {
      nomeCompleto,
      usuario,
      genero,
      foto,
      criadoEm: new Date().toISOString()
    });

    Swal.fire("✅ Cadastro realizado com sucesso!");
    console.log("Usuário criado:", user.email);
    return user;
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      Swal.fire("⚠️ Esse nome de usuário já está em uso!");
    } else {
      console.error("Erro ao cadastrar:", error);
      Swal.fire("❌ Erro ao cadastrar: " + error.message);
    }
  }
}

/**
 * Login com usuário e PIN (Firebase Auth)
 */
export async function loginComPin(usuario, pin) {
  const email = gerarEmail(usuario);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pin);
    const user = userCredential.user;
    alert(`👋 Bem-vindo de volta, ${usuario}!`);
    console.log("Login bem-sucedido:", user.email);
    return user;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      alert("❌ Usuário não encontrado. Cadastre-se primeiro.");
    } else if (error.code === "auth/wrong-password") {
      alert("❌ PIN incorreto!");
    } else {
      alert("Erro ao logar: " + error.message);
      console.error("Erro de login:", error);
    }
  }
}

/**
 * Observa mudanças no estado de autenticação (login/logout)
 */
export function observarUsuario(callback) {
  onAuthStateChanged(auth, user => {
    callback(user);
  });
}

/**
 * Faz logout
 */
export async function logout() {
  await signOut(auth);
  alert("Você saiu da conta!");
}

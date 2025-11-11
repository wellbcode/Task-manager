import { db, collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from "./firebase.js";

// Adicionar tarefa
export async function adicionarTarefa(titulo) {
  try {
    await addDoc(collection(db, "tarefas"), {
      titulo,
      concluida: false,
      criadaEm: new Date()
    });
  } catch (e) {
    console.error("Erro ao salvar no Firestore, usando localStorage:", e);
    salvarLocal(titulo);
  }
}

// Carregar tarefas em tempo real
export function carregarTarefas(callback) {
  const tarefasRef = collection(db, "tarefas");
  onSnapshot(tarefasRef, (snapshot) => {
    const lista = [];
    snapshot.forEach((doc) => lista.push({ id: doc.id, ...doc.data() }));
    callback(lista);
  });
}

// Excluir tarefa
export async function excluirTarefa(id) {
  await deleteDoc(doc(db, "tarefas", id));
}

// Concluir tarefa
export async function concluirTarefa(id) {
  await updateDoc(doc(db, "tarefas", id), { concluida: true });
}

// Backup local
function salvarLocal(titulo) {
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
  tarefas.push({ titulo, concluida: false });
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

import { adicionarTarefa } from "./tarefas.js";

export function sincronizarLocalParaFirestore() {
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
  tarefas.forEach(async (tarefa) => {
    await adicionarTarefa(tarefa.titulo);
  });
  localStorage.removeItem("tarefas"); // limpa após sincronizar
}

// Detecta quando volta a ter internet
window.addEventListener("online", () => {
  console.log("Conexão restabelecida! Sincronizando tarefas...");
  sincronizarLocalParaFirestore();
});

// function mostrarAlerta(msg) {
//   const alerta = document.createElement("div");
//   alerta.textContent = msg;
//   alerta.style = `
//     position: fixed;
//     top: 10px;
//     right: 10px;
//     background: #4caf50;
//     color: white;
//     padding: 10px 15px;
//     border-radius: 5px;
//     box-shadow: 0 0 10px rgba(0,0,0,0.2);
//     z-index: 1000;
//   `;
//   document.body.appendChild(alerta);
//   setTimeout(() => alerta.remove(), 3000);
// }

// function mostrarAlerta(msg) {
//   const alerta = document.createElement("div");
//   alerta.className = "alerta-sync";
//   alerta.innerHTML = `
//     <span class="icone">✅</span>
//     <span class="mensagem">${msg}</span>
//   `;
//   document.body.appendChild(alerta);
//   setTimeout(() => {
//     alerta.classList.add("fade-out");
//     setTimeout(() => alerta.remove(), 500);
//   }, 3000);
// }

// function mostrarAlerta(msg, tipo = "sucesso") {
//   const alerta = document.createElement("div");
//   alerta.className = `alerta-sync ${tipo}`;
//   alerta.innerHTML = `
//     <span class="icone">${
//       tipo === "sucesso" ? "✅" : tipo === "erro" ? "❌" : "⚠️"
//     }</span>
//     <span class="mensagem">${msg}</span>
//   `;
//   document.body.appendChild(alerta);

//   setTimeout(() => {
//     alerta.classList.add("fade-out");
//     setTimeout(() => alerta.remove(), 500);
//   }, 3000);
// }

function mostrarAlerta(msg, tipo = "sucesso") {
  const alerta = document.createElement("div");
  alerta.className = `alerta-sync ${tipo}`;
  alerta.innerHTML = `
    <span class="icone">${
      tipo === "sucesso" ? "✅" : tipo === "erro" ? "❌" : "⚠️"
    }</span>
    <span class="mensagem">${msg}</span>
  `;
  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.classList.add("fade-out");
    setTimeout(() => alerta.remove(), 500);
  }, 3000);
}

export function sincronizarLocalParaFirestore() {
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
  tarefas.forEach(async (tarefa) => {
    await adicionarTarefa(tarefa.titulo);
  });
  localStorage.removeItem("tarefas");
  mostrarAlerta("✅ Tarefas sincronizadas com sucesso!");
}

// Detecta conexão
window.addEventListener("online", () => {
  document.body.classList.remove("offline");
  sincronizarLocalParaFirestore();
});

window.addEventListener("offline", () => {
  document.body.classList.add("offline");
});

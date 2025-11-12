import { adicionarTarefa } from "./tarefas.js";

export function sincronizarLocalParaFirestore() {
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
  tarefas.forEach(async (tarefa) => {
    await adicionarTarefa(tarefa.titulo);
  });
  localStorage.removeItem("tarefas");
  mostrarAlerta("✅ Tarefas sincronizadas com sucesso!", "sucesso");
}

function mostrarAlerta(msg, tipo = "sucesso") {
  const alerta = document.createElement("div");
  alerta.className = `alerta-sync ${tipo}`;
  alerta.innerHTML = `
    <span class="icone">${tipo === "sucesso" ? "✅" : tipo === "erro" ? "❌" : "⚠️"}</span>
    <span class="mensagem">${msg}</span>
  `;
  document.body.appendChild(alerta);
  setTimeout(() => {
    alerta.classList.add("fade-out");
    setTimeout(() => alerta.remove(), 500);
  }, 3000);
}

// ===== Banner offline =====
function mostrarBannerOffline() {
  let banner = document.getElementById("banner-offline");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "banner-offline";
    banner.textContent = "⚠️ Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão voltar.";
    document.body.appendChild(banner);
  }
  banner.classList.add("show");
}

function removerBannerOffline() {
  const banner = document.getElementById("banner-offline");
  if (banner) banner.classList.remove("show");
}

// ===== Eventos online/offline =====
window.addEventListener("offline", () => {
  mostrarBannerOffline();
  mostrarAlerta("⚠️ Você está offline. As alterações serão salvas localmente.", "aviso");
});

window.addEventListener("online", () => {
  removerBannerOffline();
  mostrarAlerta("✅ Conexão restabelecida! Sincronizando tarefas...", "sucesso");
  sincronizarLocalParaFirestore();
});

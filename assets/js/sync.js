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
document.addEventListener("DOMContentLoaded", () => {
  const banner = document.getElementById("banner-offline");

  // Mostra o banner com a cor e mensagem desejadas
  function showBanner(bg, text) {
    banner.style.display = "block";
    banner.style.backgroundColor = bg;
    banner.textContent = text;
    banner.classList.add("show");
  }

  // Oculta o banner suavemente
  function hideBanner() {
    banner.classList.remove("show");
    setTimeout(() => (banner.style.display = "none"), 400);
  }

  // Quando ficar offline
  window.addEventListener("offline", () => {
    showBanner("#FFD700", "⚠️ Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão voltar.");
    document.body.classList.add("offline");
  });

  // Quando voltar a conexão
  window.addEventListener("online", () => {
    document.body.classList.remove("offline");
    showBanner("#32CD32", "✅ Conexão restabelecida! Sincronizando dados...");
    setTimeout(hideBanner, 4000);
  });
});


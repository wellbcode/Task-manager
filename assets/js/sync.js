import { adicionarTarefa } from "./tarefas.js";

export function sincronizarLocalParaFirestore() {
  const tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
  tarefas.forEach(async (tarefa) => {
    await adicionarTarefa(tarefa.titulo);
  });
  localStorage.removeItem("tarefas");
  mostrarAlerta("✅ Tarefas sincronizadas com sucesso!", "sucesso");
}

// ===== Alerta de sincronização =====
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

// ===== Banner Offline/Online =====
document.addEventListener("DOMContentLoaded", () => {
  // Garante que o banner existe (ou cria)
  function getBanner() {
    let banner = document.getElementById("banner-offline");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "banner-offline";
      document.body.appendChild(banner);
    }
    return banner;
  }

  // Mostra o banner com a cor e texto desejado
  function showBanner(bg, text, color = "#000") {
    const banner = getBanner();
    banner.style.display = "block";
    banner.style.backgroundColor = bg;
    banner.style.color = color;
    banner.textContent = text;
    banner.classList.add("show");
  }

  // Oculta o banner suavemente
  function hideBanner() {
    const banner = document.getElementById("banner-offline");
    if (!banner) return;
    banner.classList.remove("show");
    setTimeout(() => (banner.style.display = "none"), 400);
  }

  // Quando ficar offline
  window.addEventListener("offline", () => {
    showBanner(
      "#FFD700",
      "⚠️ Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão voltar.",
      "#000"
    );
    document.body.classList.add("offline");
  });

  // Quando voltar a conexão
  window.addEventListener("online", () => {
    document.body.classList.remove("offline");
    showBanner("#32CD32", "✅ Conexão restabelecida! Sincronizando dados...", "#fff");

    const banner = document.getElementById("banner-offline");
    // Aplica animação suave de saída após 3,5s
    banner.style.animation = "fadeOut 0.5s ease 3.5s forwards";

    // Remove após animação
    setTimeout(() => {
      banner.classList.remove("show");
      banner.style.display = "none";
      banner.style.animation = "";
    }, 4000);
  });
});

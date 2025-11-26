import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHa7mPuFtdFGEEXdW5BgLu_7RPLBmI1Yo",
  authDomain: "taskmanagersync-c9194.firebaseapp.com",
  projectId: "taskmanagersync-c9194",
  storageBucket: "taskmanagersync-c9194.firebasestorage.app",
  messagingSenderId: "242099450025",
  appId: "1:242099450025:web:946de1cd3ee02257a979b8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  db,
  auth,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  setDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};


function verificarEnterLogin(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    loginUsuario();
  }
}

function verificarEnterCadastro(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    cadastrarUsuario();
  }
}

// Enter key handlers
const loginUsuarioInput = document.getElementById("loginUsuario");
if (loginUsuarioInput) loginUsuarioInput.addEventListener("keydown", verificarEnterLogin);
const loginPinInput = document.getElementById("loginPin");
if (loginPinInput) loginPinInput.addEventListener("keydown", verificarEnterLogin);
const cadNomeInput = document.getElementById("cadastroNome");
if (cadNomeInput) cadNomeInput.addEventListener("keydown", verificarEnterCadastro);
const cadUsuarioInput = document.getElementById("cadastroUsuario");
if (cadUsuarioInput) cadUsuarioInput.addEventListener("keydown", verificarEnterCadastro);
const cadPinInput = document.getElementById("cadastroPin");
if (cadPinInput) cadPinInput.addEventListener("keydown", verificarEnterCadastro);
const cadFotoInput = document.getElementById("cadastroFoto");
if (cadFotoInput) cadFotoInput.addEventListener("keydown", verificarEnterCadastro);


// ---------------------------
// Variáveis principais (mantidas)
let tarefas = [];
let usuarioAtual = null; // agora guarda UID do Firebase quando logado
let unsubscribeTarefas = null;
let cropper;
// ---------------------------

// ---------------------------
// Helper: gerar email a partir do "usuario" (mantém formato que usamos)
function gerarEmail(usuario) {
  return `${usuario.toLowerCase()}@taskmanager.com`;
}

// ---------------------------
// Função para migrar tarefas locais para Firestore (chamada após login/cadastro)
async function sincronizarLocalParaFirestore(uid, nomeUsuarioLocal) {
  try {
    const chaveLocal = `tarefas_${nomeUsuarioLocal}`;
    const tarefasLocais = JSON.parse(localStorage.getItem(chaveLocal) || "[]");
    if (!tarefasLocais || tarefasLocais.length === 0) return;

    for (const t of tarefasLocais) {
      await addDoc(collection(db, "tarefas"), {
        userId: uid,
        texto: t.texto,
        categoria: t.categoria || "",
        vencimento: t.vencimento || "",
        concluida: !!t.concluida,
        criadoEm: serverTimestamp()
      });
    }
    localStorage.removeItem(chaveLocal);
    console.log("Tarefas locais migradas para Firestore.");
  } catch (err) {
    console.error("Erro migrar tarefas:", err);
  }
}

// ---------------------------
// ADICIONAR TAREFA (grava no Firestore quando usuário está logado)
// Foi chamado no submit do formTarefa (substituir push local)
async function adicionarTarefaFirestore(objTarefa) {
  const user = auth.currentUser;
  if (!user) {
    // fallback - se não autenticado, mantém local (compatibilidade)
    tarefas.push(objTarefa);
    salvarTarefas();
    renderizarTarefas("todas");
    return;
  }

  await addDoc(collection(db, "tarefas"), {
    userId: user.uid,
    texto: objTarefa.texto,
    categoria: objTarefa.categoria || "",
    vencimento: objTarefa.vencimento || "",
    concluida: !!objTarefa.concluida,
    criadoEm: serverTimestamp()
  });
}

// ---------------------------
// ESCUTAR TAREFAS DO USUÁRIO (real-time)
function escutarTarefasDoUsuario(uid) {
  if (unsubscribeTarefas) unsubscribeTarefas();

  const q = query(
    collection(db, "tarefas"),
    where("userId", "==", uid),
    orderBy("criadoEm", "desc")
  );

  unsubscribeTarefas = onSnapshot(q, snapshot => {
    tarefas = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      tarefas.push({
        id: docSnap.id,
        texto: data.texto,
        categoria: data.categoria,
        vencimento: data.vencimento,
        concluida: data.concluida || false
      });
    });
    renderizarTarefas("todas");
    atualizarContadores();
  }, err => {
    console.error("Erro onSnapshot tarefas:", err);
  });
}

// ---------------------------
// MARCAR CONCLUÍDA / REMOVER TAREFA (operam por ID)
async function marcarConcluida(id) {
  try {
    const ref = doc(db, "tarefas", id);
    // busca documento atual (p/ inverter)
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const current = snap.data();
    await updateDoc(ref, { concluida: !current.concluida });
  } catch (err) {
    console.error("Erro marcar concluída:", err);
  }
}

async function removerTarefa(id) {
  try {
    await deleteDoc(doc(db, "tarefas", id));
  } catch (err) {
    console.error("Erro remover tarefa:", err);
  }
}

// ---------------------------
// RENDERIZAR TAREFAS (ajustado para usar id nas ações)
function renderizarTarefas(filtro) {
  const lista = document.getElementById("listaTarefas");
  if (!lista) return;
  lista.innerHTML = "";

  const filtradas = tarefas.filter(t => {
    if (filtro === "pendentes") return !t.concluida;
    if (filtro === "concluidas") return t.concluida;
    return true;
  });

  filtradas.forEach(t => {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex justify-content-between align-items-center fade-in tarefa-concluida ${t.concluida ? "bg-success" : "bg-danger"} text-white`;

    li.innerHTML = `
      <div>
        <strong>${t.texto}</strong><br>
        <small>Categoria: ${t.categoria || "—"} | Vence: ${formatarDataBR(t.vencimento)}</small>
      </div>
      <div>
        <button class="btn btn-success btn-sm me-2" title="Concluir tarefa" onclick="marcarConcluida('${t.id}')">
          <i class="bi bi-check-circle-fill"></i>
        </button>
        <button class="btn btn-info btn-sm me-2" title="Adicionar ao calendário" onclick="gerarICS('${t.id}')">
          <i class="bi bi-calendar-event"></i>
        </button>
        <button class="btn btn-warning btn-sm me-2" title="Definir lembrete" onclick="mostrarPopupId('${t.id}')">
          <i class="bi bi-bell-fill"></i>
        </button>
        <button class="btn btn-danger btn-sm" title="Excluir tarefa" onclick="removerTarefa('${t.id}')">
          <i class="bi bi-trash-fill"></i>
        </button>
      </div>
    `;
    lista.appendChild(li);
  });

  atualizarContadores();
}

// Expor funções globais usadas via onclick no HTML
window.marcarConcluida = marcarConcluida;
window.removerTarefa = removerTarefa;
window.gerarICS = gerarICS; // atualizar abaixo p/ aceitar id
window.mostrarPopup = mostrarPopup; // manter compatibilidade se necessário
window.mostrarPopupId = function(id){ // wrapper para abrir popup por ID
  const t = tarefas.find(x => x.id === id);
  if (!t) return Swal.fire("Tarefa não encontrada");
  mostrarPopup(t.texto, t.categoria, t.vencimento);
};

// ---------------------------
// MIGRAR / SALVAR TAREFAS LOCAIS (antiga salvarTarefas) - mantida p/ compatibilidade
function salvarTarefasLocalFallback() {
  if (!usuarioAtual) return;
  localStorage.setItem(`tarefas_${usuarioAtual}`, JSON.stringify(tarefas));
}



// ---------------------------
// AUTENTICAÇÃO: cadastro / login / logout (substituem as versões locais)
async function cadastrarUsuario() {
  const nomeCompleto = document.getElementById("cadastroNome").value.trim();
  const usuario = document.getElementById("cadastroUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const pin = document.getElementById("cadastroPin").value.trim();
  const genero = document.getElementById("cadastroGenero").value;
  const fotoInput = document.getElementById("cadastroFoto");

  if (!nomeCompleto || !usuario || !pin) {
    Swal.fire("Preencha todos os campos!");
    return;
  }

  // converte foto se houver
  let base64Foto = "";
  if (fotoInput && fotoInput.files && fotoInput.files.length > 0) {
    base64Foto = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsDataURL(fotoInput.files[0]);
    });
  }

  const email = gerarEmail(usuario);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nomeCompleto,
      usuario,
      genero: genero || "",
      foto: base64Foto || "",
      criadoEm: serverTimestamp()
    });

    Swal.fire("✅ Cadastro realizado com sucesso!");
    limparFormularioCadastro();

    // sincronizar tarefas locais com a conta nova (se existirem)
    await sincronizarLocalParaFirestore(user.uid, usuario);
  } catch (err) {
    console.error("Erro cadastrar:", err);
    if (err.code === "auth/email-already-in-use") {
      Swal.fire("Esse nome de usuário já está em uso!");
    } else {
      Swal.fire("Erro ao cadastrar: " + (err.message || err));
    }
  }
}

async function loginUsuario() {
  const nomeUsuario = document.getElementById("loginUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const pin = document.getElementById("loginPin").value.trim();

  if (!nomeUsuario || !pin) {
    Swal.fire("Preencha usuário e PIN!");
    return;
  }

  const email = gerarEmail(nomeUsuario);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pin);
    Swal.fire("🔑 Login realizado!");
    // sincronizar tarefas locais caso existam (usando nome antigo)
    await sincronizarLocalParaFirestore(userCredential.user.uid, nomeUsuario);
    // resto: onAuthStateChanged vai cuidar do load do perfil e tarefas
  } catch (err) {
    console.error("Erro login:", err);
    if (err.code === "auth/user-not-found") {
      Swal.fire("Usuário não encontrado. Cadastre-se primeiro.");
    } else if (err.code === "auth/wrong-password") {
      Swal.fire("PIN incorreto!");
    } else {
      Swal.fire("Erro ao logar: " + (err.message || err));
    }
  }
}

async function logoutUsuario() {
  try {
    await signOut(auth);
    // signOut acionará onAuthStateChanged e sua UI será atualizada
    Swal.fire({ title: "Você saiu da conta.", icon: "success", timer: 1200, showConfirmButton: false });
  } catch (err) {
    console.error("Erro ao sair:", err);
    Swal.fire("Erro ao sair: " + (err.message || err));
  }
}

// Expor funções globais para botões que chamavam as versões antigas
window.cadastrarUsuario = cadastrarUsuario;
window.loginUsuario = loginUsuario;
window.logoutUsuario = logoutUsuario;

// ---------------------------
// Observador de autenticação (inicializa app quando user loga/desloga)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    usuarioAtual = null;
    document.getElementById("conteudoPrincipal").style.display = "none";
    tarefas = [];
    renderizarTarefas("todas");
    return;
  }

  // Usuário logado
  usuarioAtual = user.uid;

  try {
    // pega perfil do usuário
    const perfilSnap = await getDoc(doc(db, "usuarios", user.uid));
    const perfilData = perfilSnap.exists() ? perfilSnap.data() : null;

    if (perfilData) {
      exibirMensagemUsuario(perfilData.usuario || perfilData.nomeCompleto || "Usuário", perfilData.genero || "");
      atualizarFotoUsuario(perfilData.foto || "");
    }

    // Exibe conteúdo e esconde form
    document.getElementById("conteudoPrincipal").style.display = "block";
    const formLogin = document.getElementById("formularioLoginCadastro");
    if (formLogin) formLogin.style.display = "none";

    // Começa a escutar tarefas em tempo real
    escutarTarefasDoUsuario(user.uid);

  } catch (err) {
    console.error("Erro carregar perfil após login:", err);
  }
});

// função limparFormularioCadastro 
function limparFormularioCadastro() {
  const elemNome = document.getElementById("cadastroNome");
  if (elemNome) elemNome.value = "";
  const elemUsuario = document.getElementById("cadastroUsuario");
  if (elemUsuario) elemUsuario.value = "";
  const elemPin = document.getElementById("cadastroPin");
  if (elemPin) elemPin.value = "";
  const generoSelect = document.getElementById("cadastroGenero");
  if (generoSelect) generoSelect.selectedIndex = 0;
  const fotoInput = document.getElementById("cadastroFoto");
  if (fotoInput) fotoInput.value = "";

  const fotoHeader = document.querySelector(".foto-usuario");
  if (fotoHeader) {
    fotoHeader.src = "assets/img/default.jpg";
  }

  const cropContainer = document.getElementById("cropContainer");
  if (cropContainer) cropContainer.style.display = "none";
  const form = document.getElementById("formularioLoginCadastro");
  if (form) form.style.display = "none";
}

// alternarVisibilidadePIN etc. (mantidos)
function alternarVisibilidadePIN(idCampo, botao) {
  const campo = document.getElementById(idCampo);
  const icone = botao.querySelector("i");
  if (!campo || !icone) return;
  if (campo.type === "password") {
    campo.type = "text";
    icone.classList.remove("bi-lock-fill");
    icone.classList.add("bi-unlock-fill");
  } else {
    campo.type = "password";
    icone.classList.remove("bi-unlock-fill");
    icone.classList.add("bi-lock-fill");
  }
}

// exibirMensagemUsuario (leve ajuste para aceitar nome do perfil)
function exibirMensagemUsuario(usuario, genero) {
  let saudacao = "Olá";
  if (genero === "masculino") saudacao = "Bem-vindo";
  if (genero === "feminino") saudacao = "Bem-vinda";
  let saud = "";
  if (genero === "masculino") saud = "Seu lindo";
  if (genero === "feminino") saud = "Sua linda";

  const nomeDisplay = usuario ? (usuario.charAt(0).toUpperCase() + usuario.slice(1)) : "Usuário";
  const mensagem = `${saudacao}, ${nomeDisplay}, ${saud}! Vamos realizar as tarefas de hoje?`;
  const elemento = document.getElementById("mensagemUsuario");
  if (elemento) {
    elemento.textContent = mensagem;
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      elemento.style.color = "#ffeb3b";
    } else if (hora >= 12 && hora < 18) {
      elemento.style.color = "#ff9800";
    } else {
      elemento.style.color = "#03a9f4";
    }
  }
}

// atualizarFotoUsuario (mantido)
function atualizarFotoUsuario(fotoBase64) {
  const imgPerfil = document.querySelector(".foto-usuario");
  if (imgPerfil) {
    imgPerfil.src = fotoBase64 || "assets/img/default.jpg";
  }
}



// Cropper configuration (mantido)
const novaFotoInput = document.getElementById('novaFoto');
if (novaFotoInput) {
  novaFotoInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById('imagePreviewCadastro').src = event.target.result;
      document.getElementById('cropContainerCadastro').style.display = 'block';
      if (cropper) cropper.destroy();
      cropper = new Cropper(document.getElementById('imagePreviewCadastro'), {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.5
      });
    };
    reader.readAsDataURL(file);
  });
}

const cropButton = document.getElementById('cropButton');
if (cropButton) {
  cropButton.addEventListener('click', function () {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const base64Foto = canvas.toDataURL('image/png');
    atualizarFotoUsuario(base64Foto);
    // Salva foto no perfil Firestore se usuário logado
    const usuario = auth.currentUser;
    if (usuario) {
      setDoc(doc(db, "usuarios", usuario.uid), { foto: base64Foto }, { merge: true })
        .catch(e => console.error("Erro ao salvar foto no firestore:", e));
    } else {
      // salva localmente nos dados do sessionStorage antigo caso queira fallback
      const nome = sessionStorage.getItem("usuarioAtivo");
      if (nome) {
        const dados = JSON.parse(localStorage.getItem(`usuario_${nome}`) || "{}");
        dados.foto = base64Foto;
        localStorage.setItem(`usuario_${nome}`, JSON.stringify(dados));
      }
    }
    document.getElementById('cropContainer').style.display = 'none';
    Swal.fire('Foto atualizada com sucesso!');
  });
}

// Converter arquivo para base64 (utilitário)
function converterParaBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsDataURL(file);
}

// configurarCropper (mantido)
function configurarCropper(inputId, imageId, containerId, buttonId) {
  const inputFile = document.getElementById(inputId);
  const imagePreview = document.getElementById(imageId);
  const cropContainer = document.getElementById(containerId);
  const cropBtn = document.getElementById(buttonId);
  if (!inputFile || !imagePreview || !cropContainer || !cropBtn) return;

  inputFile.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      imagePreview.src = event.target.result;
      cropContainer.style.display = 'block';
      if (cropper) cropper.destroy();
      cropper = new Cropper(imagePreview, {
        aspectRatio: 1,
        viewMode: 1,
        autoCropArea: 0.3,
        movable: true,
        zoomable: true,
        scalable: true,
        cropBoxResizable: true,
        minCropBoxWidth: 150,
        minCropBoxHeight: 150
      });
    };
    reader.readAsDataURL(file);
  });

  cropBtn.addEventListener('click', function () {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const base64Foto = canvas.toDataURL('image/png');
    atualizarFotoUsuario(base64Foto);
    const usuario = auth.currentUser;
    if (usuario) {
      setDoc(doc(db, "usuarios", usuario.uid), { foto: base64Foto }, { merge: true })
        .catch(e => console.error("Erro ao salvar foto no firestore:", e));
    } else {
      const nome = sessionStorage.getItem("usuarioAtivo");
      if (nome) {
        const dados = JSON.parse(localStorage.getItem(`usuario_${nome}`) || "{}");
        dados.foto = base64Foto;
        localStorage.setItem(`usuario_${nome}`, JSON.stringify(dados));
      }
    }
    cropContainer.style.display = 'none';
    Swal.fire('Foto atualizada com sucesso!');
  });
}

configurarCropper('cadastroFoto', 'imagePreviewCadastro', 'cropContainerCadastro', 'cropButtonCadastro');
configurarCropper('novaFoto', 'imagePreviewAtualizar', 'cropContainerAtualizar', 'cropButtonAtualizar');

// ---------------------------
// Formulário de tarefas - submit listener (ajustado para chamar adicionarTarefaFirestore)
const formTarefa = document.getElementById("formTarefa");
if (formTarefa) {
  formTarefa.addEventListener("submit", async function (e) {
    e.preventDefault();
    const texto = document.getElementById("novaTarefa").value.trim();
    const categoria = document.getElementById("categoriaTarefa").value;
    const vencimento = document.getElementById("vencimentoTarefa").value;
    if (!texto) return;

    const tarefaObj = { texto, categoria, vencimento, concluida: false };
    await adicionarTarefaFirestore(tarefaObj);

    document.getElementById("novaTarefa").value = "";
    document.getElementById("categoriaTarefa").selectedIndex = 0;
    document.getElementById("vencimentoTarefa").value = "";
    document.getElementById("novaTarefa").focus();
  });
}

function atualizarContadores() {
  const pendentes = tarefas.filter(t => !t.concluida).length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const todas = tarefas.length;
  document.getElementById("contadorPendentes").textContent = `Pendentes: ${pendentes}`;
  document.getElementById("contadorConcluidas").textContent = `Concluídas: ${concluidas}`;
  document.getElementById("contadorTodas").textContent = `Todas: ${todas}`;
}

// Funções utilitárias (formatarDataBR, exportar, sons, etc.)
function formatarDataBR(dataISO) {
  if (!dataISO) return "Sem data";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

function tocarSomConcluida() {
  const audio = document.getElementById("audioConcluida");
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function tocarSomPendente() {
  const audio = document.getElementById("audioPendente");
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const docx = new jsPDF();
  docx.text("Minhas Tarefas", 10, 10);
  tarefas.forEach((t, i) => {
    docx.text(`${i + 1}. ${t.texto} [${t.categoria}] - Vence: ${t.vencimento || "Sem data"}`, 10, 20 + i * 10);
  });
  docx.save("tarefas.pdf");
  Swal.fire({ icon: 'success', title: 'PDF exportado!', text: 'Suas tarefas foram salvas com sucesso.', confirmButtonColor: '#3085d6' });
}

function exportarExcel() {
  const dados = tarefas.map(t => ({
    Tarefa: t.texto,
    Categoria: t.categoria,
    Vencimento: t.vencimento || "Sem data"
  }));
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tarefas");
  XLSX.writeFile(wb, "tarefas.xlsx");
  Swal.fire({ icon: 'success', title: 'Excel exportado!', text: 'Suas tarefas foram salvas com sucesso.', confirmButtonColor: '#3085d6' });
}

// gerarICS agora aceita id
function gerarICS(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa || !tarefa.vencimento) {
    Swal.fire("Esta tarefa não possui data de vencimento.");
    return;
  }
  const dt = tarefa.vencimento.replace(/-/g, "") + "T090000Z";
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${tarefa.texto}
DESCRIPTION:Categoria: ${tarefa.categoria}
DTSTART:${dt}
DTEND:${dt}
END:VEVENT
END:VCALENDAR`;
  const blob = new Blob([ics], { type: "text/calendar" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${tarefa.texto}.ics`;
  link.click();
}

// mostrarPopup adaptado (usa texto, categoria, vencimento) — mantido
function mostrarPopup(texto, categoria, vencimento) {
  Swal.fire({
    title: 'Definir Lembrete',
    html: `
      <p><strong>${texto}</strong></p>
      <p>Categoria: ${categoria}</p>
      <p>Vence: ${formatarDataBR(vencimento)}</p>
      <input type="datetime-local" id="lembreteData" class="swal2-input" placeholder="Escolha data e hora">
    `,
    showCancelButton: true,
    confirmButtonText: 'Salvar Lembrete',
    preConfirm: () => {
      const dataLembrete = document.getElementById('lembreteData').value;
      if (!dataLembrete) {
        Swal.showValidationMessage('Por favor, escolha uma data e hora!');
        return false;
      }
      return dataLembrete;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const dataLembrete = new Date(result.value);
      agendarNotificacao(texto, dataLembrete);
      Swal.fire('Lembrete definido!', '', 'success');
    }
  });
}

// wrapper para aceitar id -> abrir popup
function mostrarPopupId(id) {
  const t = tarefas.find(x => x.id === id);
  if (!t) return Swal.fire("Tarefa não encontrada");
  mostrarPopup(t.texto, t.categoria, t.vencimento);
}
window.mostrarPopupId = mostrarPopupId;

// notificações e agendarNotificacao mantidos
function agendarNotificacao(texto, dataLembrete) {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  const agora = new Date();
  const tempoRestante = dataLembrete.getTime() - agora.getTime();
  if (tempoRestante <= 0) {
    Swal.fire('A data escolhida já passou!', '', 'error');
    return;
  }
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('Lembrete de Tarefa', {
        body: `Está na hora: ${texto}`,
        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827272.png'
      });
    } else {
      alert(`Lembrete: ${texto}`);
    }
  }, tempoRestante);
}


// Dark mode toggle (mantido)
const toggleBtn = document.getElementById('toggleDarkMode');
const iconDarkMode = document.getElementById('iconDarkMode');
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    document.querySelectorAll('.card').forEach(card => card.classList.toggle('dark-card'));
    if (iconDarkMode.classList.contains('bi-moon-fill')) {
      iconDarkMode.classList.replace('bi-moon-fill', 'bi-sun-fill');
      iconDarkMode.style.color = '#FFA500';
    } else {
      iconDarkMode.classList.replace('bi-sun-fill', 'bi-moon-fill');
      iconDarkMode.style.color = '#FFD700';
    }
    const isDark = document.querySelector('.card')?.classList.contains('dark-card');
    localStorage.setItem('temaCards', isDark ? 'dark' : 'light');
  });
  if (localStorage.getItem('temaCards') === 'dark') {
    document.querySelectorAll('.card').forEach(card => card.classList.add('dark-card'));
    if (iconDarkMode) {
      iconDarkMode.classList.replace('bi-moon-fill', 'bi-sun-fill');
      iconDarkMode.style.color = '#FFA500';
    }
  }
}

// PIN helpers (mantidos)
function avaliarForcaPIN(pin) {
  if (pin.length < 6) return 'Fraco';
  if (pin.length <= 10) return 'Médio';
  return 'Forte';
}

function verificarPINExistente(pin) {
  const pinsExistentes = ["", "", ""];
  return pinsExistentes.includes(pin);
}

document.addEventListener('DOMContentLoaded', function () {
  const cadastro = document.getElementById('cadastroPin');
  const atualizar = document.getElementById('novoPin');
  if (cadastro) cadastro.addEventListener('input', handlePinInput);
  if (atualizar) atualizar.addEventListener('input', handlePinInput);
});

// handlePinInput function (mantido do seu código)
function handlePinInput(event) {
  const input = event && event.target ? event.target : null;
  if (!input) return;
  const inputId = input.id;
  const barraId = inputId === 'cadastroPin' ? 'barraForcaPinCadastro' : 'barraForcaPinAtualizar';
  const textoId = inputId === 'cadastroPin' ? 'textoForcaPinCadastro' : 'textoForcaPinAtualizar';
  const pin = input.value || '';
  const barra = document.getElementById(barraId);
  const texto = document.getElementById(textoId);
  if (!barra || !texto) return;
  if (pin.length === 0) {
    barra.style.width = "0%";
    barra.style.backgroundColor = "#ddd";
    texto.textContent = "";
    texto.style.color = "#000";
    return;
  }
  let forca = 0;
  if (pin.length >= 6) forca++;
  if (pin.length >= 10) forca++;
  if (/[A-Z]/.test(pin)) forca++;
  if (/[0-9]/.test(pin)) forca++;
  if (/[^A-Za-z0-9]/.test(pin)) forca++;
  barra.style.width = (forca / 5) * 100 + "%";
  if (forca <= 2) {
    barra.style.backgroundColor = "#f44336";
    texto.textContent = "Força do PIN: Fraco";
    texto.style.color = "#f44336";
  } else if (forca === 3) {
    barra.style.backgroundColor = "#ff9800";
    texto.textContent = "Força do PIN: Médio";
    texto.style.color = "#ff9800";
  } else {
    barra.style.backgroundColor = "#4caf50";
    texto.textContent = "Força do PIN: Forte";
    texto.style.color = "#4caf50";
  }
}

// Funções antigas removidas/sincronizadas foram substituídas pelas novas implementações Firestore/Auth

// ---------------------------
// Fim do script.js (integração completa com Firebase)
// ---------------------------


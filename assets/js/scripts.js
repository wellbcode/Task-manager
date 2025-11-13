let tarefas = [];
let usuarioAtual = null;
 
/* === Inicialização Carregar dados ao abrir a página === */
window.addEventListener("load", () => {
  const chave = sessionStorage.getItem("usuarioAtivo");
  if (!chave) {
    document.getElementById("conteudoPrincipal").style.display = "none";
    return;
  }

  usuarioAtual = chave; // ✅ Corrigido
  const dados = JSON.parse(localStorage.getItem(`usuario_${chave}`));
  document.getElementById("conteudoPrincipal").style.display = "block";
  exibirMensagemUsuario(dados.usuario, dados.genero);
  atualizarFotoUsuario(dados.foto);
  carregarTarefas();
  renderizarTarefas("todas");
});

// Login
function salvarUsuario(nome, usuario, pin, genero, foto) {
  const dadosUsuario = { nome, usuario, pin, genero, foto };
  localStorage.setItem("usuario_" + usuario, JSON.stringify(dadosUsuario));
  Swal.fire("Cadastro realizado com sucesso!");
}

function loginUsuario() {
  const nomeUsuario = document.getElementById("loginUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const pin = document.getElementById("loginPin").value.trim();
  const dados = JSON.parse(localStorage.getItem("usuario_" + nomeUsuario));

  if (!dados || dados.pin !== pin) {
    Swal.fire("Nome de usuário ou PIN incorretos!");
    return;
  }

  sessionStorage.setItem("usuarioAtivo", nomeUsuario);
  document.getElementById("conteudoPrincipal").style.display = "block";
  exibirMensagemUsuario(dados.usuario, dados.genero);

  // Aqui sim atualiza a foto real
  atualizarFotoUsuario(dados.foto);

  document.getElementById("formularioLoginCadastro").style.display = "none";
}

// usuário sai
function logoutUsuario() {
  Swal.fire({
    title: "Deseja sair?",
    text: "Você poderá entrar novamente a qualquer momento.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sim, sair",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#aaa"
  }).then((result) => {
    if (result.isConfirmed) {
      // Remove usuário ativo da sessão
      sessionStorage.removeItem("usuarioAtivo");

      // Mensagem de saída amigável
      Swal.fire({
        title: "Te vejo mais tarde então! 😴",
        text: "Bom descanso e até breve :)",
        icon: "success",
        timer: 1800,
        showConfirmButton: false
      }).then(() => {
        // Recarrega a página após o alerta
        location.reload();
      });
    }
  });
}


// Função para cadastrar usuário
function cadastrarUsuario() {
  const nomeCompleto = document.getElementById("cadastroNome").value.trim();
  const usuario = document.getElementById("cadastroUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const pin = document.getElementById("cadastroPin").value.trim();
  const genero = document.getElementById("cadastroGenero").value;
  const fotoInput = document.getElementById("cadastroFoto");

  if (!nomeCompleto || !usuario || !pin) {
    Swal.fire("Preencha todos os campos!");
    return;
  }

  if (fotoInput.files.length > 0) {
    converterParaBase64(fotoInput.files[0], function(base64Foto) {
      salvarUsuario(nomeCompleto, usuario, pin, genero, base64Foto);
    });
  } else {
    salvarUsuario(nomeCompleto, usuario, pin, genero, "");
  }
}

function limparFormularioCadastro() {
  document.getElementById("cadastroNome").value = "";
  document.getElementById("cadastroUsuario").value = "";
  document.getElementById("cadastroPin").value = "";
  document.getElementById("cadastroGenero").selectedIndex = 0;
  document.getElementById("cadastroFoto").value = "";

  // Volta imagem padrão no header
  const fotoHeader = document.querySelector(".foto-usuario");
  if (fotoHeader) {
    fotoHeader.src = "assets/img/default.jpg";
  }

  // Oculta recorta e esconde formulário
  document.getElementById("cropContainer").style.display = "none";
  document.getElementById("formularioLoginCadastro").style.display = "none";
}

function salvarUsuario(nomeCompleto, usuario, pin, genero, foto) {
  const dadosUsuario = { nomeCompleto, usuario, pin, genero, foto };
  localStorage.setItem("usuario_" + usuario, JSON.stringify(dadosUsuario));
  Swal.fire("Cadastro realizado com sucesso!");
  limparFormularioCadastro(); // ✅ limpa e oculta
}

/* === visualizar pin cadeado aberto === */
function alternarVisibilidadePIN(idCampo, botao) {
  const campo = document.getElementById(idCampo);
  const icone = botao.querySelector("i");
 
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

function exibirMensagemUsuario(usuario, genero) {
  let saudacao = "Olá";
  if (genero === "masculino") saudacao = "Bem-vindo";
  if (genero === "feminino") saudacao = "Bem-vinda";
  if (genero === "masculino") saud = "Seu lindo";
  if (genero === "feminino") saud = "Sua linda";

  const mensagem = `${saudacao}, ${usuario.charAt(0).toUpperCase() + usuario.slice(1)}, ${saud}! Vamos realizar as tarefas de hoje?`;
  const elemento = document.getElementById("mensagemUsuario");
  elemento.textContent = mensagem;

  // Ajusta cor conforme horário
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) {
    elemento.style.color = "#ffeb3b"; // amarelo (manhã)
  } else if (hora >= 12 && hora < 18) {
    elemento.style.color = "#ff9800"; // laranja (tarde)
  } else {
    elemento.style.color = "#03a9f4"; // azul (noite)
  }
}
/* Atualizar foto
 function atualizarFotoUsuario(fotoBase64) {
  document.querySelector(".foto-usuario").src = fotoBase64 || "assets/pic/default.jpg";
}*/

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
        //autoCropArea: 1  <-- aqui está o problema,significa 100% da imagem como área inicial.
        autoCropArea: 0.5 // 50% da imagem
      });
    };
    reader.readAsDataURL(file);
  });
}

function atualizarFotoUsuario(fotoBase64) {
  const imgPerfil = document.querySelector(".foto-usuario"); // ou use #fotoPerfil se preferir id
  if (imgPerfil) {
    imgPerfil.src = fotoBase64 || "assets/img/default.jpg";
  }
}

const cropButton = document.getElementById('cropButton');
if (cropButton) {
  cropButton.addEventListener('click', function () {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const base64Foto = canvas.toDataURL('image/png');

    atualizarFotoUsuario(base64Foto);

    // Se estiver atualizando perfil
    const usuario = sessionStorage.getItem("usuarioAtivo");
    if (usuario) {
      const dados = JSON.parse(localStorage.getItem(`usuario_${usuario}`));
      dados.foto = base64Foto;
      localStorage.setItem(`usuario_${usuario}`, JSON.stringify(dados));
    }

    document.getElementById('cropContainer').style.display = 'none';
    Swal.fire('Foto atualizada com sucesso!');
     //limparFormularioCadastro(); // ✅ limpa e oculta
  });
}

// Converter imagem para Base64
function converterParaBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    callback(e.target.result);
  };
  reader.readAsDataURL(file);
}

// let cropper;

// document.getElementById('cadastroFoto').addEventListener('change', function (e) {
//   const file = e.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.onload = function (event) {
//     document.getElementById('imagePreview').src = event.target.result;
//     document.getElementById('cropContainer').style.display = 'block';

//     if (cropper) cropper.destroy(); // remove cropper anterior
//     //cropper = new Cropper(document.getElementById('imagePreview'), {
//       //aspectRatio: 1, // quadrado para foto de perfil
//       //viewMode: 1,
//       //autoCropArea: 1
//     //});
    
//     cropper = new Cropper(document.getElementById('imagePreview'), {
//       aspectRatio: 1,             // mantém formato quadrado
//       viewMode: 0,                // permite ver a imagem completa sem restrição
//       autoCropArea: 0.3,          // área inicial menor (30%)
//       movable: true,              // permite mover a área
//       zoomable: true,             // permite zoom na imagem
//       scalable: true,             // permite redimensionar
//       cropBoxResizable: true,     // permite ajustar tamanho do recorte
//       minCropBoxWidth: 150,
//       minCropBoxHeight: 150
//     });
//   };
//   reader.readAsDataURL(file);
// });

// document.getElementById('cropButton').addEventListener('click', function () {
//   const canvas = cropper.getCroppedCanvas({
//     width: 500,
//     height: 500,
//   });

//   const base64Foto = canvas.toDataURL('image/png');

//   // Atualiza preview do perfil
//   atualizarFotoUsuario(base64Foto);

//   // Salva no localStorage junto com os dados do usuário
//   const usuario = sessionStorage.getItem("usuarioAtivo");
//   if (usuario) {
//     const dados = JSON.parse(localStorage.getItem(`usuario_${usuario}`));
//     dados.foto = base64Foto;
//     localStorage.setItem(`usuario_${usuario}`, JSON.stringify(dados));
//   }

//   document.getElementById('cropContainer').style.display = 'none';
//   Swal.fire('Foto atualizada com sucesso!');
// });

let cropper;

function configurarCropper(inputId, imageId, containerId, buttonId) {
  const inputFile = document.getElementById(inputId);
  const imagePreview = document.getElementById(imageId);
  const cropContainer = document.getElementById(containerId);
  const cropButton = document.getElementById(buttonId);

  if (!inputFile || !imagePreview || !cropContainer || !cropButton) return;

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

  cropButton.addEventListener('click', function () {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
    const base64Foto = canvas.toDataURL('image/png');

    atualizarFotoUsuario(base64Foto);

    const usuario = sessionStorage.getItem("usuarioAtivo");
    if (usuario) {
      const dados = JSON.parse(localStorage.getItem(`usuario_${usuario}`));
      dados.foto = base64Foto;
      localStorage.setItem(`usuario_${usuario}`, JSON.stringify(dados));
    }

    cropContainer.style.display = 'none';
    Swal.fire('Foto atualizada com sucesso!');
  });
}

configurarCropper('cadastroFoto', 'imagePreviewCadastro', 'cropContainerCadastro', 'cropButtonCadastro');
configurarCropper('novaFoto', 'imagePreviewAtualizar', 'cropContainerAtualizar', 'cropButtonAtualizar');


// Atualizar perfil
// function atualizarPerfil() {
//   const usuarioAtivo = sessionStorage.getItem("usuarioAtivo");
//   const dadosUsuario = JSON.parse(localStorage.getItem("usuario_" + usuarioAtivo));
//   if (!dadosUsuario) return;

//   const novoNomeCompleto = document.getElementById("novoNomeCompleto").value.trim();
//   const novoUsuario = document.getElementById("novoNomeUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
//   const novoPin = document.getElementById("novoPin").value.trim();
//   const novoGenero = document.getElementById("novoGenero").value;
//   const novaFotoInput = document.getElementById("novaFoto");

//   dadosUsuario.nomeCompleto = novoNomeCompleto || dadosUsuario.nomeCompleto;
//   dadosUsuario.usuario = novoUsuario || dadosUsuario.usuario;
//   dadosUsuario.pin = novoPin || dadosUsuario.pin;
//   dadosUsuario.genero = novoGenero || dadosUsuario.genero;

//   if (novaFotoInput.files.length > 0) {
//     converterParaBase64(novaFotoInput.files[0], function(base64Foto) {
//       dadosUsuario.foto = base64Foto;
//       salvarAtualizacao(dadosUsuario, usuarioAtivo);
//     });
//   } else {
//     salvarAtualizacao(dadosUsuario, usuarioAtivo);
//   }
//    // Oculta recorta e esconde formulário
//   document.getElementById("cropContainer").style.display = "none";
//   document.getElementById("formAtualizarPerfil").style.display = "none";
// }

function atualizarPerfil() {
  const usuarioAtivo = sessionStorage.getItem("usuarioAtivo");
  const dadosUsuario = JSON.parse(localStorage.getItem("usuario_" + usuarioAtivo));
  if (!dadosUsuario) return;

  const novoNomeCompleto = document.getElementById("novoNomeCompleto").value.trim();
  const novoUsuario = document.getElementById("novoNomeUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const novoPin = document.getElementById("novoPin").value.trim();
  const novoGenero = document.getElementById("novoGenero").value;

  // Atualiza os dados
  dadosUsuario.nomeCompleto = novoNomeCompleto || dadosUsuario.nomeCompleto;
  dadosUsuario.usuario = novoUsuario || dadosUsuario.usuario;
  dadosUsuario.pin = novoPin || dadosUsuario.pin;
  dadosUsuario.genero = novoGenero || dadosUsuario.genero;

  // 🔹 Remove o antigo e salva com o novo nome de usuário
  localStorage.removeItem("usuario_" + usuarioAtivo);
  localStorage.setItem("usuario_" + dadosUsuario.usuario, JSON.stringify(dadosUsuario));

  // ✅ Mantém as tarefas antigas
  if (localStorage.getItem("tarefas_" + usuarioAtivo)) {
    const tarefas = localStorage.getItem("tarefas_" + usuarioAtivo);
    localStorage.setItem("tarefas_" + dadosUsuario.usuario, tarefas);
    localStorage.removeItem("tarefas_" + usuarioAtivo);
  }

  // ✅ Atualiza o sessionStorage
  sessionStorage.setItem("usuarioAtivo", dadosUsuario.usuario);

  // ✅ Oculta formulário e cropper
  document.getElementById("formAtualizarPerfil").style.display = "none";
  document.getElementById("cropContainerAtualizar").style.display = "none";

  Swal.fire("Perfil atualizado com sucesso!");
}


function abrirAtualizacaoPerfil() {
  document.getElementById("formAtualizarPerfil").style.display = "block";
  const usuarioAtivo = sessionStorage.getItem("usuarioAtivo");
  const dadosUsuario = JSON.parse(localStorage.getItem("usuario_" + usuarioAtivo));
  if (dadosUsuario && dadosUsuario.foto) {
    document.getElementById("fotoPerfil").src = dadosUsuario.foto;
  }
}


function salvarAtualizacao(dadosUsuario, usuarioAntigo) {
  localStorage.removeItem("usuario_" + usuarioAntigo);
  localStorage.setItem("usuario_" + dadosUsuario.usuario, JSON.stringify(dadosUsuario));
  sessionStorage.setItem("usuarioAtivo", dadosUsuario.usuario);

  Swal.fire("Perfil atualizado!");
  atualizarFotoUsuario(dadosUsuario.foto); // Atualiza DOM
}

function verificarEnterCadastro(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    cadastrarUsuario();
  }
}
 
function verificarEnterLogin(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    loginUsuario();
  }
}
 
/* === Helpers de storage === */
function chaveTarefasUsuario() {
  if (!usuarioAtual) return "tarefas_default";
  return `tarefas_${usuarioAtual}`;
}
 
function salvarTarefas() {
  localStorage.setItem(chaveTarefasUsuario(), JSON.stringify(tarefas));
}
 
function carregarTarefas() {
tarefas = JSON.parse(localStorage.getItem(chaveTarefasUsuario()) || "[]");
}

/* === Formulário de tarefas === */
document.getElementById("formTarefa").addEventListener("submit", function (e) {
  e.preventDefault();

  const texto = document.getElementById("novaTarefa").value.trim();
  const categoria = document.getElementById("categoriaTarefa").value;
  const vencimento = document.getElementById("vencimentoTarefa").value;

  if (texto === "") return;

  tarefas.push({ texto, categoria, vencimento, concluida: false });
  salvarTarefas();
  renderizarTarefas("todas");

  // ✅ Limpa manualmente para evitar repopulação
  document.getElementById("novaTarefa").value = "";
  document.getElementById("categoriaTarefa").selectedIndex = 0;
  document.getElementById("vencimentoTarefa").value = "";
  document.getElementById("novaTarefa").focus();
});
 
/* === Renderizar tarefas === */function loginUsuario() {
  const nomeUsuario = document.getElementById("loginUsuario").value.trim().toLowerCase().replace(/\s+/g, "");
  const pin = document.getElementById("loginPin").value.trim();
  const dados = JSON.parse(localStorage.getItem("usuario_" + nomeUsuario));

  if (!dados || dados.pin !== pin) {
    Swal.fire("Nome de usuário ou PIN incorretos!");
    return;
  }

  sessionStorage.setItem("usuarioAtivo", nomeUsuario);
  usuarioAtual = nomeUsuario; // ✅ Corrigido
  document.getElementById("conteudoPrincipal").style.display = "block";
  exibirMensagemUsuario(dados.usuario, dados.genero);
  atualizarFotoUsuario(dados.foto);
  document.getElementById("formularioLoginCadastro").style.display = "none";

  carregarTarefas(); // ✅ Carrega tarefas do usuário
  renderizarTarefas("todas");
}

function renderizarTarefas(filtro) {
  const lista = document.getElementById("listaTarefas");
  lista.innerHTML = "";
 
  const filtradas = tarefas.filter(t => {
    if (filtro === "pendentes") return !t.concluida;
    if (filtro === "concluidas") return t.concluida;
    return true;
  });
 
  /* === Funções botões das tarefas === */
  filtradas.forEach(t => {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex justify-content-between align-items-center fade-in tarefa-concluida ${t.concluida ? "bg-success" : "bg-danger"} text-white`;
    li.innerHTML = `
      <div>
        <strong>${t.texto}</strong><br>
        <small>Categoria: ${t.categoria} | Vence: ${formatarDataBR(t.vencimento)}</small>
      </div>
      <div>
        <button class="btn btn-success btn-sm me-2" title="Concluir tarefa" onclick="marcarConcluida('${t.texto}')">
          <i class="bi bi-check-circle-fill"></i>
        </button>
        <button class="btn btn-info btn-sm me-2" title="Adicionar ao calendário" onclick="gerarICS('${t.texto}')">
          <i class="bi bi-calendar-event"></i>
        </button>
        <button class="btn btn-warning btn-sm me-2" title="Definir lembrete" onclick="mostrarPopup('${t.texto}', '${t.categoria}', '${t.vencimento}')">
          <i class="bi bi-bell-fill"></i>
        </button>
        <button class="btn btn-danger btn-sm" title="Excluir tarefa" onclick="removerTarefa('${t.texto}')">
          <i class="bi bi-trash-fill"></i>
        </button>
      </div>
    `;
    lista.appendChild(li);
  });
 
  atualizarContadores();
}
 
/* === Funções botões de son das tarefas, marcar concluída/pendentes  === */
function marcarConcluida(texto) {
  const index = tarefas.findIndex(t => t.texto === texto);
  if (index !== -1) {
    tarefas[index].concluida = !tarefas[index].concluida;
    salvarTarefas();
    renderizarTarefas("todas");
    tarefas[index].concluida ? tocarSomConcluida() : tocarSomPendente();
  }
}
 
function removerTarefa(texto) {
  tarefas = tarefas.filter(t => t.texto !== texto);
  salvarTarefas();
  renderizarTarefas("todas");
}
 
function filtrarTarefas(tipo) {
  renderizarTarefas(tipo);
}

function filtrarTarefas(filtro, botaoClicado) {
  // Chama a função que realmente filtra e renderiza
  renderizarTarefas(filtro);

  // Remove a classe ativa de todos os botões
  document.querySelectorAll(".filtro-btn").forEach(btn => {
    btn.classList.remove("active");
  });

  // Adiciona a classe ativa no botão clicado
  botaoClicado.classList.add("active");
}
 
function limparTarefas() {
  if (confirm("Tem certeza que deseja limpar todas as tarefas?")) {
    tarefas = [];
    localStorage.removeItem(chaveTarefasUsuario());
    renderizarTarefas("todas");
    atualizarContadores();
  }
}
 
function atualizarContadores() {
  const pendentes = tarefas.filter(t => !t.concluida).length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const todas = tarefas.length;
  document.getElementById("contadorPendentes").textContent = `Pendentes: ${pendentes}`;
  document.getElementById("contadorConcluidas").textContent = `Concluídas: ${concluidas}`;
   document.getElementById("contadorTodas").textContent = `Todas: ${todas}`;
}
 
/* === Sons === */
function tocarSomConcluida() {
  const audio = document.getElementById("audioConcluida");
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
 
function tocarSomPendente() {
  const audio = document.getElementById("audioPendente");
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
 
/* === Exportar PDF === */
function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Minhas Tarefas", 10, 10);
  tarefas.forEach((t, i) => {
    doc.text(`${i + 1}. ${t.texto} [${t.categoria}] - Vence: ${t.vencimento || "Sem data"}`, 10, 20 + i * 10);
  });
  doc.save("tarefas.pdf");
  //alert("PDF exportado com sucesso!");
   Swal.fire({
    icon: 'success',
    title: 'PDF exportado!',
    text: 'Suas tarefas foram salvas com sucesso.',
    confirmButtonColor: '#3085d6'
  });
}
 
/* === Exportar EXCEL === */
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
  //alert("Excel exportado com sucesso!");
    Swal.fire({
    icon: 'success',
    title: 'Excel exportado!',
    text: 'Suas tarefas foram salvas com sucesso.',
    confirmButtonColor: '#3085d6'
  });
}
 
function gerarICS(texto) {
  const tarefa = tarefas.find(t => t.texto === texto);
  if (!tarefa || !tarefa.vencimento) {
    alert("Esta tarefa não possui data de vencimento.");
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

/*== Função que mostra o lembrete ao entrar e saír ==*/
 function mostrarPopupLembrete() {
  const hoje = new Date().toISOString().slice(0, 10);
  // const bloqueio = localStorage.getItem("lembreteBloqueado");
  // if (bloqueio === hoje) return; // Se já bloqueou hoje, não mostra, se quiser mostrar o lembrete de novo após o bloqueio comente ou descomente essa linha de códiogo

  const hora = new Date().getHours();
  let saudacao = "";

  if (hora >= 5 && hora < 12) {
    saudacao = "Bom diaaaaaaaaaaaa. Lindo(a)!😄😍";
  } else if (hora >= 12 && hora < 18) {
    saudacao = "Boa tardeeeeeeee. Lindo(a)! ☀️";
  } else {
    saudacao = "Boa noite. Lindo(a)! 🌙";
  }

  Swal.fire({
    title: 'Lembrete do Dia',
    html: `<strong>${saudacao}</strong><br>Não se esqueça de revisar sua lista de tarefas diárias. ✅`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ok!',
    cancelButtonText: 'Não lembrar novamente hoje',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa'
  }).then((resultado) => {
    if (resultado.dismiss === Swal.DismissReason.cancel) {
      localStorage.setItem("lembreteBloqueado", hoje);
    }
  });
}

mostrarPopupLembrete();

// Ou chamada periódica (opcional)
setInterval(mostrarPopupLembrete, 30 * 60 * 1000); // a cada 30 minutos
 
function fecharPopup() {
  document.getElementById("popupLembrete").style.display = "none";
}

function sairUsuario() {
  const lembrete = "✨ Antes de sair, lembre-se de verificar suas tarefas!";
  Swal.fire({
    title: "Deseja sair?",
    text: lembrete,
    icon: "info",
    showCancelButton: true,
    confirmButtonText: "Sair mesmo assim",
    cancelButtonText: "Cancelar"
  }).then((result) => {
    if (result.isConfirmed) {
      sessionStorage.removeItem("usuarioAtivo");
      document.getElementById("conteudoPrincipal").style.display = "none";
      document.getElementById("formularioLoginCadastro").style.display = "block";
      Swal.fire("Você saiu com sucesso!");
    }
  });
}


function formatarDataBR(dataISO) {
  if (!dataISO) return "Sem data";
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}

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
 
function agendarNotificacao(texto, dataLembrete) {
  // Solicitar permissão para notificações
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
        icon: 'https://cdn-icons-png.flaticon.com/512/1827/1827272.png' // ícone opcional
      });
    } else {
      alert(`Lembrete: ${texto}`);
    }
  }, tempoRestante);
}

/*=== Funçao que manipula o botão "alterar perfil"=== */
function alterarUsuario() {
  //alert("Troca de perfil desativada. Faça logout e login com outro usuário.");
   //alert("Troca de perfil desativada!");
   Swal.fire({
    icon: 'warning',
    title: 'Troca de perfil desativada!',
    text: 'Faça logout e login com outro usuário.',
    confirmButtonColor: '#3085d6'
  });
}
 
function alternarFormulario() {
 const form = document.getElementById("formularioLoginCadastro");
 form.style.display = form.style.display === "none" ? "flex" : "none";
}

function abrirAtualizacaoPerfil() {
  const form = document.getElementById("formAtualizarPerfil");
  if (!form) {
    console.error("Elemento #formAtualizarPerfil não encontrado!");
    return;
  }

  if (form.style.display === "none" || form.style.display === "") {
    form.style.display = "flex";
    form.style.flexDirection = "column"; // <--- faz abrir em coluna
    form.style.gap = "10px"; // opcional: dá um espaçamento entre os campos
  } else {
    form.style.display = "none";
  }
}


document.getElementById("loginUsuario").addEventListener("keydown", verificarEnterLogin);
document.getElementById("loginPin").addEventListener("keydown", verificarEnterLogin);
document.getElementById("cadastroNome").addEventListener("keydown", verificarEnterCadastro);
document.getElementById("cadastroUsuario").addEventListener("keydown", verificarEnterCadastro);
document.getElementById("cadastroPin").addEventListener("keydown", verificarEnterCadastro);
document.getElementById("cadastroFoto").addEventListener("keydown", verificarEnterCadastro);

/*=== Botão modo escuro=== */
const toggleBtn = document.getElementById('toggleDarkMode');
const iconDarkMode = document.getElementById('iconDarkMode');

toggleBtn.addEventListener('click', () => {
  document.querySelectorAll('.card').forEach(card => {
    card.classList.toggle('dark-card');
  });

  // Alterna ícone e cor
  if (iconDarkMode.classList.contains('bi-moon-fill')) {
    iconDarkMode.classList.replace('bi-moon-fill', 'bi-sun-fill');
    iconDarkMode.style.color = '#FFA500'; // sol laranja
  } else {
    iconDarkMode.classList.replace('bi-sun-fill', 'bi-moon-fill');
    iconDarkMode.style.color = '#FFD700'; // lua dourada
  }

  // Salvar preferência
  const isDark = document.querySelector('.card').classList.contains('dark-card');
  localStorage.setItem('temaCards', isDark ? 'dark' : 'light');
});

// Carregar preferência
if (localStorage.getItem('temaCards') === 'dark') {
  document.querySelectorAll('.card').forEach(card => card.classList.add('dark-card'));
  iconDarkMode.classList.replace('bi-moon-fill', 'bi-sun-fill');
  iconDarkMode.style.color = '#FFA500';
}

//pin senha
function avaliarForcaPIN(pin) {
  if (pin.length < 6) return 'Fraco';
  if (pin.length <= 10) return 'Médio';
  return 'Forte';
}

function verificarPINExistente(pin) {
  const pinsExistentes = ["", "", ""];
  return pinsExistentes.includes(pin);
}

document.getElementById('cadastroPin').addEventListener('input', function () {
  const pin = this.value.trim();
  const avisoDiv = document.getElementById('avisoPinCadastro');
  const forcaDiv = document.getElementById('forcaPinCadastro');

  if (pin.length === 0) {
    avisoDiv.textContent = "";
    forcaDiv.textContent = "";
    return;
  }

  if (verificarPINExistente(pin)) {
    avisoDiv.textContent = 'Este PIN já está em uso, escolha outro.';
    forcaDiv.textContent = '';
  } else {
    avisoDiv.textContent = '';
    forcaDiv.textContent = `Força do PIN: ${avaliarForcaPIN(pin)}`;
  }
});

document.getElementById('novoPin').addEventListener('input', function () {
  const pin = this.value.trim();
  const avisoDiv = document.getElementById('avisoPinRepetido');
  const forcaDiv = document.getElementById('forcaPinAtualizacao');

  if (pin.length === 0) {
    avisoDiv.textContent = "";
    forcaDiv.textContent = "";
    return;
  }

  if (verificarPINExistente(pin)) {
    avisoDiv.textContent = 'Este PIN já está em uso, escolha outro.';
    forcaDiv.textContent = '';
  } else {
    avisoDiv.textContent = '';
    forcaDiv.textContent = `Força do PIN: ${avaliarForcaPIN(pin)}`;
  }
});

//barra colorida
// função genérica que detecta qual input chamou o evento
function handlePinInput(event) {
  const input = event && event.target ? event.target : null;
  if (!input) return;

  const inputId = input.id; // 'cadastroPin' ou 'novoPin'
  // decide IDs da barra/texto conforme input
  const barraId = inputId === 'cadastroPin' ? 'barraForcaPinCadastro' : 'barraForcaPinAtualizar';
  const textoId = inputId === 'cadastroPin' ? 'textoForcaPinCadastro' : 'textoForcaPinAtualizar';

  const pin = input.value || '';
  const barra = document.getElementById(barraId);
  const texto = document.getElementById(textoId);

  if (!barra || !texto) return; // sem elemento, sai silenciosamente

    // ✅ Se o campo estiver vazio, limpa tudo e sai
  if (pin.length === 0) {
    barra.style.width = "0%";
    barra.style.backgroundColor = "#ddd"; // cor neutra
    texto.textContent = "";
    texto.style.color = "#000"; // cor padrão
    return;
  }

  // calcula força
  let forca = 0;
  if (pin.length >= 6) forca++;
  if (pin.length >= 10) forca++;
  if (/[A-Z]/.test(pin)) forca++;
  if (/[0-9]/.test(pin)) forca++;
  if (/[^A-Za-z0-9]/.test(pin)) forca++;

  // atualiza barra
  barra.style.width = (forca / 5) * 100 + "%";

  // cores e texto
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

// adiciona listeners quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function () {
  const cadastro = document.getElementById('cadastroPin');
  const atualizar = document.getElementById('novoPin');

  if (cadastro) cadastro.addEventListener('input', handlePinInput);
  if (atualizar) atualizar.addEventListener('input', handlePinInput);
});




const CHAVE_ESTADO = "cozinha_estado";
const CHAVE_NOTAS = "cozinha_anotacoes";

const PISTAS_CATALOGO = [
  {
    id: "bilhete_despensa",
    cenario: "Cenário 1 · A Despensa Trancada",
    titulo: "Bilhete rasgado na parede",
    texto:
      "Meia xícara de farinha (1 xícara = 120 g) + 176 °F em °C (°C = (°F − 32) ÷ 1,8). As duas respostas juntas formam a senha da porta.",
    desbloqueada: (e) => e.pistas?.includes("bilhete") || e.portaAberta,
  },
  {
    id: "diario_chef_12",
    cenario: "Cenário 1 · A Despensa Trancada",
    titulo: "Diário do Chef · Página 12 (Caixote)",
    texto:
      "Nos potes trancados, a ordem é do mais suave ao mais forte: Baunilha < Canela < Anis < Pimenta.",
    desbloqueada: (e) => e.pistas?.includes("caixote") || e.potesAbertos,
  },
  {
    id: "mapa_restaurante",
    cenario: "Cenário 1 · A Despensa Trancada",
    titulo: "Mapa do Restaurante",
    texto:
      "Planta das 5 áreas: 1. Despensa → 2. Confeitaria e Fornos → 3. Câmara Fria → 4. Escritório do Chef → 5. Pista Principal.",
    desbloqueada: (e) => e.mapaPego,
  },
  {
    id: "chave_confeiteiro",
    cenario: "Cenário 1 · A Despensa Trancada",
    titulo: "Chave de Fenda de Confeiteiro",
    texto:
      "Encontrada escondida dentro dos sacos de farinha. Serve para abrir o painel do termostato na Câmara Fria.",
    desbloqueada: (e) => e.chavePega,
  },
  {
    id: "extrato_baunilha",
    cenario: "Cenário 1 · A Despensa Trancada",
    titulo: "Extrato de Baunilha Rara",
    texto:
      "Destravado nos potes de especiarias. Ingrediente essencial para alcançar a nota máxima na Bancada Final.",
    desbloqueada: (e) => e.potesAbertos,
  },
  {
    id: "ponto_calda",
    cenario: "Cenário 2 · Confeitaria e Fornos",
    titulo: "Ponto de Bola Mole da Calda",
    texto:
      "A calda de açúcar atinge o ponto exato de bola mole a 118 °C.",
    desbloqueada: (e) => e.caldaPronta,
  },
];

function carregarEstado() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)) || {};
  } catch (e) {
    return {};
  }
}

const estado = carregarEstado();

const params = new URLSearchParams(window.location.search);
const origem = params.get("de");
const btnVoltarJogo = document.getElementById("btn-voltar-jogo");
if (origem) {
  btnVoltarJogo.hidden = false;
  btnVoltarJogo.addEventListener("click", () => {
    window.location.href = origem;
  });
}

document.getElementById("stat-itens").textContent = Array.isArray(
  estado.inventario
)
  ? estado.inventario.length
  : 0;
document.getElementById("stat-acertos").textContent = estado.acertos || 0;
document.getElementById("stat-erros").textContent = estado.erros || 0;

const lista = document.getElementById("lista-pistas");
PISTAS_CATALOGO.forEach((pista) => {
  const achou = Boolean(pista.desbloqueada(estado));
  const card = document.createElement("article");
  card.className = "pista-card " + (achou ? "descoberta" : "bloqueada");
  card.innerHTML = `
    <div class="pista-topo">
      <span class="pista-cenario">${pista.cenario}</span>
      <span class="pista-badge">${achou ? "✓ Registrada" : "🔒 Não encontrada"}</span>
    </div>
    <h3>${achou ? pista.titulo : "Pista ainda não descoberta"}</h3>
    <p>${
      achou
        ? pista.texto
        : "Explore os cenários e examine bilhetes, gavetas e objetos para registrar esta pista no diário."
    }</p>
  `;
  lista.appendChild(card);
});

const campoNotas = document.getElementById("notas-jogador");
const statusSalvo = document.getElementById("status-salvo");
campoNotas.value = localStorage.getItem(CHAVE_NOTAS) || "";

campoNotas.addEventListener("input", () => {
  localStorage.setItem(CHAVE_NOTAS, campoNotas.value);
  statusSalvo.textContent = "Salvo agora ✓";
});

document
  .getElementById("btn-limpar-notas")
  .addEventListener("click", () => {
    campoNotas.value = "";
    localStorage.removeItem(CHAVE_NOTAS);
    statusSalvo.textContent = "Anotações limpas.";
  });
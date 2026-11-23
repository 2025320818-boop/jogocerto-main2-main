const CHAVE_ESTADO = 'cozinha_estado';
const DURACAO = 15 * 60;
const SENHA_PORTA = '6080';
const ORDEM_POTES = [1, 3, 2, 0];
const SIMBOLOS = [
  { e: '🌶️', n: 'Pimenta' },
  { e: '🌼', n: 'Baunilha' },
  { e: '⭐', n: 'Anis' },
  { e: '🪵', n: 'Canela' }
];
const ITENS = {
  chave:    { nome: 'Chave de Fenda de Confeiteiro', icone: '🪛', desc: 'Vai servir para abrir um painel na Câmara Fria.' },
  mapa:     { nome: 'Mapa do Restaurante', icone: '🗺️', desc: 'Mostra o caminho entre as cozinhas. Clique de novo para abrir.' },
  baunilha: { nome: 'Extrato de Baunilha Rara', icone: '🌿', desc: 'Ingrediente obrigatório para a nota máxima no prato final.' }
};

function carregarEstado() {
  try { return JSON.parse(sessionStorage.getItem(CHAVE_ESTADO)); } catch (e) { return null; }
}
let estado = carregarEstado() || {
  fim: Date.now() + DURACAO * 1000,
  inventario: [],
  pistas: [],
  erros: 0,
  acertos: 0,
  chavePega: false,
  mapaPego: false,
  potesAbertos: false,
  portaAberta: false
};
if (!Array.isArray(estado.pistas)) estado.pistas = [];

function salvar() {
  try { sessionStorage.setItem(CHAVE_ESTADO, JSON.stringify(estado)); } catch (e) {}
}
salvar();

function $(s) { return document.querySelector(s); }
const overlay = $('#modal-overlay');
const modalTitulo = $('#modal-titulo');
const modalCorpo = $('#modal-corpo');
let travado = false;
let selecionado = null;

function fala(texto) { $('#mensagem').innerText = texto; }

function registrarPista(idPista) {
  if (!Array.isArray(estado.pistas)) estado.pistas = [];
  if (!estado.pistas.includes(idPista)) {
    estado.pistas.push(idPista);
    salvar();
  }
}

function abrirModal(titulo, html) {
  modalTitulo.innerText = titulo;
  modalCorpo.innerHTML = html;
  overlay.hidden = false;
}
function fecharModal() {
  if (travado) return;
  overlay.hidden = true;
  modalCorpo.innerHTML = '';
}
$('#modal-fechar').onclick = fecharModal;
overlay.onclick = function(e) { if (e.target === overlay) fecharModal(); };
document.onkeydown = function(e) { if (e.key === 'Escape') fecharModal(); };

function renderInventario() {
  const barra = $('#inventory-bar');
  let html = '';
  for (let i = 0; i < 6; i++) {
    const id = estado.inventario[i];
    if (id && ITENS[id]) {
      const cls = 'slot cheio' + (selecionado === id ? ' ativo' : '');
      html += `<button type="button" class="${cls}" data-item="${id}" title="${ITENS[id].nome}" aria-label="${ITENS[id].nome}">${ITENS[id].icone}</button>`;
    } else {
      html += `<div class="slot"></div>`;
    }
  }
  barra.innerHTML = html;
  const botoes = barra.querySelectorAll('button[data-item]');
  for (let i = 0; i < botoes.length; i++) {
    botoes[i].onclick = function() {
      clicarItem(this.getAttribute('data-item'));
    };
  }
}
function addItem(id) {
  if (!estado.inventario.includes(id)) estado.inventario.push(id);
  salvar();
  renderInventario();
}
function clicarItem(id) {
  if (id === 'mapa') {
    selecionado = null;
    renderInventario();
    abrirMapa();
    return;
  }
  if (selecionado === id) {
    selecionado = null;
    fala('Item guardado.');
  } else {
    selecionado = id;
    fala(ITENS[id].nome + ': ' + ITENS[id].desc);
  }
  renderInventario();
}
function agir(alvo, fn) {
  if (selecionado) {
    fala(ITENS[selecionado].nome + ' não funciona em: ' + alvo + '. Clique no item de novo para guardá-lo.');
    return;
  }
  fn();
}
function ligar(id, alvo, fn) {
  $(id).onclick = function() { agir(alvo, fn); };
}

function abrirMapa() {
  abrirModal('Mapa do Restaurante', `
    <div class="mapa">
      <div class="sala atual">1 · Despensa<br>(você está aqui)</div>
      <div class="sala">2 · Confeitaria e Fornos</div>
      <div class="sala">3 · Câmara Fria</div>
      <div class="sala">4 · Escritório do Chef</div>
      <div class="sala">5 · Pista Principal</div>
    </div>
    <p class="dica-modal">A saída da despensa leva à Estação de Confeitaria.</p>
  `);
}

function abrirBilhete() {
  registrarPista('bilhete');
  abrirModal('Bilhete rasgado', `
    <div class="papel">
      <p>"...essas medidas misturadas me deixam louco! Para a fechadura da despensa:"</p>
      <p><strong>Parte 1:</strong> meia xícara de farinha = ___ g<br>(1 xícara de farinha = 120 g)</p>
      <p><strong>Parte 2:</strong> 176 °F = ___ °C<br>(°C = (°F − 32) ÷ 1,8)</p>
      <p>"A senha são as duas respostas juntas, nessa ordem."</p>
    </div>
  `);
}

function abrirCaixote() {
  registrarPista('caixote');
  abrirModal('Caixote de madeira', `
    <p>Entre legumes velhos, você acha um diário de capa vermelha.</p>
    <div class="papel">
      <p><strong>Diário do Chef · página 12</strong></p>
      <p>"A Pimenta é a mais forte de todas. A Baunilha é mais suave que a Canela. O Anis é mais forte que a Canela, mas perde para a Pimenta."</p>
      <p>"Nos potes trancados, a ordem é sempre do mais suave ao mais forte."</p>
    </div>
  `);
}

const EnigmaPotes = {
  trancado: !estado.potesAbertos,
  resolvido: estado.potesAbertos,
  indices: [0, 0, 0, 0],
  abrir: function() {
    if (estado.potesAbertos) {
      fala('Os potes já foram abertos. Só restam temperos comuns.');
      return;
    }
    this.indices = [0, 0, 0, 0];
    let botoesHtml = '';
    for (let i = 0; i < 4; i++) {
      botoesHtml += `<button type="button" class="disco" data-i="${i}"></button>`;
    }
    abrirModal('Potes trancados', `
      <p>Quatro potes com travas de símbolos. Coloque-os na ordem certa.</p>
      <div class="discos">${botoesHtml}</div>
      <button type="button" class="btn-pixel" id="abrir-potes">DESTRAVAR</button>
      <p class="dica-modal" id="potes-msg">Clique em cada pote para trocar o símbolo.</p>
    `);
    const self = this;
    const discos = modalCorpo.querySelectorAll('.disco');
    function desenhar() {
      for (let i = 0; i < discos.length; i++) {
        const s = SIMBOLOS[self.indices[i]];
        discos[i].innerHTML = `<span class="emo">${s.e}</span><span class="nm">${s.n}</span>`;
      }
    }
    desenhar();
    for (let i = 0; i < discos.length; i++) {
      discos[i].onclick = function() {
        const idx = Number(this.getAttribute('data-i'));
        self.indices[idx] = (self.indices[idx] + 1) % SIMBOLOS.length;
        desenhar();
      };
    }
    $('#abrir-potes').onclick = function() {
      self.verificar();
    };
  },
  verificar: function() {
    if (this.indices.join() === ORDEM_POTES.join()) {
      this.trancado = false;
      this.resolvido = true;
      estado.potesAbertos = true;
      estado.acertos++;
      salvar();
      addItem('baunilha');
      $('#no-potes').classList.add('coletado');
      fecharModal();
      fala('Clique! Um compartimento secreto abriu e você pegou o Extrato de Baunilha Rara.');
    } else {
      estado.erros++;
      salvar();
      $('#potes-msg').innerText = 'As travas não cederam. A ordem não está certa. Procure alguma pista.';
    }
  }
};

const EnigmaTeclado = {
  trancado: !estado.portaAberta,
  resolvido: estado.portaAberta,
  codigo: '',
  abrir: function() {
    if (estado.portaAberta) {
      fala('A fechadura eletrônica já está destravada.');
      return;
    }
    this.codigo = '';
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    let teclasHtml = '';
    for (let i = 0; i < nums.length; i++) {
      teclasHtml += `<button type="button" data-n="${nums[i]}">${nums[i]}</button>`;
    }
    abrirModal('Fechadura eletrônica', `
      <div class="visor" id="visor">----</div>
      <div class="teclado">
        ${teclasHtml}
        <button type="button" data-a="limpar">C</button>
        <button type="button" data-n="0">0</button>
        <button type="button" data-a="ok">OK</button>
      </div>
      <p class="dica-modal">Digite os 4 dígitos da senha.</p>
    `);
    const self = this;
    const visor = $('#visor');
    function atualizar() {
      visor.innerText = (self.codigo + '----').slice(0, 4);
    }
    modalCorpo.querySelector('.teclado').onclick = function(e) {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.n !== undefined) {
        if (self.codigo.length < 4) { self.codigo += b.dataset.n; atualizar(); }
      } else if (b.dataset.a === 'limpar') {
        self.codigo = '';
        atualizar();
      } else if (b.dataset.a === 'ok' && self.codigo.length === 4) {
        if (self.codigo === SENHA_PORTA) {
          self.trancado = false;
          self.resolvido = true;
          estado.portaAberta = true;
          estado.acertos++;
          salvar();
          $('#no-teclado').classList.add('aberta');
          fecharModal();
          fala(estado.mapaPego
            ? 'Bip! A luz ficou verde. A porta destravou. Agora é só sair.'
            : 'Bip! A luz ficou verde. Mas você não sabe o caminho. Falta achar o mapa do restaurante.');
        } else {
          estado.erros++;
          salvar();
          self.codigo = '';
          visor.classList.add('erro');
          visor.innerText = 'ERRO';
          setTimeout(function() { visor.classList.remove('erro'); atualizar(); }, 800);
        }
      }
    };
  }
};

function abrirPorta() {
  if (!estado.portaAberta) {
    EnigmaTeclado.abrir();
    return;
  }
  if (!estado.mapaPego) {
    fala('A porta está destravada, mas você não sabe o caminho. Falta o mapa do restaurante.');
    return;
  }
  abrirModal('Saída da despensa', `
    <p>Com o mapa em mãos, você empurra a porta e segue para a Estação de Confeitaria.</p>
    <a class="btn-pixel" href="cena2.html">Entrar →</a>
  `);
}

function abrirDiarioRapido() {
  const notasSalvas = localStorage.getItem('cozinha_anotacoes') || '';
  const pistas = [];

  if ((estado.pistas && estado.pistas.includes('bilhete')) || estado.portaAberta) {
    pistas.push('<li><strong>Bilhete na parede:</strong> 1/2 xícara de farinha (1 xícara = 120 g) + 176 °F em °C (°C = (°F − 32) ÷ 1,8).</li>');
  }
  if ((estado.pistas && estado.pistas.includes('caixote')) || estado.potesAbertos) {
    pistas.push('<li><strong>Diário do Chef (p. 12):</strong> Ordem dos potes (suave → forte): Baunilha, Canela, Anis, Pimenta.</li>');
  }
  if (estado.mapaPego) {
    pistas.push('<li><strong>Mapa:</strong> 1. Despensa → 2. Confeitaria → 3. Câmara Fria → 4. Escritório → 5. Pista Principal.</li>');
  }

  abrirModal('📓 Diário de Bordo', `
    <div class="papel">
      <p><strong>Pistas descobertas nesta cena:</strong></p>
      ${
        pistas.length
          ? `<ul style="padding-left:20px;margin-top:6px">${pistas.join('')}</ul>`
          : '<p style="color:var(--suave)">Nenhuma pista registrada ainda. Clique em bilhetes e diários pelo cenário.</p>'
      }
    </div>
    <p style="margin-top:14px"><strong>Suas anotações (salvas automaticamente):</strong></p>
    <textarea id="diario-rapido-texto" rows="4" style="width:100%;padding:10px;background:#fffbe9;color:var(--tinta);border:3px solid var(--escuro);font-family:var(--texto);font-size:1.35rem;" placeholder="Anote senhas, cálculos e dicas aqui...">${notasSalvas}</textarea>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;gap:10px;flex-wrap:wrap">
      <span class="dica-modal" id="diario-status" style="margin:0">Salvo automaticamente.</span>
      <a class="btn-pixel" style="margin:0" href="../diario.html?de=cenarios/cena1.html">Abrir página completa →</a>
    </div>
  `);

  const campo = $('#diario-rapido-texto');
  campo.oninput = function() {
    localStorage.setItem('cozinha_anotacoes', campo.value);
    $('#diario-status').innerText = 'Salvo ✓';
  };
}

const btnDiario = $('#btn-diario');
if (btnDiario) {
  btnDiario.onclick = function() {
    selecionado = null;
    renderInventario();
    abrirDiarioRapido();
  };
}

ligar('#no-porta', 'Porta', abrirPorta);
ligar('#no-teclado', 'Teclado', function() { EnigmaTeclado.abrir(); });
ligar('#no-bilhete', 'Bilhete', abrirBilhete);
ligar('#no-caixote', 'Caixote', abrirCaixote);
ligar('#no-potes', 'Potes trancados', function() { EnigmaPotes.abrir(); });

ligar('#no-mapa', 'Papel no caixote', function() {
  if (estado.mapaPego) {
    fala('Você já pegou o mapa.');
    return;
  }
  estado.mapaPego = true;
  salvar();
  addItem('mapa');
  $('#no-mapa').classList.add('coletado');
  fala('Você pegou o papel dobrado: é o mapa do restaurante! Clique nele no inventário para ver.');
});

ligar('#no-farinha', 'Sacos de farinha', function() {
  if (estado.chavePega) {
    fala('Só farinha e trigo. Não tem mais nada aqui.');
    return;
  }
  estado.chavePega = true;
  salvar();
  addItem('chave');
  $('#no-farinha').classList.add('coletado');
  fala('Você enfiou a mão no saco de farinha e sentiu algo de metal: uma chave de fenda de confeiteiro!');
});

ligar('#no-fechadura', 'Fechadura', function() { fala('Uma fechadura antiga, enferrujada. Não há chave por aqui, a porta usa o teclado.'); });
ligar('#no-janela', 'Janela', function() { fala('Uma janela com grades grossas. Lá fora é noite e não dá para passar.'); });
ligar('#no-barril', 'Barril', function() { fala('Um barril de metal vazio. Cheira a azeite velho.'); });
ligar('#no-potes-esq', 'Potes de tempero', function() { fala('Cravo, canela, pimenta... nenhum desses é baunilha. Os rótulos mais interessantes estão nos potes trancados, lá em cima.'); });

function formatar(seg) {
  const m = String(Math.floor(seg / 60)).padStart(2, '0');
  const s = String(seg % 60).padStart(2, '0');
  return m + ':' + s;
}
function fimDeJogo() {
  clearInterval(relogio);
  travado = true;
  try { sessionStorage.removeItem(CHAVE_ESTADO); } catch (e) {}
  abrirModal('FORA DO TEMPO!', `
    <p>O concurso começou sem você. O Chef abre a porta, furioso, e você está demitido antes de tocar na bancada.</p>
    <a class="btn-pixel" href="../index.html">Voltar ao menu</a>
  `);
}
function tick() {
  const restante = Math.max(0, Math.ceil((estado.fim - Date.now()) / 1000));
  const cron = $('#cronometro');
  cron.innerText = formatar(restante);
  cron.classList.toggle('urgente', restante <= 60);
  if (restante <= 0) fimDeJogo();
}
const relogio = setInterval(tick, 1000);

if (estado.chavePega) $('#no-farinha').classList.add('coletado');
if (estado.mapaPego) $('#no-mapa').classList.add('coletado');
if (estado.potesAbertos) $('#no-potes').classList.add('coletado');
if (estado.portaAberta) $('#no-teclado').classList.add('aberta');
renderInventario();
tick();
fala('Você acorda trancado na despensa. Procure a senha da porta e o mapa do restaurante.');
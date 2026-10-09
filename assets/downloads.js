/* Janela "Baixar dados e analises": dados em tabela (CSV num .zip) e ficha da area (A4 pela
 * janela de impressao). A logica pura fica em downloads-nucleo.js; aqui ficam a janela, a
 * leitura do estado da plataforma e a geracao. Usa as funcoes globais de plataforma.js.
 */
(function () {
  const D = window.FEFDownload;
  const janela = document.getElementById('janela-download');
  const conteudo = document.getElementById('conteudo-download');
  let aba = 'csv';

  function abrir() {
    janela.hidden = false;
    esc = null;
    trocarAba(aba);
    document.getElementById('fechar-download').focus();
  }

  function fechar() {
    janela.hidden = true;
    document.getElementById('abrir-download').focus();
  }

  function trocarAba(nova) {
    aba = nova;
    janela.querySelectorAll('[data-aba]').forEach(b => {
      const ativa = b.dataset.aba === aba;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
    });
    conteudo.setAttribute('aria-labelledby', 'aba-' + aba);
    conteudo.innerHTML = aba === 'csv' ? htmlCSV() : htmlFicha();
    if (aba === 'csv') ligarCSV(); else ligarFicha();
  }

  // Aba CSV abaixo; a aba da ficha e preenchida na tarefa seguinte.
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
               'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  // escolhas da aba CSV; preenchidas a cada abertura a partir do estado da tela
  let esc = null;

  function escolhasIniciais() {
    const area = estado.selecionado;
    return {
      camadas: [estado.camada],
      abrangencia: area ? 'area' : (estado.filtroUf ? 'uf' : 'brasil'),
      uf: estado.filtroUf || (area && estado.atributos[estado.camada][area]
        ? String(estado.atributos[estado.camada][area].chunk || estado.atributos[estado.camada][area].uf || 'BA').split(',')[0].trim()
        : 'BA'),
      campos: D.CAMPOS.filter(c => c.padrao).map(c => c.id),
      series: false,
    };
  }

  function htmlCSV() {
    esc = esc || escolhasIniciais();
    const area = estado.selecionado ? estado.atributos[estado.camada][estado.selecionado] : null;
    const chip = (c) => `<label><input type="checkbox" name="camada-dl" value="${c.id}"${
      esc.camadas.includes(c.id) ? ' checked' : ''}>${c.rotulo}</label>`;
    const radio = (v, rot, extra = '', des = false) => `<label><input type="radio" name="abrang-dl" value="${v}"${
      esc.abrangencia === v ? ' checked' : ''}${des ? ' disabled' : ''}>${rot}</label>${extra}`;
    const blocos = D.BLOCOS.map(b => {
      const cs = D.CAMPOS.filter(c => c.bloco === b.id);
      const n = cs.filter(c => esc.campos.includes(c.id)).length;
      return `<details${n ? ' open' : ''}><summary><input type="checkbox" data-bloco="${b.id}"${
        n === cs.length ? ' checked' : ''}> ${b.rotulo} <small>(${n} de ${cs.length})</small></summary>
        <div class="vars">${cs.map(c => `<label><input type="checkbox" name="campo-dl" value="${c.id}"${
          esc.campos.includes(c.id) ? ' checked' : ''}> ${c.rotulo}${c.unidade ? ` (${c.unidade})` : ''}</label>`).join('')}</div></details>`;
    }).join('');
    return `
      <div class="passo-dl"><h4>1 · Recortes <small>um ou mais</small></h4>
        <div class="chips-dl">${CAMADAS.map(chip).join('')}</div></div>
      <div class="passo-dl"><h4>2 · Abrangência</h4><div class="abrang-dl">
        ${radio('brasil', 'Brasil inteiro')}
        ${radio('uf', 'Um estado:', ` <select id="uf-dl">${UFS.map(u => `<option${u === esc.uf ? ' selected' : ''}>${u}</option>`).join('')}</select>`)}
        ${radio('area', area ? `Só ${area.nome}` : 'Só a área aberta no painel', '', !area)}</div></div>
      <div class="passo-dl"><h4>3 · Variáveis <small>o bloco inteiro ou só algumas</small></h4>
        <div class="blocos-dl">${blocos}</div></div>
      <div class="passo-dl"><h4>4 · Séries temporais <small>opcional</small></h4>
        <label class="abrang-dl"><input type="checkbox" id="series-dl"${esc.series ? ' checked' : ''}>
          Incluir as séries (GFA 2002-2025, clima mês a mês, eventos por mês)</label></div>
      <div class="rodape-dl"><span id="previa-dl"></span><button type="button" id="baixar-dl">Baixar</button></div>`;
  }

  // Grupos [{camada, rotulo, feicoes}] das escolhas atuais. Carrega as camadas que faltam.
  async function gruposEscolhidos() {
    const abr = esc.abrangencia === 'area'
      ? { tipo: 'area', camada: estado.camada, rid: estado.selecionado }
      : esc.abrangencia === 'uf' ? { tipo: 'uf', uf: esc.uf } : { tipo: 'brasil' };
    const grupos = [];
    for (const id of esc.camadas) {
      await garantirCamada(id);
      const cam = CAMADAS.find(c => c.id === id);
      grupos.push({ camada: id, rotulo: cam.rotulo, feicoes: D.filtrarFeicoes(estado.atributos[id], id, abr) });
    }
    return { grupos, abr };
  }

  async function atualizarPrevia() {
    const alvo = document.getElementById('previa-dl');
    if (!alvo) return;
    if (!esc.camadas.length || !esc.campos.length) {
      alvo.textContent = 'Escolha ao menos um recorte e uma variável.';
      document.getElementById('baixar-dl').disabled = true;
      return;
    }
    document.getElementById('baixar-dl').disabled = false;
    alvo.textContent = 'Calculando…';
    const { grupos } = await gruposEscolhidos();
    const p = D.previa(grupos, esc.campos);
    alvo.textContent = `${nf(p.linhas)} linhas · ${p.colunas} colunas · ~${D.tamanhoLegivel(p.bytes)}` +
      (esc.series ? ' + séries' : '');
  }

  function ligarCSV() {
    const caixa = conteudo;
    caixa.querySelectorAll('input[name="camada-dl"]').forEach(i => i.onchange = () => {
      esc.camadas = [...caixa.querySelectorAll('input[name="camada-dl"]:checked')].map(x => x.value);
      atualizarPrevia();
    });
    caixa.querySelectorAll('input[name="abrang-dl"]').forEach(i => i.onchange = () => { esc.abrangencia = i.value; atualizarPrevia(); });
    caixa.querySelector('#uf-dl').onchange = (e) => { esc.uf = e.target.value; esc.abrangencia = 'uf'; trocarAba('csv'); atualizarPrevia(); };
    caixa.querySelectorAll('input[name="campo-dl"]').forEach(i => i.onchange = () => {
      esc.campos = [...caixa.querySelectorAll('input[name="campo-dl"]:checked')].map(x => x.value);
      trocarAba('csv');
    });
    caixa.querySelectorAll('input[data-bloco]').forEach(i => {
      const cs = D.CAMPOS.filter(c => c.bloco === i.dataset.bloco).map(c => c.id);
      const n = cs.filter(id => esc.campos.includes(id)).length;
      i.indeterminate = n > 0 && n < cs.length;
      i.onclick = (e) => e.stopPropagation();   // nao abre/fecha o details
      i.onchange = () => {
        esc.campos = i.checked ? [...new Set(esc.campos.concat(cs))] : esc.campos.filter(id => !cs.includes(id));
        trocarAba('csv');
      };
    });
    caixa.querySelector('#series-dl').onchange = (e) => { esc.series = e.target.checked; atualizarPrevia(); };
    caixa.querySelector('#baixar-dl').onclick = baixarCSV;
    atualizarPrevia();
  }

  async function baixarCSV() {}   // tarefa 14

  function htmlFicha() { return '<p class="aviso-dl">Em construção.</p>'; }
  function ligarFicha() {}

  document.getElementById('abrir-download').addEventListener('click', abrir);
  document.getElementById('fechar-download').addEventListener('click', fechar);
  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  // Esc fecha; Tab fica preso dentro da janela enquanto ela esta aberta.
  const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href]';
  document.addEventListener('keydown', (e) => {
    if (janela.hidden) return;
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    const itens = [...janela.querySelector('.caixa-download').querySelectorAll(FOCAVEIS)]
      .filter(el => el.offsetParent !== null && el.tabIndex >= 0);
    if (!itens.length) return;
    const primeiro = itens[0], ultimo = itens[itens.length - 1];
    if (!janela.contains(document.activeElement)) { e.preventDefault(); primeiro.focus(); }
    else if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
  // Setas esquerda/direita trocam de aba.
  janela.querySelector('.abas-download').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const abas = [...janela.querySelectorAll('[data-aba]')];
    const i = abas.findIndex(b => b.dataset.aba === aba);
    const novo = abas[(i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
    trocarAba(novo.dataset.aba);
    novo.focus();
  });
  janela.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.aba)));

  window.FEFJanelaDownload = { abrir, fechar, trocarAba };
})();

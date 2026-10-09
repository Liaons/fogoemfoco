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

  // As duas abas: preenchidas nas tarefas seguintes.
  function htmlCSV() { return '<p class="aviso-dl">Em construção.</p>'; }
  function ligarCSV() {}
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

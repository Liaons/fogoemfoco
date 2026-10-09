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
    janela.querySelectorAll('[data-aba]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !janela.hidden) fechar(); });
  janela.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.aba)));

  window.FEFJanelaDownload = { abrir, fechar, trocarAba };
})();

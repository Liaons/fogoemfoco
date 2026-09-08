/* Alternancia de tema, compartilhada pela homepage e pela plataforma.
 *
 * Tres situacoes:
 *   sem escolha salva  segue o sistema, via prefers-color-scheme no CSS
 *   claro / escuro     escolha do leitor, gravada em localStorage
 *
 * O primeiro clique parte do tema que esta valendo no momento, e nao de um
 * padrao fixo, para nao dar a impressao de que o botao nao fez nada.
 */
(function () {
  const CHAVE = 'fef-tema';

  function temaAtual() {
    const salvo = document.documentElement.dataset.tema;
    if (salvo) return salvo;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }

  function aplicar(tema) {
    document.documentElement.dataset.tema = tema;
    try { localStorage.setItem(CHAVE, tema); } catch (e) {}
    document.dispatchEvent(new CustomEvent('tema-mudou', { detail: { tema } }));
  }

  window.FEFTema = { atual: temaAtual, aplicar };

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tema').forEach(b => {
      b.addEventListener('click', () => aplicar(temaAtual() === 'escuro' ? 'claro' : 'escuro'));
    });
  });
})();

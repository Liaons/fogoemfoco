/* Nucleo dos downloads da plataforma: funcoes puras, sem DOM.
 *
 * Monta as tabelas, o CSV, o dicionario, as series em formato longo, o zip e o SVG do
 * mapa da ficha a partir dos mesmos dados que a plataforma ja carrega. A interface fica
 * em downloads.js. Testes em testes/downloads.html.
 *
 * CSV no padrao internacional: separador virgula, ponto decimal, UTF-8 com BOM (para o
 * Excel reconhecer os acentos). Nulo nao e zero: ausente sai como celula vazia.
 */
(function () {
  const FEFDownload = {};
  window.FEFDownload = FEFDownload;
  // Uma celula do CSV. Numero com ponto decimal (toString do JS nunca usa separador de
  // milhar); texto entre aspas quando tem virgula, aspas ou quebra de linha.
  function valorCSV(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
    const s = String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function paraCSV(colunas, linhas) {
    const out = [colunas.map(valorCSV).join(',')];
    for (const l of linhas) out.push(l.map(valorCSV).join(','));
    return out.join('\r\n') + '\r\n';
  }

  FEFDownload.valorCSV = valorCSV;
  FEFDownload.paraCSV = paraCSV;
})();

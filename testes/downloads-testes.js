teste('o nucleo existe', () => {
  verdadeiro(typeof window.FEFDownload === 'object');
});

const D = window.FEFDownload;

teste('valor: nulo, indefinido e NaN viram celula vazia', () => {
  igual(D.valorCSV(null), '');
  igual(D.valorCSV(undefined), '');
  igual(D.valorCSV(NaN), '');
});

teste('valor: numero com ponto decimal, sem separador de milhar', () => {
  igual(D.valorCSV(1622.1302), '1622.1302');
  igual(D.valorCSV(0), '0');
  igual(D.valorCSV(-0.5), '-0.5');
  igual(D.valorCSV(41845), '41845');
});

teste('valor: texto com virgula, aspas ou quebra de linha vai entre aspas', () => {
  igual(D.valorCSV('Bahia'), 'Bahia');
  igual(D.valorCSV('MINAS GERAIS, SÃO PAULO'), '"MINAS GERAIS, SÃO PAULO"');
  igual(D.valorCSV('Parque "Novo"'), '"Parque ""Novo"""');
  igual(D.valorCSV('a\nb'), '"a\nb"');
});

teste('CSV: cabecalho e linhas separados por CRLF, sem BOM', () => {
  const csv = D.paraCSV(['nome', 'aq_km2'], [['Bahia', 1622.1], ['Acre', null]]);
  igual(csv, 'nome,aq_km2\r\nBahia,1622.1\r\nAcre,\r\n');
});

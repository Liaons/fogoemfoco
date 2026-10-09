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

teste('catalogo: seis blocos na ordem do menu', () => {
  igual(D.BLOCOS.map(b => b.id), ['ranques', 'aq', 'gfa', 'clima', 'focos', 'eventos']);
});

teste('catalogo: ranques marcados por padrao, sete', () => {
  const r = D.CAMPOS.filter(c => c.bloco === 'ranques');
  igual(r.length, 7);
  verdadeiro(r.every(c => c.padrao));
});

teste('catalogo: GFA tem 25 campos (5 metricas x valor, media, dp, anomalia %, anomalia dp)', () => {
  igual(D.CAMPOS.filter(c => c.bloco === 'gfa').length, 25);
});

teste('catalogo: fracao queimada sai em %', () => {
  const c = D.CAMPOS.find(c => c.id === 'aq_frac');
  igual([c.coluna, c.fator, c.unidade], ['aq_frac_pct', 100, '%']);
});

teste('catalogo: nomes de coluna unicos', () => {
  const nomes = D.CAMPOS.map(c => c.coluna);
  igual(new Set(nomes).size, nomes.length);
});

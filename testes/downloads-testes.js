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

const ATRIB = {
  UF: { '60000025': { nome: 'Bahia', uf: 'BA', cod: '29', aq: 1622.1302, aq_frac: 0.011529, aq_ranque: 4, focos: 11653 },
        '60000005': { nome: 'Paraná', uf: 'PR', cod: '41', aq: 12.5, aq_frac: 0.0001, aq_ranque: 20, focos: null } },
  Municipios: {
    '1': { nome: 'Barra', uf: 'BA', chunk: 'BA', cod: '2903201', aq: 412.3, aq_ranque: 4 },
    '2': { nome: 'Curitiba', uf: 'PR', chunk: 'PR', cod: '4106902', aq: null, aq_ranque: null },
  },
  Biomas: { '10000001': { nome: 'Amazônia', uf: null, cod: 'Amazônia', aq: 4305.8 } },
  TerrasIndigenas: { '20000001': { nome: 'Acapuri de Cima', uf: 'AM', cod: '101' },
                     '20000002': { nome: 'Kayabi', uf: 'MT, PA', cod: '200' } },
};

teste('filtro: brasil devolve todas, em ordem de nome', () => {
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'brasil' }).map(([r]) => r), ['1', '2']);
});

teste('filtro: um estado', () => {
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'uf', uf: 'PR' }).map(([r]) => r), ['2']);
  igual(D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'uf', uf: 'BA' }).map(([r]) => r), ['60000025']);
  igual(D.filtrarFeicoes(ATRIB.TerrasIndigenas, 'TerrasIndigenas', { tipo: 'uf', uf: 'MT' }).map(([r]) => r), ['20000002']);
  igual(D.filtrarFeicoes(ATRIB.Biomas, 'Biomas', { tipo: 'uf', uf: 'BA' }).length, 1);
});

teste('filtro: so a area aberta, e so na camada dela', () => {
  igual(D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'area', camada: 'UF', rid: '60000005' }).map(([r]) => r), ['60000005']);
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'area', camada: 'UF', rid: '60000005' }).length, 0);
});

teste('tabela: identificacao + campos, fator aplicado, nulo vazio', () => {
  const t = D.montarTabela([{ camada: 'UF', rotulo: 'Estados',
    feicoes: D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'brasil' }) }], ['aq_ranque', 'aq_frac', 'focos']);
  igual(t.colunas, ['camada', 'region_id', 'codigo', 'nome', 'uf', 'ranque_area_queimada', 'aq_frac_pct', 'focos']);
  igual(t.linhas[0], ['Estados', '60000025', '29', 'Bahia', 'BA', 4, 1.1529, 11653]);
  igual(t.linhas[1][7], null);
});

teste('tabela: varias camadas empilhadas, campos na ordem do catalogo', () => {
  const t = D.montarTabela([
    { camada: 'UF', rotulo: 'Estados', feicoes: D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'uf', uf: 'BA' }) },
    { camada: 'Municipios', rotulo: 'Municípios', feicoes: D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'uf', uf: 'BA' }) },
  ], ['aq', 'aq_ranque']);
  igual(t.colunas.slice(5), ['ranque_area_queimada', 'aq_km2']);
  igual(t.linhas.map(l => l[0] + ':' + l[3]), ['Estados:Bahia', 'Municípios:Barra']);
});

teste('dicionario: uma linha por coluna, com as de identificacao', () => {
  const d = D.dicionario(['aq', 'focos']);
  igual(d.colunas, ['coluna', 'descricao', 'unidade', 'bloco', 'fonte', 'quando_vazio']);
  igual(d.linhas.map(l => l[0]), ['camada', 'region_id', 'codigo', 'nome', 'uf', 'aq_km2', 'focos']);
  verdadeiro(d.linhas[6][5].length > 0, 'focos explica o vazio');
});

teste('dicionario: clima avisa que biomas nao tem dado', () => {
  const d = D.dicionario(['t_dif']);
  verdadeiro(/bioma/i.test(d.linhas[5][5]));
});

teste('LEIA: periodo, citacao e como abrir no Excel', () => {
  const t = D.textoLeia({ geradoEm: '09/10/2026' });
  verdadeiro(t.includes('março de 2025 a fevereiro de 2026'));
  verdadeiro(t.includes('Fogo em foco: diagnóstico dos incêndios no Brasil em 2025/2026'));
  verdadeiro(/Excel/.test(t));
  verdadeiro(t.includes('09/10/2026'));
});

const FEIC = [['60000025', { nome: 'Bahia', uf: 'BA' }]];

teste('series GFA: uma linha por area e ano', () => {
  const t = D.seriesLongas('gfa', 'Estados', FEIC, { '60000025': { ano: [2024, 2025], n_incendios: [800, 1289],
    tam_max: [100, 518], taxa_max: [10, 33.8], tam_p95: [12, 30.4], taxa_p95: [1.5, 3.03] } });
  igual(t.colunas, ['camada', 'region_id', 'nome', 'ano_inicio', 'n_incendios', 'tam_max', 'taxa_max', 'tam_p95', 'taxa_p95']);
  igual(t.linhas[1], ['Estados', '60000025', 'Bahia', 2025, 1289, 518, 33.8, 30.4, 3.03]);
});

teste('series clima: 12 meses de marco a fevereiro, campos ausentes vazios', () => {
  const v = (x) => Array(12).fill(x);
  const t = D.seriesLongas('clima', 'Estados', FEIC, { '60000025': { t: v(25), t_media: v(24.5), p: v(30), p_media: v(60) } });
  igual(t.linhas.length, 12);
  igual(t.linhas[0].slice(3, 5), [2025, 3]);
  igual(t.linhas[11].slice(3, 5), [2026, 2]);
  igual(t.colunas.indexOf('t_min_c') > 0, true);
  igual(t.linhas[0][t.colunas.indexOf('t_min_c')], null);
});

teste('series eventos: 12 meses de 2025 por tipo', () => {
  const t = D.seriesLongas('eventos', 'Estados', FEIC, { '60000025': { queimada: Array(12).fill(1),
    possivel_incendio: Array(12).fill(2), incendio: Array(12).fill(3), atividade_antropica: Array(12).fill(4) } });
  igual(t.linhas.length, 12);
  igual(t.linhas[0].slice(3), [2025, 1, 1, 2, 3, 4, 10]);
});

teste('series: area sem serie fica fora', () => {
  igual(D.seriesLongas('gfa', 'Estados', FEIC, {}).linhas.length, 0);
});

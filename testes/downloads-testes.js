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
  UF: { '60000025': { nome: 'Bahia', uf: 'BA', cod: '29', estado_dado: 'ok', aq: 1622.1302, aq_frac: 0.011529, aq_ranque: 4, focos: 11653 },
        '60000005': { nome: 'Paraná', uf: 'PR', cod: '41', estado_dado: 'ok', aq: 12.5, aq_frac: 0.0001, aq_ranque: 20, focos: null } },
  Municipios: {
    '1': { nome: 'Barra', uf: 'BA', chunk: 'BA', cod: '2903201', aq: 412.3, aq_ranque: 4 },
    '2': { nome: 'Curitiba', uf: 'PR', chunk: 'PR', cod: '4106902', aq: null, aq_ranque: null },
  },
  Biomas: { '10000001': { nome: 'Amazônia', uf: null, cod: 'Amazônia', aq: 4305.8 } },
  TerrasIndigenas: { '20000001': { nome: 'Acapuri de Cima', uf: 'AM', cod: '101' },
                     '20000002': { nome: 'Kayabi', uf: 'MT, PA', cod: '200' },
                     '20000003': { nome: 'Andirá-Marau', uf: 'AM,PA', cod: '300' } },
};

teste('filtro: brasil devolve todas, em ordem de nome', () => {
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'brasil' }).map(([r]) => r), ['1', '2']);
});

teste('filtro: um estado', () => {
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'uf', uf: 'PR' }).map(([r]) => r), ['2']);
  igual(D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'uf', uf: 'BA' }).map(([r]) => r), ['60000025']);
  igual(D.filtrarFeicoes(ATRIB.TerrasIndigenas, 'TerrasIndigenas', { tipo: 'uf', uf: 'MT' }).map(([r]) => r), ['20000002']);
  igual(D.filtrarFeicoes(ATRIB.TerrasIndigenas, 'TerrasIndigenas', { tipo: 'uf', uf: 'AM' }).map(([r]) => r), ['20000001', '20000003']);
  igual(D.filtrarFeicoes(ATRIB.Biomas, 'Biomas', { tipo: 'uf', uf: 'BA' }).length, 1);
});

teste('filtro: TI em varios estados entra em cada um deles, nao so no primeiro', () => {
  igual(D.filtrarFeicoes(ATRIB.TerrasIndigenas, 'TerrasIndigenas', { tipo: 'uf', uf: 'PA' }).map(([r]) => r), ['20000003', '20000002']);
});

teste('filtro: so a area aberta, e so na camada dela', () => {
  igual(D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'area', camada: 'UF', rid: '60000005' }).map(([r]) => r), ['60000005']);
  igual(D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'area', camada: 'UF', rid: '60000005' }).length, 0);
});

teste('tabela: identificacao + campos, fator aplicado, nulo vazio', () => {
  const t = D.montarTabela([{ camada: 'UF', rotulo: 'Estados',
    feicoes: D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'brasil' }) }], ['aq_ranque', 'aq_frac', 'focos']);
  igual(t.colunas, ['camada', 'region_id', 'codigo', 'nome', 'uf', 'situacao', 'ranque_area_queimada', 'aq_frac_pct', 'focos']);
  igual(t.linhas[0], ['Estados', '60000025', '29', 'Bahia', 'BA', 'ok', 4, 1.1529, 11653]);
  igual(t.linhas[1][8], null);
});

teste('tabela: varias camadas empilhadas, campos na ordem do catalogo', () => {
  const t = D.montarTabela([
    { camada: 'UF', rotulo: 'Estados', feicoes: D.filtrarFeicoes(ATRIB.UF, 'UF', { tipo: 'uf', uf: 'BA' }) },
    { camada: 'Municipios', rotulo: 'Municípios', feicoes: D.filtrarFeicoes(ATRIB.Municipios, 'Municipios', { tipo: 'uf', uf: 'BA' }) },
  ], ['aq', 'aq_ranque']);
  igual(t.colunas.slice(6), ['ranque_area_queimada', 'aq_km2']);
  igual(t.linhas.map(l => l[0] + ':' + l[3]), ['Estados:Bahia', 'Municípios:Barra']);
});

teste('tabela: sem fogo ou fora, sem anomalia nem mes de pico; zero real fica', () => {
  const t = D.montarTabela([{ camada: 'UCs', rotulo: 'UCs', feicoes: [
    ['1', { nome: 'A', chunk: 'MG', estado_dado: 'sem_fogo', aq: 0, aq_media: 0, aq_anom_pct: 0, aq_anom_dp: 0, mes_pico: 7, eventos: 0 }],
    ['2', { nome: 'B', chunk: 'MG', estado_dado: 'fora', aq: null, mes_pico: 3 }],
    ['3', { nome: 'C', chunk: 'MG', estado_dado: 'ok', aq: 5, aq_anom_pct: 12, aq_anom_dp: 0.4, mes_pico: 8 }],
  ] }], ['aq', 'aq_media', 'aq_anom_pct', 'aq_anom_dp', 'mes_pico', 'eventos']);
  const col = (n) => t.colunas.indexOf(n);
  igual(t.linhas.map(l => l[col('situacao')]), ['sem_fogo', 'fora', 'ok']);
  igual([t.linhas[0][col('aq_km2')], t.linhas[0][col('aq_media_km2')], t.linhas[0][col('eventos')]], [0, 0, 0]);
  igual([t.linhas[0][col('aq_anomalia_pct')], t.linhas[0][col('aq_anomalia_dp')], t.linhas[0][col('mes_pico')]], [null, null, null]);
  igual(t.linhas[1][col('mes_pico')], null);
  igual([t.linhas[2][col('aq_anomalia_pct')], t.linhas[2][col('mes_pico')]], [12, 8]);
});

teste('dicionario: uma linha por coluna, com as de identificacao', () => {
  const d = D.dicionario(['aq', 'focos']);
  igual(d.colunas, ['coluna', 'descricao', 'unidade', 'bloco', 'fonte', 'quando_vazio']);
  igual(d.linhas.map(l => l[0]), ['camada', 'region_id', 'codigo', 'nome', 'uf', 'situacao', 'aq_km2', 'focos']);
  verdadeiro(d.linhas[7][5].length > 0, 'focos explica o vazio');
  verdadeiro(/sem_fogo/.test(d.linhas[5][1]) && /fora/.test(d.linhas[5][1]), 'situacao explica os estados');
  verdadeiro(/0/.test(d.linhas[6][5]), 'aq: sem_fogo vale 0');
});

teste('dicionario: clima avisa que biomas nao tem dado', () => {
  const d = D.dicionario(['t_dif']);
  verdadeiro(/bioma/i.test(d.linhas[6][5]));
});

teste('LEIA: periodo, citacao e como abrir no Excel', () => {
  const t = D.textoLeia({ geradoEm: '09/10/2026' });
  verdadeiro(t.includes('março de 2025 a fevereiro de 2026'));
  verdadeiro(t.includes('Fogo em foco: diagnóstico dos incêndios no Brasil em 2025/2026'));
  verdadeiro(/Excel/.test(t));
  verdadeiro(t.includes('09/10/2026'));
  verdadeiro(!/Clima dos municípios/.test(t), 'sem aviso quando o clima municipal esta atualizado');
});

teste('LEIA: avisa a referencia antiga do clima municipal e descreve as series', () => {
  const t = D.textoLeia({ geradoEm: '09/10/2026', climaMunicipios: '2003-2023' });
  verdadeiro(/Clima dos municípios/.test(t) && t.includes('2003-2023'));
  verdadeiro(t.includes('precipitacao_hist_mm') && t.includes('ano_inicio'));
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

teste('crc32 do vetor de referencia "123456789" = cbf43926', () => {
  igual(D.crc32(new TextEncoder().encode('123456789')).toString(16), 'cbf43926');
});

teste('zip: assinaturas, contagem e conteudo legivel', () => {
  const z = D.zipar([{ nome: 'a.csv', texto: 'x,y\r\n1,2\r\n' }, { nome: 'dicionário.csv', texto: 'ç' }], new Date(2026, 9, 9));
  const v = new DataView(z.buffer);
  igual(v.getUint32(0, true).toString(16), '4034b50', 'cabecalho local');
  const fim = z.length - 22;
  igual(v.getUint32(fim, true).toString(16), '6054b50', 'registro final');
  igual(v.getUint16(fim + 10, true), 2, 'dois arquivos');
  const nome = new TextDecoder().decode(z.slice(30, 30 + v.getUint16(26, true)));
  igual(nome, 'a.csv');
  const dados = new TextDecoder().decode(z.slice(30 + 5, 30 + 5 + v.getUint32(18, true)));
  igual(dados, 'x,y\r\n1,2\r\n');
});

teste('zip: BOM opcional no inicio do texto', () => {
  const z = D.zipar([{ nome: 'a.csv', texto: 'x', bom: true }], new Date(2026, 9, 9));
  const v = new DataView(z.buffer);
  igual(v.getUint32(18, true), 4, 'BOM (3 bytes) + x');
});

teste('nome: recortes e abrangencia sem acento', () => {
  igual(D.nomeBase(['UF', 'Municipios'], { tipo: 'uf', uf: 'BA' }), 'fogo-em-foco_2025-26_estados-municipios_BA');
  igual(D.nomeBase(['UCs'], { tipo: 'brasil' }), 'fogo-em-foco_2025-26_ucs_brasil');
  igual(D.nomeBase(['Municipios'], { tipo: 'area', nome: 'São Félix do Xingu' }), 'fogo-em-foco_2025-26_municipios_sao-felix-do-xingu');
});

teste('previa: linhas, colunas e tamanho aproximado', () => {
  const p = D.previa([{ feicoes: [['1', {}], ['2', {}]] }, { feicoes: [['3', {}]] }], ['aq', 'focos']);
  igual([p.linhas, p.colunas], [3, 8]);
  verdadeiro(p.bytes > 0);
});

teste('previa: celula vazia pesa menos que preenchida', () => {
  const vazias = D.previa([{ rotulo: 'X', feicoes: [['1', { nome: 'A' }]] }], ['aq', 'focos']);
  const cheias = D.previa([{ rotulo: 'X', feicoes: [['1', { nome: 'A', aq: 1.5, focos: 10 }]] }], ['aq', 'focos']);
  igual(cheias.bytes - vazias.bytes, 12);
});

teste('tamanho legivel', () => {
  igual(D.tamanhoLegivel(900), '1 KB');
  igual(D.tamanhoLegivel(42 * 1024), '42 KB');
  igual(D.tamanhoLegivel(3.4 * 1024 * 1024), '3,4 MB');
});

const QUAD = (rid, x0, y0, x1, y1) => ({ type: 'Feature', properties: { rid },
  geometry: { type: 'Polygon', coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] } });

teste('caixa: limites de um conjunto de feicoes', () => {
  igual(D.caixa([QUAD('a', -50, -10, -49, -9), QUAD('b', -48, -12, -47, -11)]), [-50, -12, -47, -9]);
});

teste('svg do mapa: um path por feicao, destaque com contorno grosso, dentro da caixa', () => {
  const svg = D.mapaSVG([QUAD('a', -50, -10, -49, -9), QUAD('b', -48, -12, -47, -11)],
    { cor: (rid) => rid === 'a' ? '#ff0000' : '#00ff00', destaque: 'a', largura: 300, altura: 200 });
  igual((svg.match(/<path /g) || []).length, 3, 'duas feicoes + contorno do destaque');
  verdadeiro(svg.includes('fill="#ff0000"'));
  verdadeiro(/stroke-width="2/.test(svg), 'contorno grosso do destaque');
  const nums = [...svg.matchAll(/[ML]([\d.]+),([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  verdadeiro(nums.every(([x, y]) => x >= 0 && x <= 300 && y >= 0 && y <= 200), 'pontos dentro do quadro');
});

teste('svg do mapa: caixa forcada recorta o enquadramento', () => {
  const svg = D.mapaSVG([QUAD('a', -50, -10, -49, -9)], { cor: () => '#000', largura: 100, altura: 100, limites: [-60, -20, -40, 0] });
  verdadeiro(svg.includes('viewBox="0 0 100 100"'));
});

teste('series eventos: mes sem nenhum tipo tem total nulo', () => {
  const t = D.seriesLongas('eventos', 'Estados', FEIC, { '60000025': { queimada: [null, 1] } });
  igual(t.linhas[0][t.colunas.indexOf('total')], null);
  igual(t.linhas[1][t.colunas.indexOf('total')], 1);
});

teste('tabela: codigo nulo vira celula vazia', () => {
  const t = D.montarTabela([{ camada: 'UF', rotulo: 'Estados', feicoes: [['1', { nome: 'X', uf: 'BA', cod: null }]] }], []);
  igual(t.linhas[0][2], '');
});

teste('svg do mapa: clipPath com id unico por chamada', () => {
  const op = { cor: () => '#000', largura: 100, altura: 100 };
  const a = D.mapaSVG([QUAD('a', -50, -10, -49, -9)], op), b = D.mapaSVG([QUAD('a', -50, -10, -49, -9)], op);
  const id = (s) => s.match(/clipPath id="([^"]+)"/)[1];
  verdadeiro(id(a) !== id(b));
  verdadeiro(a.includes('url(#' + id(a) + ')'));
});

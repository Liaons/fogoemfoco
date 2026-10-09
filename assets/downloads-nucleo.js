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
  const FONTE = {
    aq: 'MODIS MCD64A1, área queimada em vegetação com pelo menos 30% de cobertura arbórea',
    gfa: 'Global Fire Atlas (incêndios individuais derivados do MODIS)',
    focos: 'INPE, focos de calor',
    eventos: 'INPE, eventos de fogo de 2025, atribuídos pelo centroide',
    clima: 'ERA5, média histórica de 2003-2024',
  };

  const BLOCOS = [
    { id: 'ranques', rotulo: 'Ranques na série histórica' },
    { id: 'aq',      rotulo: 'Área queimada (MODIS)' },
    { id: 'gfa',     rotulo: 'Métricas do fogo (GFA)' },
    { id: 'clima',   rotulo: 'Clima (temperatura e precipitação)' },
    { id: 'focos',   rotulo: 'Focos de calor' },
    { id: 'eventos', rotulo: 'Eventos de fogo' },
  ];

  const RANQUE_DESC = 'posição do período 2025-26 na série de 24 períodos; 1 = maior registro desde 2002';
  const METRICAS = [
    ['n_incendios', 'número de incêndios', ''],
    ['tam_max', 'tamanho máximo', 'km²'],
    ['taxa_max', 'taxa máxima de crescimento', 'km²/dia'],
    ['tam_p95', 'tamanho no percentil 95', 'km²'],
    ['taxa_p95', 'taxa de crescimento no percentil 95', 'km²/dia'],
  ];

  // c(id, bloco, coluna, rotulo, unidade, descricao, fonte, extras)
  function c(id, bloco, coluna, rotulo, unidade, descricao, fonte, extras) {
    return Object.assign({ id, bloco, coluna, rotulo, unidade, descricao, fonte, fator: 1, padrao: false }, extras || {});
  }

  const CAMPOS = [
    c('aq_ranque', 'ranques', 'ranque_area_queimada', 'Área queimada', '', RANQUE_DESC, FONTE.aq, { padrao: true }),
    ...METRICAS.map(([m, r]) => c(m + '_ranque', 'ranques', 'ranque_' + m, r[0].toUpperCase() + r.slice(1), '',
                                   RANQUE_DESC, FONTE.gfa, { padrao: true })),
    c('focos_ranque', 'ranques', 'ranque_focos', 'Focos de calor', '', RANQUE_DESC + '; vazio sem foco no período',
      FONTE.focos, { padrao: true }),

    c('aq', 'aq', 'aq_km2', 'Área queimada', 'km²', 'área queimada em vegetação no período', FONTE.aq),
    c('aq_frac', 'aq', 'aq_frac_pct', 'Fração queimada', '%', 'área queimada sobre a área do recorte', FONTE.aq, { fator: 100 }),
    c('aq_media', 'aq', 'aq_media_km2', 'Média anual', 'km²', 'média anual da série 2002-03 a 2024-25', FONTE.aq),
    c('aq_dp', 'aq', 'aq_dp_km2', 'Desvio padrão anual', 'km²', 'desvio padrão anual da série', FONTE.aq),
    c('aq_anom_pct', 'aq', 'aq_anomalia_pct', 'Anomalia (%)', '%', 'diferença em relação à média, em % da média', FONTE.aq),
    c('aq_anom_dp', 'aq', 'aq_anomalia_dp', 'Anomalia (desvios padrão)', 'dp', 'diferença em relação à média, em desvios padrão', FONTE.aq),
    c('mes_pico', 'aq', 'mes_pico', 'Mês de pico da anomalia', 'mês (1-12)', 'mês do pico da anomalia de área queimada', FONTE.aq),

    ...METRICAS.flatMap(([m, r, u]) => [
      c(m, 'gfa', m, r[0].toUpperCase() + r.slice(1), u, r + ' no período 2025-26', FONTE.gfa),
      c(m + '_media', 'gfa', m + '_media', r + ': média anual', u, 'média anual da série 2002-03 a 2024-25', FONTE.gfa),
      c(m + '_dp', 'gfa', m + '_dp', r + ': desvio padrão anual', u, 'desvio padrão anual da série', FONTE.gfa),
      c(m + '_anom_pct', 'gfa', m + '_anomalia_pct', r + ': anomalia (%)', '%', 'diferença em relação à média, em % da média', FONTE.gfa),
      c(m + '_anom_dp', 'gfa', m + '_anomalia_dp', r + ': anomalia (dp)', 'dp', 'diferença em relação à média, em desvios padrão', FONTE.gfa),
    ]),

    c('t_periodo', 'clima', 'temperatura_media_c', 'Temperatura média', '°C', 'média de março a fevereiro', FONTE.clima),
    c('t_dif', 'clima', 'temperatura_dif_c', 'Temperatura: diferença da média', '°C', 'período menos a média histórica', FONTE.clima),
    c('p_periodo', 'clima', 'precipitacao_mm', 'Precipitação acumulada', 'mm', 'soma de março a fevereiro', FONTE.clima),
    c('p_dif_pct', 'clima', 'precipitacao_dif_pct', 'Precipitação: diferença da média', '%', 'diferença em relação à média histórica, em %', FONTE.clima),

    c('focos', 'focos', 'focos', 'Número de focos', 'focos', 'focos de calor no período; vazio sem foco', FONTE.focos),

    c('eventos', 'eventos', 'eventos', 'Número de eventos', 'eventos', 'eventos de fogo em 2025', FONTE.eventos),
    c('ev_dur_media', 'eventos', 'eventos_duracao_media_dias', 'Duração média', 'dias',
      'sem os eventos acima do percentil 99 do país; vazio com menos de 5 eventos', FONTE.eventos),
    c('ev_dur_max', 'eventos', 'eventos_duracao_max_dias', 'Duração máxima', 'dias', 'o evento mais longo', FONTE.eventos),
  ];

  FEFDownload.BLOCOS = BLOCOS;
  FEFDownload.CAMPOS = CAMPOS;
  const ID_COLUNAS = ['camada', 'region_id', 'codigo', 'nome', 'uf'];

  function primeiraUf(v) {
    return v ? String(v).split(',')[0].trim() : '';
  }

  // Ordem alfabetica pelo nome, ignorando acentos e maiusculas
  function porNome(a, b) {
    return String(a[1].nome || '').localeCompare(String(b[1].nome || ''), 'pt-BR', { sensitivity: 'base' });
  }

  // abrangencia: { tipo: 'brasil' } | { tipo: 'uf', uf: 'BA' } | { tipo: 'area', camada, rid }
  function filtrarFeicoes(atributos, camada, abrangencia) {
    const todas = Object.entries(atributos || {});
    let sel;
    if (abrangencia.tipo === 'area') {
      sel = abrangencia.camada === camada ? todas.filter(([rid]) => rid === String(abrangencia.rid)) : [];
    } else if (abrangencia.tipo === 'uf' && camada !== 'Biomas') {
      const uf = abrangencia.uf;
      sel = todas.filter(([, r]) => (r.chunk || primeiraUf(r.uf)) === uf);
    } else {
      sel = todas;
    }
    return sel.sort(porNome);
  }

  // grupos: [{ camada, rotulo, feicoes: [[rid, reg], ...] }]; campos: ids do catalogo
  function montarTabela(grupos, campos) {
    const escolhidos = CAMPOS.filter(c => campos.includes(c.id));
    const colunas = ID_COLUNAS.concat(escolhidos.map(c => c.coluna));
    const linhas = [];
    for (const g of grupos) {
      for (const [rid, r] of g.feicoes) {
        const ufc = g.camada === 'Biomas' ? '' : (g.camada === 'UCs' ? (r.chunk || '') : primeiraUf(r.uf));
        const linha = [g.rotulo, String(rid), r.cod === undefined ? '' : String(r.cod), r.nome, ufc];
        for (const c of escolhidos) {
          const v = r[c.id];
          linha.push(v === null || v === undefined || !Number.isFinite(v)
            ? null : (c.fator === 1 ? v : Math.round(v * c.fator * 1e6) / 1e6));
        }
        linhas.push(linha);
      }
    }
    return { colunas, linhas };
  }

  FEFDownload.ID_COLUNAS = ID_COLUNAS;
  FEFDownload.filtrarFeicoes = filtrarFeicoes;
  FEFDownload.montarTabela = montarTabela;
  const CITACAO = 'Fogo em foco: diagnóstico dos incêndios no Brasil em 2025/2026. ' +
    'Rede Brasa de Pesquisa. – São José dos Campos: INPE, 2025.';

  const ID_DESC = {
    camada: ['recorte territorial (Estados, Municípios, Biomas, Unidades de conservação, Terras indígenas)', ''],
    region_id: ['identificador único da feição em todas as camadas', ''],
    codigo: ['código oficial da fonte (IBGE, CNUC, FUNAI)', ''],
    nome: ['nome da feição', ''],
    uf: ['sigla do estado; nas UCs e TIs em mais de um estado, o primeiro; vazio nos biomas', ''],
  };

  function quandoVazio(c) {
    if (c.bloco === 'clima') return 'sem série de clima atualizada (biomas não têm clima; municípios aguardam o arquivo novo)';
    if (c.bloco === 'focos' || c.id === 'focos_ranque') return 'sem foco de calor no período';
    if (c.bloco === 'eventos') return c.id === 'ev_dur_media' ? 'menos de 5 eventos ou nenhum evento' : 'nenhum evento em 2025';
    if (c.bloco === 'gfa' || /^(n_incendios|tam_|taxa_)/.test(c.id)) return 'sem incêndio no período ou sem média na série';
    return 'sem área queimada na série ou fora do processamento (nulo não é zero)';
  }

  function dicionario(campos) {
    const escolhidos = CAMPOS.filter(c => campos.includes(c.id));
    const linhas = ID_COLUNAS.map(k => [k, ID_DESC[k][0], ID_DESC[k][1], 'identificação', '', ''])
      .concat(escolhidos.map(c => [c.coluna, c.rotulo + ' — ' + c.descricao, c.unidade,
        BLOCOS.find(b => b.id === c.bloco).rotulo, c.fonte, quandoVazio(c)]));
    return { colunas: ['coluna', 'descricao', 'unidade', 'bloco', 'fonte', 'quando_vazio'], linhas };
  }

  function textoLeia(o) {
    return [
      'Fogo em Foco 2025-2026 — dados baixados da plataforma',
      '',
      'Período: março de 2025 a fevereiro de 2026 (eventos de fogo: janeiro a dezembro de 2025).',
      'Gerado em ' + o.geradoEm + '.',
      '',
      'Arquivos',
      '- tabela principal (.csv): uma linha por área, com as variáveis escolhidas.',
      '- dicionario.csv: o que é cada coluna, unidade, fonte e o que significa célula vazia.',
      '- series_*.csv (se pedidas): séries em formato longo, uma linha por área e por ano ou mês.',
      '',
      'Formato: CSV com separador vírgula, ponto decimal e codificação UTF-8.',
      'Célula vazia significa dado ausente, nunca zero.',
      '',
      'Como abrir no Excel em português: Dados > Obter dados > De texto/CSV, escolher',
      'delimitador "Vírgula" e, em Transformar dados, a localidade "Inglês (Estados Unidos)"',
      'para os números com ponto decimal.',
      '',
      'Fontes: MODIS MCD64A1 (área queimada em vegetação com pelo menos 30% de cobertura',
      'arbórea); Global Fire Atlas; INPE (focos de calor e eventos de fogo); ERA5 (clima,',
      'média histórica de 2003-2024). Ranque: posição do período na série de 24 períodos,',
      '1 = maior registro desde 2002.',
      '',
      'Como citar:',
      CITACAO,
      '',
    ].join('\r\n');
  }

  FEFDownload.CITACAO = CITACAO;
  FEFDownload.dicionario = dicionario;
  FEFDownload.textoLeia = textoLeia;
  const SERIE_COLUNAS = {
    gfa: { tempo: ['ano_inicio'], campos: [['n_incendios', 'n_incendios'], ['tam_max', 'tam_max'], ['taxa_max', 'taxa_max'],
                                          ['tam_p95', 'tam_p95'], ['taxa_p95', 'taxa_p95']] },
    clima: { tempo: ['ano', 'mes'], campos: [['t', 't_media_c'], ['t_media', 't_media_hist_c'], ['t_min', 't_min_c'],
      ['t_min_media', 't_min_hist_c'], ['t_max', 't_max_c'], ['t_max_media', 't_max_hist_c'],
      ['p', 'precipitacao_mm'], ['p_media', 'precipitacao_hist_mm']] },
    eventos: { tempo: ['ano', 'mes'], campos: [['queimada', 'queimada'], ['possivel_incendio', 'possivel_incendio'],
      ['incendio', 'incendio'], ['atividade_antropica', 'atividade_antropica']], total: 'total' },
  };
  // Clima: marco do ano inicial a fevereiro do seguinte. Eventos: janeiro a dezembro de 2025.
  const MESES_CLIMA = [[2025, 3], [2025, 4], [2025, 5], [2025, 6], [2025, 7], [2025, 8], [2025, 9],
                       [2025, 10], [2025, 11], [2025, 12], [2026, 1], [2026, 2]];

  function num(v) {
    return v === null || v === undefined || !Number.isFinite(v) ? null : v;
  }

  // tipo: 'gfa' | 'clima' | 'eventos'; series: { rid: objeto da serie }
  function seriesLongas(tipo, rotuloCamada, feicoes, series) {
    const def = SERIE_COLUNAS[tipo];
    const colunas = ['camada', 'region_id', 'nome'].concat(def.tempo, def.campos.map(c => c[1]), def.total ? [def.total] : []);
    const linhas = [];
    for (const [rid, r] of feicoes) {
      const s = series[rid];
      if (!s) continue;
      const n = tipo === 'gfa' ? (s.ano || []).length : 12;
      for (let i = 0; i < n; i++) {
        const tempo = tipo === 'gfa' ? [s.ano[i]] : (tipo === 'clima' ? MESES_CLIMA[i] : [2025, i + 1]);
        const vals = def.campos.map(([k]) => num((s[k] || [])[i]));
        const extra = def.total ? [vals.reduce((a, b) => a + (b || 0), 0)] : [];
        linhas.push([rotuloCamada, String(rid), r.nome].concat(tempo, vals, extra));
      }
    }
    return { colunas, linhas };
  }

  FEFDownload.seriesLongas = seriesLongas;
  const TABELA_CRC = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // arquivos: [{ nome, texto, bom? }] -> Uint8Array de um .zip sem compressao
  function zipar(arquivos, data) {
    const enc = new TextEncoder();
    const d = data || new Date();
    const hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const dia = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const partes = [], central = [];
    let pos = 0;
    for (const a of arquivos) {
      const nome = enc.encode(a.nome);
      const corpo = enc.encode(a.texto);
      const dados = a.bom ? new Uint8Array([0xEF, 0xBB, 0xBF, ...corpo]) : corpo;
      const crc = crc32(dados);
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
      loc.setUint16(8, 0, true); loc.setUint16(10, hora, true); loc.setUint16(12, dia, true);
      loc.setUint32(14, crc, true); loc.setUint32(18, dados.length, true); loc.setUint32(22, dados.length, true);
      loc.setUint16(26, nome.length, true); loc.setUint16(28, 0, true);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true); cen.setUint16(10, 0, true); cen.setUint16(12, hora, true);
      cen.setUint16(14, dia, true); cen.setUint32(16, crc, true); cen.setUint32(20, dados.length, true);
      cen.setUint32(24, dados.length, true); cen.setUint16(28, nome.length, true);
      cen.setUint32(42, pos, true);
      partes.push(new Uint8Array(loc.buffer), nome, dados);
      central.push(new Uint8Array(cen.buffer), nome);
      pos += 30 + nome.length + dados.length;
    }
    const tamCentral = central.reduce((s, p) => s + p.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true); fim.setUint16(8, arquivos.length, true); fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true); fim.setUint32(16, pos, true);
    const tudo = partes.concat(central, [new Uint8Array(fim.buffer)]);
    const out = new Uint8Array(tudo.reduce((s, p) => s + p.length, 0));
    let o = 0;
    for (const p of tudo) { out.set(p, o); o += p.length; }
    return out;
  }

  FEFDownload.crc32 = crc32;
  FEFDownload.zipar = zipar;
})();

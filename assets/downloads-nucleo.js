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
})();

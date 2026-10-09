/* Plataforma do Fogo em Foco.
 *
 * Le os arquivos de plataforma/dados/, gerados pelos scripts em codigos/.
 * A chave de tudo e o region_id, que a geometria guarda no campo "rid".
 *
 * Quatro estados de dado, desenhados de formas diferentes:
 *   ok           tem serie historica e ranque
 *   sem_fogo     esta na tabela, mas nunca queimou na serie. E zero de verdade.
 *   fora         foi analisado e ficou fora da tabela de ranque, provavelmente por ser
 *                menor que o pixel do sensor.
 *   sem_analise  nao chegou a ser analisado. So nos assentamentos: o INCRA publica 8.217
 *                no Brasil e a camada processada tem 2.429, em doze estados.
 *
 * Esses estados descrevem a area queimada. Os focos de calor vem de outra tabela, que
 * so lista quem teve foco no periodo: ali o nulo quer dizer "fora da tabela de focos",
 * independente do estado_dado.
 */

const DADOS = 'dados/';

// Carimbo do conteudo de dados/, reescrito por 11_versionar_assets.py. Os JSONs e os
// TopoJSONs sao buscados com fetch e o navegador os guarda em cache como qualquer outro
// arquivo: sem este carimbo, trocar uma camada nao chega a quem ja visitou a pagina.
const VERSAO_DADOS = 'f8b551d0';

const CAMADAS = [
  { id: 'UF',              rotulo: 'Estados',                 geo: 'uf.json',             tipo: 'geojson',  filtravel: false },
  { id: 'Municipios',      rotulo: 'Municípios',              geo: 'municipios.json',    tipo: 'topojson', filtravel: true  },
  { id: 'Biomas',          rotulo: 'Biomas',                  geo: 'biomas.json',         tipo: 'geojson',  filtravel: false },
  { id: 'UCs',             rotulo: 'Unidades de conservação', geo: 'ucs.json',           tipo: 'topojson', filtravel: true  },
  { id: 'TerrasIndigenas', rotulo: 'Terras indígenas',        geo: 'tis.json',           tipo: 'topojson', filtravel: true  },
  // Assentamentos ficaram fora desta edicao: a analise cobriu 2.429 das 8.217 feicoes
  // do INCRA, em doze estados. Para trazer de volta, descomente aqui e tire a camada de
  // CAMADAS_OCULTAS em codigos/07_preparar_dados_web.py e 09_validar_dados_web.py.
  // { id: 'Assentamentos',   rotulo: 'Assentamentos',           geo: 'assentamentos.json', tipo: 'topojson', filtravel: true  },
];

// O menu tem os ranques juntos, no topo: e a leitura principal do relatorio e a unica
// escala comum a todas as fontes. As outras variaveis ficam no bloco da sua fonte, na
// mesma ordem das figuras do relatorio. "fonte" diz de qual tabela vem o dado, e com
// ela a regra do que e "sem dado"; "grupo" e so a posicao no menu.
// "destaque" acompanha o numero grande no topo do painel direito.
const GRUPOS = [
  { id: 'ranques', rotulo: 'Ranques na série histórica' },
  { id: 'aq',      rotulo: 'Área queimada (MODIS)' },
  { id: 'gfa',     rotulo: 'Métricas do fogo (GFA)' },
  { id: 'clima',   rotulo: 'Clima (temperatura e precipitação)' },
  { id: 'focos',   rotulo: 'Focos de calor' },
  { id: 'eventos', rotulo: 'Eventos de fogo' },
];

const VARIAVEIS = [
  // ranques: 1 = maior registro da serie
  { id: 'aq_ranque',          grupo: 'ranques', fonte: 'aq',    rotulo: 'Área queimada',               escala: 'ranque',
    destaque: 'maior área queimada<br>na série desde 2002' },
  { id: 'n_incendios_ranque', grupo: 'ranques', fonte: 'gfa',   rotulo: 'Número de incêndios',         escala: 'ranque',
    destaque: 'maior número de incêndios<br>na série desde 2002' },
  { id: 'tam_max_ranque',     grupo: 'ranques', fonte: 'gfa',   rotulo: 'Tamanho máximo',              escala: 'ranque',
    destaque: 'maior incêndio individual<br>na série desde 2002' },
  { id: 'taxa_max_ranque',    grupo: 'ranques', fonte: 'gfa',   rotulo: 'Taxa de crescimento (máx)',   escala: 'ranque',
    destaque: 'maior taxa de crescimento<br>na série desde 2002' },
  { id: 'tam_p95_ranque',     grupo: 'ranques', fonte: 'gfa',   rotulo: 'Tamanho (P95)',               escala: 'ranque',
    destaque: 'maior tamanho no percentil 95<br>na série desde 2002' },
  { id: 'taxa_p95_ranque',    grupo: 'ranques', fonte: 'gfa',   rotulo: 'Taxa de crescimento (P95)',   escala: 'ranque',
    destaque: 'maior taxa no percentil 95<br>na série desde 2002' },
  { id: 'focos_ranque',       grupo: 'ranques', fonte: 'focos', rotulo: 'Focos de calor',              escala: 'ranque',
    destaque: 'maior número de focos<br>na série desde 2002' },

  // area queimada
  { id: 'aq',          grupo: 'aq', fonte: 'aq', rotulo: 'Área queimada',             escala: 'continua', paleta: 'SEQ',  raiz: true,
    unidade: ' km²', casas: 1, destaque: 'de vegetação<br>queimada no período' },
  { id: 'aq_frac',     grupo: 'aq', fonte: 'aq', rotulo: 'Fração queimada',           escala: 'continua', paleta: 'FRAC', raiz: true,
    unidade: '%', fator: 100, casas: 2, destaque: 'do território<br>queimado no período' },
  { id: 'aq_anom_pct', grupo: 'aq', fonte: 'aq', rotulo: 'Anomalia da área queimada', escala: 'anomalia',
    unidade: '%', casas: 0, destaque: 'em relação à média<br>da série desde 2002' },
  { id: 'mes_pico',    grupo: 'aq', fonte: 'aq', rotulo: 'Mês de pico da anomalia',   escala: 'mes',
    destaque: 'mês do pico da anomalia<br>de área queimada' },

  // GFA, valores do periodo
  { id: 'n_incendios', grupo: 'gfa', fonte: 'gfa', rotulo: 'Número de incêndios',        escala: 'continua', paleta: 'SEQ', raiz: true,
    unidade: '', casas: 0, destaque: 'incêndios individuais<br>no período' },
  { id: 'tam_max',     grupo: 'gfa', fonte: 'gfa', rotulo: 'Tamanho máximo',             escala: 'continua', paleta: 'SEQ', raiz: true,
    unidade: ' km²', casas: 1, destaque: 'o maior incêndio<br>do período' },
  { id: 'taxa_max',    grupo: 'gfa', fonte: 'gfa', rotulo: 'Taxa de crescimento (máx)',  escala: 'continua', paleta: 'SEQ', raiz: true,
    unidade: ' km²/dia', casas: 1, destaque: 'a maior taxa de crescimento<br>do período' },
  { id: 'tam_p95',     grupo: 'gfa', fonte: 'gfa', rotulo: 'Tamanho (P95)',              escala: 'continua', paleta: 'SEQ', raiz: true,
    unidade: ' km²', casas: 1, destaque: 'tamanho no percentil 95<br>dos incêndios do período' },
  { id: 'taxa_p95',    grupo: 'gfa', fonte: 'gfa', rotulo: 'Taxa de crescimento (P95)',  escala: 'continua', paleta: 'SEQ', raiz: true,
    unidade: ' km²/dia', casas: 2, destaque: 'taxa no percentil 95<br>dos incêndios do período' },

  // clima, marco a fevereiro
  { id: 't_periodo', grupo: 'clima', fonte: 'clima', rotulo: 'Temperatura média',            escala: 'continua', paleta: 'TEMP',
    unidade: ' °C', casas: 1, destaque: 'temperatura média<br>no período' },
  { id: 't_dif',     grupo: 'clima', fonte: 'clima', rotulo: 'Temperatura: diferença da média', escala: 'diferenca', paleta: 'DIV',
    unidade: ' °C', casas: 2, destaque: 'em relação à<br>média histórica' },
  { id: 'p_periodo', grupo: 'clima', fonte: 'clima', rotulo: 'Precipitação acumulada',       escala: 'continua', paleta: 'CHUVA',
    unidade: ' mm', casas: 0, destaque: 'de chuva<br>no período' },
  { id: 'p_dif_pct', grupo: 'clima', fonte: 'clima', rotulo: 'Precipitação: diferença da média', escala: 'diferenca', paleta: 'CHUVA_DIV',
    unidade: '%', casas: 0, destaque: 'em relação à<br>média histórica' },

  // focos e eventos
  { id: 'focos',        grupo: 'focos',   fonte: 'focos',   rotulo: 'Número de focos',          escala: 'continua', paleta: 'FOCOS', raiz: true,
    de1: true, unidade: '', casas: 0, destaque: 'focos de calor<br>no período' },
  { id: 'eventos',      grupo: 'eventos', fonte: 'eventos', rotulo: 'Número de eventos',        escala: 'continua', paleta: 'FOCOS', raiz: true,
    de1: true, unidade: '', casas: 0, destaque: `eventos de fogo<br>em 2025` },
  { id: 'ev_dur_media', grupo: 'eventos', fonte: 'eventos', rotulo: 'Duração média dos eventos', escala: 'continua', paleta: 'DUR',
    unidade: ' dias', casas: 1, destaque: 'duração média dos eventos,<br>sem os extremos' },
];

function defAtual() {
  return VARIAVEIS.find(x => x.id === estado.variavel);
}

// Sem dado, conforme a fonte. Devolve null quando ha valor, ou [token de cor, rotulo].
//   aq       os quatro estados_dado da area queimada (ver o cabecalho)
//   gfa      sem incendio no periodo
//   focos    sem foco no periodo (a tabela so lista quem teve foco; zero tambem conta)
//   eventos  sem evento; na duracao, menos de 5 eventos
//   clima    sem serie climatica atualizada (municipios, ate chegar o arquivo completo)
function semDado(reg, def) {
  const v = reg ? reg[def.id] : null;
  const vazio = v === null || v === undefined;
  switch (def.fonte) {
    case 'focos':
      return (!reg || !reg.focos) ? ['--fora', 'sem foco no período'] : (vazio ? ['--fora', 'sem foco no período'] : null);
    case 'eventos':
      if (!reg || !reg.eventos) return ['--fora', 'sem evento de fogo'];
      return vazio ? ['--sem-fogo', 'menos de 5 eventos'] : null;
    case 'gfa':
      return (!reg || !reg.n_incendios || vazio) ? ['--sem-fogo', 'sem incêndio no período'] : null;
    case 'clima':
      return vazio ? ['--sem-analise', 'sem dado de clima'] : null;
    default:
      if (!reg || reg.estado_dado === 'fora') return ['--fora', 'fora do processamento'];
      if (reg.estado_dado === 'sem_analise') return ['--sem-analise', 'sem análise nesta edição'];
      if (reg.estado_dado === 'sem_fogo' || vazio) return ['--sem-fogo', 'sem fogo na série'];
      return null;
  }
}

const MESES_EXTENSO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
                       'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES = ['mar','abr','mai','jun','jul','ago','set','out','nov','dez','jan','fev'];
const PERIODOS = 24;

const estado = {
  meta: null,
  camada: 'UF',
  variavel: 'aq_ranque',
  filtroUf: '',
  atributos: {},
  geometrias: {},
  series: {},
  faixa: null,
  graficos: [],
  gfaMetrica: 'n_incendios',   // metrica do GFA no grafico do painel direito
  camadasPorRid: {},   // rid -> layer do Leaflet, para dar zoom pela busca
  selecionado: null,   // rid aberto no painel direito, para redesenhar ao trocar de variavel
};

let mapa, camadaLeaflet, camadaBase;

/* ---------- utilidades ---------- */

const $ = (s) => document.querySelector(s);

function nf(v, casas = 0) {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

// Acentos fora, minusculas: para a busca casar "Sao Felix" com "São Félix".
function chave(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

async function json(caminho) {
  const r = await fetch(DADOS + caminho + '?v=' + VERSAO_DADOS);
  if (!r.ok) throw new Error('Não foi possível carregar ' + caminho);
  return r.json();
}

function ocupado(ligado, texto) {
  const el = $('#carregando');
  el.hidden = !ligado;
  if (texto) el.textContent = texto;
}

function avisar(html) {
  const el = $('#carregando');
  el.hidden = false;
  el.classList.add('aviso-grande');
  el.innerHTML = html;
}

// As cores vivem no CSS, para acompanharem o tema sem duplicacao aqui.
function css(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/* ---------- cores ---------- */

// As mesmas escalas das figuras do relatorio (codigos/14_mapas_relatorio.py e
// 16_paineis_relatorio.py, imagem em relatorio_2026/paleta_cores.png). Mudou la, mude aqui.
// Ranque em 14 classes: 1o e 2o com cor propria, de 2 em 2 ate 21-22, e 23 e 24.
const RANQUE = [
  [1, 1, '#26071f'], [2, 2, '#5e0f4e'], [3, 4, '#8a1a10'], [5, 6, '#a8280f'], [7, 8, '#c2380e'],
  [9, 10, '#d64a0d'], [11, 12, '#e65410'], [13, 14, '#f16c1b'], [15, 16, '#f8912f'], [17, 18, '#fbac4c'],
  [19, 20, '#fcc568'], [21, 22, '#fddc84'], [23, 23, '#d8e2f0'], [24, 24, '#a9b7d5'],
];
// Anomalia da area queimada, em 10 classes (limite superior de cada uma)
const ANOMALIA = [
  [-100, '#1b1e5d', '−100'], [-50, '#4a5aa0', '−50'], [-15, '#8f9fc8', '−15'], [0, '#ccdcf5', '0'],
  [15, '#fbe4b4', '15'], [50, '#fcb95a', '50'], [150, '#f8912f', '150'], [300, '#d64a0d', '300'],
  [500, '#8a1a10', '500'], [Infinity, '#5e0f4e', ''],
];
// Mes de pico, de marco a fevereiro: cianos no outono, a rampa quente na seca, roxos e azuis no fim
const MESES_COR = ['#b5e8ef', '#4cc3d2', '#0f8fa3', '#fddc84', '#fcb95a', '#f8912f',
                   '#d64a0d', '#8a1a10', '#5e0f4e', '#a35d8f', '#4a5aa0', '#2b3080'];
const PALETAS = {
  SEQ:       ['#fddc84', '#fcb95a', '#f8912f', '#ee5911', '#b8300f', '#8a1a10'],
  FRAC:      ['#f3e9f1', '#dcc1d8', '#bf92bb', '#a35c8f', '#7d3270', '#5d0f4e', '#2e0a28'],
  FOCOS:     ['#fde4dc', '#f8b4a0', '#ee7b62', '#d8402e', '#a81c1c', '#6b0d12'],
  DUR:       ['#fdf0d2', '#fcc977', '#f8912f', '#d64a0d', '#8a1a10', '#4a0c1c'],
  TEMP:      ['#fbe4b4', '#fcb95a', '#f8912f', '#d64a0d', '#8a1a10', '#5e0f4e'],
  CHUVA:     ['#e3e9f4', '#c3cee6', '#8f9fc8', '#4a5aa0', '#2b3080', '#1b1e5d'],
  DIV:       ['#8f9fc8', '#a2b1d6', '#b4c3e3', '#cbd7eb', '#f2eee6', '#f9b96f', '#e16f24', '#a72a1b', '#5e0f4e'],
  CHUVA_DIV: ['#8a1a10', '#ba380e', '#e16923', '#fbb758', '#f1ede8', '#bec9e3', '#6a78b2', '#384286', '#1b1e5d'],
};

function corRanque(v) {
  for (const [a, b, c] of RANQUE) if (v >= a && v <= b) return c;
  return RANQUE[RANQUE.length - 1][2];
}

function corAnomalia(v) {
  for (const [lim, c] of ANOMALIA) if (v <= lim) return c;
  return ANOMALIA[ANOMALIA.length - 1][1];
}

function corMes(m) {
  return MESES_COR[(m + 9) % 12];      // 3 (marco) -> 0, 2 (fevereiro) -> 11
}

// Interpola numa paleta de paradas igualmente espacadas, t entre 0 e 1.
function interpolar(paradas, t) {
  t = Math.min(1, Math.max(0, t));
  const x = t * (paradas.length - 1);
  const i = Math.min(paradas.length - 2, Math.floor(x));
  const f = x - i;
  const a = paradas[i].match(/\w\w/g).map(h => parseInt(h, 16));
  const b = paradas[i + 1].match(/\w\w/g).map(h => parseInt(h, 16));
  return '#' + a.map((c, k) => Math.round(c + (b[k] - c) * f).toString(16).padStart(2, '0')).join('');
}

// Posicao na escala continua. Contagens e areas usam raiz quadrada (sao muito
// assimetricas: sem isso quase tudo cai no primeiro tom); as diferencas sao simetricas
// em torno do zero.
function posicao(v, def, faixa) {
  const [lo, hi] = faixa;
  if (def.escala === 'diferenca') return hi > 0 ? (v + hi) / (2 * hi) : 0.5;
  if (hi <= lo) return 0;
  const t = (v - lo) / (hi - lo);
  return def.raiz ? Math.sqrt(Math.max(0, t)) : t;
}

function corDe(reg) {
  const def = defAtual();
  const vazio = semDado(reg, def);
  if (vazio) return css(vazio[0]);
  const v = reg[def.id];
  if (def.escala === 'ranque') return corRanque(v);
  if (def.escala === 'anomalia') return corAnomalia(v);
  if (def.escala === 'mes') return corMes(v);
  return estado.faixa ? interpolar(PALETAS[def.paleta], posicao(v * (def.fator || 1), def, estado.faixa))
                      : PALETAS[def.paleta][0];
}

function ehTopo(reg) {
  const def = defAtual();
  return def && def.escala === 'ranque' && !semDado(reg, def) && (reg[def.id] === 1 || reg[def.id] === 2);
}

/* ---------- carga ---------- */

async function garantirCamada(id) {
  const def = CAMADAS.find(c => c.id === id);
  if (!estado.atributos[id]) estado.atributos[id] = await json('atributos/' + id + '.json');
  if (!estado.geometrias[id]) {
    const bruto = await json('geo/' + def.geo);
    estado.geometrias[id] = def.tipo === 'topojson'
      ? topojson.feature(bruto, bruto.objects[Object.keys(bruto.objects)[0]])
      : bruto;
  }
}

async function serie(tipo, camada, chunk) {
  const ch = tipo + '/' + camada + '/' + (chunk || '_');
  if (estado.series[ch]) return estado.series[ch];
  const caminho = chunk ? `series/${tipo}/${camada}/${chunk}.json` : `series/${tipo}/${camada}.json`;
  try { estado.series[ch] = await json(caminho); }
  catch (e) { estado.series[ch] = {}; }
  return estado.series[ch];
}

function visiveis() {
  const atrib = estado.atributos[estado.camada];
  if (!estado.filtroUf) return atrib;
  const fora = {};
  for (const [rid, reg] of Object.entries(atrib)) {
    if ((reg.chunk || reg.uf) === estado.filtroUf) fora[rid] = reg;
  }
  return fora;
}

function calcularFaixa() {
  const def = defAtual();
  if (def.escala !== 'continua' && def.escala !== 'diferenca') { estado.faixa = null; return; }
  const f = def.fator || 1;
  const vals = Object.values(visiveis())
    .filter(r => !semDado(r, def))
    .map(r => r[def.id] * f)
    .filter(v => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!vals.length) { estado.faixa = null; return; }
  if (def.escala === 'diferenca') {
    // simetrica em torno do zero, pelo maior afastamento
    const m = Math.max(Math.abs(vals[0]), Math.abs(vals[vals.length - 1])) || 1;
    estado.faixa = [-m, m];
  } else if (def.de1) {
    // contagens (focos, eventos): de 1 ao maximo, como no relatorio
    estado.faixa = [1, Math.max(2, vals[vals.length - 1])];
  } else if (def.paleta === 'TEMP' || def.paleta === 'DUR') {
    estado.faixa = def.paleta === 'DUR'
      ? [1, Math.max(2, vals[Math.floor(vals.length * 0.99)])]
      : [vals[0], vals[vals.length - 1]];
  } else {
    // percentil 98 no topo: sem isso um unico municipio enorme achata todo o resto
    estado.faixa = [0, vals[Math.floor(vals.length * 0.98)] || vals[vals.length - 1]];
  }
}

/* ---------- mapa ---------- */

function desenhar(ajustarZoom) {
  if (camadaLeaflet) camadaLeaflet.remove();
  const atrib = estado.atributos[estado.camada];
  const mostrar = visiveis();
  const linha = css('--linha-mapa');
  const foraOp = parseFloat(css('--fora-opacidade')) || 0.25;
  const grossa = estado.camada === 'UF' || estado.camada === 'Biomas';
  estado.camadasPorRid = {};

  camadaLeaflet = L.geoJSON(estado.geometrias[estado.camada], {
    filter: (f) => !estado.filtroUf || !!mostrar[String(f.properties.rid)],
    style: (f) => {
      const reg = atrib[String(f.properties.rid)];
      const apagada = reg && reg.estado_dado === 'fora' && defAtual().fonte === 'aq';
      return {
        fillColor: corDe(reg),
        fillOpacity: apagada ? foraOp : 0.85,
        color: ehTopo(reg) ? css('--linha-top') : linha,
        weight: ehTopo(reg) ? 1.4 : (grossa ? 1.1 : 0.35), opacity: 0.9,
      };
    },
    onEachFeature: (f, layer) => {
      const rid = String(f.properties.rid);
      const reg = atrib[rid];
      if (!reg) return;
      estado.camadasPorRid[rid] = layer;
      layer.bindTooltip(dica(reg), { className: 'dica', sticky: true });
      layer.on('click', () => selecionar(rid));
      // Duplo clique num estado abre os municipios dele (camada de municipios filtrada)
      if (estado.camada === 'UF') layer.on('dblclick', (e) => { L.DomEvent.stop(e); abrirMunicipios(reg.uf); });
      layer.on('mouseover', () => layer.setStyle({ weight: 2, color: css('--realce') }));
      layer.on('mouseout', () => camadaLeaflet.resetStyle(layer));
    },
  }).addTo(mapa);

  if (ajustarZoom) {
    const b = camadaLeaflet.getBounds();
    if (b.isValid()) mapa.fitBounds(b, { padding: [20, 20] });
  }
}

function valorTexto(reg, def) {
  const v = reg[def.id];
  if (def.escala === 'ranque') return v + 'º';
  if (def.escala === 'mes') return MESES[(v + 9) % 12];
  const casas = def.casas === undefined ? 1 : def.casas;
  const bruto = v * (def.fator || 1);
  return (def.escala === 'anomalia' || def.escala === 'diferenca' ? comSinal(bruto, casas) : nf(bruto, casas)) + def.unidade;
}

async function abrirMunicipios(uf) {
  await trocarCamada('Municipios');
  trocarFiltro(uf);
}

function dica(reg) {
  const def = defAtual();
  const vazio = semDado(reg, def);
  const valor = vazio ? vazio[1] : valorTexto(reg, def);
  return `<b>${reg.nome}${reg.uf ? ' · ' + reg.uf : ''}</b><em>${def.rotulo.toLowerCase()}: ${valor}</em>` +
    (estado.camada === 'UF' ? '<small class="dica-acao">duplo clique: ver os municípios</small>' : '');
}

function trocarBase() {
  // Esri World Gray Canvas: cinza neutro, sem rotulo pesado, e sem chave de API.
  // O endpoint gratuito da CARTO passou a carimbar "API KEY REQUIRED" nos tiles.
  if (camadaBase) camadaBase.remove();
  const camada = css('--basemap') || 'World_Light_Gray_Base';
  camadaBase = L.tileLayer(
    `https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/${camada}/MapServer/tile/{z}/{y}/{x}`,
    {
      attribution: 'Mapa base: Esri, HERE, Garmin, &copy; OpenStreetMap e colaboradores',
      maxZoom: 12,
      opacity: parseFloat(css('--basemap-opacidade')) || 0.55,
    }
  ).addTo(mapa);
  if (camadaBase.bringToBack) camadaBase.bringToBack();
}

/* ---------- painel ---------- */

async function selecionar(rid, comZoom) {
  const reg = estado.atributos[estado.camada][rid];
  if (!reg) return;
  estado.selecionado = rid;
  const gfa = await serie('gfa', estado.camada, reg.chunk || null);
  const clima = await serie('clima', estado.camada, reg.chunk || null);
  const eventos = await serie('eventos', estado.camada, reg.chunk || null);
  render(reg, gfa[rid], clima[rid], eventos[rid]);
  const layer = estado.camadasPorRid[rid];
  if (comZoom && layer && layer.getBounds) mapa.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 9 });
  if (layer) layer.openTooltip();
}

// O numero grande no topo do painel direito mostra a variavel que esta selecionada, e
// nao sempre o ranque de area queimada. Sem isso, quem troca para "tamanho maximo" ve o
// mapa mudar e o destaque continuar falando de outra coisa.
// Numa anomalia, "44%" e "-42%" sao lados opostos da media, e so um deles carrega sinal.
// Com o "+" explicito os dois se leem sem depender de lembrar a convencao.
function comSinal(v, casas) {
  return (v > 0 ? '+' : '') + nf(v, casas);
}


// Ranque que acompanha a variavel do mapa: ela mesma, se for ranque; o ranque da mesma
// metrica (tam_p95 -> tam_p95_ranque); o da fonte (area queimada, focos); e, nas variaveis
// sem ranque (clima, eventos), o de area queimada.
function ranqueDaVariavel(def) {
  if (def.escala === 'ranque') return def;
  const mesmo = VARIAVEIS.find(v => v.id === def.id + '_ranque');
  if (mesmo) return mesmo;
  const daFonte = VARIAVEIS.find(v => v.escala === 'ranque' && v.fonte === def.fonte);
  return daFonte || VARIAVEIS.find(v => v.id === 'aq_ranque');
}

// Topo do painel: o ranque ligado a variavel do mapa em destaque e, embaixo, os outros
// ranques menores, cada um na cor da sua classe.
function destaqueDe(reg) {
  const def = defAtual();
  if (!def) return '';
  const principal = ranqueDaVariavel(def);
  const ranques = VARIAVEIS.filter(v => v.escala === 'ranque');
  const grande = semDado(reg, principal)
    ? `<div class="destaque"><span class="n vazio-n">—</span><span class="rot">${principal.rotulo}:
         ${semDado(reg, principal)[1]}</span></div>`
    : `<div class="destaque"><span class="n">${reg[principal.id]}º</span>
         <span class="rot">${principal.destaque}</span></div>`;
  const outros = ranques.filter(v => v.id !== principal.id).map(v => {
    const vazio = semDado(reg, v);
    const r = reg[v.id];
    const cor = vazio ? null : corRanque(r);
    // so o numero, na cor da classe; misturado ao texto para o amarelo e o azul claro do
    // fim da escala continuarem legiveis no fundo claro (e o quase preto, no escuro)
    return `<div class="ranque-mini${vazio ? ' sem' : ''}" title="${v.rotulo}${vazio ? ': ' + vazio[1] : ''}">
      <span class="num" style="color:${vazio ? 'var(--suave)' : `color-mix(in srgb, ${cor} 72%, var(--texto))`}">${
        vazio ? '—' : r + 'º'}</span><small>${v.rotulo}</small></div>`;
  }).join('');
  return grande + `<div class="ranques-mini">${outros}</div>`;
}

function render(reg, sgfa, sclima, seventos) {
  estado.graficos.forEach(g => g.destroy());
  estado.graficos = [];

  const alerta = reg.estado_dado === 'sem_analise'
    ? `<div class="bloco"><div class="aviso-dado"><b>Sem análise nesta edição.</b>
       O INCRA publica 8.217 assentamentos no Brasil, e a camada processada nesta edição
       cobre 2.429, em doze estados. Este assentamento aparece no mapa para o país ficar
       completo, mas ainda não tem ranque, métricas de fogo nem série climática.</div></div>`
    : reg.estado_dado === 'fora'
    ? `<div class="bloco"><div class="aviso-dado"><b>Sem dado de área queimada.</b>
       Esta feição não entrou na tabela de ranque, provavelmente por ser menor que o
       pixel de 500 m do sensor. Isso não significa que não tenha queimado.</div></div>`
    : reg.estado_dado === 'sem_fogo'
    ? `<div class="bloco"><div class="aviso-dado"><b>Sem registro de fogo em vegetação</b>
       em nenhum ano da série. Por isso não há ranque.</div></div>`
    : '';

  const destaque = destaqueDe(reg);

  $('#painel').innerHTML = `
    <div class="titulo-sel">
      <h3>${reg.nome}</h3>
      <p>${reg.uf ? reg.uf + ' · ' : ''}código ${reg.cod}</p>
      ${destaque}
    </div>
    ${alerta}
    <div class="bloco">
      <h2>Área queimada em vegetação</h2>
      <div class="numeros-sel">
        <div><b>${nf(reg.aq, 1)}</b><small>km² no período</small></div>
        <div><b>${nf(reg.aq_media, 1)}</b><small>km², média da série</small></div>
        <div><b>${reg.aq_anom_pct === null ? '—' : comSinal(reg.aq_anom_pct, 0) + '%'}</b><small>contra a média</small></div>
        <div><b>${reg.aq_frac === null ? '—' : nf(reg.aq_frac * 100, 2) + '%'}</b><small>do território</small></div>
        ${reg.estado_dado === 'ok' && reg.mes_pico ? `<div class="largo"><b><i class="amostra" style="background:${
          corMes(reg.mes_pico)}"></i>${MESES_EXTENSO[reg.mes_pico - 1]}</b><small>mês do pico da anomalia de área queimada</small></div>` : ''}
      </div>
    </div>
    <div class="bloco" id="bloco-gfa">${blocoGfa(reg)}</div>
    ${reg.focos_ranque !== undefined ? `
    <div class="bloco">
      <h2>Focos de calor</h2>
      ${reg.focos_ranque === null
        ? `<p class="nota">Fora da tabela de focos de calor deste período.</p>`
        : `<div class="numeros-sel">
             <div><b>${nf(reg.focos)}</b><small>focos no período</small></div>
             <div><b>${reg.focos_ranque}º</b><small>posição na série de ${PERIODOS} anos</small></div>
           </div>`}
    </div>` : ''}
    ${blocoEventos(reg, seventos)}
    <div class="bloco">
      <h2>Clima · março a fevereiro</h2>
      ${climaDaCamada().atualizado ? '' : `<div class="aviso-dado">Série da versão anterior, com a média de
        ${climaDaCamada().ref}: o arquivo mensal atualizado deste recorte ainda não chegou. Quando chegar, a
        série passa a usar a média de ${estado.meta.clima_referencia}, como no relatório.</div>`}
      <p class="chaves">
        <span><i class="cheia"></i>período ${estado.meta.periodo_curto}</span>
        <span><i class="tracejada"></i>média ${climaDaCamada().ref}</span>
      </p>
      <div class="grafico"><canvas id="g-temp"></canvas></div>
      <div class="grafico grafico-dif"><canvas id="g-temp-dif"></canvas></div>
      <div class="grafico"><canvas id="g-chuva"></canvas></div>
      <div class="grafico grafico-dif"><canvas id="g-chuva-dif"></canvas></div>
    </div>
    <div class="bloco">
      <p class="nota">Toda a área queimada aqui se refere a vegetação com pelo menos
      30% de cobertura arbórea. Não é a área queimada total.</p>
    </div>`;

  estado.sgfa = sgfa;
  estado.regAberto = reg;
  ligarGfa();
  if (sgfa) grafGfa(sgfa, reg);
  if (sclima) {
    grafClima(sclima, true); grafDif(sclima, true);
    grafClima(sclima, false); grafDif(sclima, false);
  }
  if (seventos && reg.eventos) grafEventos(seventos);
}

function baseGraf() {
  // Tooltip com as cores do tema: um gráfico em HTML é interativo por natureza,
  // e sem o valor sob o cursor o leitor fica adivinhando altura de barra.
  const dica = {
    backgroundColor: css('--escuro'), titleColor: css('--sobre-escuro'),
    bodyColor: css('--sobre-escuro'), borderWidth: 0, padding: 9,
    cornerRadius: 6, displayColors: false,
    titleFont: { family: 'Instrument Sans', size: 12 },
    bodyFont: { family: 'Instrument Sans', size: 13 },
  };
  return {
    responsive: true, maintainAspectRatio: false, locale: 'pt-BR',
    interaction: { mode: 'index', intersect: false },
    // barra sob o mouse ganha um contorno fino na cor do texto, sem mudar o preenchimento
    // (a cor da barra carrega informacao: periodo atual, sinal da diferenca, tipo de evento)
    elements: { bar: {
      hoverBorderWidth: 1.5, hoverBorderColor: css('--texto'), borderSkipped: false,
      hoverBackgroundColor: (c) => { const b = c.dataset.backgroundColor; return Array.isArray(b) ? b[c.dataIndex] : b; },
    } },
    plugins: { legend: { display: false }, tooltip: dica },
    scales: {
      x: { grid: { display: false }, ticks: { color: css('--suave'), font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 } },
      y: { grid: { color: css('--grade-grafico') }, ticks: { color: css('--suave'), font: { size: 10 } }, border: { display: false } },
    },
  };
}

// As cinco metricas do GFA no painel. O grafico segue a metrica do mapa quando ela e do
// GFA (valor ou ranque); nas outras variaveis fica a ultima escolhida, e os botoes acima
// do grafico trocam a metrica sem mexer no mapa.
const METRICAS_GFA = [
  { id: 'n_incendios', curto: 'Nº de incêndios', titulo: 'Número de incêndios', unidade: '', casas: 0 },
  { id: 'tam_max',     curto: 'Tam. máx.',       titulo: 'Tamanho máximo', unidade: ' km²', casas: 1 },
  { id: 'taxa_max',    curto: 'Taxa máx.',       titulo: 'Taxa de crescimento (máx)', unidade: ' km²/dia', casas: 1 },
  { id: 'tam_p95',     curto: 'Tam. P95',        titulo: 'Tamanho no percentil 95', unidade: ' km²', casas: 1 },
  { id: 'taxa_p95',    curto: 'Taxa P95',        titulo: 'Taxa de crescimento (P95)', unidade: ' km²/dia', casas: 2 },
];

function metricaGfaDoMapa() {
  const base = estado.variavel.replace(/_ranque$/, '');
  return METRICAS_GFA.some(m => m.id === base) ? base : null;
}

function blocoGfa(reg, sincronizar = true) {
  const doMapa = metricaGfaDoMapa();
  if (sincronizar && doMapa) estado.gfaMetrica = doMapa;
  const m = METRICAS_GFA.find(x => x.id === estado.gfaMetrica);
  const v = reg[m.id], media = reg[m.id + '_media'], dp = reg[m.id + '_dp'];
  const an = reg[m.id + '_anom_pct'], z = reg[m.id + '_anom_dp'], rk = reg[m.id + '_ranque'];
  const botoes = METRICAS_GFA.map(x => `<button type="button" class="chip" data-gfa="${x.id}"
      aria-pressed="${x.id === m.id}">${x.curto}</button>`).join('');
  const temValor = v !== null && v !== undefined && v > 0;
  return `
    <h2>Métrica de fogo · ${m.titulo}</h2>
    <div class="chips" role="group" aria-label="Métrica do Global Fire Atlas">${botoes}</div>
    <div class="numeros-sel numeros-gfa">
      <div><b>${temValor ? nf(v, m.casas) : '—'}</b><small>${m.unidade.trim() || 'incêndios'} em ${estado.meta.periodo_curto}</small></div>
      <div><b>${media === null || media === undefined ? '—' : nf(media, m.casas)}<em> ± ${dp === null || dp === undefined ? '—' : nf(dp, m.casas)}</em></b>
           <small>média ± desvio padrão anual</small></div>
      <div><b>${temValor && an !== null && an !== undefined ? comSinal(an, 0) + '%' : '—'}</b>
           <small>${temValor && z !== null && z !== undefined ? comSinal(z, 1) + ' dp · ' : ''}anomalia</small></div>
      <div><b>${temValor && rk ? rk + 'º' : '—'}</b><small>na série desde 2002</small></div>
    </div>
    <div class="grafico"><canvas id="g-gfa"></canvas></div>
    <p class="nota">Global Fire Atlas, períodos de março a fevereiro pelo ano de início. Faixa clara:
    média ± 1 desvio padrão de 2002-03 a 2024-25; linha tracejada: a média. O período atual vem na cor da
    sua anomalia.</p>`;
}

function ligarGfa() {
  document.querySelectorAll('#bloco-gfa .chip').forEach(b => {
    b.onclick = () => {
      estado.gfaMetrica = b.dataset.gfa;
      estado.graficos = estado.graficos.filter(g => { if (g.canvas.id === 'g-gfa') { g.destroy(); return false; } return true; });
      // o botao manda no grafico; ao trocar a variavel do mapa, o painel volta a segui-la
      $('#bloco-gfa').innerHTML = blocoGfa(estado.regAberto, false);
      ligarGfa();
      if (estado.sgfa) grafGfa(estado.sgfa, estado.regAberto);
    };
  });
}

function grafGfa(s, reg) {
  const m = METRICAS_GFA.find(x => x.id === estado.gfaMetrica);
  const vals = s[m.id] || [];
  const ultimo = s.ano.length - 1;
  const media = reg[m.id + '_media'], dp = reg[m.id + '_dp'], an = reg[m.id + '_anom_pct'];
  const temFaixa = media !== null && media !== undefined && dp !== null && dp !== undefined;
  const corAtual = an !== null && an !== undefined ? corAnomalia(an) : css('--laranja');
  const neutro = css('--serie-media') || '#aaa39a';
  const base = baseGraf();
  const n = s.ano.length;
  const datasets = [{
    type: 'bar', data: vals, borderRadius: 2, order: 2,
    categoryPercentage: 0.86, barPercentage: 0.9,
    backgroundColor: s.ano.map((_, i) => i === ultimo ? corAtual : neutro),
  }];
  if (temFaixa) {
    const faixa = 'rgba(248,145,47,.16)';
    datasets.push(
      { type: 'line', data: Array(n).fill(Math.max(0, media - dp)), borderWidth: 0, pointRadius: 0, fill: false, order: 3 },
      { type: 'line', data: Array(n).fill(media + dp), borderWidth: 0, pointRadius: 0, fill: '-1', backgroundColor: faixa, order: 3 },
      { type: 'line', data: Array(n).fill(media), borderColor: css('--suave'), borderWidth: 1, borderDash: [4, 3], pointRadius: 0, order: 1 },
    );
  }
  estado.graficos.push(new Chart($('#g-gfa'), {
    data: { labels: s.ano.map(a => `${a}-${String(a + 1).slice(2)}`), datasets },
    options: {
      ...base,
      scales: {
        ...base.scales,
        x: { ...base.scales.x, ticks: { ...base.scales.x.ticks,
             // de 3 em 3 anos contados a partir do ultimo (os recentes ficam regulares), e
             // sempre o primeiro; o que encostaria no primeiro sai
             autoSkip: false, maxRotation: 0,
             callback(v, i) { const r = this.getLabelForValue(v);
               return i === 0 || ((n - 1 - i) % 3 === 0 && i > 2) ? r.slice(0, 4) : ''; } } },
        y: { ...base.scales.y, beginAtZero: true },
      },
      plugins: {
        ...base.plugins,
        tooltip: { ...base.plugins.tooltip, filter: (it) => it.datasetIndex === 0, callbacks: {
          title: (it) => 'Período ' + it[0].label,
          label: (it) => nf(it.parsed.y, m.casas) + (m.unidade || ' incêndios'),
        } },
      },
    },
  }));
}

// Eventos de fogo do INPE: numeros do ano e o grafico de barras empilhadas por mes de
// inicio e tipo, como na figura do relatorio.
const TIPOS_EVENTO = [
  ['queimada', 'queimada', '#fcb95a'], ['possivel_incendio', 'possível incêndio', '#f8912f'],
  ['incendio', 'incêndio', '#b8300f'], ['atividade_antropica', 'atividade antrópica', '#8f9fc8'],
];

function blocoEventos(reg, s) {
  if (!('eventos' in reg)) return '';
  const ev = estado.meta.eventos || {};
  if (!reg.eventos) {
    return `<div class="bloco"><h2>Eventos de fogo · ${ev.ano || 2025}</h2>
      <p class="nota">Nenhum evento de fogo com o centroide nesta área em ${ev.ano || 2025}.</p></div>`;
  }
  return `
    <div class="bloco">
      <h2>Eventos de fogo · ${ev.ano || 2025}</h2>
      <div class="numeros-sel">
        <div><b>${nf(reg.eventos)}</b><small>eventos no ano</small></div>
        <div><b>${reg.ev_dur_media === null || reg.ev_dur_media === undefined ? '—' : nf(reg.ev_dur_media, 1)}</b>
             <small>dias, duração média sem os extremos</small></div>
      </div>
      ${s ? `<div class="grafico grafico-eventos"><canvas id="g-eventos"></canvas></div>
      <p class="chaves chaves-eventos">${TIPOS_EVENTO.map(([, rot, cor]) =>
        `<span><i class="bloco-cor" style="background:${cor}"></i>${rot}</span>`).join('')}</p>` : ''}
      <p class="nota">Eventos por mês de início, atribuídos pelo centroide. A duração média deixa de fora
      os eventos acima de ${nf(ev.corte_dias || 15)} dias (percentil 99 do país) e fica sem valor com menos
      de ${ev.min_eventos || 5} eventos.</p>
    </div>`;
}

function grafEventos(s) {
  const base = baseGraf();
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  estado.graficos.push(new Chart($('#g-eventos'), {
    type: 'bar',
    data: {
      labels: meses,
      datasets: TIPOS_EVENTO.map(([id, rot, cor]) => ({
        label: rot, data: s[id] || [], backgroundColor: cor, stack: 'ev',
        categoryPercentage: 0.82, barPercentage: 0.92,
      })),
    },
    options: {
      ...base,
      scales: {
        x: { ...base.scales.x, stacked: true, ticks: eixoMeses(base) },
        y: { ...base.scales.y, stacked: true, beginAtZero: true },
      },
      plugins: {
        ...base.plugins,
        tooltip: { ...base.plugins.tooltip, displayColors: true, callbacks: {
          title: (it) => mesCompleto(it[0].label),
          label: (it) => `${it.dataset.label}: ${nf(it.parsed.y)}`,
          footer: (it) => 'total: ' + nf(it.reduce((a, x) => a + x.parsed.y, 0)),
        } },
      },
    },
  }));
}

// Referencia da serie de clima da camada aberta. Cada camada guarda a sua em meta.json:
// a municipal fica na versao anterior ate chegar o arquivo completo.
function climaDaCamada() {
  const c = estado.meta.camadas[estado.camada] || {};
  return { ref: c.clima_referencia || estado.meta.clima_referencia, atualizado: c.clima_atualizado !== false };
}

// Diferenca mes a mes em relacao a media historica, em barras, como na figura do relatorio:
// temperatura em °C (laranja acima, azul abaixo), chuva em mm (azul acima, laranja abaixo).
// Rotulo do valor em cada barra, como nas figuras de clima do relatorio: acima da barra
// positiva, abaixo da negativa. Temperatura com duas casas, na vertical (nao cabe deitado
// na largura do painel); chuva em mm inteiros.
// Eixo de meses: todos os doze, pela inicial (o nome inteiro nao cabe na largura do
// painel). O mes por extenso aparece na dica ao passar o mouse.
// "mar" -> "Março", para a dica dos graficos de meses
function mesCompleto(abrev) {
  const i = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'].indexOf(abrev);
  if (i < 0) return abrev;
  const m = MESES_EXTENSO[i];
  return m[0].toUpperCase() + m.slice(1);
}

function eixoMeses(base) {
  return { ...base.scales.x.ticks, autoSkip: false, maxRotation: 0,
           callback(v) { return String(this.getLabelForValue(v))[0].toUpperCase(); } };
}

const rotulosBarras = {
  id: 'rotulosBarras',
  afterDatasetsDraw(chart, args, op) {
    if (!op || !op.ligado) return;
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    ctx.save();
    ctx.font = `${op.tamanho || 9}px "Instrument Sans", sans-serif`;
    ctx.fillStyle = op.cor;
    meta.data.forEach((barra, i) => {
      const v = chart.data.datasets[0].data[i];
      if (v === null || v === undefined) return;
      const r = Math.round(v * 10 ** op.casas) / 10 ** op.casas;
      const txt = r === 0 ? nf(0, op.casas) : comSinal(r, op.casas);
      const cima = v >= 0;
      const y = barra.y + (cima ? -3 : 3);
      ctx.save();
      ctx.translate(barra.x, y);
      if (op.vertical) {
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = cima ? 'left' : 'right';
        ctx.textBaseline = 'middle';
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = cima ? 'bottom' : 'top';
      }
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    });
    ctx.restore();
  },
};

function grafDif(s, temp) {
  const base = baseGraf();
  const atual = temp ? s.t : s.p, media = temp ? s.t_media : s.p_media;
  const dif = (atual || []).map((v, i) => (v === null || media[i] === null) ? null : v - media[i]);
  const casas = temp ? 2 : 0;
  const unidade = temp ? ' °C' : ' mm';
  const [pos, neg] = temp ? ['#d64a0d', '#8f9fc8'] : ['#4a5aa0', '#f8912f'];
  // folga no eixo para os rotulos caberem acima e abaixo das barras
  const vs = dif.filter(v => v !== null);
  const ext = Math.max(...vs.map(Math.abs), temp ? 0.1 : 1);
  const folga = ext * (temp ? 0.5 : 0.3);
  estado.graficos.push(new Chart($(temp ? '#g-temp-dif' : '#g-chuva-dif'), {
    type: 'bar',
    plugins: [rotulosBarras],
    data: {
      labels: MESES,
      datasets: [{ data: dif, borderRadius: 2, categoryPercentage: 0.8, barPercentage: 0.9,
                   backgroundColor: dif.map(v => (v || 0) >= 0 ? pos : neg) }],
    },
    options: {
      ...base,
      scales: {
        ...base.scales,
        x: { ...base.scales.x, ticks: eixoMeses(base) },
        y: { ...base.scales.y,
             suggestedMin: Math.min(0, ...vs) < 0 ? Math.min(...vs) - folga : 0,
             suggestedMax: Math.max(0, ...vs) > 0 ? Math.max(...vs) + folga : 0,
             ticks: { ...base.scales.y.ticks, maxTicksLimit: 5,
             callback: (v) => (v > 0 ? '+' : '') + nf(v, temp ? 1 : 0) } },
      },
      plugins: {
        ...base.plugins,
        rotulosBarras: { ligado: true, casas, vertical: temp, cor: css('--texto'), tamanho: temp ? 8.5 : 9 },
        title: { display: true, align: 'start', color: css('--suave'),
                 font: { family: 'Instrument Sans', size: 11, weight: '600' },
                 text: temp ? 'Diferença em relação à média (°C)' : 'Diferença em relação à média (mm)' },
        tooltip: { ...base.plugins.tooltip, callbacks: {
          title: (it) => mesCompleto(it[0].label),
          label: (it) => comSinal(Math.round(it.parsed.y * 10 ** casas) / 10 ** casas || 0, casas) + unidade,
        } },
      },
    },
  }));
}

function grafClima(s, temp) {
  const base = baseGraf();
  const unidade = temp ? ' °C' : ' mm';
  estado.graficos.push(new Chart($(temp ? '#g-temp' : '#g-chuva'), {
    type: 'line',
    data: {
      labels: MESES,
      datasets: [
        { data: temp ? s.t : s.p, borderColor: temp ? css('--laranja') : css('--azul-claro'),
          borderWidth: 2, pointRadius: 0, tension: .3 },
        { data: temp ? s.t_media : s.p_media, borderColor: css('--serie-media'),
          borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, tension: .3 },
      ],
    },
    options: {
      ...base,
      // temperatura nao comeca no zero: o eixo cheio esconde a anomalia
      scales: { ...base.scales, x: { ...base.scales.x, ticks: eixoMeses(base) },
                y: { ...base.scales.y, beginAtZero: !temp } },
      plugins: {
        ...base.plugins,
        legend: { display: false },
        title: { display: true, align: 'start', color: css('--suave'),
                 font: { family: 'Instrument Sans', size: 11, weight: '600' },
                 text: temp ? 'Temperatura média (°C)' : 'Precipitação (mm)' },
        tooltip: { ...base.plugins.tooltip, callbacks: {
          title: (it) => mesCompleto(it[0].label),
          label: (it) => (it.datasetIndex === 0 ? 'período: ' : 'média histórica: ')
                          + nf(it.parsed.y, temp ? 1 : 0) + unidade,
        } },
      },
    },
  }));
}

/* ---------- filtro e busca ---------- */

function montarFiltro() {
  const def = CAMADAS.find(c => c.id === estado.camada);
  // O filtro por estado so nas camadas grandes; a busca fica sempre, sobre o mapa.
  $('#bloco-filtro').hidden = !def.filtravel;
  if (!def.filtravel) return;

  const atrib = estado.atributos[estado.camada];
  const ufs = [...new Set(Object.values(atrib).map(r => r.chunk || r.uf).filter(Boolean))].sort();
  const sel = $('#filtro-uf');
  sel.innerHTML = `<option value="">Todos os estados (${nf(Object.keys(atrib).length)})</option>` +
    ufs.map(u => `<option value="${u}">${u}</option>`).join('');
  sel.value = estado.filtroUf;

  $('#ajuda-filtro').textContent = estado.filtroUf
    ? `Mostrando ${nf(Object.keys(visiveis()).length)} feições em ${estado.filtroUf}.`
    : 'Filtre por estado para desenhar menos feições e navegar mais rápido.';
}

// A busca procura em todas as camadas, num indice leve (dados/busca.json, ~110 KB com
// gzip) carregado na primeira vez que o leitor digita. Cada resultado diz a camada; ao
// escolher, o mapa troca de camada se precisar e abre a feicao.
let indiceBusca = null;
async function carregarIndice() {
  if (!indiceBusca) {
    const bruto = await json('busca.json');
    indiceBusca = bruto.map(([rid, nome, uf, camada]) => ({ rid, nome, uf, camada, k: chave(nome) }));
  }
  return indiceBusca;
}

const ROTULO_CURTO = { UF: 'Estado', Municipios: 'Município', Biomas: 'Bioma', UCs: 'UC', TerrasIndigenas: 'TI' };

async function buscar() {
  const termo = chave($('#busca').value.trim());
  const caixa = $('#achados');
  if (termo.length < 2) { caixa.innerHTML = ''; return; }
  const indice = await carregarIndice();
  if (chave($('#busca').value.trim()) !== termo) return;   // o leitor ja digitou outra coisa

  const ativas = new Set(CAMADAS.map(c => c.id));
  const achados = [];
  for (const it of indice) {
    if (!ativas.has(it.camada) || !it.k.includes(termo)) continue;
    // primeiro quem comeca com o termo; depois a camada aberta; depois o nome
    achados.push({ ...it, ordem: (it.k.startsWith(termo) ? 0 : 2) + (it.camada === estado.camada ? 0 : 1) });
  }
  achados.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));

  if (!achados.length) {
    caixa.innerHTML = '<p class="ajuda">Nenhum resultado em nenhuma camada.</p>';
    return;
  }
  caixa.innerHTML = achados.slice(0, 40).map(a =>
    `<button class="achado" data-rid="${a.rid}" data-camada="${a.camada}">
       <span>${a.nome}${a.uf && a.camada !== 'UF' ? ` <small>${a.uf}</small>` : ''}</span>
       <em class="etq-camada${a.camada === estado.camada ? ' atual' : ''}">${ROTULO_CURTO[a.camada]}</em></button>`
  ).join('') + (achados.length > 40 ? `<p class="ajuda">${nf(achados.length - 40)} outros resultados. Refine o termo.</p>` : '');

  caixa.querySelectorAll('.achado').forEach(b => {
    b.onclick = async () => {
      caixa.innerHTML = '';
      const { rid, camada } = b.dataset;
      if (camada !== estado.camada) await trocarCamada(camada);
      else if (estado.filtroUf && !visiveis()[rid]) trocarFiltro('');
      selecionar(rid, true);
    };
  });
}
/* ---------- controles ---------- */

function montarOpcoes(alvo, itens, atual, aoTrocar) {
  alvo.innerHTML = '';
  itens.forEach(it => {
    const b = document.createElement('button');
    b.className = 'opcao';
    b.type = 'button';
    b.setAttribute('aria-pressed', String(it.id === atual));
    b.innerHTML = `<span>${it.rotulo}</span>${it.conta ? `<small>${it.conta}</small>` : ''}`;
    b.onclick = () => aoTrocar(it.id);
    alvo.appendChild(b);
  });
}

// Um subtitulo e um conjunto de botoes por grupo. Grupo sem dado na camada aberta (os
// focos nao existem para assentamentos) nao aparece.
// Um subtitulo e um conjunto de botoes por grupo. Variavel sem dado na camada aberta (os
// biomas nao tem clima) nao aparece.
// Recorte territorial: botoes de radio no menu flutuante sobre o mapa.
function montarCamadas(itens) {
  const alvo = $('#camadas');
  alvo.innerHTML = itens.map(it => `
    <label class="radio"><input type="radio" name="camada" value="${it.id}"${it.id === estado.camada ? ' checked' : ''}>
      <span>${it.rotulo}</span><small>${it.conta}</small></label>`).join('');
  alvo.querySelectorAll('input').forEach(i => { i.onchange = () => trocarCamada(i.value); });
}

function montarVariaveis() {
  const alvo = $('#variaveis');
  alvo.innerHTML = '';
  const regs = Object.values(estado.atributos[estado.camada] || {});
  const temDado = (v) => regs.some(r => r[v.id] !== null && r[v.id] !== undefined);
  if (!VARIAVEIS.some(v => v.id === estado.variavel && temDado(v))) estado.variavel = 'aq_ranque';
  // Cada grupo e um menu retratil. O grupo da variavel do mapa abre sempre; os outros
  // ficam como o leitor deixou (lembrado entre visitas).
  let abertos = [];
  try { abertos = JSON.parse(localStorage.getItem('fef-grupos') || '[]'); } catch (e) {}
  const atual = (VARIAVEIS.find(v => v.id === estado.variavel) || {}).grupo;
  GRUPOS.forEach(g => {
    const itens = VARIAVEIS.filter(v => v.grupo === g.id && temDado(v));
    if (!itens.length) return;
    const det = document.createElement('details');
    det.className = 'grupo-var';
    det.open = g.id === atual || abertos.includes(g.id);
    const sum = document.createElement('summary');
    sum.innerHTML = `<span>${g.rotulo}</span><small>${itens.length}</small>`;
    const caixa = document.createElement('div');
    caixa.className = 'opcoes';
    det.append(sum, caixa);
    // so o clique do leitor conta: o "toggle" tambem dispara quando o grupo abre sozinho
    sum.addEventListener('click', () => {
      const lista = new Set(abertos);
      if (!det.open) lista.add(g.id); else lista.delete(g.id);
      abertos = [...lista];
      try { localStorage.setItem('fef-grupos', JSON.stringify(abertos)); } catch (e) {}
    });
    alvo.append(det);
    montarOpcoes(caixa, itens, estado.variavel, trocarVariavel);
  });
}

function montarLegenda() {
  const def = defAtual();
  // Escalas classificadas em blocos encostados, com o rotulo de cada classe embaixo;
  // escalas continuas num degrade com as pontas. A esquerda fica o menor valor, como
  // nas figuras do relatorio; no ranque, o 1o lugar.
  const blocos = (cores) => {
    const passo = 100 / cores.length;
    return 'linear-gradient(90deg,' + cores.map((c, i) => `${c} ${i * passo}% ${(i + 1) * passo}%`).join(',') + ')';
  };
  const marcas = (rotulos) => `<span class="marcas" style="grid-template-columns:repeat(${rotulos.length},1fr)">` +
    rotulos.map(r => `<span>${r}</span>`).join('') + '</span>';
  let titulo = def.rotulo, faixa = '', baixo = '';
  if (def.escala === 'ranque') {
    titulo = '1º – maior registro desde 2002';
    faixa = blocos(RANQUE.map(r => r[2]));
    baixo = marcas(RANQUE.map(([a, b]) => (b <= 2 ? b + 'º' : b)));
  } else if (def.escala === 'anomalia') {
    titulo = 'Anomalia da área queimada (%)';
    faixa = blocos(ANOMALIA.map(a => a[1]));
    baixo = marcas(['−100', '', '−15', '', '15', '', '150', '', '500', '>']);
  } else if (def.escala === 'mes') {
    titulo = 'Mês de pico (mar/25 – fev/26)';
    faixa = blocos(MESES_COR);
    baixo = marcas(MESES.map(m => m[0].toUpperCase()));
  } else if (estado.faixa) {
    const [lo, hi] = estado.faixa;
    const casas = def.casas === undefined ? 1 : def.casas;
    const fmt = (v) => nf(v, Math.abs(v) >= 100 ? 0 : casas);
    faixa = `linear-gradient(90deg,${PALETAS[def.paleta].join(',')})`;
    titulo = def.rotulo + (def.unidade ? ` (${def.unidade.trim()})` : '');
    baixo = def.escala === 'diferenca'
      ? `<span class="pontas"><span>${comSinal(lo, casas)}</span><span>0</span><span>${comSinal(hi, casas)}</span></span>`
      : `<span class="pontas"><span>${fmt(lo)}</span><span>${fmt(hi)}</span></span>`;
  }

  // o que fica sem cor, conforme a fonte do dado
  const regs = Object.values(visiveis());
  const vazios = new Map();
  regs.forEach(r => { const v = semDado(r, def); if (v) vazios.set(v[1], v[0]); });
  const linhas = [...vazios].map(([rot, tok]) =>
    `<span class="linha"><i style="background:${css(tok)}"></i>${rot}</span>`).join('');

  $('#legenda-corpo').innerHTML = `
    <span class="titulo-leg">${titulo}</span>
    ${faixa ? `<span class="faixa" style="background:${faixa}"></span>` : ''}
    ${baixo}
    ${linhas}`;

  const pc = $('#painel-camadas');
  try {
    if (localStorage.getItem('fef-camadas') === 'fechada') pc.removeAttribute('open');
    pc.ontoggle = () => localStorage.setItem('fef-camadas', pc.open ? 'aberta' : 'fechada');
  } catch (e) {}

  // A legenda lembra se o leitor a deixou recolhida.
  const cx = $('#legenda');
  try {
    if (localStorage.getItem('fef-legenda') === 'fechada') cx.removeAttribute('open');
    cx.ontoggle = () => localStorage.setItem('fef-legenda', cx.open ? 'aberta' : 'fechada');
  } catch (e) {}
}

function limparPainel() {
  estado.graficos.forEach(g => g.destroy());
  estado.graficos = [];
  estado.selecionado = null;
  $('#painel').innerHTML = resumoCamada();
  $('#painel').querySelectorAll('[data-rid]').forEach(b => { b.onclick = () => selecionar(b.dataset.rid, true); });
}

// Variaveis em que a soma das feicoes faz sentido (contagens e areas). Nas outras o
// resumo mostra a media ou nada: somar ranque, taxa ou temperatura nao diz nada.
const SOMAVEIS = new Set(['aq', 'n_incendios', 'focos', 'eventos']);

// Painel direito antes do clique: um resumo da camada aberta (ou do estado filtrado)
// na variavel do mapa. Numeros gerais, os cinco primeiros e, nas escalas de valor, os
// cinco ultimos com dado. Cada linha abre a feicao.
function resumoCamada() {
  const def = defAtual();
  const cam = CAMADAS.find(c => c.id === estado.camada);
  const todas = Object.entries(visiveis());
  const com = todas.filter(([, r]) => !semDado(r, def));
  const f = def.fator || 1;
  const casas = def.casas === undefined ? 1 : def.casas;
  const onde = estado.filtroUf ? ` · ${estado.filtroUf}` : '';
  const linha = ([rid, r]) => `<button class="achado" data-rid="${rid}"><span>${r.nome}${
    r.uf && estado.camada !== 'UF' ? ` <small>${String(r.uf).split(',')[0]}</small>` : ''}</span><b>${valorTexto(r, def)}</b></button>`;

  const numeros = [`<div><b>${nf(todas.length)}</b><small>${cam.rotulo.toLowerCase()}${onde ? ' em ' + estado.filtroUf : ''}</small></div>`,
                   `<div><b>${nf(com.length)}</b><small>com dado nesta variável</small></div>`];
  let lista = '', titulo1 = 'Os cinco primeiros', extra = '';

  if (def.escala === 'ranque') {
    const ord = com.slice().sort(([, a], [, b]) => a[def.id] - b[def.id] || a.nome.localeCompare(b.nome, 'pt-BR'));
    const n1 = com.filter(([, r]) => r[def.id] === 1).length;
    const n2 = com.filter(([, r]) => r[def.id] === 2).length;
    numeros.push(`<div><b>${nf(n1)}</b><small>no 1º lugar: maior registro desde 2002</small></div>`,
                 `<div><b>${nf(n2)}</b><small>no 2º lugar</small></div>`);
    titulo1 = n1 > 5 ? `No 1º lugar (${nf(n1)}; os cinco primeiros em ordem alfabética)` : 'Mais perto do topo da série';
    lista = ord.slice(0, 5).map(linha).join('');
  } else if (def.escala === 'mes') {
    const conta = {};
    com.forEach(([, r]) => { conta[r[def.id]] = (conta[r[def.id]] || 0) + 1; });
    const top = Object.entries(conta).sort((a, b) => b[1] - a[1]).slice(0, 3);
    titulo1 = 'Meses de pico mais frequentes';
    const moda = top.length ? +top[0][0] : null;
    if (moda) numeros.push(`<div class="largo"><b><i class="amostra" style="background:${corMes(moda)}"></i>${
      MESES_EXTENSO[moda - 1]}</b><small>mês de pico mais frequente (moda) entre as feições com área queimada</small></div>`);
    extra = `<p class="nota">Sem uma área selecionada, o mês de pico mostrado é a moda: o mês que mais se
      repete entre todos os polígonos ${estado.filtroUf ? 'filtrados' : 'da camada'} com área queimada na série.
      Clique numa área para ver o mês de pico dela.</p>`;
    lista = top.map(([m, n]) => `<div class="achado"><span><i class="amostra" style="background:${corMes(+m)}"></i>${
      MESES[(+m + 9) % 12]}</span><b>${nf(n)} (${nf(n / com.length * 100, 0)}%)</b></div>`).join('');
  } else {
    const ord = com.slice().sort(([, a], [, b]) => b[def.id] - a[def.id]);
    const vals = ord.map(([, r]) => r[def.id] * f);
    if (SOMAVEIS.has(def.id) && vals.length) {
      numeros.push(`<div><b>${nf(vals.reduce((a, b) => a + b, 0), def.id === 'aq' ? 0 : 0)}${def.unidade}</b><small>no total</small></div>`);
    } else if (vals.length) {
      const media = vals.reduce((a, b) => a + b, 0) / vals.length;
      numeros.push(`<div><b>${(def.escala === 'diferenca' || def.escala === 'anomalia' ? comSinal(media, casas) : nf(media, casas))}${def.unidade}</b><small>média das feições</small></div>`);
    }
    if (def.escala === 'anomalia' || def.escala === 'diferenca') {
      const acima = vals.filter(v => v > 0).length;
      numeros.push(`<div><b>${nf(acima)}</b><small>acima da média histórica</small></div>`);
    }
    titulo1 = 'Os cinco maiores';
    lista = ord.slice(0, 5).map(linha).join('');
    if (ord.length > 5) {
      extra = `<h2>Os cinco menores (com dado)</h2><div class="lista-resumo">${ord.slice(-5).reverse().map(linha).join('')}</div>`;
    }
  }

  return `
    <div class="titulo-sel">
      <h3>${cam.rotulo}${onde}</h3>
      <p>${def.rotulo} · período ${estado.meta.periodo_curto}</p>
    </div>
    <div class="bloco">
      <div class="numeros-sel">${numeros.join('')}</div>
    </div>
    <div class="bloco">
      <h2>${titulo1}</h2>
      <div class="lista-resumo">${lista || '<p class="nota">Nenhuma feição com dado.</p>'}</div>
      ${extra}
      <p class="nota">Clique numa linha ou no mapa para ver os detalhes da feição.</p>
    </div>`;
}

async function trocarCamada(id) {
  estado.camada = id;
  estado.filtroUf = '';
  estado.selecionado = null;
  $('#busca').value = '';
  $('#achados').innerHTML = '';
  ocupado(true, 'Carregando camada…');
  try {
    await garantirCamada(id);
    calcularFaixa();
    desenhar(false);
    montarControles();
    limparPainel();
  } catch (e) {
    $('#painel').innerHTML = `<div class="vazio">Não foi possível carregar esta camada.<br><small>${e.message}</small></div>`;
  } finally {
    ocupado(false);
  }
}

function trocarVariavel(id) {
  estado.variavel = id;
  calcularFaixa();
  desenhar(false);
  montarControles();
  // O painel direito precisa ser refeito, senao o numero grande do topo continua
  // mostrando a variavel anterior enquanto o mapa ja mudou.
  if (estado.selecionado) selecionar(estado.selecionado, false);
  else limparPainel();
}

function trocarFiltro(uf) {
  estado.selecionado = null;
  estado.filtroUf = uf;
  calcularFaixa();
  desenhar(true);
  montarFiltro();
  buscar();
  limparPainel();
}

function montarControles() {
  const c = estado.meta.camadas;
  montarCamadas(CAMADAS.map(x => ({ ...x, conta: nf(c[x.id].feicoes) })));
  montarVariaveis();
  montarFiltro();
  montarLegenda();
}

/* ---------- barras laterais: largura e recolher ---------- */

// As duas barras se alargam arrastando a borda do mapa, entre os limites abaixo, e se
// recolhem pela aba. Largura e estado ficam guardados entre visitas. O mapa e os graficos
// acompanham: o Leaflet precisa ser avisado (invalidateSize); o Chart.js se ajusta sozinho.
const LIMITES_BARRA = { esq: [220, 440], dir: [300, 600] };
const PADRAO_BARRA = { esq: 288, dir: 366 };

function aplicarBarras() {
  const corpo = $('.corpo');
  const salvo = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const larg = salvo('fef-barras', PADRAO_BARRA);
  const fechadas = salvo('fef-barras-fechadas', {});
  for (const lado of ['esq', 'dir']) {
    const [lo, hi] = LIMITES_BARRA[lado];
    corpo.style.setProperty(`--larg-${lado}`, Math.min(hi, Math.max(lo, larg[lado] || PADRAO_BARRA[lado])) + 'px');
    corpo.classList.toggle(`${lado}-fechada`, !!fechadas[lado]);
  }
  atualizarAbas();
}

function atualizarAbas() {
  const corpo = $('.corpo');
  document.querySelectorAll('.aba').forEach(b => {
    const fechada = corpo.classList.contains(`${b.dataset.lado}-fechada`);
    const nome = b.dataset.lado === 'esq' ? 'a barra de variáveis' : 'o painel de detalhes';
    b.setAttribute('aria-label', (fechada ? 'Abrir ' : 'Recolher ') + nome);
    b.title = fechada ? 'Abrir' : 'Recolher';
    b.setAttribute('aria-expanded', String(!fechada));
  });
}

function guardarBarras() {
  const corpo = $('.corpo');
  const larg = {}, fechadas = {};
  for (const lado of ['esq', 'dir']) {
    larg[lado] = parseInt(getComputedStyle(corpo).getPropertyValue(`--larg-${lado}`)) || PADRAO_BARRA[lado];
    fechadas[lado] = corpo.classList.contains(`${lado}-fechada`);
  }
  try {
    localStorage.setItem('fef-barras', JSON.stringify(larg));
    localStorage.setItem('fef-barras-fechadas', JSON.stringify(fechadas));
  } catch (e) {}
}

function ligarBarras() {
  const corpo = $('.corpo');
  aplicarBarras();
  document.querySelectorAll('.aba').forEach(b => {
    b.onclick = () => {
      corpo.classList.toggle(`${b.dataset.lado}-fechada`);
      atualizarAbas();
      guardarBarras();
      setTimeout(() => mapa && mapa.invalidateSize(), 220);   // depois da transicao
    };
  });
  document.querySelectorAll('.alca').forEach(alca => {
    alca.addEventListener('pointerdown', (e) => {
      const lado = alca.dataset.lado;
      if (corpo.classList.contains(`${lado}-fechada`)) return;
      e.preventDefault();
      alca.setPointerCapture(e.pointerId);
      corpo.classList.add('arrastando');
      const caixa = corpo.getBoundingClientRect();
      const [lo, hi] = LIMITES_BARRA[lado];
      const mover = (ev) => {
        const w = lado === 'esq' ? ev.clientX - caixa.left : caixa.right - ev.clientX;
        corpo.style.setProperty(`--larg-${lado}`, Math.min(hi, Math.max(lo, Math.round(w))) + 'px');
        if (mapa) mapa.invalidateSize({ pan: false });
      };
      const soltar = () => {
        alca.removeEventListener('pointermove', mover);
        corpo.classList.remove('arrastando');
        guardarBarras();
        if (mapa) mapa.invalidateSize();
      };
      alca.addEventListener('pointermove', mover);
      alca.addEventListener('pointerup', soltar, { once: true });
      alca.addEventListener('pointercancel', soltar, { once: true });
    });
    // duplo clique volta a largura padrao
    alca.addEventListener('dblclick', () => {
      corpo.style.setProperty(`--larg-${alca.dataset.lado}`, PADRAO_BARRA[alca.dataset.lado] + 'px');
      guardarBarras();
      if (mapa) mapa.invalidateSize();
    });
  });
}

/* ---------- inicio ---------- */

async function iniciar() {
  // Abrir o arquivo com duplo clique usa o protocolo file://, e o navegador
  // bloqueia fetch nesse modo por seguranca. O mapa base aparece, os vetores nao.
  // Sem esta checagem o erro sai como "Failed to fetch", que nao ajuda ninguem.
  if (location.protocol === 'file:') {
    avisar(`<b>A plataforma precisa de um servidor local.</b>
      <p>Abrir o arquivo com duplo clique usa <code>file://</code>, e o navegador bloqueia
      a leitura dos dados nesse modo. O mapa de fundo carrega, os vetores não.</p>
      <p>Na pasta <code>plataforma</code>, dê um duplo clique em <code>servir.bat</code>
      (Windows) ou rode <code>python -m http.server 8000</code> e abra
      <code>http://localhost:8000/plataforma.html</code>.</p>`);
    return;
  }

  ligarBarras();
  // O canto superior esquerdo e do menu de recortes: o zoom vai para o direito.
  mapa = L.map('mapa', { center: [-14.5, -53], zoom: 4, preferCanvas: true, zoomControl: false });
  L.control.zoom({ position: 'topright' }).addTo(mapa);
  trocarBase();

  ocupado(true, 'Carregando…');
  estado.meta = await json('meta.json');
  $('#periodo').textContent = 'Período ' + estado.meta.periodo_curto + ' · ' + estado.meta.periodo_extenso;

  const url = new URLSearchParams(location.search);
  const pedida = url.get('camada');
  if (pedida && CAMADAS.some(c => c.id === pedida)) estado.camada = pedida;

  await garantirCamada(estado.camada);
  calcularFaixa();
  desenhar(false);
  montarControles();
  limparPainel();
  ocupado(false);

  $('#filtro-uf').addEventListener('change', (e) => trocarFiltro(e.target.value));
  let atraso;
  $('#busca').addEventListener('input', () => { clearTimeout(atraso); atraso = setTimeout(buscar, 140); });

  // Ao trocar o tema, as cores vem do CSS: basta redesenhar.
  document.addEventListener('tema-mudou', () => {
    trocarBase();
    desenhar(false);
    montarLegenda();
  });
}

iniciar().catch(e => avisar(
  `<b>Não foi possível carregar os dados.</b>
   <p>${e.message}</p>
   <p>Confira se a pasta <code>dados/</code> está ao lado de <code>plataforma.html</code>.
   Se estiver faltando, rode os scripts de <code>codigos/</code> para gerá-la.</p>`));

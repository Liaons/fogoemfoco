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
 */

const DADOS = 'dados/';

// Carimbo do conteudo de dados/, reescrito por 11_versionar_assets.py. Os JSONs e os
// TopoJSONs sao buscados com fetch e o navegador os guarda em cache como qualquer outro
// arquivo: sem este carimbo, trocar uma camada nao chega a quem ja visitou a pagina.
const VERSAO_DADOS = 'a1dce02a';

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

const VARIAVEIS = [
  // Primeiro os ranques, que sao a leitura principal do relatorio. Depois os valores
  // absolutos e, por ultimo, a anomalia. "destaque" e o texto que acompanha o numero
  // grande no topo do painel direito, e muda junto com a variavel selecionada.
  { id: 'aq_ranque',          rotulo: 'Ranque de área queimada',                escala: 'ranque',     unidade: '',     curto: 'ranque',
    destaque: 'maior área queimada<br>na série desde 2002' },
  { id: 'n_incendios_ranque', rotulo: 'Ranque de número de incêndios',          escala: 'ranque',     unidade: '',     curto: 'ranque',
    destaque: 'maior número de incêndios<br>na série desde 2002' },
  { id: 'tam_max_ranque',     rotulo: 'Ranque de tamanho máximo dos incêndios', escala: 'ranque',     unidade: '',     curto: 'ranque',
    destaque: 'maior incêndio individual<br>na série desde 2002' },
  { id: 'taxa_max_ranque',    rotulo: 'Ranque de taxa máxima de crescimento',   escala: 'ranque',     unidade: '',     curto: 'ranque',
    destaque: 'maior taxa de crescimento<br>na série desde 2002' },
  { id: 'aq',                 rotulo: 'Área queimada',                          escala: 'sequencial', unidade: ' km²', curto: 'área queimada', casas: 1,
    destaque: 'de vegetação florestal<br>queimada no período' },
  { id: 'aq_frac',            rotulo: 'Fração queimada',                        escala: 'sequencial', unidade: '%',    curto: 'fração queimada', fator: 100, casas: 2,
    destaque: 'da área florestal<br>queimada no período' },
  { id: 'aq_anom_pct',        rotulo: 'Anomalia da área queimada',              escala: 'divergente', unidade: '%',    curto: 'anomalia', casas: 0,
    destaque: 'contra a média<br>da série desde 2002' },
];

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
function rampa() {
  return ['--r1','--r2','--r3','--r4','--r5','--r6','--r7','--r8','--r9'].map(css);
}

/* ---------- cores ---------- */

// O 1o e o 2o colocados tem cor propria. O gradiente cobre do 3o ao ultimo, o que
// tambem alarga cada classe: antes 24 posicoes se espremiam em nove degraus.
function corRanque(v) {
  if (v === 1) return css('--r-top1');
  if (v === 2) return css('--r-top2');
  const r = rampa();
  const faixa = Math.max(1, PERIODOS - 2);
  const i = Math.min(r.length - 1, Math.max(0, Math.floor(((v - 3) / faixa) * r.length)));
  return r[i];
}

function ehTopo(reg) {
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  return def && def.escala === 'ranque' && (reg[def.id] === 1 || reg[def.id] === 2);
}

const SEQUENCIAL = ['#fddc84','#fcb95a','#f8912f','#ee5911','#b8300f','#8a1a10'];

function corSequencial(v, faixa) {
  if (!faixa || faixa[1] <= faixa[0]) return SEQUENCIAL[0];
  // raiz quadrada porque area queimada e muito assimetrica: sem isso quase
  // tudo cai na primeira classe e o mapa vira uma cor so.
  const t = Math.sqrt(Math.max(0, (v - faixa[0]) / (faixa[1] - faixa[0])));
  return SEQUENCIAL[Math.min(SEQUENCIAL.length - 1, Math.floor(t * SEQUENCIAL.length))];
}

// Dez classes, com o miolo aberto em duas (0 a 15% e -15% a 0) e um extremo proprio
// acima de 500%. A distribuicao e muito assimetrica: 71% das feicoes estao em -100%,
// e 3% passam de 500%, faixa que antes se perdia toda dentro do vermelho escuro.
const DIVERGENTE = [
  [-100, '--dv1'],       [-50, '--dv2'],      [-15, '--dv3'],
  [0,    '--dv-baixo'],  [15,  '--dv-alto'],
  [50,   '--r6'],        [150, '--r5'],       [300, '--r3'],
  [500,  '--r1'],        [Infinity, '--dv-topo'],
];

function corDivergente(v) {
  for (const [lim, tok] of DIVERGENTE) if (v <= lim) return css(tok);
  return css('--r1');
}

function corDe(reg) {
  if (!reg || reg.estado_dado === 'fora') return css('--fora');
  if (reg.estado_dado === 'sem_analise') return css('--sem-analise');
  if (reg.estado_dado === 'sem_fogo') return css('--sem-fogo');
  const v = reg[estado.variavel];
  if (v === null || v === undefined) return css('--sem-fogo');
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  if (def.escala === 'ranque') return corRanque(v);
  if (def.escala === 'divergente') return corDivergente(v);
  return corSequencial(v, estado.faixa);
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
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  if (def.escala !== 'sequencial') { estado.faixa = null; return; }
  const vals = Object.values(visiveis())
    .map(r => r[estado.variavel])
    .filter(v => v !== null && v !== undefined && v > 0)
    .sort((a, b) => a - b);
  // percentil 98 no topo: sem isso um unico municipio enorme achata todo o resto
  estado.faixa = vals.length ? [0, vals[Math.floor(vals.length * 0.98)]] : null;
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
      return {
        fillColor: corDe(reg),
        fillOpacity: reg && reg.estado_dado === 'fora' ? foraOp : 0.85,
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
      layer.on('mouseover', () => layer.setStyle({ weight: 2, color: css('--realce') }));
      layer.on('mouseout', () => camadaLeaflet.resetStyle(layer));
    },
  }).addTo(mapa);

  if (ajustarZoom) {
    const b = camadaLeaflet.getBounds();
    if (b.isValid()) mapa.fitBounds(b, { padding: [20, 20] });
  }
}

function dica(reg) {
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  let valor;
  if (reg.estado_dado === 'sem_analise') valor = 'sem análise nesta edição';
  else if (reg.estado_dado === 'fora') valor = 'sem dado';
  else if (reg[estado.variavel] === null || reg[estado.variavel] === undefined) valor = 'sem fogo na série';
  else valor = nf(reg[estado.variavel] * (def.fator || 1), def.escala === 'ranque' ? 0 : 2) + def.unidade;
  return `<b>${reg.nome}${reg.uf ? ' · ' + reg.uf : ''}</b><em>${def.curto}: ${valor}</em>`;
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
  render(reg, gfa[rid], clima[rid]);
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


function destaqueDe(reg) {
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  if (!def) return '';
  const v = reg[def.id];
  if (v === null || v === undefined) return '';
  const casas = def.casas === undefined ? 1 : def.casas;
  const bruto = v * (def.fator || 1);
  const valor = def.escala === 'ranque'
    ? `${v}º`
    : (def.escala === 'divergente' ? comSinal(bruto, casas) : nf(bruto, casas)) + def.unidade;
  return `<div class="destaque"><span class="n">${valor}</span>
       <span class="rot">${def.destaque}</span></div>`;
}


function render(reg, sgfa, sclima) {
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
    ? `<div class="bloco"><div class="aviso-dado"><b>Sem registro de fogo em vegetação florestal</b>
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
      <h2>Área queimada em floresta</h2>
      <div class="numeros-sel">
        <div><b>${nf(reg.aq, 1)}</b><small>km² no período</small></div>
        <div><b>${nf(reg.aq_media, 1)}</b><small>km², média da série</small></div>
        <div><b>${reg.aq_anom_pct === null ? '—' : comSinal(reg.aq_anom_pct, 0) + '%'}</b><small>contra a média</small></div>
        <div><b>${reg.aq_frac === null ? '—' : nf(reg.aq_frac * 100, 2) + '%'}</b><small>da área florestal</small></div>
      </div>
    </div>
    <div class="bloco">
      <h2>Comportamento do fogo · série histórica</h2>
      <div class="grafico"><canvas id="g-gfa"></canvas></div>
      <p class="nota">Número de incêndios por período, segundo o Global Fire Atlas.
      A barra em laranja é o período em foco.</p>
    </div>
    <div class="bloco">
      <h2>Clima · março a fevereiro</h2>
      <div class="grafico"><canvas id="g-temp"></canvas></div>
      <div class="grafico"><canvas id="g-chuva"></canvas></div>
      <p class="chaves">
        <span><i class="cheia"></i>período ${estado.meta.periodo_curto}</span>
        <span><i class="tracejada"></i>média ${estado.meta.clima_referencia}</span>
      </p>
    </div>
    <div class="bloco">
      <p class="nota">Toda a área queimada aqui se refere a vegetação com pelo menos
      30% de cobertura arbórea. Não é a área queimada total.</p>
    </div>`;

  if (sgfa) grafGfa(sgfa);
  if (sclima) { grafClima(sclima, true); grafClima(sclima, false); }
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
    plugins: { legend: { display: false }, tooltip: dica },
    scales: {
      x: { grid: { display: false }, ticks: { color: css('--suave'), font: { size: 10 }, maxRotation: 0, autoSkipPadding: 12 } },
      y: { grid: { color: css('--grade-grafico') }, ticks: { color: css('--suave'), font: { size: 10 } }, border: { display: false } },
    },
  };
}

function grafGfa(s) {
  const ultimo = s.ano.length - 1;
  const neutro = css('--r7');
  const base = baseGraf();
  estado.graficos.push(new Chart($('#g-gfa'), {
    type: 'bar',
    data: {
      labels: s.ano.map(a => `${a}-${String(a + 1).slice(2)}`),
      datasets: [{
        data: s.n_incendios, borderRadius: 2,
        // 2 px de respiro entre barras: sem isso a série vira um bloco só
        categoryPercentage: 0.86, barPercentage: 0.9,
        backgroundColor: s.ano.map((_, i) => i === ultimo ? css('--laranja') : neutro),
      }],
    },
    options: {
      ...base,
      scales: {
        ...base.scales,
        x: { ...base.scales.x, ticks: { ...base.scales.x.ticks,
             callback(v, i) { const r = this.getLabelForValue(v); return i % 4 === 0 || i === s.ano.length - 1 ? r.slice(2, 4) : ''; } } },
      },
      plugins: {
        ...base.plugins,
        tooltip: { ...base.plugins.tooltip, callbacks: {
          title: (it) => 'Período ' + it[0].label,
          label: (it) => nf(it.parsed.y) + ' incêndios',
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
      scales: { ...base.scales, y: { ...base.scales.y, beginAtZero: !temp } },
      plugins: {
        ...base.plugins,
        legend: { display: false },
        title: { display: true, align: 'start', color: css('--suave'),
                 font: { family: 'Instrument Sans', size: 11, weight: '600' },
                 text: temp ? 'Temperatura média (°C)' : 'Precipitação (mm)' },
        tooltip: { ...base.plugins.tooltip, callbacks: {
          title: (it) => it[0].label,
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

function buscar() {
  const termo = chave($('#busca').value.trim());
  const caixa = $('#achados');
  if (termo.length < 2) { caixa.innerHTML = ''; return; }

  const alvo = visiveis();
  const achados = [];
  for (const [rid, reg] of Object.entries(alvo)) {
    const k = chave(reg.nome);
    if (!k.includes(termo)) continue;
    achados.push({ rid, reg, comeca: k.startsWith(termo) ? 0 : 1 });
    if (achados.length > 400) break;
  }
  achados.sort((a, b) => a.comeca - b.comeca || a.reg.nome.localeCompare(b.reg.nome, 'pt-BR'));

  if (!achados.length) {
    caixa.innerHTML = '<p class="ajuda">Nenhum resultado. Se a feição existe, talvez esteja em outro estado.</p>';
    return;
  }
  caixa.innerHTML = achados.slice(0, 40).map(({ rid, reg }) =>
    `<button class="achado" data-rid="${rid}"><span>${reg.nome}</span><small>${reg.uf || ''}</small></button>`
  ).join('') + (achados.length > 40 ? `<p class="ajuda">${nf(achados.length - 40)} outros resultados. Refine o termo.</p>` : '');

  caixa.querySelectorAll('.achado').forEach(b => {
    b.onclick = () => selecionar(b.dataset.rid, true);
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

function montarLegenda() {
  const def = VARIAVEIS.find(x => x.id === estado.variavel);
  const r = rampa();

  // Uma faixa continua ocupa quatro linhas a menos que nove amostras empilhadas,
  // e a leitura do mapa nao depende de saber a posicao exata de cada classe.
  // Todas as faixas correm na mesma direcao: o que mais chama atencao fica a esquerda.
  // Nas escalas de valor isso significa inverter a rampa em relacao ao mapa, onde o
  // tom mais escuro continua sendo o maior valor.
  let cores, esquerda, direita, fundo;
  if (def.escala === 'ranque') {
    // Os dois primeiros aparecem como blocos, nao como parte do degrade: eles nao
    // pertencem a rampa, e mostrar assim deixa claro que sao classes proprias.
    const passo = 100 / (r.length + 2);
    const paradas = [
      `${css('--r-top1')} 0 ${passo}%`,
      `${css('--r-top2')} ${passo}% ${2 * passo}%`,
      ...r.map((c, i) => `${c} ${(i + 2) * passo}% ${(i + 3) * passo}%`),
    ];
    fundo = `linear-gradient(90deg,${paradas.join(',')})`;
    esquerda = '1º · maior registro'; direita = `${PERIODOS}º · menor registro`;
  } else if (def.escala === 'divergente') {
    // A anomalia e classificada, nao continua: o degrade suave misturava o bege e o
    // azul claro do centro num tom so. Blocos duros mostram que sao duas classes, e
    // e justamente ali, na virada do sinal, que a leitura importa.
    const dv = DIVERGENTE.map(([, tok]) => css(tok)).reverse();
    const passo = 100 / dv.length;
    fundo = 'linear-gradient(90deg,' + dv.map(
      (c, i) => `${c} ${i * passo}% ${(i + 1) * passo}%`).join(',') + ')';
    esquerda = 'acima da média da série'; direita = 'abaixo';
  } else {
    cores = SEQUENCIAL.slice().reverse();
    esquerda = 'maior'; direita = 'menor';
  }
  if (!fundo) fundo = `linear-gradient(90deg,${cores.join(',')})`;

  $('#legenda-corpo').innerHTML = `
    <span class="faixa" style="background:${fundo}"></span>
    <span class="pontas"><span>${esquerda}</span><span>${direita}</span></span>
    <span class="linha"><i style="background:${css('--sem-fogo')}"></i>sem fogo na série</span>
    <span class="linha"><i style="background:${css('--fora')}"></i>fora do processamento</span>
    ${estado.camada === 'Assentamentos'
      ? `<span class="linha"><i style="background:${css('--sem-analise')}"></i>sem análise nesta edição</span>`
      : ''}`;

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
  $('#painel').innerHTML = '<div class="vazio">Clique em qualquer área do mapa para ver os detalhes.</div>';
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
}

function trocarFiltro(uf) {
  estado.selecionado = null;
  estado.filtroUf = uf;
  calcularFaixa();
  desenhar(true);
  montarFiltro();
  buscar();
}

function montarControles() {
  const c = estado.meta.camadas;
  montarOpcoes($('#camadas'), CAMADAS.map(x => ({ ...x, conta: nf(c[x.id].feicoes) })), estado.camada, trocarCamada);
  montarOpcoes($('#variaveis'), VARIAVEIS, estado.variavel, trocarVariavel);
  montarFiltro();
  montarLegenda();
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

  mapa = L.map('mapa', { center: [-14.5, -53], zoom: 4, preferCanvas: true });
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

# Downloads na plataforma — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhamento.

**Objetivo:** botão "Baixar dados" na barra do topo da plataforma, abrindo uma janela com duas abas — dados em tabela (CSV em `.zip`, com recortes, abrangência, variáveis e séries à escolha) e ficha da área aberta (página A4 pela janela de impressão).

**Arquitetura:** tudo no navegador, sem servidor e sem biblioteca externa. A lógica pura (catálogo de campos, filtro, tabela, CSV, dicionário, séries, zip, projeção do mapa) vai em `assets/downloads-nucleo.js`, testável numa página de testes. A interface (janela, prévia, geração, ficha) vai em `assets/downloads.js`, que usa as funções globais de `assets/plataforma.js` (`estado`, `VARIAVEIS`, `serie()`, `garantirCamada()`, cores, formatação). O `plataforma.js` ganha três extrações pequenas (faixa, cor e legenda de qualquer conjunto de feições; gráficos num canvas qualquer) para a ficha reaproveitar o painel.

**Tecnologia:** JavaScript sem build (scripts clássicos, como o resto do site), Chart.js já carregado, SVG para o mapa, `window.print()` para o PDF, zip "store" escrito à mão (CRC-32 + cabeçalhos).

**Especificação:** `docs/superpowers/specs/2026-10-09-downloads-plataforma-design.md`.

---

## Contexto para quem não conhece o projeto

- Repositório do site: este worktree (`fogoemfoco/`). Página da plataforma: `plataforma.html`; scripts em `assets/`; dados em `dados/` (gerados por `C:\Vault\fogoemfoco\codigos\07_preparar_dados_web.py`, fora do repositório — **não editar `dados/` à mão**).
- `assets/plataforma.js` é um script clássico (não módulo). `const` e `function` de nível superior ficam visíveis para outros scripts clássicos carregados depois, então `downloads.js` enxerga `estado`, `CAMADAS`, `VARIAVEIS`, `GRUPOS`, `MESES`, `MESES_EXTENSO`, `nf`, `comSinal`, `css`, `$`, `semDado`, `serie`, `garantirCamada`, `ranqueDaVariavel`, `corRanque`, `corAnomalia`, `corMes`, `interpolar`, `posicao`, `PALETAS`, `RANQUE`, `ANOMALIA`, `MESES_COR`, `METRICAS_GFA`, `TIPOS_EVENTO`, `climaDaCamada`.
- Atributos por camada: `estado.atributos[camada][rid]` com os campos `nome, uf, cod, chunk (só Municipios/UCs), estado_dado, aq, aq_frac (razão 0–1), aq_ranque, aq_media, aq_dp, aq_anom_pct, aq_anom_dp, mes_pico, <m>, <m>_ranque, <m>_media, <m>_dp, <m>_anom_pct, <m>_anom_dp` para `m` em `n_incendios, tam_max, taxa_max, tam_p95, taxa_p95`, e `focos, focos_ranque, t_periodo, t_dif, p_periodo, p_dif_pct, eventos, ev_dur_media, ev_dur_max`. Ausente = `null` ou chave inexistente.
- Séries (`serie(tipo, camada, chunk)`): `gfa` → `{ano:[2002…2025], n_incendios:[…], tam_max, taxa_max, tam_p95, taxa_p95}`; `clima` → `{t,t_media,t_min,t_min_media,t_max,t_max_media,p,p_media}` com 12 valores de março a fevereiro (a série municipal antiga não tem `t_min`/`t_max`); `eventos` → `{queimada, possivel_incendio, incendio, atividade_antropica}` com 12 valores de janeiro a dezembro de 2025. Municípios e UCs têm séries divididas por UF (`reg.chunk`); as outras camadas, um arquivo só (`chunk` nulo).
- Geometrias: `estado.geometrias[camada]` é um GeoJSON `FeatureCollection` com `feature.properties.rid` (depois de `await garantirCamada(camada)`).
- Não há Node.js na máquina. Os testes rodam no navegador: `testes/downloads.html` carrega o núcleo e os testes e escreve o resultado na página e em `window.RESULTADO`. Servidor local: `python -m http.server 8765` na raiz do worktree.
- Commits: mensagem em português, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Arquivos

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `assets/downloads-nucleo.js` | criar | `window.FEFDownload`: catálogo de campos, filtro de feições, tabela, CSV, dicionário, LEIA, séries longas, CRC-32 e zip, nome de arquivo, prévia, projeção e SVG do mapa. Sem DOM. |
| `testes/downloads.html` | criar | página que roda os testes do núcleo |
| `testes/downloads-testes.js` | criar | testes do núcleo |
| `assets/plataforma.js` | modificar | extrair `faixaDe`, `corPara`, `legendaHTML`; gráficos aceitam um canvas alvo |
| `assets/downloads.js` | criar | janela "Baixar dados e análises", aba CSV, aba ficha, geração da ficha A4 |
| `assets/downloads.css` | criar | estilo da janela (a ficha leva o próprio CSS embutido) |
| `plataforma.html` | modificar | botão "Baixar dados" na barra, janela vazia, `<link>`/`<script>` novos |
| `img/logos/logo_fogoemfoco_horizontal_claro.svg` | criar | logo para fundo branco |
| `img/logos/logo_trees_claro.svg` | criar | logo da TREES para fundo branco |
| `.gitignore` | já ignora `.claude/` | — |

---

### Tarefa 1: Página de testes e esqueleto do núcleo

**Arquivos:**
- Criar: `assets/downloads-nucleo.js`
- Criar: `testes/downloads.html`
- Criar: `testes/downloads-testes.js`
- Criar (local, ignorado pelo git): `.claude/launch.json`

- [ ] **Passo 1: configuração do servidor de testes**

Criar `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "plataforma", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8765"], "port": 8765 }
  ]
}
```

- [ ] **Passo 2: página de testes**

Criar `testes/downloads.html`:

```html
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Testes · downloads</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 24px; }
  .ok { color: #2a7a3a; } .falha { color: #b8300f; font-weight: 600; }
  pre { background: #f4f1ec; padding: 8px; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>Testes do núcleo de downloads</h1>
<div id="saida"></div>
<script src="../assets/downloads-nucleo.js"></script>
<script>
  // Mini executor: teste(nome, fn) e igual(a, b). Sem dependencias.
  const casos = [];
  function teste(nome, fn) { casos.push([nome, fn]); }
  function igual(obtido, esperado, msg) {
    const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
    if (a !== b) throw new Error((msg ? msg + ': ' : '') + 'esperado ' + b + ', obtido ' + a);
  }
  function verdadeiro(cond, msg) { if (!cond) throw new Error(msg || 'condicao falsa'); }
</script>
<script src="downloads-testes.js"></script>
<script>
  (async () => {
    const saida = document.getElementById('saida');
    let ok = 0, falhas = [];
    for (const [nome, fn] of casos) {
      try { await fn(); ok++; saida.insertAdjacentHTML('beforeend', `<div class="ok">✓ ${nome}</div>`); }
      catch (e) { falhas.push(nome); saida.insertAdjacentHTML('beforeend', `<div class="falha">✗ ${nome}<pre>${e.message}</pre></div>`); }
    }
    window.RESULTADO = { ok, falhas };
    saida.insertAdjacentHTML('afterbegin', `<p><b>${ok} ok, ${falhas.length} falha(s)</b></p>`);
  })();
</script>
</body>
</html>
```

- [ ] **Passo 3: esqueleto do núcleo e primeiro teste**

Criar `assets/downloads-nucleo.js`:

```js
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
})();
```

Criar `testes/downloads-testes.js`:

```js
teste('o nucleo existe', () => {
  verdadeiro(typeof window.FEFDownload === 'object');
});
```

- [ ] **Passo 4: rodar os testes**

Subir o servidor (`preview_start` com o nome `plataforma`, ou `python -m http.server 8765` na raiz do worktree), abrir `http://localhost:8765/testes/downloads.html` e ler `window.RESULTADO`.
Esperado: `{ ok: 1, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads.html testes/downloads-testes.js
git commit -m "Downloads: esqueleto do nucleo e pagina de testes"
```

---

### Tarefa 2: Formatação de valor e CSV

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

- [ ] **Passo 1: testes**

Acrescentar a `testes/downloads-testes.js`:

```js
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
```

- [ ] **Passo 2: rodar e ver falhar**

Recarregar `testes/downloads.html`. Esperado: 4 falhas com "D.valorCSV is not a function" / "D.paraCSV is not a function".

- [ ] **Passo 3: implementar**

Em `assets/downloads-nucleo.js`, dentro da IIFE, antes da última linha:

```js
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
```

- [ ] **Passo 4: rodar e ver passar**

Recarregar. Esperado: `{ ok: 5, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: formatacao de celula e CSV"
```

---

### Tarefa 3: Catálogo de campos e blocos

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

O catálogo diz, para cada coluna baixável: id no atributo, bloco, nome da coluna no CSV, rótulo legível, unidade, descrição, fonte, fator (multiplicador) e se vem marcada por padrão.

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar**

Esperado: 5 falhas ("Cannot read properties of undefined").

- [ ] **Passo 3: implementar**

Em `assets/downloads-nucleo.js`:

```js
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
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 10, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: catalogo de campos por bloco"
```

---

### Tarefa 4: Filtro de feições e tabela principal

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

Regra da abrangência (especificação): `brasil` = todas; `uf` = Municípios e UCs pelo `chunk`, TIs pela primeira sigla de `uf`, Estados pela própria `uf`, Biomas inteiros; `area` = só a feição aberta (`rid`) e só na camada dela.

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 5 falhas novas.

- [ ] **Passo 3: implementar**

```js
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
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 15, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: filtro por abrangencia e tabela principal"
```

---

### Tarefa 5: Dicionário e LEIA

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 3 falhas novas.

- [ ] **Passo 3: implementar**

```js
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
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 18, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: dicionario dos campos e LEIA"
```

---

### Tarefa 6: Séries em formato longo

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 4 falhas novas.

- [ ] **Passo 3: implementar**

```js
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
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 22, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: series em formato longo"
```

---

### Tarefa 7: CRC-32 e zip

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

Zip "store" (sem compressão): para cada arquivo, cabeçalho local + bytes; no fim, diretório central + registro final. Nomes em UTF-8 (bit 11 do flag). Datas fixas no formato DOS.

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 3 falhas novas.

- [ ] **Passo 3: implementar**

```js
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
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 25, falhas: [] }`.

- [ ] **Passo 5: conferir com uma ferramenta externa**

No console da página de testes, gerar e baixar um zip de teste:

```js
const z = FEFDownload.zipar([{ nome: 'teste.csv', texto: 'nome,valor\r\nBahia,1.5\r\n', bom: true }, { nome: 'dicionário.csv', texto: 'ç' }]);
const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([z], { type: 'application/zip' })); a.download = 'teste.zip'; a.click();
```

Depois, no terminal: `python -c "import zipfile; z=zipfile.ZipFile(r'%USERPROFILE%/Downloads/teste.zip'); print(z.testzip(), z.namelist(), z.read('teste.csv'))"`.
Esperado: `None ['teste.csv', 'dicionário.csv'] b'\xef\xbb\xbfnome,valor\r\nBahia,1.5\r\n'`.

- [ ] **Passo 6: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: CRC-32 e zip sem compressao"
```

---

### Tarefa 8: Nome do arquivo e prévia do tamanho

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

- [ ] **Passo 1: testes**

```js
teste('nome: recortes e abrangencia sem acento', () => {
  igual(D.nomeBase(['UF', 'Municipios'], { tipo: 'uf', uf: 'BA' }), 'fogo-em-foco_2025-26_estados-municipios_BA');
  igual(D.nomeBase(['UCs'], { tipo: 'brasil' }), 'fogo-em-foco_2025-26_ucs_brasil');
  igual(D.nomeBase(['Municipios'], { tipo: 'area', nome: 'São Félix do Xingu' }), 'fogo-em-foco_2025-26_municipios_sao-felix-do-xingu');
});

teste('previa: linhas, colunas e tamanho aproximado', () => {
  const p = D.previa([{ feicoes: [['1', {}], ['2', {}]] }, { feicoes: [['3', {}]] }], ['aq', 'focos']);
  igual([p.linhas, p.colunas], [3, 7]);
  verdadeiro(p.bytes > 0);
});

teste('tamanho legivel', () => {
  igual(D.tamanhoLegivel(900), '1 KB');
  igual(D.tamanhoLegivel(42 * 1024), '42 KB');
  igual(D.tamanhoLegivel(3.4 * 1024 * 1024), '3,4 MB');
});
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 3 falhas novas.

- [ ] **Passo 3: implementar**

```js
  const SLUG_CAMADA = { UF: 'estados', Municipios: 'municipios', Biomas: 'biomas', UCs: 'ucs', TerrasIndigenas: 'tis' };

  function slug(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function nomeBase(camadas, abrangencia) {
    const onde = abrangencia.tipo === 'uf' ? abrangencia.uf
      : abrangencia.tipo === 'area' ? slug(abrangencia.nome || 'area') : 'brasil';
    return 'fogo-em-foco_2025-26_' + camadas.map(c => SLUG_CAMADA[c] || slug(c)).join('-') + '_' + onde;
  }

  // Estimativa simples: ~9 bytes por celula numerica, ~40 pelas colunas de identificacao.
  function previa(grupos, campos) {
    const linhas = grupos.reduce((s, g) => s + g.feicoes.length, 0);
    const colunas = ID_COLUNAS.length + CAMPOS.filter(c => campos.includes(c.id)).length;
    return { linhas, colunas, bytes: linhas * (40 + 9 * (colunas - ID_COLUNAS.length)) };
  }

  function tamanhoLegivel(b) {
    if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' KB';
    return (b / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  FEFDownload.slug = slug;
  FEFDownload.nomeBase = nomeBase;
  FEFDownload.previa = previa;
  FEFDownload.tamanhoLegivel = tamanhoLegivel;
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 28, falhas: [] }`.

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: nome do arquivo e previa do tamanho"
```

---

### Tarefa 9: Projeção e SVG do mapa da ficha

**Arquivos:**
- Modificar: `assets/downloads-nucleo.js`
- Modificar: `testes/downloads-testes.js`

Projeção equirretangular com correção do cosseno da latitude média (como o recorte é pequeno ou o país inteiro, basta para uma ficha). Recebe features GeoJSON (Polygon/MultiPolygon), uma função de cor por rid e o rid destacado.

- [ ] **Passo 1: testes**

```js
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
```

- [ ] **Passo 2: rodar e ver falhar** — Esperado: 3 falhas novas.

- [ ] **Passo 3: implementar**

```js
  function aneis(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates;
    if (geom.type === 'MultiPolygon') return geom.coordinates.flat();
    return [];
  }

  function caixa(features) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const f of features) for (const anel of aneis(f.geometry)) for (const [x, y] of anel) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return [x0, y0, x1, y1];
  }

  // features: GeoJSON; op: { cor(rid) -> cor, destaque?: rid, largura, altura, limites?, linha?, fundo? }
  function mapaSVG(features, op) {
    const [x0, y0, x1, y1] = op.limites || caixa(features);
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180);
    const larg = (x1 - x0) * k || 1, alt = (y1 - y0) || 1;
    const margem = 4;
    const esc = Math.min((op.largura - 2 * margem) / larg, (op.altura - 2 * margem) / alt);
    const dx = (op.largura - larg * esc) / 2, dy = (op.altura - alt * esc) / 2;
    const px = (x, y) => (dx + (x - x0) * k * esc).toFixed(1) + ',' + (dy + (y1 - y) * esc).toFixed(1);
    const caminho = (f) => aneis(f.geometry).map(a => 'M' + a.map(([x, y]) => px(x, y)).join('L') + 'Z').join('');
    const linha = op.linha || '#ffffff';
    let corpo = '';
    let contorno = '';
    for (const f of features) {
      const rid = String(f.properties.rid);
      corpo += `<path d="${caminho(f)}" fill="${op.cor(rid)}" stroke="${linha}" stroke-width="0.4"/>`;
      if (op.destaque !== undefined && rid === String(op.destaque)) {
        contorno = `<path d="${caminho(f)}" fill="none" stroke="#0a0c1c" stroke-width="2"/>`;
      }
    }
    const fundo = op.fundo ? `<rect width="${op.largura}" height="${op.altura}" fill="${op.fundo}"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${op.largura} ${op.altura}" width="100%">` +
      `<clipPath id="quadro"><rect width="${op.largura}" height="${op.altura}"/></clipPath>` +
      `<g clip-path="url(#quadro)">${fundo}${corpo}${contorno}</g></svg>`;
  }

  FEFDownload.caixa = caixa;
  FEFDownload.mapaSVG = mapaSVG;
```

- [ ] **Passo 4: rodar e ver passar** — Esperado: `{ ok: 31, falhas: [] }`. (Se o teste de "pontos dentro do quadro" falhar por causa do `0.0`, conferir que `px` usa `toFixed(1)` e que a regex aceita decimais.)

- [ ] **Passo 5: commit**

```bash
git add assets/downloads-nucleo.js testes/downloads-testes.js
git commit -m "Downloads: projecao e SVG do mapa da ficha"
```

---

### Tarefa 10: Extrações no `plataforma.js` (faixa, cor, legenda e gráficos com alvo)

**Arquivos:**
- Modificar: `assets/plataforma.js` (funções `calcularFaixa`, `corDe`, `montarLegenda`, `grafGfa`, `grafEventos`, `grafDif`, `grafClima`)

Sem mudança de comportamento no painel. O objetivo é a ficha poder calcular faixa, cor e legenda para outro conjunto de feições e desenhar os gráficos num canvas próprio.

- [ ] **Passo 1: faixa e cor de qualquer conjunto**

Trocar `function calcularFaixa() { … }` inteira por:

```js
// Faixa da escala continua para um conjunto de feicoes (o mapa usa as visiveis; a ficha,
// os municipios do estado ou a regiao em volta da area).
function faixaDe(regs, def) {
  if (def.escala !== 'continua' && def.escala !== 'diferenca') return null;
  const f = def.fator || 1;
  const vals = regs
    .filter(r => !semDado(r, def))
    .map(r => r[def.id] * f)
    .filter(v => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (!vals.length) return null;
  if (def.escala === 'diferenca') {
    // simetrica em torno do zero, pelo maior afastamento
    const m = Math.max(Math.abs(vals[0]), Math.abs(vals[vals.length - 1])) || 1;
    return [-m, m];
  }
  if (def.de1) return [1, Math.max(2, vals[vals.length - 1])];   // contagens: de 1 ao maximo
  if (def.paleta === 'DUR') return [1, Math.max(2, vals[Math.floor(vals.length * 0.99)])];
  if (def.paleta === 'TEMP') return [vals[0], vals[vals.length - 1]];
  // percentil 98 no topo: sem isso um unico municipio enorme achata todo o resto
  return [0, vals[Math.floor(vals.length * 0.98)] || vals[vals.length - 1]];
}

function calcularFaixa() {
  estado.faixa = faixaDe(Object.values(visiveis()), defAtual());
}
```

Trocar `function corDe(reg) { … }` por:

```js
function corPara(reg, def, faixa) {
  const vazio = semDado(reg, def);
  if (vazio) return css(vazio[0]);
  const v = reg[def.id];
  if (def.escala === 'ranque') return corRanque(v);
  if (def.escala === 'anomalia') return corAnomalia(v);
  if (def.escala === 'mes') return corMes(v);
  return faixa ? interpolar(PALETAS[def.paleta], posicao(v * (def.fator || 1), def, faixa))
               : PALETAS[def.paleta][0];
}

function corDe(reg) {
  return corPara(reg, defAtual(), estado.faixa);
}
```

- [ ] **Passo 2: legenda como texto**

Em `function montarLegenda()`, mover a montagem do HTML para uma função nova `legendaHTML(def, faixa, regs)` e fazer `montarLegenda` usá-la. Resultado:

```js
// HTML da legenda de uma variavel, para o mapa e para a ficha.
function legendaHTML(def, faixaAtual, regs) {
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
  } else if (faixaAtual) {
    const [lo, hi] = faixaAtual;
    const casas = def.casas === undefined ? 1 : def.casas;
    const fmt = (v) => nf(v, Math.abs(v) >= 100 ? 0 : casas);
    faixa = `linear-gradient(90deg,${PALETAS[def.paleta].join(',')})`;
    titulo = def.rotulo + (def.unidade ? ` (${def.unidade.trim()})` : '');
    baixo = def.escala === 'diferenca'
      ? `<span class="pontas"><span>${comSinal(lo, casas)}</span><span>0</span><span>${comSinal(hi, casas)}</span></span>`
      : `<span class="pontas"><span>${fmt(lo)}</span><span>${fmt(hi)}</span></span>`;
  }
  // o que fica sem cor, conforme a fonte do dado
  const vazios = new Map();
  regs.forEach(r => { const v = semDado(r, def); if (v) vazios.set(v[1], v[0]); });
  const linhas = [...vazios].map(([rot, tok]) =>
    `<span class="linha"><i style="background:${css(tok)}"></i>${rot}</span>`).join('');
  return `
    <span class="titulo-leg">${titulo}</span>
    ${faixa ? `<span class="faixa" style="background:${faixa}"></span>` : ''}
    ${baixo}
    ${linhas}`;
}

function montarLegenda() {
  $('#legenda-corpo').innerHTML = legendaHTML(defAtual(), estado.faixa, Object.values(visiveis()));

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
```

- [ ] **Passo 3: gráficos com canvas alvo**

Em cada uma das quatro funções de gráfico, acrescentar um parâmetro opcional `alvo` (canvas) e devolver o gráfico. Quando `alvo` vem, o gráfico não entra em `estado.graficos` (quem chamou cuida dele). Mudanças exatas:

- `function grafGfa(s, reg) {` → `function grafGfa(s, reg, alvo) {`; trocar `estado.graficos.push(new Chart($('#g-gfa'), {` por `const g = new Chart(alvo || $('#g-gfa'), {`; trocar o fechamento `}));` da chamada por `});` seguido de `if (!alvo) estado.graficos.push(g);` e `return g;`.
- `function grafEventos(s) {` → `function grafEventos(s, alvo) {`; mesma troca com `$('#g-eventos')`.
- `function grafDif(s, temp) {` → `function grafDif(s, temp, alvo) {`; mesma troca com `$(temp ? '#g-temp-dif' : '#g-chuva-dif')`.
- `function grafClima(s, temp) {` → `function grafClima(s, temp, alvo) {`; mesma troca com `$(temp ? '#g-temp' : '#g-chuva')`.

Exemplo do formato final (grafEventos):

```js
function grafEventos(s, alvo) {
  const base = baseGraf();
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const g = new Chart(alvo || $('#g-eventos'), {
    type: 'bar',
    data: { /* inalterado */ },
    options: { /* inalterado */ },
  });
  if (!alvo) estado.graficos.push(g);
  return g;
}
```

- [ ] **Passo 4: conferir que nada mudou na plataforma**

Abrir `http://localhost:8765/plataforma.html`, clicar na Bahia, trocar a variável para "Número de focos" e para "Mês de pico", abrir Municípios filtrado no MA. No console: `[estado.faixa, Object.keys(Chart.instances).length]`.
Esperado: mapa, legenda e os seis gráficos do painel iguais aos de antes; console sem erros.

- [ ] **Passo 5: commit**

```bash
git add assets/plataforma.js
git commit -m "Plataforma: faixa, cor e legenda de qualquer conjunto; graficos num canvas dado"
```

---

### Tarefa 11: Logos para fundo branco

**Arquivos:**
- Criar: `img/logos/logo_fogoemfoco_horizontal_claro.svg`
- Criar: `img/logos/logo_trees_claro.svg`

- [ ] **Passo 1: gerar os arquivos (o branco vira a cor do texto da identidade)**

```bash
sed 's/fill="white"/fill="#0a0c1c"/g' img/logos/logo_fogoemfoco_horizontal.svg > img/logos/logo_fogoemfoco_horizontal_claro.svg
sed 's/fill="white"/fill="#0a0c1c"/g' img/logos/logo_trees.svg > img/logos/logo_trees_claro.svg
grep -c 'fill="white"' img/logos/logo_fogoemfoco_horizontal_claro.svg img/logos/logo_trees_claro.svg
```

Esperado: `0` nos dois.

- [ ] **Passo 2: conferir visualmente** — abrir `http://localhost:8765/img/logos/logo_fogoemfoco_horizontal_claro.svg` e `…/logo_trees_claro.svg`: letras escuras, laranja/verde preservados.

- [ ] **Passo 3: commit**

```bash
git add img/logos/logo_fogoemfoco_horizontal_claro.svg img/logos/logo_trees_claro.svg
git commit -m "Logos do Fogo em Foco e da TREES para fundo branco"
```

---

### Tarefa 12: Botão "Baixar dados" e janela vazia com abas

**Arquivos:**
- Modificar: `plataforma.html`
- Criar: `assets/downloads.css`
- Criar: `assets/downloads.js`

- [ ] **Passo 1: HTML**

Em `plataforma.html`, dentro de `<header class="barra">`, logo depois de `<span class="periodo" id="periodo"></span>`:

```html
    <button class="baixar" id="abrir-download" type="button" aria-haspopup="dialog">
      <span aria-hidden="true">⤓</span> Baixar dados</button>
```

Antes de `</body>`, depois do último `<script>`, e no `<head>`, depois do último `<link rel="stylesheet">`:

```html
<!-- no head -->
<link rel="stylesheet" href="assets/downloads.css">
```

```html
<!-- depois de assets/plataforma.js -->
<div class="janela-download" id="janela-download" role="dialog" aria-modal="true" aria-labelledby="titulo-download" hidden>
  <div class="caixa-download">
    <header><b id="titulo-download">Baixar dados e análises</b>
      <button type="button" class="fechar" id="fechar-download" aria-label="Fechar">✕</button></header>
    <div class="abas-download" role="tablist">
      <button type="button" role="tab" data-aba="csv" aria-selected="true">⤓ Dados em tabela (CSV)</button>
      <button type="button" role="tab" data-aba="ficha" aria-selected="false">⤓ Ficha da área (PDF)</button>
    </div>
    <div class="conteudo-download" id="conteudo-download"></div>
  </div>
</div>
<script src="assets/downloads-nucleo.js"></script>
<script src="assets/downloads.js"></script>
```

- [ ] **Passo 2: CSS**

Criar `assets/downloads.css`:

```css
/* Botao na barra do topo e janela "Baixar dados e analises". */
.barra .baixar {
  margin-left: auto; display: inline-flex; align-items: center; gap: 7px; cursor: pointer;
  border: 1px solid var(--laranja); background: var(--laranja); color: #fff; border-radius: 999px;
  padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 600;
}
.barra .baixar:hover { filter: brightness(1.08); }
.barra .periodo + .baixar { margin-left: 14px; }

.janela-download { position: fixed; inset: 0; z-index: 2000; background: rgba(10, 12, 28, .38); display: flex;
  align-items: flex-start; justify-content: center; padding: 72px 16px 16px; }
.janela-download[hidden] { display: none; }
.caixa-download { width: min(640px, 100%); max-height: calc(100vh - 96px); display: flex; flex-direction: column;
  background: var(--superficie); color: var(--texto); border: 1px solid var(--borda); border-radius: 14px;
  box-shadow: 0 18px 50px var(--sombra); overflow: hidden; }
.caixa-download > header { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px;
  border-bottom: 1px solid var(--borda); }
.caixa-download > header b { font-size: 15px; }
.caixa-download .fechar { border: 0; background: transparent; color: var(--suave); font-size: 16px; cursor: pointer; }
.abas-download { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 16px 0; }
.abas-download button { border: 1px solid var(--borda); background: transparent; color: var(--texto); border-radius: 9px;
  padding: 9px 10px; font: inherit; font-size: 13.5px; cursor: pointer; text-align: left; }
.abas-download button[aria-selected="true"] { border: 2px solid var(--laranja); font-weight: 600; }
.conteudo-download { overflow-y: auto; padding: 4px 16px 0; }
.passo-dl { padding: 12px 0; border-bottom: 1px solid var(--borda); }
.passo-dl h4 { margin: 0 0 8px; font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--laranja-acao); }
.passo-dl h4 small { color: var(--suave); text-transform: none; letter-spacing: 0; font-weight: 400; margin-left: 6px; }
.chips-dl { display: flex; flex-wrap: wrap; gap: 6px; }
.chips-dl label { border: 1px solid var(--borda); border-radius: 999px; padding: 4px 11px; font-size: 13px; cursor: pointer; }
.chips-dl input { display: none; }
.chips-dl label:has(input:checked) { background: var(--selecionado); color: var(--sobre-selecionado); border-color: transparent; }
.abrang-dl { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13.5px; align-items: center; }
.abrang-dl label { display: inline-flex; align-items: center; gap: 6px; }
.abrang-dl input { accent-color: var(--laranja); }
.abrang-dl select { font: inherit; font-size: 13px; padding: 3px 6px; border-radius: 6px; border: 1px solid var(--borda);
  background: var(--superficie-2); color: var(--texto); }
.blocos-dl { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
.blocos-dl details summary { cursor: pointer; font-size: 13px; font-weight: 600; list-style: none; display: flex; gap: 7px; align-items: center; }
.blocos-dl details summary::-webkit-details-marker { display: none; }
.blocos-dl .vars { padding: 4px 0 4px 22px; display: flex; flex-direction: column; gap: 2px; font-size: 12.5px; color: var(--suave); }
.blocos-dl input { accent-color: var(--laranja); }
.rodape-dl { position: sticky; bottom: 0; display: flex; justify-content: space-between; align-items: center; gap: 12px;
  padding: 11px 16px; margin: 0 -16px; background: var(--superficie-2); border-top: 1px solid var(--borda);
  font-size: 12.5px; color: var(--suave); }
.rodape-dl button { border: 0; background: var(--laranja); color: #fff; border-radius: 8px; padding: 8px 16px;
  font: inherit; font-weight: 700; cursor: pointer; }
.rodape-dl button[disabled] { opacity: .55; cursor: progress; }
.aviso-dl { padding: 18px 0; color: var(--suave); font-size: 14px; line-height: 1.55; }
@media (max-width: 560px) { .blocos-dl { grid-template-columns: 1fr; } }
```

- [ ] **Passo 3: abrir e fechar**

Criar `assets/downloads.js`:

```js
/* Janela "Baixar dados e analises": dados em tabela (CSV num .zip) e ficha da area (A4 pela
 * janela de impressao). A logica pura fica em downloads-nucleo.js; aqui ficam a janela, a
 * leitura do estado da plataforma e a geracao. Usa as funcoes globais de plataforma.js.
 */
(function () {
  const D = window.FEFDownload;
  const janela = document.getElementById('janela-download');
  const conteudo = document.getElementById('conteudo-download');
  let aba = 'csv';

  function abrir() {
    janela.hidden = false;
    trocarAba(aba);
    document.getElementById('fechar-download').focus();
  }

  function fechar() {
    janela.hidden = true;
    document.getElementById('abrir-download').focus();
  }

  function trocarAba(nova) {
    aba = nova;
    janela.querySelectorAll('[data-aba]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
    conteudo.innerHTML = aba === 'csv' ? htmlCSV() : htmlFicha();
    if (aba === 'csv') ligarCSV(); else ligarFicha();
  }

  // As duas abas: preenchidas nas tarefas seguintes.
  function htmlCSV() { return '<p class="aviso-dl">Em construção.</p>'; }
  function ligarCSV() {}
  function htmlFicha() { return '<p class="aviso-dl">Em construção.</p>'; }
  function ligarFicha() {}

  document.getElementById('abrir-download').addEventListener('click', abrir);
  document.getElementById('fechar-download').addEventListener('click', fechar);
  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !janela.hidden) fechar(); });
  janela.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.aba)));

  window.FEFJanelaDownload = { abrir, fechar, trocarAba };
})();
```

(As funções `htmlCSV`, `ligarCSV`, `htmlFicha`, `ligarFicha` são substituídas nas tarefas 13 e 15; o texto "Em construção" some ali.)

- [ ] **Passo 4: conferir**

Recarregar a plataforma. Esperado: botão laranja "⤓ Baixar dados" na barra, ao lado do período; clique abre a janela com as duas abas; ✕, Esc e clique fora fecham; nos dois temas.

- [ ] **Passo 5: commit**

```bash
git add plataforma.html assets/downloads.css assets/downloads.js
git commit -m "Downloads: botao Baixar dados e janela com abas"
```

---

### Tarefa 13: Aba "Dados em tabela" — passos e prévia

**Arquivos:**
- Modificar: `assets/downloads.js`

- [ ] **Passo 1: substituir `htmlCSV` e `ligarCSV`**

Trocar as linhas `function htmlCSV() { … }` e `function ligarCSV() {}` por:

```js
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
               'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  // escolhas da aba CSV; preenchidas a cada abertura a partir do estado da tela
  let esc = null;

  function escolhasIniciais() {
    const area = estado.selecionado;
    return {
      camadas: [estado.camada],
      abrangencia: area ? 'area' : (estado.filtroUf ? 'uf' : 'brasil'),
      uf: estado.filtroUf || (area && estado.atributos[estado.camada][area]
        ? String(estado.atributos[estado.camada][area].chunk || estado.atributos[estado.camada][area].uf || 'BA').split(',')[0].trim()
        : 'BA'),
      campos: D.CAMPOS.filter(c => c.padrao).map(c => c.id),
      series: false,
    };
  }

  function htmlCSV() {
    esc = esc || escolhasIniciais();
    const area = estado.selecionado ? estado.atributos[estado.camada][estado.selecionado] : null;
    const chip = (c) => `<label><input type="checkbox" name="camada-dl" value="${c.id}"${
      esc.camadas.includes(c.id) ? ' checked' : ''}>${c.rotulo}</label>`;
    const radio = (v, rot, extra = '', des = false) => `<label><input type="radio" name="abrang-dl" value="${v}"${
      esc.abrangencia === v ? ' checked' : ''}${des ? ' disabled' : ''}>${rot}</label>${extra}`;
    const blocos = D.BLOCOS.map(b => {
      const cs = D.CAMPOS.filter(c => c.bloco === b.id);
      const n = cs.filter(c => esc.campos.includes(c.id)).length;
      return `<details${n ? ' open' : ''}><summary><input type="checkbox" data-bloco="${b.id}"${
        n === cs.length ? ' checked' : ''}> ${b.rotulo} <small>(${n} de ${cs.length})</small></summary>
        <div class="vars">${cs.map(c => `<label><input type="checkbox" name="campo-dl" value="${c.id}"${
          esc.campos.includes(c.id) ? ' checked' : ''}> ${c.rotulo}${c.unidade ? ` (${c.unidade})` : ''}</label>`).join('')}</div></details>`;
    }).join('');
    return `
      <div class="passo-dl"><h4>1 · Recortes <small>um ou mais</small></h4>
        <div class="chips-dl">${CAMADAS.map(chip).join('')}</div></div>
      <div class="passo-dl"><h4>2 · Abrangência</h4><div class="abrang-dl">
        ${radio('brasil', 'Brasil inteiro')}
        ${radio('uf', 'Um estado:', ` <select id="uf-dl">${UFS.map(u => `<option${u === esc.uf ? ' selected' : ''}>${u}</option>`).join('')}</select>`)}
        ${radio('area', area ? `Só ${area.nome}` : 'Só a área aberta no painel', '', !area)}</div></div>
      <div class="passo-dl"><h4>3 · Variáveis <small>o bloco inteiro ou só algumas</small></h4>
        <div class="blocos-dl">${blocos}</div></div>
      <div class="passo-dl"><h4>4 · Séries temporais <small>opcional</small></h4>
        <label class="abrang-dl"><input type="checkbox" id="series-dl"${esc.series ? ' checked' : ''}>
          Incluir as séries (GFA 2002-2025, clima mês a mês, eventos por mês)</label></div>
      <div class="rodape-dl"><span id="previa-dl"></span><button type="button" id="baixar-dl">Baixar</button></div>`;
  }

  // Grupos [{camada, rotulo, feicoes}] das escolhas atuais. Carrega as camadas que faltam.
  async function gruposEscolhidos() {
    const abr = esc.abrangencia === 'area'
      ? { tipo: 'area', camada: estado.camada, rid: estado.selecionado }
      : esc.abrangencia === 'uf' ? { tipo: 'uf', uf: esc.uf } : { tipo: 'brasil' };
    const grupos = [];
    for (const id of esc.camadas) {
      await garantirCamada(id);
      const cam = CAMADAS.find(c => c.id === id);
      grupos.push({ camada: id, rotulo: cam.rotulo, feicoes: D.filtrarFeicoes(estado.atributos[id], id, abr) });
    }
    return { grupos, abr };
  }

  async function atualizarPrevia() {
    const alvo = document.getElementById('previa-dl');
    if (!alvo) return;
    if (!esc.camadas.length || !esc.campos.length) {
      alvo.textContent = 'Escolha ao menos um recorte e uma variável.';
      document.getElementById('baixar-dl').disabled = true;
      return;
    }
    document.getElementById('baixar-dl').disabled = false;
    alvo.textContent = 'Calculando…';
    const { grupos } = await gruposEscolhidos();
    const p = D.previa(grupos, esc.campos);
    alvo.textContent = `${nf(p.linhas)} linhas · ${p.colunas} colunas · ~${D.tamanhoLegivel(p.bytes)}` +
      (esc.series ? ' + séries' : '');
  }

  function ligarCSV() {
    const caixa = conteudo;
    caixa.querySelectorAll('input[name="camada-dl"]').forEach(i => i.onchange = () => {
      esc.camadas = [...caixa.querySelectorAll('input[name="camada-dl"]:checked')].map(x => x.value);
      atualizarPrevia();
    });
    caixa.querySelectorAll('input[name="abrang-dl"]').forEach(i => i.onchange = () => { esc.abrangencia = i.value; atualizarPrevia(); });
    caixa.querySelector('#uf-dl').onchange = (e) => { esc.uf = e.target.value; esc.abrangencia = 'uf'; trocarAba('csv'); atualizarPrevia(); };
    caixa.querySelectorAll('input[name="campo-dl"]').forEach(i => i.onchange = () => {
      esc.campos = [...caixa.querySelectorAll('input[name="campo-dl"]:checked')].map(x => x.value);
      trocarAba('csv');
    });
    caixa.querySelectorAll('input[data-bloco]').forEach(i => {
      const cs = D.CAMPOS.filter(c => c.bloco === i.dataset.bloco).map(c => c.id);
      const n = cs.filter(id => esc.campos.includes(id)).length;
      i.indeterminate = n > 0 && n < cs.length;
      i.onclick = (e) => e.stopPropagation();   // nao abre/fecha o details
      i.onchange = () => {
        esc.campos = i.checked ? [...new Set(esc.campos.concat(cs))] : esc.campos.filter(id => !cs.includes(id));
        trocarAba('csv');
      };
    });
    caixa.querySelector('#series-dl').onchange = (e) => { esc.series = e.target.checked; atualizarPrevia(); };
    caixa.querySelector('#baixar-dl').onclick = baixarCSV;
    atualizarPrevia();
  }

  async function baixarCSV() {}   // tarefa 14
```

E em `abrir()`, antes de `trocarAba(aba)`, zerar as escolhas para refletir a tela atual:

```js
    esc = null;
```

- [ ] **Passo 2: conferir**

Recarregar; abrir Municípios, filtrar MA, abrir "Baixar dados". Esperado: recorte Municípios marcado; abrangência "Um estado: MA"; bloco Ranques marcado (7 de 7); prévia "217 linhas · 12 colunas · ~…". Marcar "Estados" → prévia soma 1 linha. Marcar o bloco "Eventos de fogo" → "(3 de 3)" e prévia com 15 colunas. Clicar numa área no mapa e reabrir → "Só <nome>" vem marcado. Console sem erros.

- [ ] **Passo 3: commit**

```bash
git add assets/downloads.js
git commit -m "Downloads: passos da aba de dados e previa"
```

---

### Tarefa 14: Aba "Dados em tabela" — gerar e baixar o .zip

**Arquivos:**
- Modificar: `assets/downloads.js`

- [ ] **Passo 1: substituir `async function baixarCSV() {}`**

```js
  // Cede o navegador entre partes, para a pagina nao travar nos downloads grandes.
  const ceder = () => new Promise(r => setTimeout(r, 0));

  function salvarArquivo(bytes, nome, tipo) {
    const url = URL.createObjectURL(new Blob([bytes], { type: tipo }));
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function seriesDe(grupos, tipo) {
    const linhas = []; let colunas = null;
    for (const g of grupos) {
      const chunks = [...new Set(g.feicoes.map(([, r]) => r.chunk || null))];
      const series = {};
      for (const ch of chunks) Object.assign(series, await serie(tipo, g.camada, ch));
      const t = D.seriesLongas(tipo, g.rotulo, g.feicoes, series);
      colunas = t.colunas; linhas.push(...t.linhas);
      await ceder();
    }
    return colunas ? D.paraCSV(colunas, linhas) : null;
  }

  async function baixarCSV() {
    const botao = document.getElementById('baixar-dl');
    const previa = document.getElementById('previa-dl');
    botao.disabled = true; botao.textContent = 'Preparando…';
    try {
      const { grupos, abr } = await gruposEscolhidos();
      const area = abr.tipo === 'area' ? estado.atributos[estado.camada][estado.selecionado] : null;
      const base = D.nomeBase(esc.camadas, abr.tipo === 'area' ? { tipo: 'area', nome: area && area.nome } : abr);
      const tabela = D.montarTabela(grupos, esc.campos);
      await ceder();
      const arquivos = [
        { nome: base + '.csv', texto: D.paraCSV(tabela.colunas, tabela.linhas), bom: true },
        { nome: 'dicionario.csv', texto: (d => D.paraCSV(d.colunas, d.linhas))(D.dicionario(esc.campos)), bom: true },
        { nome: 'LEIA.txt', texto: D.textoLeia({ geradoEm: new Date().toLocaleDateString('pt-BR') }), bom: true },
      ];
      if (esc.series) {
        for (const tipo of ['gfa', 'clima', 'eventos']) {
          previa.textContent = `Séries: ${tipo}…`;
          const texto = await seriesDe(grupos, tipo);
          if (texto) arquivos.push({ nome: `series_${tipo}.csv`, texto, bom: true });
        }
      }
      salvarArquivo(D.zipar(arquivos), base + '.zip', 'application/zip');
      previa.textContent = `Pronto: ${nf(tabela.linhas.length)} linhas.`;
    } catch (e) {
      previa.textContent = 'Não foi possível gerar o arquivo: ' + e.message;
    } finally {
      botao.disabled = false; botao.textContent = 'Baixar';
    }
  }
```

- [ ] **Passo 2: conferir o arquivo**

Na plataforma: Estados, abrangência Brasil, blocos Ranques + Área queimada + Focos, com séries. Baixar. No terminal (trocar o nome pelo baixado):

```bash
python -c "
import zipfile, io, pandas as pd
z = zipfile.ZipFile(r'C:/Users/Henri/Downloads/fogo-em-foco_2025-26_estados_brasil.zip')
print(z.testzip(), z.namelist())
t = pd.read_csv(io.BytesIO(z.read('fogo-em-foco_2025-26_estados_brasil.csv')), encoding='utf-8-sig')
print(t.shape); print(t[t.uf=='BA'][['nome','ranque_area_queimada','aq_km2','focos']])
s = pd.read_csv(io.BytesIO(z.read('series_gfa.csv')), encoding='utf-8-sig'); print(s.shape, s.ano_inicio.min(), s.ano_inicio.max())
"
```

Esperado: `None` no testzip; 6 arquivos; tabela com 27 linhas; Bahia com ranque 4, `aq_km2` 1622.1302, focos 11653 (iguais ao painel); séries GFA 27×24 = 648 linhas de 2002 a 2025.

Também: Municípios + Brasil inteiro + todos os blocos + séries — a página continua respondendo (o botão mostra "Preparando…" e as etapas) e o zip baixa.

- [ ] **Passo 3: commit**

```bash
git add assets/downloads.js
git commit -m "Downloads: gera e baixa o zip com tabela, dicionario, LEIA e series"
```

---

### Tarefa 15: Aba "Ficha da área" e página A4

**Arquivos:**
- Modificar: `assets/downloads.js`

A ficha abre numa janela nova (aberta já no clique, para não ser bloqueada), que recebe um HTML completo com CSS próprio, imagens dos gráficos (canvas → PNG em alta resolução) e o mapa em SVG, e chama `print()`. Os gráficos são desenhados com o tema claro forçado e voltam ao tema do leitor no fim.

- [ ] **Passo 1: substituir `htmlFicha` e `ligarFicha`**

```js
  function htmlFicha() {
    const rid = estado.selecionado;
    if (!rid) {
      return `<p class="aviso-dl">Escolha uma área no mapa ou na busca para gerar a ficha. Ela sai com a
        variável que estiver no mapa.</p>`;
    }
    const reg = estado.atributos[estado.camada][rid];
    const def = defAtual();
    return `<p class="aviso-dl">Ficha de <b>${reg.nome}</b>, em uma página A4, com o mapa em
      <b>${def.rotulo.toLowerCase()}</b>. Abre a janela de impressão: escolha <b>Salvar como PDF</b>.</p>
      <div class="rodape-dl"><span id="previa-dl">Uma página A4</span>
        <button type="button" id="gerar-ficha">Gerar ficha</button></div>`;
  }

  function ligarFicha() {
    const b = document.getElementById('gerar-ficha');
    if (b) b.onclick = () => gerarFicha(estado.selecionado);
  }
```

- [ ] **Passo 2: dados do mapa da ficha**

Acrescentar dentro da IIFE:

```js
  // Feicoes e cores do mapa da ficha. Estado: os municipios dele. Outras camadas: a area
  // e as vizinhas da mesma camada num quadro 60% maior que a area.
  async function mapaDaFicha(camada, rid, def) {
    const reg = estado.atributos[camada][rid];
    let feicoes, regs, destaque = rid, limites;
    if (camada === 'UF') {
      await garantirCamada('Municipios');
      const am = estado.atributos.Municipios;
      feicoes = estado.geometrias.Municipios.features.filter(f => (am[String(f.properties.rid)] || {}).uf === reg.uf);
      regs = feicoes.map(f => am[String(f.properties.rid)]);
      destaque = undefined;
    } else {
      const geo = estado.geometrias[camada].features;
      const alvo = geo.find(f => String(f.properties.rid) === String(rid));
      const [x0, y0, x1, y1] = D.caixa([alvo]);
      const mx = Math.max((x1 - x0) * 0.6, 0.3), my = Math.max((y1 - y0) * 0.6, 0.3);
      limites = [x0 - mx, y0 - my, x1 + mx, y1 + my];
      feicoes = geo.filter(f => { const [a, b, c, d] = D.caixa([f]);
        return c >= limites[0] && a <= limites[2] && d >= limites[1] && b <= limites[3]; });
      regs = feicoes.map(f => estado.atributos[camada][String(f.properties.rid)]).filter(Boolean);
    }
    const atrib = camada === 'UF' ? estado.atributos.Municipios : estado.atributos[camada];
    const faixa = faixaDe(regs, def);
    const svg = D.mapaSVG(feicoes, { cor: (r) => corPara(atrib[r], def, faixa), destaque,
      largura: 420, altura: 330, limites, linha: '#ffffff', fundo: '#f4f1ec' });
    return { svg, legenda: legendaHTML(def, faixa, regs),
             titulo: camada === 'UF' ? `${def.rotulo} por município` : `${def.rotulo} na região` };
  }
```

- [ ] **Passo 3: gráficos como imagem**

```js
  // Desenha um grafico do painel num canvas fora da tela e devolve o PNG (3x, para
  // impressao nitida). desenhar(canvas) chama grafGfa/grafEventos/grafClima/grafDif.
  async function graficoPNG(desenhar, largura, altura) {
    const caixa = document.createElement('div');
    caixa.style.cssText = `position:fixed;left:-10000px;top:0;width:${largura}px;height:${altura}px`;
    const cv = document.createElement('canvas');
    caixa.appendChild(cv); document.body.appendChild(caixa);
    const antes = Chart.defaults.devicePixelRatio, anim = Chart.defaults.animation;
    Chart.defaults.devicePixelRatio = 3; Chart.defaults.animation = false;
    let g;
    try {
      g = desenhar(cv);
      g.update('none');
      return g.toBase64Image('image/png', 1);
    } finally {
      if (g) g.destroy();
      Chart.defaults.devicePixelRatio = antes; Chart.defaults.animation = anim;
      caixa.remove();
    }
  }
```

- [ ] **Passo 4: montar e imprimir a ficha**

```js
  const LOGO = (arq) => new URL('img/logos/' + arq, location.href).href;

  function htmlRanques(reg, def) {
    const principal = ranqueDaVariavel(def);
    const outros = VARIAVEIS.filter(v => v.escala === 'ranque' && v.id !== principal.id);
    const vz = semDado(reg, principal);
    const grande = `<div class="rq-g"><b>${vz ? '—' : reg[principal.id] + 'º'}</b><small>${vz ? principal.rotulo + ': ' + vz[1]
      : principal.destaque}</small></div>`;
    return grande + outros.map(v => {
      const z = semDado(reg, v);
      return `<div class="rq-m"><b style="color:${z ? '#9a9488' : corRanque(reg[v.id])}">${z ? '—' : reg[v.id] + 'º'}</b><small>${v.rotulo}</small></div>`;
    }).join('');
  }

  function htmlNumeros(reg) {
    const aq = reg.estado_dado === 'ok'
      ? `<div class="nums"><div><b>${nf(reg.aq, 1)} km²</b>no período</div>
           <div><b>${reg.aq_anom_pct === null ? '—' : comSinal(reg.aq_anom_pct, 0) + '%'}</b>vs. média (${nf(reg.aq_media, 0)})</div>
           <div><b>${reg.aq_frac === null ? '—' : nf(reg.aq_frac * 100, 2) + '%'}</b>do território</div></div>
         ${reg.mes_pico ? `<small>mês de pico: ${MESES_EXTENSO[reg.mes_pico - 1]}</small>` : ''}`
      : `<p class="nota">${semDado(reg, VARIAVEIS.find(v => v.id === 'aq'))[1]}.</p>`;
    const linhasGfa = METRICAS_GFA.map(m => {
      const v = reg[m.id], an = reg[m.id + '_anom_pct'];
      const tem = v !== null && v !== undefined && v > 0;
      return `<tr><td>${m.titulo}${m.unidade ? ` (${m.unidade.trim()})` : ''}</td><td>${tem ? nf(v, m.casas) : '—'}</td>
        <td>${reg[m.id + '_media'] === null || reg[m.id + '_media'] === undefined ? '—'
          : nf(reg[m.id + '_media'], m.casas) + ' ± ' + nf(reg[m.id + '_dp'], m.casas)}</td>
        <td>${tem && an !== null && an !== undefined ? `<span class="tag" style="background:${corAnomalia(an)}">${comSinal(an, 0)}%</span>` : '—'}</td>
        <td>${tem && reg[m.id + '_ranque'] ? reg[m.id + '_ranque'] + 'º' : '—'}</td></tr>`;
    }).join('');
    return `
      <div class="bl"><h4>Área queimada em vegetação</h4>${aq}</div>
      <div class="bl"><h4>Métricas de fogo (GFA)</h4><table><tr><th>métrica</th><th>2025-26</th><th>média ± dp</th>
        <th>anomalia</th><th>ranque</th></tr>${linhasGfa}</table></div>
      <div class="bl"><h4>Focos e eventos</h4><div class="nums">
        <div><b>${reg.focos ? nf(reg.focos) : '—'}</b>focos de calor</div>
        <div><b>${reg.eventos ? nf(reg.eventos) : '—'}</b>eventos em 2025</div>
        <div><b>${reg.ev_dur_media === null || reg.ev_dur_media === undefined ? '—' : nf(reg.ev_dur_media, 1) + ' dias'}</b>duração média</div></div></div>`;
  }

  const CSS_FICHA = `
    @page { size: A4; margin: 12mm 12mm 11mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { margin: 0; font-family: 'Instrument Sans', system-ui, sans-serif; color: #0a0c1c; font-size: 8.6pt; }
    .pag { width: 186mm; min-height: 270mm; display: flex; flex-direction: column; gap: 3.2mm; }
    .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 0.6mm solid #d64a0d; padding-bottom: 2mm; }
    .cab h1 { margin: 0; font-size: 20pt; } .cab p { margin: 1mm 0 0; color: #6b6f7e; font-size: 8.5pt; }
    .cab img { height: 7.5mm; }
    .rq { display: grid; grid-template-columns: 1.5fr repeat(6, 1fr); gap: 2mm; align-items: center; }
    .rq-g { display: flex; gap: 2mm; align-items: center; } .rq-g b { font-size: 26pt; color: #d64a0d; line-height: .9; }
    .rq small { color: #6b6f7e; font-size: 7pt; line-height: 1.15; display: block; }
    .rq-m { display: flex; gap: 1.5mm; align-items: center; } .rq-m b { font-size: 14pt; }
    .meio { display: grid; grid-template-columns: 1.1fr 1fr; gap: 3mm; }
    .mapa, .bl { border: 0.25mm solid #ebe6de; border-radius: 1.5mm; padding: 2mm; }
    .mapa small { color: #6b6f7e; } .blocos { display: grid; gap: 2mm; align-content: start; }
    .bl h4 { margin: 0 0 1.2mm; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: #d64a0d; }
    .nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5mm; } .nums b { display: block; font-size: 10.5pt; }
    table { width: 100%; border-collapse: collapse; font-size: 7.4pt; } td, th { padding: .5mm 1mm; border-bottom: .2mm solid #f1ede6; text-align: left; }
    th { color: #6b6f7e; font-weight: 600; } .tag { color: #fff; padding: 0 1.2mm; border-radius: .6mm; }
    .graf { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 3mm; } .graf img { width: 100%; display: block; }
    .graf .bl { padding: 1.5mm 2mm; } .nota { color: #6b6f7e; margin: 0; }
    .leg { font-size: 7pt; } .leg .titulo-leg { color: #6b6f7e; } .leg .faixa { display: block; height: 2.2mm; border-radius: .6mm; margin: 1mm 0; }
    .leg .marcas, .leg .pontas { display: grid; grid-auto-flow: column; justify-content: space-between; color: #6b6f7e; }
    .leg .linha { display: inline-flex; gap: 1mm; align-items: center; margin-right: 3mm; } .leg .linha i { width: 3mm; height: 2mm; display: inline-block; border: .2mm solid #ccc; }
    .rod { margin-top: auto; border-top: .25mm solid #ebe6de; padding-top: 2mm; color: #6b6f7e; font-size: 7pt; line-height: 1.4; }
    .rod .l2 { border-top: .25mm solid #ebe6de; margin-top: 2mm; padding-top: 2mm; display: flex; justify-content: space-between; align-items: center; gap: 4mm; }
    .rod .l2 b { color: #0a0c1c; } .rod .logos { display: flex; gap: 4mm; align-items: center; } .rod .logos img { height: 7mm; }
  `;

  async function gerarFicha(rid) {
    // a janela abre ja no clique: depois de um await o navegador a bloquearia
    const win = window.open('', '_blank');
    if (!win) { alert('Permita janelas pop-up para gerar a ficha.'); return; }
    win.document.write('<p style="font:14px system-ui;padding:24px">Preparando a ficha…</p>');
    const camada = estado.camada;
    const reg = estado.atributos[camada][rid];
    const def = defAtual();
    const temaAntes = document.documentElement.dataset.tema;
    document.documentElement.dataset.tema = 'claro';     // graficos com as cores do papel
    try {
      const sg = (await serie('gfa', camada, reg.chunk || null))[rid];
      const sc = (await serie('clima', camada, reg.chunk || null))[rid];
      const se = (await serie('eventos', camada, reg.chunk || null))[rid];
      const mapa = await mapaDaFicha(camada, rid, def);
      const png = async (fn) => graficoPNG(fn, 340, 150);
      const graf = [];
      if (sg) graf.push(['Métricas de fogo · ' + METRICAS_GFA.find(m => m.id === estado.gfaMetrica).titulo, await png(cv => grafGfa(sg, reg, cv))]);
      graf.push(['Eventos de fogo por mês, 2025', se && reg.eventos ? await png(cv => grafEventos(se, cv)) : null]);
      if (camada === 'Biomas' || !sc) {
        graf.push(['Clima', null]);
      } else {
        graf.push(['Temperatura média mensal', await png(cv => grafClima(sc, true, cv))],
                  ['Precipitação mensal', await png(cv => grafClima(sc, false, cv))],
                  ['Temperatura: diferença da média', await png(cv => grafDif(sc, true, cv))],
                  ['Precipitação: diferença da média', await png(cv => grafDif(sc, false, cv))]);
      }
      const cam = CAMADAS.find(c => c.id === camada);
      const clima = climaDaCamada();
      const avisoClima = camada === 'Biomas' ? 'Os biomas não têm série de clima.'
        : (!clima.atualizado ? `Série de clima da versão anterior (média ${clima.ref}).` : '');
      const htmlGraf = graf.map(([t, img]) => `<div class="bl"><h4>${t}</h4>${img ? `<img src="${img}" alt="">`
        : `<p class="nota">${t === 'Clima' ? avisoClima : 'Nenhum evento de fogo com o centroide nesta área em 2025.'}</p>`}</div>`).join('');
      const titulo = `fogo-em-foco_2025-26_ficha_${D.slug(reg.nome)}`;
      win.document.open();
      win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
        <link rel="stylesheet" href="${new URL('assets/fontes/fontes.css', location.href).href}">
        <style>${CSS_FICHA}</style></head><body><div class="pag">
        <div class="cab"><div><h1>${reg.nome}</h1><p>${cam.rotulo.replace(/s$/, '')}${reg.uf ? ' · ' + String(reg.uf).split(',')[0] : ''}
          · ficha de fogo · período março/2025 a fevereiro/2026</p></div>
          <img src="${LOGO('logo_fogoemfoco_horizontal_claro.svg')}" alt="Fogo em Foco"></div>
        <div class="rq">${htmlRanques(reg, def)}</div>
        <div class="meio"><div class="mapa"><small>${mapa.titulo}</small>${mapa.svg}<div class="leg">${mapa.legenda}</div></div>
          <div class="blocos">${htmlNumeros(reg)}</div></div>
        <div class="graf">${htmlGraf}</div>
        ${avisoClima && camada !== 'Biomas' ? `<p class="nota">${avisoClima}</p>` : ''}
        <div class="rod"><div>Fontes: área queimada MODIS MCD64A1 (vegetação com ≥30% de cobertura arbórea); Global Fire Atlas;
          focos e eventos de fogo do INPE; clima ERA5 (média ${clima.ref}). Ranque: posição na série de 24 períodos, 1º = maior
          registro desde 2002. Gerado em ${new Date().toLocaleDateString('pt-BR')}.</div>
          <div class="l2"><div><b>Como citar:</b> ${D.CITACAO}</div><div class="logos">
            <img src="${LOGO('logo_inpe.svg')}" alt="INPE"><img src="${LOGO('logo_brasa.svg')}" alt="Rede BRASA">
            <img src="${LOGO('logo_trees_claro.svg')}" alt="TREES"></div></div></div>
        </div></body></html>`);
      win.document.close();
      // espera as imagens e as fontes antes de imprimir
      if (win.document.readyState !== 'complete') await new Promise(r => win.addEventListener('load', r, { once: true }));
      await win.document.fonts.ready;
      win.focus();
      win.print();
    } catch (e) {
      win.document.body.innerHTML = '<p style="font:14px system-ui;padding:24px">Não foi possível gerar a ficha: ' + e.message + '</p>';
    } finally {
      if (temaAntes) document.documentElement.dataset.tema = temaAntes;
      else delete document.documentElement.dataset.tema;
    }
  }
```


- [ ] **Passo 5: conferir**

Na plataforma, com a variável "Área queimada" no mapa:
1. Estados → clicar Bahia → "Baixar dados" → aba "Ficha da área" → "Gerar ficha". Esperado: janela nova com a ficha e o diálogo de impressão; na pré-visualização, uma página A4: cabeçalho com logo claro, 4º em destaque, mapa dos municípios da BA com legenda, tabela do GFA, seis gráficos, rodapé com duas linhas e os três logos.
2. Municípios → um município do MA → ficha com o município destacado entre os vizinhos e a nota da série de clima antiga.
3. Biomas → Pantanal → ficha com a nota "Os biomas não têm série de clima." no lugar dos gráficos de clima.
4. Uma UC sem eventos (buscar "Arie Paulo Nogueira Neto") → gráfico de eventos trocado pela frase.
5. Repetir 1 com o tema escuro ligado: a ficha continua clara e a plataforma volta ao tema escuro.
Em todos: uma página só (se passar, reduzir `graficoPNG(fn, 340, 150)` para altura 130 e conferir de novo).

- [ ] **Passo 6: commit**

```bash
git add assets/downloads.js
git commit -m "Downloads: ficha da area em A4 pela janela de impressao"
```

---

### Tarefa 16: Versionar assets, documentar e publicar

**Arquivos:**
- Modificar: `plataforma.html` (carimbos `?v=`, reescritos pelo script `11_versionar_assets.py`)

- [ ] **Passo 1: rodar o carimbo de versões**

```bash
FEF_SITE="$(pwd)" python C:/Vault/fogoemfoco/codigos/11_versionar_assets.py
grep -n "downloads" plataforma.html
```

Esperado: `downloads.css?v=…`, `downloads-nucleo.js?v=…`, `downloads.js?v=…`.

- [ ] **Passo 2: rodar os testes uma última vez** — `http://localhost:8765/testes/downloads.html`. Esperado: `31 ok, 0 falha(s)`.

- [ ] **Passo 3: commit e push**

```bash
git add plataforma.html
git commit -m "Downloads: carimbo de versao dos assets novos"
git push
```

---

## Autorrevisão (feita ao escrever o plano)

- Cobertura da especificação: botão no topo (T12); abas com estado da tela (T12–T13, T15); 4 passos, prévia, "Preparando…", não travar (T13–T14); zip com CSV internacional + BOM, dicionário, LEIA, séries longas (T2–T7, T14); nomes de arquivo (T8, T14, T15); ficha com cabeçalho, ranques, mapa por dentro do estado e no contexto das outras camadas (bioma no contexto), números, tabela do GFA, seis gráficos, rodapé em duas linhas com citação e logos (T9–T11, T15); casos sem dado (T5, T15); testes (T1–T9 automáticos, T10–T15 manuais). Shapefile e card PNG fora do escopo, como na especificação.
- Nomes consistentes: `FEFDownload.{valorCSV, paraCSV, BLOCOS, CAMPOS, ID_COLUNAS, filtrarFeicoes, montarTabela, CITACAO, dicionario, textoLeia, seriesLongas, crc32, zipar, slug, nomeBase, previa, tamanhoLegivel, caixa, mapaSVG}`; `faixaDe`, `corPara`, `legendaHTML` e o parâmetro `alvo` dos gráficos definidos na T10 e usados na T15.

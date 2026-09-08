# Dados da plataforma

Saída do pipeline. Não edite nada aqui à mão: rode os scripts de novo.

```
cd codigos
python 06_gerar_crosswalk.py        # tabela de correspondência de identificadores
python 07_preparar_dados_web.py     # atributos e séries  (~20 s)
bash   08_preparar_geometrias.sh    # geometrias           (requer: npm install mapshaper)
python 09_validar_dados_web.py      # conferência
```

## Chave de junção

Tudo se liga pelo **`region_id`**, o identificador do Matt. É único nas seis camadas e é o que as tabelas de ranque e do GFA já usam. O código oficial da fonte fica como atributo `cod`.

Não use o código oficial como chave: o INCRA repete o `cd_sipra` em 25 assentamentos divididos em mais de um polígono, e chavear por ele apagaria essas feições.

## Estrutura

```
meta.json                          período, cobertura e contagem por camada
                                   (chaves `periodo_curto` e `periodo_extenso`)
geo/
  uf.geojson                       27 estados
  biomas.geojson                   6 biomas
  municipios.topojson              5.573 municípios
  ucs.topojson                     3.247 unidades de conservação
  tis.topojson                     657 terras indígenas
  assentamentos.topojson           2.429 assentamentos
atributos/<Camada>.json            valores do período 2025-2026, por region_id
series/gfa/<Camada>[/UF].json      métricas do GFA de 2002 a 2025
series/clima/<Camada>[/UF].json    temperatura e precipitação, março a fevereiro
```

Municípios, UCs e assentamentos têm as séries divididas por UF, para carregar só o estado aberto.

## Tamanhos

| Arquivo | Bruto | Servido com gzip |
|---|---|---|
| uf.geojson | 244 KB | 71 KB |
| biomas.geojson | 280 KB | 81 KB |
| municipios.topojson | 2,7 MB | 860 KB |
| ucs.topojson | 3,1 MB | 960 KB |
| tis.topojson | 952 KB | 300 KB |
| assentamentos.topojson | 460 KB | 130 KB |

Carga inicial da plataforma (UF, biomas, atributos e séries de UF, meta): **161 KB gzipados**. As camadas municipais entram sob demanda.

O GitHub Pages aplica gzip sozinho. TopoJSON compartilha as fronteiras entre polígonos vizinhos e sai cerca de cinco vezes menor que GeoJSON no mesmo nível de detalhe, ao custo de uma biblioteca de 7 KB no navegador (`topojson-client`).

## Campos de `atributos/`

| Campo | Significado |
|---|---|
| `nome`, `uf`, `cod` | identificação |
| `aq` | área queimada em floresta, km² |
| `aq_frac` | fração queimada do território, % |
| `aq_ranque` | posição na série 2002-2026; 1 é o pior ano |
| `aq_media`, `aq_dp` | média e desvio padrão anuais da série |
| `aq_anom_pct`, `aq_anom_dp` | anomalia contra a média, em % e em desvios padrão |
| `mes_pico` | mês do pico da anomalia |
| `n_incendios`, `tam_max`, `taxa_max` | métricas do GFA no período corrente |
| `*_ranque` | posição histórica de cada métrica do GFA |
| `sem_dado_aq` | verdadeiro quando a feição não aparece na tabela de ranque |

## Cuidados na hora de desenhar o mapa

**Nulo não é zero.** 1.707 feições têm `sem_dado_aq: true` e `aq_ranque: null`. São 268 municípios, 1.038 UCs, 365 assentamentos e 36 TIs, todos pequenos. Precisam de cor e legenda próprias. Pintar de zero afirma que não queimaram, e a tabela não diz isso. Detalhes em `crosswalk/LEIA.md`.

**Só há cobertura florestal.** Os CSVs recebidos são todos `*_Forest.csv`, ou seja, área queimada em pixels com pelo menos 30% de cobertura arbórea. Não é a área queimada total. A legenda tem que dizer isso, ou o número será lido como se fosse o total. Pendente de confirmação com a Débora.

**O período vai de março a fevereiro.** As séries de clima seguem a mesma janela: o primeiro valor do vetor é março, o último é fevereiro. A média histórica é de 2003 a 2023.

**As geometrias estão simplificadas** entre 1% e 4% dos vértices, com `keep-shapes`. Servem para exibição em tela, não para cálculo de área. Qualquer número de área vem das tabelas, nunca da geometria.

## Assentamentos: cobertura parcial

A geometria vem de `shapefile_2026/Assentamento_Brasil.shp`, o arquivo do INCRA para o
Brasil inteiro, com 8.217 feições nos 27 estados. A análise do Matt, porém, rodou sobre
uma camada regional de 2.429 feições em doze estados. As 5.819 que sobram entram no mapa
com `estado_dado: "sem_analise"` e `region_id` a partir de 51000001, um bloco próprio que
não se mistura com os 50000001+ da camada analisada.

`estado_dado` tem quatro valores, e "fora" e "sem_analise" não são a mesma coisa: o
primeiro passou pela análise e ficou de fora da tabela de ranque, o segundo nunca entrou.

A junção entre geometria e atributos, só nesta camada, é pela ORDEM do registro no
shapefile, via `crosswalk/assentamentos_ordem_para_rid.csv`. Não pode ser pelo `cd_sipra`:
o código se repete em 119 feições do arquivo do Brasil, e uma junção por chave repetida
colapsaria todas elas numa só.

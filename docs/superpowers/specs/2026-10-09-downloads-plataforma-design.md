# Downloads na plataforma: dados em tabela e ficha da área

Data: 09/10/2026 · Status: aprovado no brainstorm, aguardando plano de implementação

## Objetivo

Deixar quem usa a plataforma baixar:

1. **os dados em tabela** (CSV), escolhendo recortes, abrangência e variáveis, com as séries temporais opcionais;
2. **uma ficha pronta da área aberta** (PDF, uma página A4), com os números, o mapa e os gráficos do painel.

Públicos: técnicos e pesquisadores (dados para as próprias análises) e gestores, imprensa e público geral (ficha para apresentar ou compartilhar), com o mesmo peso.

## Restrições

- O site é estático (GitHub Pages): não há servidor. Tudo é gerado no navegador de quem baixa, a partir dos mesmos JSON que a plataforma já carrega (`dados/atributos`, `dados/series/{gfa,clima,eventos}`, `dados/geo`, `dados/meta.json`).
- Bibliotecas extras só sob demanda (carregadas no clique), de CDN aceita pelo projeto ou copiadas para `assets/`, com versão fixa.
- Nulo não é zero: o que falta sai vazio, nunca 0.

## Entrada

- Um botão **"Baixar dados"** na barra do topo, à direita, ao lado do período (2025-2026), antes de "Início" e do tema. Sempre visível.
- Ele abre a janela **"Baixar dados e análises"**, sobre o mapa, no estilo dos menus flutuantes (fundo da superfície, borda, sombra, cabeçalho com ✕; fecha com Esc e clique fora). Duas abas no topo da janela:
  - **Dados em tabela (CSV)**: sempre disponível.
  - **Ficha da área (PDF)**: com uma área aberta no painel; sem área aberta, a aba mostra "Escolha uma área no mapa ou na busca".
- A janela abre preenchida com o estado da tela: camada atual, estado filtrado (se houver) e área aberta (se houver).

## Aba "Dados em tabela (CSV)"

Quatro passos:

1. **Recortes** — um ou mais: Estados, Municípios, Biomas, Unidades de conservação, Terras indígenas (só as camadas visíveis em `CAMADAS`).
2. **Abrangência** — Brasil inteiro · um estado (menu com as 27 UFs) · só a área aberta no painel (desabilitada sem área aberta). "Um estado" filtra municípios, UCs e TIs pela UF (o mesmo critério do filtro da plataforma, campo `chunk`/`uf`); para Estados, entra só o estado escolhido; para Biomas, entram os biomas inteiros (não há recorte por UF).
3. **Variáveis** — nos mesmos blocos do menu: Ranques; Área queimada (MODIS); Métricas do fogo (GFA); Clima; Focos de calor; Eventos de fogo. Cada bloco tem uma caixa para o bloco inteiro (com estado parcial) e as variáveis soltas. Os ranques vêm marcados. Além das variáveis do mapa, os blocos oferecem os campos de apoio que existem nos atributos: média, desvio padrão e anomalias da área queimada e de cada métrica do GFA, mês de pico, duração máxima dos eventos.
4. **Séries temporais (opcional)** — GFA (2002-2025, as cinco métricas), clima (março a fevereiro: temperatura média, mínima e máxima, precipitação, e as médias históricas), eventos (janeiro a dezembro de 2025, por tipo).

Rodapé da janela: prévia ("418 linhas · 11 colunas · ~40 KB", contada antes de gerar) e o botão **Baixar**. Enquanto monta, o botão mostra "Preparando…" e a página não trava (montagem em partes, cedendo ao navegador entre elas).

### Arquivos

Sempre um `.zip` (o navegador não baixa dois arquivos num clique só):

- `fogo-em-foco_2025-26_<recortes>_<abrangencia>.csv` — uma linha por área; colunas de identificação (`camada`, `region_id`, `codigo`, `nome`, `uf`) e depois as variáveis escolhidas, na ordem dos blocos.
- `dicionario.csv` — uma linha por coluna: nome, descrição, unidade, bloco, fonte, e o que significa vazio naquela coluna.
- `LEIA.txt` — período, fontes, como citar, como abrir no Excel em português (importar com separador vírgula e ponto decimal).
- Com séries: `series_gfa.csv`, `series_clima.csv`, `series_eventos.csv`, em formato longo (uma linha por área e por ano ou mês: `camada, region_id, nome, ano|mes, variável…`).

Formato: **padrão internacional** — separador vírgula, ponto decimal, UTF-8 com BOM (para o Excel reconhecer os acentos), aspas só onde preciso.

Como citar (no LEIA e na ficha): *Fogo em foco: diagnóstico dos incêndios no Brasil em 2025/2026. Rede Brasa de Pesquisa. – São José dos Campos: INPE, 2025.*

## Aba "Ficha da área (PDF)"

Gera uma página A4 com a área aberta e a variável que está no mapa, e abre a janela de impressão do navegador (com "Salvar como PDF"). Implementação: uma página de impressão montada num `iframe` (ou janela) com CSS `@page { size: A4; margin }`, sempre em fundo branco (independe do tema), gráficos do Chart.js e mapa em SVG desenhado a partir das geometrias.

Layout (maquete aprovada: tela 12 do brainstorm):

1. **Cabeçalho** — nome da área (grande), tipo · UF · "ficha de fogo · período março/2025 a fevereiro/2026"; à direita, o logo do Fogo em Foco na versão para fundo branco, em tamanho contido. Linha laranja embaixo.
2. **Ranques** — o ranque ligado à variável do mapa em destaque (mesma regra do painel: `ranqueDaVariavel`) e os outros seis ao lado, só o número na cor da classe.
3. **Meio** — à esquerda, o **mapa**: num estado, os municípios dele na variável da tela; num bioma, município, UC ou TI, a área com contorno destacado e os vizinhos na mesma variável. (Os dados da plataforma não dizem a que bioma cada município pertence, e calcular isso no navegador seria pesado; os biomas ficam no contexto, entre si.) Legenda embaixo (a mesma escala do mapa da plataforma). À direita, os **números por bloco**: área queimada em vegetação (valor, anomalia contra a média, fração do território, mês de pico); **tabela das cinco métricas do GFA** (valor 2025-26, média ± dp, anomalia em etiqueta colorida, ranque); focos e eventos (focos, eventos no ano, duração média).
4. **Gráficos**, três fileiras de dois, mais baixos que no painel:
   - série da métrica do GFA escolhida no painel (barras 2002-2025, faixa média ± dp, atual na cor da anomalia) · eventos por mês e tipo;
   - temperatura média mensal · precipitação mensal (período e média tracejada);
   - diferença da temperatura em relação à média (°C, rótulos com duas casas) · diferença da precipitação (mm).
5. **Rodapé**, duas linhas separadas por uma linha fina:
   - linha 1: fontes (MODIS MCD64A1 em vegetação com ≥30% de cobertura arbórea; Global Fire Atlas; focos e eventos de fogo do INPE; clima ERA5, média 2003-2024), definição do ranque, data em que foi gerada;
   - linha 2: "Como citar: …" e, à direita, os logos do INPE, da Rede BRASA e da TREES, na mesma altura.

Nome sugerido no "Salvar como PDF": `fogo-em-foco_2025-26_ficha_<nome-da-area>.pdf` (pelo `<title>` da página de impressão).

Logos: `img/logos/logo_inpe.svg`, `logo_brasa.svg`, `logo_trees.svg` (a TREES com as partes brancas em tom escuro, como arquivo novo); o Fogo em Foco precisa de uma versão para fundo branco (arquivo novo `logo_fogoemfoco_horizontal_claro.svg`, com o branco trocado pela cor do texto; se a equipe tiver o arquivo oficial, usar ele).

## Casos sem dado

- Área sem área queimada na série (`sem_fogo`, `fora`): o bloco mostra o motivo, como no painel; ranques vazios saem "—" sem cor.
- Sem evento no ano: o gráfico de eventos vira uma frase.
- Biomas não têm clima: os quatro gráficos de clima dão lugar a uma nota.
- Municípios: aviso da referência 2003-2023 enquanto a série de clima não for atualizada (`meta.camadas.Municipios.clima_atualizado`).
- No CSV, ausente = célula vazia; variável que não existe num recorte (clima nos biomas) sai vazia, com nota no dicionário.
- Download grande (Brasil + municípios + tudo + séries): a prévia mostra o tamanho; a montagem não trava a página.

## Organização do código

O `assets/plataforma.js` já passa de mil linhas. O download vai num arquivo próprio, `assets/downloads.js`, carregado junto com a plataforma, que usa o que ela já expõe (`estado`, `VARIAVEIS`, `GRUPOS`, `serie()`, `garantirCamada()`, cores e formatação). Divisão interna:

- `janelaDownload` — monta a janela, as abas e os passos; lê o estado da tela.
- `montarTabela(opcoes)` → linhas e colunas (dados puros, testável sem tela).
- `paraCSV(linhas, colunas)` e `dicionario(colunas)` — texto dos arquivos.
- `montarZip(arquivos)` — com JSZip, carregado sob demanda.
- `fichaPDF(rid)` — monta a página de impressão (layout, mapa SVG, gráficos) e chama a impressão.

## Testes

- CSV: conferir linhas contra o painel (Bahia, um município, uma UC, uma TI) e contra os CSVs de origem; abrir no Excel (importação) e no Python (`pandas.read_csv`); conferir vazios nas feições `sem_fogo`/`fora` e clima nos biomas.
- Ficha: um estado, um município, um bioma, uma UC sem eventos; cada uma numa página A4, nos temas claro e escuro (a ficha sai sempre clara).
- Desempenho: o download máximo (Brasil, todas as camadas, todas as variáveis, séries) termina sem travar a página.

## Fora do escopo (por ora)

Card vertical em PNG para redes sociais; fichas pré-geradas em Python; shapefile pelo navegador (já existe a exportação em `codigos/15_exportar_shapefiles.py`).

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
    esc = null; seqPrevia++;
    trocarAba(aba);
    document.getElementById('fechar-download').focus();
  }

  function fechar() {
    janela.hidden = true; seqPrevia++;
    document.getElementById('abrir-download').focus();
  }

  function trocarAba(nova) {
    aba = nova;
    janela.querySelectorAll('[data-aba]').forEach(b => {
      const ativa = b.dataset.aba === aba;
      b.setAttribute('aria-selected', String(ativa));
      b.tabIndex = ativa ? 0 : -1;
    });
    conteudo.setAttribute('aria-labelledby', 'aba-' + aba);
    conteudo.innerHTML = aba === 'csv' ? htmlCSV() : htmlFicha();
    if (aba === 'csv') ligarCSV(); else ligarFicha();
  }

  // Aba CSV abaixo; a da ficha, depois dela.
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
               'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  // escolhas da aba CSV; preenchidas a cada abertura a partir do estado da tela
  let esc = null;
  let seqPrevia = 0;      // descarta resultados atrasados da previa
  let gerando = false;    // true enquanto o zip e montado
  // escapa texto para entrar em innerHTML
  const escHtml = (s) => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

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
        ${radio('area', area ? `Só ${escHtml(area.nome)}` : 'Só a área aberta no painel', '', !area)}</div></div>
      <div class="passo-dl"><h4>3 · Variáveis <small>o bloco inteiro ou só algumas</small></h4>
        <div class="blocos-dl">${blocos}</div></div>
      <div class="passo-dl"><h4>4 · Séries temporais <small>opcional</small></h4>
        <label class="abrang-dl"><input type="checkbox" id="series-dl"${esc.series ? ' checked' : ''}>
          Incluir as séries (GFA 2002-2025, clima mês a mês, eventos por mês)</label></div>
      <div class="rodape-dl"><span id="previa-dl"></span><button type="button" id="baixar-dl">Baixar</button></div>`;
  }

  // Grupos [{camada, rotulo, feicoes}] das escolhas e (copia congelada ou atual). Carrega so os atributos.
  async function gruposEscolhidos(e) {
    const abr = e.abrangencia === 'area'
      ? { tipo: 'area', camada: e.areaCamada || estado.camada, rid: e.areaRid || estado.selecionado }
      : e.abrangencia === 'uf' ? { tipo: 'uf', uf: e.uf } : { tipo: 'brasil' };
    const grupos = [];
    for (const id of e.camadas) {
      await garantirAtributos(id);
      const cam = CAMADAS.find(c => c.id === id);
      grupos.push({ camada: id, rotulo: cam.rotulo, feicoes: D.filtrarFeicoes(estado.atributos[id], id, abr) });
    }
    return { grupos, abr };
  }

  async function atualizarPrevia() {
    const alvo = document.getElementById('previa-dl');
    const botao = document.getElementById('baixar-dl');
    if (!alvo || !esc || gerando) return;
    const meu = ++seqPrevia;
    botao.disabled = true;
    if (!esc.camadas.length || !esc.campos.length) {
      alvo.textContent = 'Escolha ao menos um recorte e uma variável.';
      return;
    }
    alvo.textContent = 'Calculando…';
    try {
      const e = JSON.parse(JSON.stringify(esc));
      const { grupos } = await gruposEscolhidos(e);
      if (meu !== seqPrevia) return;
      const p = D.previa(grupos, e.campos);
      if (!p.linhas) { alvo.textContent = 'Nenhuma área nesta combinação de recorte e abrangência.'; return; }
      alvo.textContent = `${nf(p.linhas)} linhas · ${p.colunas} colunas · ~${D.tamanhoLegivel(p.bytes)}` +
        (e.series ? ' + séries' : '') +
        (e.abrangencia === 'uf' && e.camadas.includes('Biomas') ? ' · biomas inteiros' : '');
      botao.disabled = false;
    } catch (err) {
      if (meu === seqPrevia) alvo.textContent = 'Não foi possível calcular a prévia: ' + err.message;
    }
  }

  // Atualiza as caixas dos blocos e das variaveis no lugar, sem redesenhar (o foco fica onde estava).
  function sincronizar() {
    conteudo.querySelectorAll('input[name="campo-dl"]').forEach(i => { i.checked = esc.campos.includes(i.value); });
    conteudo.querySelectorAll('input[data-bloco]').forEach(i => {
      const cs = D.CAMPOS.filter(c => c.bloco === i.dataset.bloco).map(c => c.id);
      const n = cs.filter(id => esc.campos.includes(id)).length;
      i.checked = n === cs.length;
      i.indeterminate = n > 0 && n < cs.length;
      const pequeno = i.closest('summary').querySelector('small');
      if (pequeno) pequeno.textContent = `(${n} de ${cs.length})`;
    });
  }

  function ligarCSV() {
    const caixa = conteudo;
    caixa.querySelectorAll('input[name="camada-dl"]').forEach(i => i.onchange = () => {
      esc.camadas = [...caixa.querySelectorAll('input[name="camada-dl"]:checked')].map(x => x.value);
      atualizarPrevia();
    });
    caixa.querySelectorAll('input[name="abrang-dl"]').forEach(i => i.onchange = () => { esc.abrangencia = i.value; atualizarPrevia(); });
    caixa.querySelector('#uf-dl').onchange = (e) => {
      esc.uf = e.target.value; esc.abrangencia = 'uf';
      caixa.querySelector('input[name="abrang-dl"][value="uf"]').checked = true;
      atualizarPrevia();
    };
    caixa.querySelectorAll('input[name="campo-dl"]').forEach(i => i.onchange = () => {
      esc.campos = [...caixa.querySelectorAll('input[name="campo-dl"]:checked')].map(x => x.value);
      sincronizar(); atualizarPrevia();
    });
    caixa.querySelectorAll('input[data-bloco]').forEach(i => {
      const cs = D.CAMPOS.filter(c => c.bloco === i.dataset.bloco).map(c => c.id);
      const n = cs.filter(id => esc.campos.includes(id)).length;
      i.indeterminate = n > 0 && n < cs.length;
      i.onclick = (e) => e.stopPropagation();   // nao abre/fecha o details
      i.onchange = () => {
        esc.campos = i.checked ? [...new Set(esc.campos.concat(cs))] : esc.campos.filter(id => !cs.includes(id));
        sincronizar(); atualizarPrevia();
      };
    });
    caixa.querySelector('#series-dl').onchange = (e) => { esc.series = e.target.checked; atualizarPrevia(); };
    caixa.querySelector('#baixar-dl').onclick = baixarCSV;
    atualizarPrevia();
  }

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
      colunas = t.colunas;
      for (const l of t.linhas) linhas.push(l);   // push(...) estoura a pilha em listas grandes
      await ceder();
    }
    return colunas && linhas.length ? D.paraCSV(colunas, linhas) : null;
  }

  async function baixarCSV() {
    if (gerando || !esc) return;
    const e = JSON.parse(JSON.stringify(esc));   // copia congelada das escolhas
    e.areaCamada = estado.camada; e.areaRid = estado.selecionado;
    const botao = document.getElementById('baixar-dl');
    const previa = document.getElementById('previa-dl');
    gerando = true; seqPrevia++;
    conteudo.inert = true;
    botao.disabled = true; botao.textContent = 'Preparando…';
    await ceder();
    try {
      const { grupos, abr } = await gruposEscolhidos(e);
      const area = abr.tipo === 'area' ? estado.atributos[abr.camada][abr.rid] : null;
      const base = D.nomeBase(e.camadas, abr.tipo === 'area' ? { tipo: 'area', nome: area && area.nome } : abr);
      const tabela = D.montarTabela(grupos, e.campos);
      await ceder();
      const arquivos = [
        { nome: base + '.csv', texto: D.paraCSV(tabela.colunas, tabela.linhas), bom: true },
        { nome: 'dicionario.csv', texto: (d => D.paraCSV(d.colunas, d.linhas))(D.dicionario(e.campos)), bom: true },
        { nome: 'LEIA.txt', texto: D.textoLeia({ geradoEm: new Date().toLocaleDateString('pt-BR') }), bom: true },
      ];
      if (e.series) {
        for (const tipo of ['gfa', 'clima', 'eventos']) {
          previa.textContent = `Séries: ${tipo}…`;
          const texto = await seriesDe(grupos, tipo);
          if (texto) arquivos.push({ nome: `series_${tipo}.csv`, texto, bom: true });
        }
      }
      salvarArquivo(D.zipar(arquivos), base + '.zip', 'application/zip');
      previa.textContent = `Pronto: ${nf(tabela.linhas.length)} linhas.`;
    } catch (err) {
      previa.textContent = 'Não foi possível gerar o arquivo: ' + err.message;
    } finally {
      gerando = false; conteudo.inert = false;
      botao.disabled = false; botao.textContent = 'Baixar';
    }
  }

  /* ---------- aba da ficha ---------- */

  function htmlFicha() {
    const rid = estado.selecionado;
    const reg = rid ? (estado.atributos[estado.camada] || {})[rid] : null;
    if (!reg) {
      return `<p class="aviso-dl">Escolha uma área no mapa ou na busca para gerar a ficha. Ela sai com a
        variável que estiver no mapa.</p>`;
    }
    const def = defAtual();
    return `<p class="aviso-dl">Ficha de <b>${escHtml(reg.nome)}</b>, em uma página A4, com o mapa em
      <b>${escHtml(def.rotulo.toLowerCase())}</b>. Abre a janela de impressão: escolha <b>Salvar como PDF</b>.</p>
      <div class="rodape-dl"><span id="previa-dl">Uma página A4</span>
        <button type="button" id="gerar-ficha">Gerar ficha</button></div>`;
  }

  function ligarFicha() {
    const b = document.getElementById('gerar-ficha');
    if (!b) return;
    b.onclick = async () => {
      if (b.disabled) return;
      b.disabled = true;       // um clique duplo nao abre duas janelas
      try { await gerarFicha(estado.selecionado); }
      finally { b.disabled = false; }
    };
  }

  // Feicoes do mapa da ficha (so a carga, antes de trocar o tema). Estado: os municipios
  // dele. Outras camadas: a area e as vizinhas da mesma camada num quadro 60% maior que a area.
  async function carregarMapaDaFicha(camada, rid) {
    const reg = estado.atributos[camada][rid];
    if (camada === 'UF') {
      await garantirCamada('Municipios');
      const am = estado.atributos.Municipios;
      const feicoes = estado.geometrias.Municipios.features.filter(f => (am[String(f.properties.rid)] || {}).uf === reg.uf);
      return { feicoes, regs: feicoes.map(f => am[String(f.properties.rid)]), atrib: am, destaque: undefined };
    }
    await garantirCamada(camada);
    const geo = estado.geometrias[camada].features;
    const alvo = geo.find(f => String(f.properties.rid) === String(rid));
    const [x0, y0, x1, y1] = D.caixa([alvo]);
    const mx = Math.max((x1 - x0) * 0.6, 0.3), my = Math.max((y1 - y0) * 0.6, 0.3);
    const limites = [x0 - mx, y0 - my, x1 + mx, y1 + my];
    const feicoes = geo.filter(f => { const [a, b, c, d] = D.caixa([f]);
      return c >= limites[0] && a <= limites[2] && d >= limites[1] && b <= limites[3]; });
    const atrib = estado.atributos[camada];
    return { feicoes, regs: feicoes.map(f => atrib[String(f.properties.rid)]).filter(Boolean), atrib, destaque: rid, limites };
  }

  // Cores, SVG e legenda do mapa da ficha (sincrono: roda com o tema claro forcado).
  function desenharMapaDaFicha(m, camada, def) {
    const faixa = faixaDe(m.regs, def);
    const svg = D.mapaSVG(m.feicoes, { cor: (r) => corPara(m.atrib[r], def, faixa), destaque: m.destaque,
      largura: 420, altura: 300, limites: m.limites, linha: '#ffffff', fundo: '#f4f1ec' });
    return { svg, legenda: legendaHTML(def, faixa, m.regs),
             titulo: camada === 'UF' ? `${def.rotulo} por município` : `${def.rotulo} na região` };
  }

  // Desenha um grafico do painel num canvas fora da tela e devolve o PNG (3x, para
  // impressao nitida). desenhar(canvas) chama grafGfa/grafEventos/grafClima/grafDif. O
  // titulo interno do grafico sai: na ficha, o titulo do bloco ja diz o que e.
  function graficoPNG(desenhar, largura, altura) {
    const caixa = document.createElement('div');
    caixa.style.cssText = `position:fixed;left:-10000px;top:0;width:${largura}px;height:${altura}px`;
    const cv = document.createElement('canvas');
    caixa.appendChild(cv); document.body.appendChild(caixa);
    const antes = Chart.defaults.devicePixelRatio, anim = Chart.defaults.animation;
    Chart.defaults.devicePixelRatio = 3; Chart.defaults.animation = false;
    let g;
    try {
      g = desenhar(cv);
      if (g.options.plugins.title) g.options.plugins.title.display = false;
      g.update('none');
      return g.toBase64Image('image/png', 1);
    } finally {
      if (g) g.destroy();
      Chart.defaults.devicePixelRatio = antes; Chart.defaults.animation = anim;
      caixa.remove();
    }
  }

  const LOGO = (arq) => new URL('img/logos/' + arq, location.href).href;
  // tipo da area no cabecalho (o rotulo da camada e plural)
  const TIPO_AREA = { UF: 'Estado', Municipios: 'Município', Biomas: 'Bioma', UCs: 'Unidade de conservação',
                      TerrasIndigenas: 'Terra indígena' };

  function htmlRanques(reg, def) {
    const principal = ranqueDaVariavel(def);
    const outros = VARIAVEIS.filter(v => v.escala === 'ranque' && v.id !== principal.id);
    const vz = semDado(reg, principal);
    const grande = `<div class="rq-g"><b${vz ? ' class="vazio"' : ''}>${vz ? '—' : reg[principal.id] + 'º'}</b><small>${
      vz ? principal.rotulo + ': ' + vz[1] : principal.destaque}</small></div>`;
    // so o numero na cor da classe, misturada ao texto como no painel: o amarelo e o azul
    // claro do fim da escala sumiriam no papel branco
    return grande + outros.map(v => {
      const z = semDado(reg, v);
      return `<div class="rq-m"><b style="color:${z ? '#9a9488' : `color-mix(in srgb, ${corRanque(reg[v.id])} 72%, #0a0c1c)`}">${
        z ? '—' : reg[v.id] + 'º'}</b><small>${v.rotulo}</small></div>`;
    }).join('');
  }

  function htmlNumeros(reg, anoEv) {
    const aq = reg.estado_dado === 'ok'
      ? `<div class="nums"><div><b>${nf(reg.aq, 1)} km²</b>no período</div>
           <div><b>${reg.aq_anom_pct === null ? '—' : comSinal(reg.aq_anom_pct, 0) + '%'}</b>vs. média${reg.aq_media === null || reg.aq_media === undefined ? '' : ` (${nf(reg.aq_media, 0)} km²)`}</div>
           <div><b>${reg.aq_frac === null ? '—' : nf(reg.aq_frac * 100, 2) + '%'}</b>do território</div></div>
         ${reg.mes_pico ? `<small class="pico"><i style="background:${corMes(reg.mes_pico)}"></i>mês de pico da anomalia: ${
           MESES_EXTENSO[reg.mes_pico - 1]}</small>` : ''}`
      : `<p class="nota">${semDado(reg, VARIAVEIS.find(v => v.id === 'aq'))[1]}.</p>`;
    const linhasGfa = METRICAS_GFA.map(m => {
      const v = reg[m.id], an = reg[m.id + '_anom_pct'];
      const tem = v !== null && v !== undefined && v > 0;
      return `<tr><td>${m.titulo}${m.unidade ? ` (${m.unidade.trim()})` : ''}</td><td>${tem ? nf(v, m.casas) : '—'}</td>
        <td>${reg[m.id + '_media'] === null || reg[m.id + '_media'] === undefined ? '—'
          : nf(reg[m.id + '_media'], m.casas) + ' ± ' + nf(reg[m.id + '_dp'], m.casas)}</td>
        <td>${tem && an !== null && an !== undefined ? `<span class="tag" style="background:${corAnomalia(an)}${an > -15 && an <= 50 ? ';color:#0a0c1c' : ''}">${comSinal(an, 0)}%</span>` : '—'}</td>
        <td>${tem && reg[m.id + '_ranque'] ? reg[m.id + '_ranque'] + 'º' : '—'}</td></tr>`;
    }).join('');
    return `
      <div class="bl"><h4>Área queimada em vegetação</h4>${aq}</div>
      <div class="bl"><h4>Métricas de fogo (GFA)</h4><table><tr><th>métrica</th><th>2025-26</th><th>média ± dp</th>
        <th>anomalia</th><th>ranque</th></tr>${linhasGfa}</table></div>
      <div class="bl"><h4>Focos e eventos</h4><div class="nums">
        <div><b>${reg.focos ? nf(reg.focos) : '—'}</b>focos de calor</div>
        <div><b>${reg.eventos ? nf(reg.eventos) : '—'}</b>eventos em ${anoEv}</div>
        <div><b>${reg.ev_dur_media === null || reg.ev_dur_media === undefined ? '—' : nf(reg.ev_dur_media, 1) + ' dias'}</b>duração média</div></div></div>`;
  }

  const CSS_FICHA = `
    @page { size: A4; margin: 12mm 12mm 11mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { background: #fff; color-scheme: light; }
    body { margin: 0; font-family: 'Instrument Sans', system-ui, sans-serif; color: #0a0c1c; font-size: 8.6pt; }
    .pag { width: 186mm; min-height: 270mm; display: flex; flex-direction: column; gap: 2.5mm; }
    .cab { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 0.6mm solid #d64a0d; padding-bottom: 2mm; }
    .cab h1 { margin: 0; font-size: 20pt; } .cab h1.longo { font-size: 15pt; } .cab p { margin: 1mm 0 0; color: #6b6f7e; font-size: 8.5pt; }
    .cab img { height: 7.5mm; }
    .rq { display: grid; grid-template-columns: 1.5fr repeat(6, 1fr); gap: 2mm; align-items: center; }
    .rq-g { display: flex; gap: 2mm; align-items: center; } .rq-g b { font-size: 26pt; color: #d64a0d; line-height: .9; }
    .rq-g b.vazio { color: #9a9488; }
    .rq small { color: #6b6f7e; font-size: 7pt; line-height: 1.15; display: block; }
    .rq-m { display: flex; gap: 1.5mm; align-items: center; } .rq-m b { font-size: 14pt; }
    .meio { display: grid; grid-template-columns: 1fr 1.1fr; gap: 3mm; }
    .mapa, .bl { border: 0.25mm solid #ebe6de; border-radius: 1.5mm; padding: 2mm; }
    .mapa small { color: #6b6f7e; } .mapa svg { display: block; margin: 1mm 0; }
    .blocos { display: grid; gap: 2mm; align-content: start; }
    .bl h4 { margin: 0 0 1.2mm; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: #d64a0d; } .bl h4 .un { text-transform: none; letter-spacing: 0; }
    .chave-graf svg { vertical-align: middle; margin-right: .8mm; }
    .chave-graf { margin: .6mm 0 0; font-size: 6.5pt; color: #6b6f7e; display: flex; gap: 3mm; justify-content: center; }
    .chave-graf i { display: inline-block; width: 2.2mm; height: 2.2mm; border-radius: .4mm; margin-right: .8mm; vertical-align: -.2mm; }
    .nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5mm; } .nums b { display: block; font-size: 10.5pt; }
    .pico { display: block; margin-top: 1mm; color: #6b6f7e; }
    .pico i { display: inline-block; width: 2.4mm; height: 2.4mm; border-radius: .5mm; margin-right: 1mm; vertical-align: -.3mm; }
    table { width: 100%; border-collapse: collapse; font-size: 7.4pt; } td, th { padding: .5mm 1mm; border-bottom: .2mm solid #f1ede6; text-align: left; }
    th { color: #6b6f7e; font-weight: 600; } .tag { color: #fff; padding: 0 1.2mm; border-radius: .6mm; }
    .graf { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 3mm; } .graf img { width: 100%; display: block; }
    .graf .bl { padding: 1.5mm 2mm; } .nota { color: #6b6f7e; margin: 0; }
    .leg { font-size: 7pt; } .leg .titulo-leg { color: #6b6f7e; } .leg .faixa { display: block; height: 2.2mm; border-radius: .6mm; margin: 1mm 0; }
    .leg .marcas, .leg .pontas { display: grid; grid-auto-flow: column; justify-content: space-between; color: #6b6f7e; }
    .leg .linha { display: inline-flex; gap: 1mm; align-items: center; margin-right: 3mm; }
    .leg .linha i { width: 3mm; height: 2mm; display: inline-block; border: .2mm solid #ccc; }
    .rod { margin-top: auto; border-top: .25mm solid #ebe6de; padding-top: 2mm; color: #6b6f7e; font-size: 7pt; line-height: 1.4; }
    .rod .l2 { border-top: .25mm solid #ebe6de; margin-top: 2mm; padding-top: 2mm; display: flex; justify-content: space-between; align-items: center; gap: 4mm; }
    .rod .l2 b { color: #0a0c1c; } .rod .logos { display: flex; gap: 4mm; align-items: center; } .rod .logos img { height: 7mm; }
  `;

  // Roda desenhar() com o tema claro forcado (cores do papel nos graficos e no "sem dado"
  // do mapa) e devolve o tema do leitor logo depois. Sincrono: a plataforma nao chega a
  // aparecer clara.
  function comTemaClaro(desenhar) {
    const raiz = document.documentElement;
    const antes = raiz.dataset.tema;
    raiz.dataset.tema = 'claro';
    try { return desenhar(); }
    finally {
      if (antes) raiz.dataset.tema = antes;
      else delete raiz.dataset.tema;
    }
  }

  // Chaves pequenas dos graficos: um traco por serie, ou um quadrado por tipo de evento.
  const traco = (cor, tracejado) => `<svg width="14" height="6" viewBox="0 0 14 6"><line x1="0" y1="3" x2="14" y2="3"
    stroke="${cor}" stroke-width="2"${tracejado ? ' stroke-dasharray="3 2"' : ''}/></svg>`;
  const chaveEventos = () => `<p class="chave-graf">${TIPOS_EVENTO.map(([, rot, cor]) =>
    `<span><i style="background:${cor}"></i>${rot}</span>`).join('')}</p>`;

  // HTML completo da ficha A4 da area rid na camada aberta, com a variavel do mapa. Tudo o
  // que carrega vem primeiro; o desenho (graficos, mapa, cores) sai de uma vez com o tema
  // claro forcado.
  async function montarFicha(rid) {
    const camada = estado.camada;
    const reg = estado.atributos[camada][rid];
    const def = defAtual();
    const anoEv = (estado.meta.eventos || {}).ano || 2025;
    const sg = (await serie('gfa', camada, reg.chunk || null))[rid];
    const sc = (await serie('clima', camada, reg.chunk || null))[rid];
    const se = (await serie('eventos', camada, reg.chunk || null))[rid];
    const dadosMapa = await carregarMapaDaFicha(camada, rid);
    const clima = climaDaCamada();
    const avisoClima = camada === 'Biomas' ? 'Os biomas não têm série de clima.'
      : !sc ? 'Sem série de clima para esta área.'
      : !clima.atualizado ? `Série de clima da versão anterior (média ${clima.ref}): o arquivo mensal atualizado deste recorte ainda não chegou.`
      : '';

    return comTemaClaro(() => {
      const mapa = desenharMapaDaFicha(dadosMapa, camada, def);
      const png = (fn, altura = 120) => graficoPNG(fn, 340, altura);
      const chaveClima = (temp) => `<p class="chave-graf"><span>${traco(temp ? css('--laranja') : css('--azul-claro'))}período
        ${estado.meta.periodo_curto}</span><span>${traco(css('--serie-media') || '#aaa39a', true)}média ${clima.ref}</span></p>`;
      // celulas da grade de 3 x 2: { t: titulo, img | nota, abaixo? }. Os graficos com chave
      // embaixo sao mais baixos, para a celula ficar com a altura das outras.
      const graf = [];
      const m = METRICAS_GFA.find(x => x.id === estado.gfaMetrica);
      graf.push(sg ? { t: 'Métricas de fogo · ' + m.titulo, img: png(cv => grafGfa(sg, reg, cv)) }
                   : { t: 'Métricas de fogo · ' + m.titulo, nota: 'Sem série do Global Fire Atlas para esta área.' });
      graf.push(!reg.eventos ? { t: `Eventos de fogo por mês, ${anoEv}`, nota: `Nenhum evento de fogo com o centroide nesta área em ${anoEv}.` }
        : !se ? { t: `Eventos de fogo por mês, ${anoEv}`, nota: 'Sem série mensal de eventos.' }
        : { t: `Eventos de fogo por mês, ${anoEv}`, img: png(cv => grafEventos(se, cv), 106), abaixo: chaveEventos() });
      if (camada === 'Biomas' || !sc) {
        graf.push({ t: 'Clima', nota: avisoClima });
      } else {
        graf.push({ t: 'Temperatura média mensal <span class="un">(°C)</span>', img: png(cv => grafClima(sc, true, cv), 106), abaixo: chaveClima(true) },
                  { t: 'Precipitação mensal <span class="un">(mm)</span>', img: png(cv => grafClima(sc, false, cv), 106), abaixo: chaveClima(false) },
                  { t: 'Temperatura: diferença da média <span class="un">(°C)</span>', img: png(cv => grafDif(sc, true, cv)) },
                  { t: 'Precipitação: diferença da média <span class="un">(mm)</span>', img: png(cv => grafDif(sc, false, cv)) });
      }
      const htmlGraf = graf.map(g => `<div class="bl"><h4>${g.t}</h4>${
        g.img ? `<img src="${g.img}" alt="">${g.abaixo || ''}` : `<p class="nota">${g.nota}</p>`}</div>`).join('');
      const titulo = `fogo-em-foco_2025-26_ficha_${D.slug(reg.nome)}`;
      const uf = reg.uf ? ' · ' + escHtml(String(reg.uf).split(',')[0].trim()) : '';
      return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
        <link rel="stylesheet" href="${new URL('assets/fontes/fontes.css', location.href).href}">
        <style>${CSS_FICHA}</style></head><body><div class="pag">
        <div class="cab"><div><h1${reg.nome.length > 40 ? ' class="longo"' : ''}>${escHtml(reg.nome)}</h1><p>${TIPO_AREA[camada] || camada}${uf}
          · ficha de fogo · período março/2025 a fevereiro/2026</p></div>
          <img src="${LOGO('logo_fogoemfoco_horizontal_claro.svg')}" alt="Fogo em Foco"></div>
        <div class="rq">${htmlRanques(reg, def)}</div>
        <div class="meio"><div class="mapa"><small>${mapa.titulo}</small>${mapa.svg}<div class="leg">${mapa.legenda}</div></div>
          <div class="blocos">${htmlNumeros(reg, anoEv)}</div></div>
        <div class="graf">${htmlGraf}</div>
        <div class="rod"><div>Fontes: área queimada MODIS MCD64A1 (vegetação com ≥30% de cobertura arbórea); Global Fire Atlas;
          focos e eventos de fogo do INPE; clima ERA5 (média ${clima.ref}). Ranque: posição na série de 24 períodos, 1º = maior
          registro desde 2002.${avisoClima && camada !== 'Biomas' && sc ? ' ' + avisoClima : ''}
          Gerado em ${new Date().toLocaleDateString('pt-BR')}.</div>
          <div class="l2"><div><b>Como citar:</b> ${D.CITACAO}</div><div class="logos">
            <img src="${LOGO('logo_inpe.svg')}" alt="INPE"><img src="${LOGO('logo_brasa.svg')}" alt="Rede BRASA">
            <img src="${LOGO('logo_trees_claro.svg')}" alt="TREES"></div></div></div>
        </div></body></html>`;
    });
  }

  async function gerarFicha(rid) {
    if (!rid) return;
    // a janela abre ja no clique: depois de um await o navegador a bloquearia
    const win = window.open('', '_blank');
    if (!win) { alert('Permita janelas pop-up para gerar a ficha.'); return; }
    win.document.write('<p style="font:14px system-ui;padding:24px">Preparando a ficha…</p>');
    try {
      const html = await montarFicha(rid);
      if (win.closed) return;              // o leitor fechou a janela enquanto carregava
      win.document.open();
      win.document.write(html);
      win.document.close();
      // espera as imagens e as fontes antes de imprimir
      if (win.document.readyState !== 'complete') await new Promise(r => win.addEventListener('load', r, { once: true }));
      await win.document.fonts.ready;
      if (win.closed) return;
      win.focus();
      win.print();
    } catch (e) {
      if (!win.closed) {
        win.document.body.innerHTML = '<p style="font:14px system-ui;padding:24px">Não foi possível gerar a ficha: ' +
          escHtml(e.message) + '</p>';
      }
    }
  }

  document.getElementById('abrir-download').addEventListener('click', abrir);
  document.getElementById('fechar-download').addEventListener('click', fechar);
  janela.addEventListener('click', (e) => { if (e.target === janela) fechar(); });
  // Esc fecha; Tab fica preso dentro da janela enquanto ela esta aberta.
  const FOCAVEIS = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), summary, a[href]';
  document.addEventListener('keydown', (e) => {
    if (janela.hidden) return;
    if (e.key === 'Escape') { fechar(); return; }
    if (e.key !== 'Tab') return;
    const itens = [...janela.querySelector('.caixa-download').querySelectorAll(FOCAVEIS)]
      .filter(el => el.offsetParent !== null && el.tabIndex >= 0);
    if (!itens.length) return;
    const primeiro = itens[0], ultimo = itens[itens.length - 1];
    if (!janela.contains(document.activeElement)) { e.preventDefault(); primeiro.focus(); }
    else if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  });
  // Setas esquerda/direita trocam de aba.
  janela.querySelector('.abas-download').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const abas = [...janela.querySelectorAll('[data-aba]')];
    const i = abas.findIndex(b => b.dataset.aba === aba);
    const novo = abas[(i + (e.key === 'ArrowRight' ? 1 : abas.length - 1)) % abas.length];
    trocarAba(novo.dataset.aba);
    novo.focus();
  });
  janela.querySelectorAll('[data-aba]').forEach(b => b.addEventListener('click', () => trocarAba(b.dataset.aba)));

  window.FEFJanelaDownload = { abrir, fechar, trocarAba, montarFicha };
})();

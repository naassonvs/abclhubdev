/* ══════════════════════════════════════════════════════════════
   ABCL Hub · js/export.js — exportação unificada (CSV · XLSX · PDF)
   ──────────────────────────────────────────────────────────────
   Substitui as 5 implementações que existiam espalhadas pelo projeto,
   cada uma com um separador, um mecanismo de download e um tratamento
   de acento diferente.

   Uso:
     exportarDados({
       nome:    'financeiro',                    // vira ABCL_financeiro_2026-09-05.xlsx
       titulo:  'Relatório Financeiro',          // usado no PDF e na aba do XLSX
       colunas: ['Tipo', 'Data', 'Valor'],
       linhas:  [['Despesa', '05/09', 200.5], ...],
       formato: 'xlsx' | 'csv' | 'pdf',
       moeda:   [2],                             // índices de coluna com R$ (opcional)
     });

   Decisões de projeto e o porquê:
   • CSV com ponto e vírgula: o Excel em português usa o separador de lista
     do sistema, que no Brasil é ';'. Com vírgula, tudo abre numa coluna só.
   • BOM (\uFEFF) sempre: sem ele o Excel lê UTF-8 como latin-1 e "Inscrição"
     vira "InscriÃ§Ã£o".
   • Blob em vez de data: URL: data: tem teto de tamanho no navegador e falha
     em silêncio quando o catálogo cresce.
   • Proteção contra injeção de fórmula: texto vindo de formulário público que
     comece com = + - @ é interpretado como fórmula pelo Excel.
   • PDF via janela de impressão: zero dependências, e o "Salvar como PDF" do
     navegador dá tipografia melhor que qualquer biblioteca leve.
   ══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var VERSAO = '1.0.0';

  // ── Nome de arquivo ──
  // Translitera acentos em vez de trocá-los por traço: "Inscrição" → "inscricao",
  // e não "inscri-o" como fazia a versão antiga.
  var ACENTOS = { á:'a',à:'a',ã:'a',â:'a',ä:'a', é:'e',ê:'e',è:'e',ë:'e',
                  í:'i',î:'i',ì:'i',ï:'i', ó:'o',õ:'o',ô:'o',ò:'o',ö:'o',
                  ú:'u',û:'u',ù:'u',ü:'u', ç:'c', ñ:'n' };

  function sanitizarNome(txt) {
    return String(txt || 'export')
      .toLowerCase()
      .replace(/[áàãâäéêèëíîìïóõôòöúûùüçñ]/g, function (c) { return ACENTOS[c] || c; })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'export';
  }

  function dataArquivo() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function nomeArquivo(nome, ext) {
    return 'ABCL_' + sanitizarNome(nome) + '_' + dataArquivo() + '.' + ext;
  }

  // ── Segurança: injeção de fórmula em planilha ──
  // O texto vem de formulário público. "=1+1" ou "@SUM(...)" viram fórmula
  // ativa ao abrir o arquivo. O apóstrofo à frente força leitura como texto.
  function protegerFormula(v) {
    if (typeof v !== 'string') return v;
    return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  }

  function baixar(blob, arquivo) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = arquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  // ══════════════════ CSV ══════════════════
  function celulaCSV(v) {
    if (v === null || v === undefined) return '';
    var s = String(protegerFormula(v));
    // Aspas duplicadas + envelope sempre que houver ; " quebra de linha ou vírgula
    return /[;"\n\r,]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function gerarCSV(cfg) {
    var linhas = [cfg.colunas.map(celulaCSV).join(';')];
    cfg.linhas.forEach(function (l) { linhas.push(l.map(celulaCSV).join(';')); });
    return new Blob(['\uFEFF' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  }

  // ══════════════════ XLSX ══════════════════
  function gerarXLSX(cfg) {
    if (typeof XLSX === 'undefined') {
      throw new Error('Biblioteca de planilha não carregada. Inclua js/xlsx.full.min.js antes de js/export.js.');
    }
    var moeda = cfg.moeda || [];
    var aoa = [cfg.colunas.slice()];
    cfg.linhas.forEach(function (l) {
      aoa.push(l.map(function (v) {
        // Números continuam números: viram somáveis e ordenáveis na planilha,
        // coisa que o CSV não consegue garantir.
        if (typeof v === 'number') return v;
        return protegerFormula(v === null || v === undefined ? '' : String(v));
      }));
    });

    var ws = XLSX.utils.aoa_to_sheet(aoa);

    // Largura das colunas pelo conteúdo (limitada, para não virar coluna gigante)
    ws['!cols'] = cfg.colunas.map(function (c, i) {
      var max = String(c).length;
      cfg.linhas.forEach(function (l) {
        var t = String(l[i] === null || l[i] === undefined ? '' : l[i]).length;
        if (t > max) max = t;
      });
      return { wch: Math.min(Math.max(max + 2, 8), 50) };
    });

    // Formato de moeda nas colunas indicadas
    var ref = XLSX.utils.decode_range(ws['!ref']);
    moeda.forEach(function (col) {
      for (var r = 1; r <= ref.e.r; r++) {
        var cel = ws[XLSX.utils.encode_cell({ r: r, c: col })];
        if (cel && cel.t === 'n') cel.z = 'R$ #,##0.00';
      }
    });

    ws['!autofilter'] = { ref: ws['!ref'] };
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    var wb = XLSX.utils.book_new();
    // Nome de aba tem limite de 31 caracteres e proíbe : \ / ? * [ ]
    var aba = String(cfg.titulo || cfg.nome || 'Dados').replace(/[:\\\/?*\[\]]/g, ' ').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, aba);

    var buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ══════════════════ PDF (via impressão do navegador) ══════════════════
  function escaparHTML(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function gerarPDF(cfg) {
    var titulo = cfg.titulo || cfg.nome || 'Relatório';
    var agora = new Date().toLocaleString('pt-BR');
    var alinhaDir = {};
    (cfg.moeda || []).forEach(function (i) { alinhaDir[i] = true; });

    var html =
      '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<title>' + escaparHTML(titulo) + '</title><style>' +
      '@page{size:A4 landscape;margin:14mm 10mm;}' +
      'body{font:11px -apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:0;}' +
      'h1{font-size:16px;margin:0 0 2px;}' +
      '.meta{font-size:10px;color:#666;margin-bottom:12px;}' +
      'table{width:100%;border-collapse:collapse;}' +
      'th,td{border:1px solid #ccc;padding:5px 7px;text-align:left;vertical-align:top;}' +
      'th{background:#f0f4f1;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.03em;}' +
      'tr{page-break-inside:avoid;}' +
      'thead{display:table-header-group;}' +   /* repete cabeçalho em toda página */
      'tbody tr:nth-child(even){background:#fafafa;}' +
      '.num{text-align:right;white-space:nowrap;}' +
      '</style></head><body>' +
      '<h1>' + escaparHTML(titulo) + '</h1>' +
      '<div class="meta">Acampamento Bíblico de Conselheiro Lafaiete · gerado em ' + agora +
      ' · ' + cfg.linhas.length + ' registro' + (cfg.linhas.length === 1 ? '' : 's') + '</div>' +
      '<table><thead><tr>' +
      cfg.colunas.map(function (c, i) {
        return '<th' + (alinhaDir[i] ? ' class="num"' : '') + '>' + escaparHTML(c) + '</th>';
      }).join('') +
      '</tr></thead><tbody>' +
      cfg.linhas.map(function (l) {
        return '<tr>' + cfg.colunas.map(function (_, i) {
          var v = l[i];
          if (alinhaDir[i] && typeof v === 'number') v = 'R$ ' + v.toFixed(2).replace('.', ',');
          return '<td' + (alinhaDir[i] ? ' class="num"' : '') + '>' + escaparHTML(v) + '</td>';
        }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></body></html>';

    var w = window.open('', '_blank');
    if (!w) throw new Error('O navegador bloqueou a janela de impressão. Libere pop-ups para este site.');
    w.document.write(html);
    w.document.close();
    // Espera o layout assentar antes de abrir o diálogo de impressão
    w.onload = function () { setTimeout(function () { w.focus(); w.print(); }, 250); };
  }

  // ══════════════════ Entrada única ══════════════════
  function exportarDados(cfg) {
    cfg = cfg || {};
    if (!Array.isArray(cfg.colunas) || !cfg.colunas.length) {
      throw new Error('exportarDados: "colunas" é obrigatório.');
    }
    cfg.linhas = Array.isArray(cfg.linhas) ? cfg.linhas : [];
    if (!cfg.linhas.length) return { ok: false, motivo: 'vazio' };

    var formato = (cfg.formato || 'xlsx').toLowerCase();

    if (formato === 'pdf') { gerarPDF(cfg); return { ok: true, formato: 'pdf' }; }

    var blob = formato === 'csv' ? gerarCSV(cfg) : gerarXLSX(cfg);
    baixar(blob, nomeArquivo(cfg.nome, formato === 'csv' ? 'csv' : 'xlsx'));
    return { ok: true, formato: formato, bytes: blob.size };
  }

  global.exportarDados = exportarDados;
  global.ABCLExport = {
    versao: VERSAO,
    exportarDados: exportarDados,
    sanitizarNome: sanitizarNome,
    nomeArquivo: nomeArquivo,
    protegerFormula: protegerFormula,
    celulaCSV: celulaCSV,
    gerarCSV: gerarCSV,
    gerarXLSX: gerarXLSX,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = global.ABCLExport;
  console.log('[export.js] v' + VERSAO + ' carregado');
})(typeof window !== 'undefined' ? window : globalThis);

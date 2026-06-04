/**
 * pdv-auth.js — ABCL PDV
 *
 * Login LEVE e 100% OFFLINE para vendinha/livraria.
 * - Captura o nome do operador (atribuição em cada venda) e exige um código de acesso.
 * - Persiste em localStorage (sobrevive a recarregar a página sem internet, ao contrário
 *   do sessionStorage que morria ao fechar a aba).
 * - Não depende do Firebase: funciona com o aparelho totalmente offline.
 *
 * CONFIGURAÇÃO (em cada página, ANTES de carregar este script):
 *   <script>
 *     window.PDV_MODULO      = 'vendinha';   // ou 'livraria'
 *     window.PDV_CODIGO       = 'abcl2026';   // TROQUE este código antes do acampamento
 *     window.PDV_TITULO       = 'Vendinha';   // rótulo exibido
 *   </script>
 *   <script src="js/pdv-auth.js"></script>
 */
(function () {
  'use strict';

  var MOD    = window.PDV_MODULO || (location.pathname.indexOf('livraria') >= 0 ? 'livraria' : 'vendinha');
  var CODIGO = String(window.PDV_CODIGO || 'abcl2026');
  var TITULO = window.PDV_TITULO || (MOD === 'livraria' ? 'Livraria' : 'Vendinha');
  var LS_KEY = 'abcl-' + MOD + '-auth';

  function operadorAtual() {
    return localStorage.getItem(LS_KEY) || '';
  }

  function aplicarOperadorNaTela() {
    var nome = operadorAtual();
    if (!nome) return;
    // back-compat com o código existente que lê sessionStorage
    try { sessionStorage.setItem(LS_KEY, nome); } catch (e) {}
    var el = document.getElementById('v-username') || document.getElementById('l-username');
    if (el) el.textContent = nome;
  }

  function entrar(nome) {
    nome = (nome || '').trim();
    localStorage.setItem(LS_KEY, nome);
    try { sessionStorage.setItem(LS_KEY, nome); } catch (e) {}
    aplicarOperadorNaTela();
  }

  // Troca de operador (exposto para um botão "trocar operador", se quiser usar)
  window.pdvTrocarOperador = function () {
    localStorage.removeItem(LS_KEY);
    try { sessionStorage.removeItem(LS_KEY); } catch (e) {}
    location.reload();
  };

  function mostrarTela() {
    if (document.getElementById('pdv-auth-overlay')) return;

    var ov = document.createElement('div');
    ov.id = 'pdv-auth-overlay';
    ov.setAttribute('role', 'dialog');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'background:#0a0a0a', 'color:#f5f2eb',
      'display:flex', 'align-items:center', 'justify-content:center',
      'font-family:Inter,DM Sans,system-ui,sans-serif', 'padding:24px'
    ].join(';');

    ov.innerHTML =
      '<div style="width:100%;max-width:360px;text-align:center;">' +
        '<div style="width:56px;height:56px;border-radius:14px;background:#e85d04;display:flex;' +
          'align-items:center;justify-content:center;font-size:26px;margin:0 auto 18px;">🏕️</div>' +
        '<h1 style="font-size:20px;font-weight:800;letter-spacing:-.5px;margin:0 0 4px;">ABCL — ' + TITULO + '</h1>' +
        '<p style="font-size:13px;color:#888;margin:0 0 26px;">Identifique-se para abrir o caixa</p>' +
        '<input id="pdv-auth-nome" type="text" autocomplete="name" placeholder="Seu nome (operador)" ' +
          'style="width:100%;padding:13px 15px;margin-bottom:10px;border-radius:11px;border:1px solid #2a2a2a;' +
          'background:#1a1a1a;color:#f5f2eb;font-size:15px;outline:none;box-sizing:border-box;">' +
        '<input id="pdv-auth-codigo" type="password" autocomplete="off" placeholder="Código de acesso" ' +
          'style="width:100%;padding:13px 15px;margin-bottom:10px;border-radius:11px;border:1px solid #2a2a2a;' +
          'background:#1a1a1a;color:#f5f2eb;font-size:15px;outline:none;box-sizing:border-box;">' +
        '<div id="pdv-auth-erro" style="min-height:18px;color:#e63946;font-size:12.5px;margin-bottom:8px;"></div>' +
        '<button id="pdv-auth-btn" ' +
          'style="width:100%;padding:14px;border:none;border-radius:11px;background:#e85d04;color:#fff;' +
          'font-size:15px;font-weight:700;cursor:pointer;">Entrar no caixa</button>' +
        '<p style="font-size:11px;color:#555;margin:18px 0 0;">Funciona offline. Seu nome fica registrado em cada venda.</p>' +
      '</div>';

    document.body.appendChild(ov);

    var inpNome = ov.querySelector('#pdv-auth-nome');
    var inpCod  = ov.querySelector('#pdv-auth-codigo');
    var erro    = ov.querySelector('#pdv-auth-erro');
    var btn     = ov.querySelector('#pdv-auth-btn');

    function tentar() {
      var nome = (inpNome.value || '').trim();
      var cod  = (inpCod.value  || '').trim();
      if (nome.length < 2) { erro.textContent = 'Digite seu nome.'; inpNome.focus(); return; }
      if (cod !== CODIGO)  { erro.textContent = 'Código de acesso incorreto.'; inpCod.focus(); return; }
      entrar(nome);
      ov.remove();
    }

    btn.addEventListener('click', tentar);
    ov.addEventListener('keydown', function (e) { if (e.key === 'Enter') tentar(); });
    setTimeout(function () { inpNome.focus(); }, 60);
  }

  function init() {
    if (operadorAtual()) { aplicarOperadorNaTela(); return; }
    mostrarTela();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

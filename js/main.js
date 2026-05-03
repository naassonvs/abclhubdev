/* ============================================================
   ABCL — Acampamento Bíblico Conselheiro Lafaiete
   main.js · Versão 2026

   🔧 Para atualizar o countdown, edite a DATA_ACAMPAMENTO abaixo.
   ============================================================ */

// ── Configuração ────────────────────────────────────────────
const CONFIG = {
  DATA_ACAMPAMENTO: '2026-06-04T00:00:00',   // <- mude aqui a cada edição
  WHATSAPP_NUM:     '5531988262599',           // <- número sem + ou espaços
  FORMS_URL:        'https://forms.gle/VAdsxWVp7fedCzD76', // <- link do Google Forms
};

// ── Utilitários ─────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');
const $   = id => document.getElementById(id);

// ── Nav: opacidade no scroll ─────────────────────────────────
(function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 50
      ? 'rgba(5, 10, 7, 0.97)'
      : 'rgba(10, 22, 16, 0.85)';
  }, { passive: true });
})();

// ── Menu mobile ──────────────────────────────────────────────
function toggleMenu() {
  const menu = $('menu-mobile');
  if (!menu) return;
  menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
}

// Fecha o menu ao clicar fora
document.addEventListener('click', (e) => {
  const menu = $('menu-mobile');
  const btn  = document.querySelector('.hamburger');
  if (!menu || menu.style.display !== 'flex') return;
  if (!menu.contains(e.target) && !btn.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// ── Reveal on scroll ─────────────────────────────────────────
(function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();

// ── FAQ accordion ────────────────────────────────────────────
function toggleFaq(el) {
  const item   = el.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Fecha todos
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));

  // Abre o clicado (se estava fechado)
  if (!isOpen) item.classList.add('open');
}

// ── Countdown ─────────────────────────────────────────────────
(function initCountdown() {
  const alvo = new Date(CONFIG.DATA_ACAMPAMENTO);

  function tick() {
    const diff = alvo - new Date();

    if (diff <= 0) {
      ['cd-d','cd-h','cd-m','cd-s'].forEach(id => {
        const el = $(id);
        if (el) el.textContent = '00';
      });
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff % 86400000 / 3600000);
    const m = Math.floor(diff % 3600000  / 60000);
    const s = Math.floor(diff % 60000    / 1000);

    if ($('cd-d')) $('cd-d').textContent = pad(d);
    if ($('cd-h')) $('cd-h').textContent = pad(h);
    if ($('cd-m')) $('cd-m').textContent = pad(m);
    if ($('cd-s')) $('cd-s').textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

// ── Formulário → WhatsApp ────────────────────────────────────
function enviarWhats() {
  const nome   = $('nome')?.value.trim()   || '';
  const tel    = $('tel')?.value.trim()    || '';
  const modal  = $('modalidade')?.value    || '';
  const obs    = $('obs')?.value.trim()    || '';
  const igreja = $('igreja')?.value.trim() || '';
  const membro = $('membro')?.value        || '';

  if (!nome || !tel) {
    alert('Preencha pelo menos seu nome e WhatsApp para continuarmos. 😊');
    return;
  }

  const linhas = [
    `Olá! Tenho interesse no *13º Acampamento Bíblico (ABCL 2026)*.`,
    ``,
    `👤 Nome: *${nome}*`,
    `📱 WhatsApp: ${tel}`,
    modal  ? `📋 Modalidade: ${modal}`       : '',
    igreja ? `⛪ Igreja: ${igreja}`           : '',
    membro ? `✅ Membro: ${membro}`           : '',
    obs    ? `📝 Obs: ${obs}`                : '',
  ].filter(Boolean);

  const url = `https://wa.me/${CONFIG.WHATSAPP_NUM}?text=${encodeURIComponent(linhas.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ── Abre o Google Forms ───────────────────────────────────────
function abrirForms() {
  window.open(CONFIG.FORMS_URL, '_blank', 'noopener,noreferrer');
}

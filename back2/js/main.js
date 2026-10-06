// main.js
(function () {
  'use strict';

  // --- Loader de scripts externos (retorna Promise) ---
  function loadScript(src, attrs = {}, timeout = 8000) {
    return new Promise((resolve, reject) => {
      try {
        const s = document.createElement('script');
        s.src = src;
        for (const k in attrs) {
          // se valor for booleano true, setamos atributo vazio (ex: disable-devtool-auto)
          if (typeof attrs[k] === 'boolean') {
            if (attrs[k]) s.setAttribute(k, '');
          } else {
            s.setAttribute(k, attrs[k]);
          }
        }
        s.async = false; // tentar manter ordem previsível
        const tid = setTimeout(() => {
          s.onerror = s.onload = null;
          reject(new Error('timeout loading script: ' + src));
        }, timeout);
        s.onload = () => { clearTimeout(tid); resolve(s); };
        s.onerror = (e) => { clearTimeout(tid); reject(e || new Error('error loading script: ' + src)); };
        (document.head || document.documentElement).appendChild(s);
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- Proteção contra devtools, em modo seguro ---------------------------
  // Antes: carregado com `disable-devtool-auto`, que liga TODOS os detectores
  // e usa a ação padrão da lib (apagar o documento + navegar para fora). Dois
  // problemas em produção:
  //   1. o detector "Size" compara outerWidth/innerWidth e dispara sozinho com
  //      zoom do navegador, janela redimensionada ou barra lateral aberta;
  //   2. quando dispara, o visitante fica com tela branca — em cima de tráfego
  //      pago isso é venda perdida.
  // Agora: versão fixada, detectores instáveis desligados e ação própria que
  // nunca apaga a página nem manda para domínio externo.
  const DISABLE_DEVTOOL_SRC = 'https://cdn.jsdelivr.net/npm/disable-devtool@0.3.9/disable-devtool.min.js';
  const DEVTOOL_FLAG = 'ddt_guard_fired';

  function startDevtoolGuard() {
    // Em touch não há devtools para abrir e os detectores dão falso-positivo
    // (teclado virtual e barra de endereço retrátil mexem no viewport).
    const isTouch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
                    ('ontouchstart' in window);
    if (isTouch) return Promise.resolve(null);

    return loadScript(DISABLE_DEVTOOL_SRC)
      .then(() => {
        const DisableDevtool = window.DisableDevtool;
        if (typeof DisableDevtool !== 'function') return null;

        const T = DisableDevtool.DetectorType || {};
        // Ficam de fora: Size (falso-positivo com zoom/resize) e Performance
        // (falso-positivo em máquina lenta ou aba em segundo plano).
        const detectors = ['RegToString', 'DefineId', 'DateToString', 'FuncToString', 'Debugger', 'DebugLib']
          .map((k) => T[k])
          .filter((v) => typeof v === 'number');

        DisableDevtool({
          detectors: detectors,
          interval: 1000,
          disableMenu: true,
          clearIntervalWhenDevOpenTrigger: true,
          ondevtoolopen: function () {
            // Age no máximo uma vez por sessão: sem isso um falso-positivo
            // persistente viraria loop de redirect.
            try {
              if (sessionStorage.getItem(DEVTOOL_FLAG)) return;
              sessionStorage.setItem(DEVTOOL_FLAG, '1');
            } catch (e) {
              return; // sem sessionStorage (aba anônima restrita), não faz nada
            }
            // Volta para a home preservando as UTMs. No pior caso — um falso
            // positivo — o visitante continua dentro do funil.
            window.location.replace('/' + (window.location.search || ''));
          }
        });
        return DisableDevtool;
      })
      .catch((err) => {
        // Não falhar a inicialização do app se o recurso não carregar
        console.warn('Falha ao carregar disable-devtool (continuando sem ele):', err);
        return null;
      });
  }

  const devtoolPromise = startDevtoolGuard();

  // --- Função de inicialização do app (executa depois do carregar do devtool ou fallback) ---
  async function initApp() {
    // aguarda tentativa de carregamento do devtool (não bloqueia indefinidamente)
    await devtoolPromise;

    // ==============================
    // UTILITÁRIOS GERAIS
    // ==============================
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    function setHeroImage(url, alt = 'Hero') {
      const wrap = document.getElementById('heroMedia');
      if (!wrap) return;
      wrap.innerHTML = `<img src="${url}" alt="${alt}">`;
    }

    function setHeroVideo(url, autoplay = true, loop = true, muted = true) {
      const wrap = document.getElementById('heroMedia');
      if (!wrap) return;
      wrap.innerHTML = `
        <video ${autoplay ? 'autoplay' : ''} ${loop ? 'loop' : ''} ${muted ? 'muted' : ''} playsinline>
          <source src="${url}" type="video/mp4">
        </video>`;
    }

    function setImage(targetId, url, alt = 'Imagem') {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.src = url; el.alt = alt;
    }

    function applyAspect(selector, desktopRatio, mobileRatio) {
      const els = document.querySelectorAll(selector);
      if (!els || els.length === 0) return;
      const mq = window.matchMedia('(min-width: 768px)');
      const apply = () => {
        els.forEach(el => {
          el.classList.remove(`aspect-[${mobileRatio}]`, `aspect-[${desktopRatio}]`);
          el.classList.add(mq.matches ? `aspect-[${desktopRatio}]` : `aspect-[${mobileRatio}]`);
        });
      };
      if (mq.addEventListener) mq.addEventListener('change', apply);
      else mq.addListener(apply); // compatibilidade
      apply();
    }

    // chama com segurança (não há heroMedia em todos os layouts)
    applyAspect('#heroMedia', '16/9', '9/16');

    // ==============================
    // HEADER / BOTÕES DE NAVEGAÇÃO
    // ==============================
    const back = document.getElementById('btnBack');
    back && back.addEventListener('click', () => {
      if (history.length > 1) history.back();
    });

    const shareBtn = document.getElementById('btnShare');
    shareBtn && shareBtn.addEventListener('click', async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title: document.title, url: location.href });
        } else {
          await navigator.clipboard.writeText(location.href);
          shareBtn.classList.add('text-brand-700');
          setTimeout(() => shareBtn.classList.remove('text-brand-700'), 800);
        }
      } catch (e) { /* noop */ }
    });

    const cartBtn = document.getElementById('btnCart');
    cartBtn && cartBtn.addEventListener('click', () => {
      location.href = 'carrinho.php' + window.location.search;
    });

    // ==============================
    // CHAT ESTILO TYPEBOT
    // ==============================
    const chatModal = document.getElementById('chatModal');
    const chatStream = document.getElementById('chatStream');
    const btnMessage = document.getElementById('btnMessage');

    const STORAGE_KEY = 'chat_history_laissa_v1';
    const AGENT_NAME = 'Laissa';
    const SCRIPTED_MSGS = [
      'Olá! 👋 Todos os produtos estão com descontos de até <strong>85% OFF</strong>.',
      'Aproveite agora: as ofertas são por tempo limitado e os <strong>estoques estão acabando</strong>.'
    ];

    function loadHistory() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
    }
    function saveHistory(items) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* quota */ }
    }
    function clearHistory() { localStorage.removeItem(STORAGE_KEY); }

    function openChat() {
      if (!chatModal) return;
      chatModal.classList.remove('hidden');
      if (chatStream) chatStream.innerHTML = '';
      const hist = loadHistory();
      if (hist.length) renderHistory(hist);
      else scriptedConversation();
    }
    function closeChat() { chatModal && chatModal.classList.add('hidden'); }

    function renderHistory(items) {
      if (!chatStream) return;
      for (const it of items) {
        if (it.type === 'bot') botBubble(it.html, false);
        if (it.type === 'cta') ctaBubble(false);
      }
    }

    function botBubble(html, persist = true) {
      if (!chatStream) return null;
      const wrap = document.createElement('div');
      wrap.className = 'flex items-start gap-2';
      wrap.innerHTML = `
        <img src="images/kwainatal.jpg" alt="${AGENT_NAME}" class="w-6 h-6 rounded-full mt-1"/>
        <div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border shadow-sm px-3 py-2 text-[13px] leading-snug text-slate-800">
          <div class="text-[11px] text-slate-500 mb-1">${AGENT_NAME}</div>
          <div>${html}</div>
        </div>
      `;
      chatStream.appendChild(wrap);
      chatStream.scrollTop = chatStream.scrollHeight;
      if (persist) {
        const hist = loadHistory();
        hist.push({ type: 'bot', html });
        saveHistory(hist);
      }
      return wrap;
    }

    function ctaBubble(persist = true) {
      if (!chatStream) return null;
      const wrap = document.createElement('div');
      wrap.className = 'flex items-start gap-2';
      wrap.innerHTML = `
        <img src="images/kwainatal.jpg" alt="${AGENT_NAME}" class="w-6 h-6 rounded-full mt-1"/>
        <div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border shadow-sm px-3 py-2 text-[13px] leading-snug text-slate-800 space-y-2">
          <div class="text-[11px] text-slate-500">${AGENT_NAME}</div>
          <div>Se precisar de ajuda para escolher, posso te orientar aqui no chat. <strong>Aproveite já</strong>! 🔥</div>
          <div><button id="ctaOffers" data-close class="px-3 py-1.5 rounded-full bg-[#ff3b66] text-white text-[12px] font-semibold shadow-sm active:scale-95">Aproveitar ofertas</button></div>
        </div>
      `;
      chatStream.appendChild(wrap);
      chatStream.scrollTop = chatStream.scrollHeight;
      const btn = wrap.querySelector('#ctaOffers');
      btn && btn.addEventListener('click', () => {
        closeChat();
        const dest = document.querySelector('#products');
        dest && dest.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      if (persist) {
        const hist = loadHistory();
        hist.push({ type: 'cta' });
        saveHistory(hist);
      }
      return wrap;
    }

    function typingBubble() {
      if (!chatStream) return null;
      const wrap = document.createElement('div');
      wrap.className = 'flex items-start gap-2';
      wrap.innerHTML = `
        <img src="images/kwainatal.jpg" alt="${AGENT_NAME}" class="w-6 h-6 rounded-full mt-1"/>
        <div class="max-w-[85%] rounded-2xl rounded-tl-sm bg-white border shadow-sm px-3 py-2">
          <span class="inline-flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay:0ms"></span>
            <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay:120ms"></span>
            <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" style="animation-delay:240ms"></span>
          </span>
        </div>`;
      chatStream.appendChild(wrap);
      chatStream.scrollTop = chatStream.scrollHeight;
      return wrap;
    }

    async function scriptedConversation() {
      for (const msg of SCRIPTED_MSGS) {
        const typing = typingBubble();
        await new Promise(r => setTimeout(r, 3000));
        typing && typing.remove();
        botBubble(msg);
      }
      const typing = typingBubble();
      await new Promise(r => setTimeout(r, 3000));
      typing && typing.remove();
      ctaBubble();
    }

    btnMessage && btnMessage.addEventListener('click', openChat);
    chatModal && chatModal.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) closeChat();
    });

    // ==== Pequenos testes automáticos (console) ====
    (function testChat() {
      try {
        console.assert(!!btnMessage, 'btnMessage existe');
        console.assert(!!chatModal && !!chatStream, 'chatModal e chatStream existem');
        const before = loadHistory().length;
        const tmp = loadHistory(); tmp.push({ type: 'bot', html: '_test_' }); saveHistory(tmp);
        console.assert(loadHistory().length === before + 1, 'history persiste');
        tmp.pop(); saveHistory(tmp);
      } catch (e) { /* noop */ }
    })();

    // --- Expor algumas funções úteis globalmente (opcional) ---
    window.App = window.App || {};
    Object.assign(window.App, {
      setHeroImage,
      setHeroVideo,
      setImage,
      applyAspect,
      openChat,
      closeChat,
      loadHistory,
      saveHistory,
      clearHistory
    });

    // pronto
    console.info('main.js inicializado');
  } // fim initApp

  // inicia sem bloquear
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();


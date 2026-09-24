(() => {
  /* ---------- Anti-clickjacking (reforço para hospedagens sem cabeçalho frame-ancestors) ---------- */
  if (window.top !== window.self) {
    try {
      window.top.location.replace(window.self.location.href);
    } catch {
      /* navegação do topo bloqueada: esconde o conteúdo para não servir de isca */
    }
    document.documentElement.style.display = 'none';
    return;
  }

  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  const wa = document.querySelector('.wa');
  const hero = document.querySelector('.hero');

  /* ---------- Nav: fundo ao rolar + botão WhatsApp ---------- */
  let waFrom = 400;
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle('is-scrolled', y > 40);
    wa?.classList.toggle('is-visible', y > waFrom);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  // Mede o hero só quando ele muda de tamanho (fontes carregando, giro da tela), com o layout
  // já pronto: medir a cada scroll ou resize forçaria um reflow
  if (hero && 'ResizeObserver' in window) {
    new ResizeObserver(() => { waFrom = hero.offsetHeight * 0.6; onScroll(); }).observe(hero);
  }

  /* ---------- Menu mobile ---------- */
  // Com o menu aberto, o resto da página (e a logo, coberta pelo menu) sai do foco do teclado
  const behindMenu = [...document.querySelectorAll('body > :not(.nav)'), document.querySelector('.nav .logo')].filter(Boolean);
  const isOpen = () => toggle?.getAttribute('aria-expanded') === 'true';
  const setMenu = (open) => {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    behindMenu.forEach((el) => { el.inert = open; });
  };
  toggle?.addEventListener('click', () => setMenu(!isOpen()));
  menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !isOpen()) return;
    setMenu(false);
    toggle.focus();
  });
  // Girar o tablet/celular com o menu aberto (virando layout desktop) não pode deixar a página travada
  window.matchMedia('(min-width: 901px)').addEventListener?.('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Animações de entrada ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Números que contam do zero até o valor final (o HTML já traz o valor final, sem JS continua certo)
  const countUp = (el, delay) => {
    const end = Number(el.dataset.count);
    if (!end || reduceMotion) return;
    el.style.minWidth = `${el.offsetWidth}px`; // reserva a largura final: nada ao lado pula
    el.textContent = '0';
    setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 1600, 1);
        el.textContent = String(Math.round(end * (1 - (1 - p) ** 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  };

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        const delay = Math.min(siblings.indexOf(el), 5) * 90;
        el.style.animationDelay = `${delay}ms`;
        el.classList.add('is-in');
        el.querySelectorAll('[data-count]').forEach((n) => countUp(n, delay + 200));
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Brilho que segue o mouse nos cartões da comunidade (só com mouse) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Próximo culto (horário de Joinville) ---------- */
  const SERVICES = [
    { day: 3, hour: 20, label: 'Quarta · 20h' },
    { day: 0, hour: 10, label: 'Domingo · 10h' },
    { day: 0, hour: 19, label: 'Domingo · 19h' },
  ];
  const DURATION_MIN = 90;

  // Data/hora "de parede" em America/Sao_Paulo, independente do fuso do visitante
  const nowInSaoPaulo = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'short',
    }).formatToParts(new Date()).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[parts.weekday], minutes: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
  };

  const findNext = () => {
    const { day, minutes } = nowInSaoPaulo();
    const nowWeekMin = day * 1440 + minutes;
    let best = null;
    for (const s of SERVICES) {
      const start = s.day * 1440 + s.hour * 60;
      if (nowWeekMin >= start && nowWeekMin < start + DURATION_MIN) return { ...s, live: true, diff: 0 };
      let diff = start - nowWeekMin;
      if (diff < 0) diff += 7 * 1440;
      if (!best || diff < best.diff) best = { ...s, live: false, diff };
    }
    best.calDays = Math.floor((minutes + best.diff) / 1440);
    return best;
  };

  const formatDiff = ({ diff, calDays }) => {
    if (calDays === 0) {
      if (diff < 60) return `hoje, em ${diff} min`;
      const h = Math.floor(diff / 60), m = diff % 60;
      return `hoje, em ${h}h${m ? `${String(m).padStart(2, '0')}` : ''}`;
    }
    return calDays === 1 ? 'amanhã' : `em ${calDays} dias`;
  };

  const whenEl = document.getElementById('next-when');
  const countEl = document.getElementById('next-count');
  const cards = document.querySelectorAll('.service');

  const updateNext = () => {
    if (!whenEl || !countEl) return;
    const next = findNext();
    if (!next) return;
    whenEl.textContent = next.label;
    countEl.textContent = next.live ? 'acontecendo agora' : formatDiff(next);
    cards.forEach((c) => c.classList.toggle(
      'is-next',
      Number(c.dataset.day) === next.day && Number(c.dataset.hour) === next.hour
    ));
  };
  updateNext();
  setInterval(updateNext, 60 * 1000);

  /* ---------- Mapa: só carrega o Google Maps após o clique (privacidade/LGPD) ---------- */
  const MAP_SRC = 'https://www.google.com/maps?q=Rua+Benjamin+Constant,+3473+-+Gl%C3%B3ria,+Joinville+-+SC&output=embed';
  const mapBox = document.getElementById('mapa');
  document.getElementById('load-map')?.addEventListener('click', () => {
    if (!mapBox) return;
    const iframe = document.createElement('iframe');
    iframe.title = 'Mapa: Igreja Ame, Joinville';
    iframe.src = MAP_SRC;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    iframe.allowFullscreen = true;
    mapBox.replaceChildren(iframe);
  });

  /* ---------- Ano no rodapé ---------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

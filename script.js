(() => {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('menu');
  const wa = document.querySelector('.wa');
  const hero = document.querySelector('.hero');

  /* ---------- Nav: fundo ao rolar + botão WhatsApp ---------- */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    wa.classList.toggle('is-visible', y > hero.offsetHeight * 0.6);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Animações de entrada ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
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

  /* ---------- Ano no rodapé ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();

(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Lenis: scroll fluido ---- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const t = $(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { duration: 1.3, easing: x => 1 - Math.pow(1 - x, 4) })
          : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---- Hero: entrada + flotado + parallax suave ---- */
  const hero = $('#hero');
  const pieces = $$('.hp', hero);
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('go')));
  setTimeout(() => hero.classList.add('idle'), 1800);

  /* ---- Cinta de cartas ---- */
  const nombres = {
    fila1: ['casa','corazon','pez','conejo','mariposa','robot','nube','flor','helado','gato'],
    fila2: ['gato','auto','palmera','molino','regalo','planta','hongos','mate','lapiz','casa']
  };
  const filas = $$('.fila');
  const build = (fila, lista) => {
    const html = lista.map(n => `<div class="carta"><img src="img/figma/cartas/${n}.png" alt="" draggable="false"></div>`).join('');
    fila.innerHTML = html + html + html; // 3 copias para loop continuo
  };
  build(filas[0], nombres.fila1);
  build(filas[1], nombres.fila2);

  const state = filas.map((f, i) => ({ el: f, dir: i === 0 ? -1 : 1, x: 0, w: 0 }));
  const measure = () => state.forEach(s => {
    s.w = s.el.scrollWidth / 3;
    if (s.dir > 0 && s.x === 0) s.x = -s.w;
  });
  addEventListener('load', measure);
  addEventListener('resize', measure);
  measure();

  const base = 0.03; // px por ms
  let last = performance.now(), boost = 0, scrollY0 = 0, heroH = innerHeight;
  const cinta = $('.cinta');
  let cintaVisible = false;
  new IntersectionObserver(([e]) => cintaVisible = e.isIntersecting).observe(cinta);

  function frame(now) {
    const dt = Math.min(now - last, 50); last = now;
    const v = lenis ? lenis.velocity : 0;
    boost += ((Math.min(Math.abs(v), 40) * 0.9) - boost) * 0.06;

    // parallax del hero
    if (!reduce) {
      const y = lenis ? lenis.scroll : scrollY;
      if (y < heroH * 1.2) pieces.forEach(p => p.style.setProperty('--py', (y * (parseFloat(p.dataset.depth) * 0.25)) + 'px'));
    }
    if (cintaVisible && !reduce) {
      state.forEach(s => {
        s.x += s.dir * (base + boost * 0.006) * dt;
        if (s.x <= -s.w * 2) s.x += s.w;
        if (s.x >= 0) s.x -= s.w;
        s.el.style.transform = `translate3d(${s.x}px,0,0)`;
      });
    } else if (reduce) {
      state.forEach(s => s.el.style.transform = `translate3d(${-s.w}px,0,0)`);
    }
    lenis && lenis.raf(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize', () => heroH = innerHeight);

  /* ---- Dock: aparece tras el hero + sección activa ---- */
  const dock = $('#dock');
  const links = $$('.dock-links a');
  new IntersectionObserver(([e]) => dock.classList.toggle('on', e.intersectionRatio < 0.88), { threshold: [0, 0.88, 0.95, 1] }).observe(hero);
  const secs = ['proyecto','detalles','uso','manual','contacto'].map(id => document.getElementById(id));
  const wrapL = $('.dock-links');
  const ind = document.createElement('i');
  ind.className = 'dock-ind';
  wrapL.prepend(ind);
  let cur = null, hidden = true;
  const place = (instant) => {
    const a = links.find(l => l.classList.contains('act'));
    // en Contacto el botón amarillo queda como está: el indicador se apaga
    if (!a) { ind.classList.remove('on'); hidden = true; return; }
    if (a.classList.contains('dock-cta')) {
      // el negro simplemente se desvanece; el botón sigue amarillo
      ind.classList.remove('on');
      hidden = true;
      return;
    }
    if (hidden || instant) {
      ind.style.transition = 'opacity .25s var(--ease)';
      ind.style.width = a.offsetWidth + 'px';
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      void ind.offsetWidth;
      ind.classList.add('on');
      requestAnimationFrame(() => ind.style.transition = '');
      hidden = false;
      return;
    }
    ind.style.width = a.offsetWidth + 'px';
    ind.style.transform = `translateX(${a.offsetLeft}px)`;
    ind.classList.add('on');
  };
  const setActive = id => {
    if (id === cur) return;
    cur = id;
    links.forEach(a => a.classList.toggle('act', a.dataset.s === id));
    place();
  };
  addEventListener('resize', place);
  secs.forEach(s => {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(s.id); }, { rootMargin: '-45% 0px -50% 0px' }).observe(s);
  });

  /* ---- Copiar mail ---- */
  $$('[data-copy]').forEach(btn => {
    const lbl = $('.lbl', btn), ico = $('.ico', btn), txt = lbl.textContent;
    let t;
    btn.addEventListener('click', async () => {
      const v = btn.dataset.copy;
      try { await navigator.clipboard.writeText(v); }
      catch { const r = document.createRange(); r.selectNodeContents(lbl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges(); }
      lbl.textContent = '¡Copiado!';
      ico.classList.replace('i-copy', 'i-check');
      clearTimeout(t);
      t = setTimeout(() => { lbl.textContent = txt; ico.classList.replace('i-check', 'i-copy'); }, 1800);
    });
  });
})();

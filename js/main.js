/* Jensen — site interactions. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const pad = (n) => String(n).padStart(2, '0');

  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = motionQuery.matches;
  motionQuery.addEventListener?.('change', (e) => { reduceMotion = e.matches; });
  // Data Saver / reduced motion: never autoplay video; show posters with Play controls instead.
  const noAutoplay = reduceMotion || navigator.connection?.saveData === true;

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------------------
     Scroll: nav state, progress bar, "5–9" clock, hero parallax
     The clock interpolates between each section's data-time stamp, so it
     reads exactly 18:30 when you arrive at Stills, 20:00 at The Haus, etc.
     --------------------------------------------------------------------- */
  const nav = $('[data-nav]');
  const clockEl = $('[data-clock]');
  const hero = $('.hero');
  const timedSections = $$('[data-time]');
  const tickerTrack = $('.ticker__track');
  const badgeRing = $('.badge__ring');
  const END_MINUTES = 21 * 60;
  let stops = [];
  let maxScroll = 1, heroH = 1, tickerLoop = 0;

  const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const formatClock = (min) => {
    const m = Math.round(min);
    return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  };

  // All layout reads happen here (on load/resize), never inside the scroll frame.
  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    heroH = hero ? hero.offsetHeight : 1;
    tickerLoop = tickerTrack ? tickerTrack.scrollWidth / 2 : 0;
    stops = timedSections
      .map((s) => ({ y: Math.min(Math.max(0, s.offsetTop - innerHeight * 0.4), maxScroll), m: toMinutes(s.dataset.time) }))
      .concat({ y: maxScroll, m: END_MINUTES })
      .sort((a, b) => a.y - b.y);
  }

  function clockAt(y) {
    if (!stops.length) return toMinutes('17:00');
    if (y <= stops[0].y) return stops[0].m;
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (y >= a.y && y <= b.y) {
        const t = b.y === a.y ? 1 : (y - a.y) / (b.y - a.y);
        return a.m + (b.m - a.m) * t;
      }
    }
    return stops[stops.length - 1].m;
  }

  let ticking = false;
  function update() {
    ticking = false;
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 24);
    nav.style.setProperty('--progress', Math.min(1, y / maxScroll).toFixed(4));
    if (clockEl) clockEl.textContent = formatClock(clockAt(y));
    if (reduceMotion) return;
    // Scroll-linked motion only: it moves because the reader moves, and stops when they stop.
    if (hero) hero.style.setProperty('--hero-p', Math.min(1, y / heroH).toFixed(3));
    if (tickerTrack && tickerLoop) tickerTrack.style.setProperty('--tick', `${-((y * 0.45) % tickerLoop)}px`);
    if (badgeRing) badgeRing.style.setProperty('--spin', `${(y * 0.12) % 360}deg`);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  measure();
  update();
  addEventListener('scroll', onScroll, { passive: true });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { measure(); update(); }).observe(document.body);
  } else {
    addEventListener('resize', () => { measure(); update(); });
  }

  /* Active nav link */
  const navLinks = $$('[data-navlink]');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach((a) => {
        if (a.dataset.navlink === id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main > section[id]').forEach((s) => sectionIO.observe(s));

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  const menu = $('[data-menu]');
  const menuOpen = $('[data-menu-open]');
  if (menu && menuOpen) {
    menuOpen.addEventListener('click', () => {
      menu.showModal();
      menuOpen.setAttribute('aria-expanded', 'true');
    });
    $('[data-menu-close]', menu).addEventListener('click', () => menu.close());
    menu.addEventListener('close', () => menuOpen.setAttribute('aria-expanded', 'false'));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => menu.close()));
    matchMedia('(min-width: 1024px)').addEventListener?.('change', (e) => { if (e.matches && menu.open) menu.close(); });
  }

  /* ---------------------------------------------------------------------
     Hero video + viewfinder timecode
     --------------------------------------------------------------------- */
  const heroVideo = $('[data-hero-video]');
  const toggle = $('[data-video-toggle]');
  const tcEl = $('[data-timecode]');
  let heroUserPaused = false;
  let heroVisible = true;

  function setToggle(playing) {
    if (!toggle) return;
    $('[data-toggle-label]', toggle).textContent = playing ? 'Pause' : 'Play';
    $('[data-toggle-icon] use', toggle).setAttribute('href', playing ? '#i-pause' : '#i-play');
    hero.classList.toggle('is-paused', !playing);
  }
  function playHero() {
    const p = heroVideo.play();
    if (p && p.catch) p.catch(() => setToggle(false));
  }

  if (heroVideo) {
    heroVideo.addEventListener('play', () => setToggle(true));
    // Off-screen / player pauses are temporary, so only a user pause flips the control to "Play".
    heroVideo.addEventListener('pause', () => { if (heroUserPaused) setToggle(false); });

    if (noAutoplay) { heroUserPaused = true; setToggle(false); }
    else playHero();

    toggle?.addEventListener('click', () => {
      if (heroVideo.paused) { heroUserPaused = false; playHero(); }
      else { heroUserPaused = true; heroVideo.pause(); setToggle(false); }
    });

    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      if (!heroVisible) heroVideo.pause();
      else if (!heroUserPaused && !playerIsOpen()) playHero();
    }, { threshold: 0.05 }).observe(hero);

    // Timecode: HH:MM:SS:FF at 24fps, starting at 17:00, only counts while the video plays.
    const FPS = 24, BASE = 17 * 3600;
    let elapsed = 0, last = 0, raf = 0;
    const renderTC = () => {
      const frames = Math.floor((elapsed / 1000) * FPS);
      const s = BASE + Math.floor(frames / FPS);
      tcEl.textContent = [Math.floor(s / 3600) % 24, Math.floor(s / 60) % 60, s % 60, frames % FPS].map(pad).join(':');
    };
    const tick = (now) => { elapsed += now - last; last = now; renderTC(); raf = requestAnimationFrame(tick); };
    heroVideo.addEventListener('playing', () => {
      if (reduceMotion || !tcEl) return;
      cancelAnimationFrame(raf);
      last = performance.now();
      raf = requestAnimationFrame(tick);
    });
    heroVideo.addEventListener('pause', () => cancelAnimationFrame(raf));
  }

  /* ---------------------------------------------------------------------
     Scroll reveals
     --------------------------------------------------------------------- */
  const reveals = $$('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    reveals.forEach((el) => revealIO.observe(el));
  }

  /* ---------------------------------------------------------------------
     Four lives — active row follows scroll (all devices) and hover (mouse)
     --------------------------------------------------------------------- */
  const lives = $$('.life');
  const stageFrames = $$('[data-stage]');
  const stageLabel = $('[data-stage-label]');
  function setLife(i) {
    lives.forEach((li, n) => li.classList.toggle('is-active', n === i));
    stageFrames.forEach((f, n) => f.classList.toggle('is-active', n === i));
    if (stageLabel) stageLabel.textContent = `${pad(i + 1)} / ${$('.life__name', lives[i]).textContent}`;
  }
  if (lives.length) {
    const lifeIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setLife(Number(e.target.dataset.life)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    lives.forEach((li) => {
      lifeIO.observe(li);
      li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') setLife(Number(li.dataset.life)); });
    });
  }

  /* ---------------------------------------------------------------------
     Stills — filters
     --------------------------------------------------------------------- */
  const chips = $$('[data-filter]');
  const shots = $$('.shot');
  const filterStatus = $('[data-filter-status]');
  const countEl = $('[data-count]');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    shots.forEach((s) => s.classList.remove('is-entering'));
    void document.body.offsetWidth; // restart the entry animation
    let n = 0;
    shots.forEach((s) => {
      const show = f === 'all' || s.dataset.cat === f;
      s.hidden = !show;
      if (show) {
        s.style.setProperty('--i', n++);
        if (!reduceMotion) s.classList.add('is-entering');
      }
    });
    if (countEl) countEl.textContent = `(${n})`;
    if (filterStatus) {
      filterStatus.textContent = f === 'all' ? `Showing all ${n} photographs` : `Showing ${n} ${chip.textContent} photographs`;
    }
  }));

  /* ---------------------------------------------------------------------
     Modal history: opening a dialog adds a history entry, so the phone's
     Back button/gesture closes the dialog instead of leaving the site.
     --------------------------------------------------------------------- */
  const historyModals = new Set();
  function openModal(dlg) {
    dlg.showModal();
    history.pushState({ modal: true }, '');
    dlg._pushed = true;
    if (!historyModals.has(dlg)) {
      historyModals.add(dlg);
      dlg.addEventListener('close', () => {
        if (dlg._pushed) { dlg._pushed = false; if (history.state?.modal) history.back(); }
      });
    }
  }
  addEventListener('popstate', () => {
    historyModals.forEach((dlg) => { if (dlg.open) { dlg._pushed = false; dlg.close(); } });
  });
  $$('.shot__btn, [data-play-video]').forEach((b) => b.setAttribute('aria-haspopup', 'dialog'));

  /* ---------------------------------------------------------------------
     Lightbox
     --------------------------------------------------------------------- */
  const lb = $('[data-lightbox]');
  const lbImg = $('[data-lb-img]');
  const lbTitle = $('[data-lb-title]');
  const lbMeta = $('[data-lb-meta]');
  const lbCount = $('[data-lb-count]');
  const lbLive = $('[data-lb-live]');
  let lbItems = [];
  let lbIndex = 0;
  let lbOpener = null;

  function showShot(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    const btn = lbItems[lbIndex];
    lbImg.classList.remove('is-swapping');
    void lbImg.offsetWidth;
    lbImg.classList.add('is-swapping');
    lbImg.src = btn.dataset.full;
    lbImg.alt = $('img', btn).alt;
    lbTitle.textContent = btn.dataset.title || '';
    lbMeta.textContent = btn.dataset.meta || '';
    lbCount.textContent = `${pad(lbIndex + 1)} / ${pad(lbItems.length)}`;
    if (lbLive) lbLive.textContent = `Photo ${lbIndex + 1} of ${lbItems.length}: ${btn.dataset.title || ''}`;
    [1, -1].forEach((d) => {
      const nb = lbItems[(lbIndex + d + lbItems.length) % lbItems.length];
      if (nb) new Image().src = nb.dataset.full;
    });
  }

  if (lb) {
    $$('.shot__btn').forEach((btn) => btn.addEventListener('click', () => {
      lbItems = $$('.shot:not([hidden]) .shot__btn');
      lbOpener = btn;
      showShot(lbItems.indexOf(btn));
      openModal(lb);
    }));
    $('[data-lb-prev]').addEventListener('click', () => showShot(lbIndex - 1));
    $('[data-lb-next]').addEventListener('click', () => showShot(lbIndex + 1));
    $('[data-lb-close]').addEventListener('click', () => lb.close());
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showShot(lbIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showShot(lbIndex + 1); }
    });
    lb.addEventListener('close', () => lbOpener?.focus());

    // Swipe on touch
    let startX = null;
    lb.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') startX = e.clientX; });
    lb.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) showShot(lbIndex + (dx < 0 ? 1 : -1));
    });
  }

  /* ---------------------------------------------------------------------
     Video player — plays local files, or YouTube / Vimeo links
     (set data-play-video to a YouTube or Vimeo URL and it embeds instead)
     --------------------------------------------------------------------- */
  const player = $('[data-player]');
  const playerFrame = $('[data-player-frame]');
  const playerTitle = $('[data-player-title]');
  const reelPreview = $('[data-reel-preview]');
  let playerOpener = null;
  let reelVisible = false;
  let reelUserPaused = noAutoplay;

  function playerIsOpen() { return !!(player && player.open); }

  function embedUrl(src) {
    try {
      const u = new URL(src, location.href);
      if (/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(u.hostname)) {
        const id = u.hostname.endsWith('youtu.be') ? u.pathname.slice(1) : (u.searchParams.get('v') || u.pathname.split('/').pop());
        return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      }
      if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
        return `https://player.vimeo.com/video/${u.pathname.split('/').filter(Boolean).pop()}?autoplay=1`;
      }
    } catch (_) { /* relative path → local file */ }
    return null;
  }

  if (player) {
    $$('[data-play-video]').forEach((btn) => btn.addEventListener('click', () => {
      const src = btn.dataset.playVideo;
      const title = btn.dataset.videoTitle || 'Video';
      playerOpener = btn;
      playerTitle.textContent = title;
      playerFrame.replaceChildren();

      const embed = embedUrl(src);
      if (embed) {
        const f = document.createElement('iframe');
        f.src = embed;
        f.title = title;
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        playerFrame.append(f);
      } else {
        const v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.playsInline = true;
        v.autoplay = true;
        v.setAttribute('aria-label', title);
        playerFrame.append(v);
      }
      heroVideo?.pause();
      reelPreview?.pause();
      openModal(player);
    }));
    $('[data-player-close]').addEventListener('click', () => player.close());
    player.addEventListener('close', () => {
      playerFrame.replaceChildren();
      playerOpener?.focus();
      if (heroVideo && heroVisible && !heroUserPaused) playHero();
      if (reelPreview && reelVisible && !reelUserPaused) reelPreview.play().catch(() => {});
    });
  }

  if (reelPreview) {
    const reelToggle = $('[data-reel-toggle]');
    const setReelToggle = (playing) => {
      if (!reelToggle) return;
      $('[data-reel-label]', reelToggle).textContent = playing ? 'Pause preview' : 'Play preview';
      $('[data-reel-icon] use', reelToggle).setAttribute('href', playing ? '#i-pause' : '#i-play');
    };
    reelPreview.addEventListener('play', () => setReelToggle(true));
    reelPreview.addEventListener('pause', () => { if (reelUserPaused) setReelToggle(false); });
    setReelToggle(!reelUserPaused);
    reelToggle?.addEventListener('click', () => {
      if (reelPreview.paused) { reelUserPaused = false; reelPreview.play().catch(() => {}); }
      else { reelUserPaused = true; reelPreview.pause(); setReelToggle(false); }
    });
    new IntersectionObserver(([e]) => {
      reelVisible = e.isIntersecting;
      if (reelVisible && !reelUserPaused && !playerIsOpen()) reelPreview.play().catch(() => {});
      else reelPreview.pause();
    }, { threshold: 0.25 }).observe(reelPreview);
  }

  /* ---------------------------------------------------------------------
     Copy email
     --------------------------------------------------------------------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const status = $('[data-copy-status]');
    const icon = $('[data-copy-icon] use', btn);
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      status.textContent = 'Copied';
      icon.setAttribute('href', '#i-check');
    } catch (_) {
      const link = $('.mail-link');
      const range = document.createRange();
      range.selectNodeContents(link);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      status.textContent = 'Selected, press Ctrl/⌘ C';
    }
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { status.textContent = ''; icon.setAttribute('href', '#i-copy'); }, 2400);
  }));
})();

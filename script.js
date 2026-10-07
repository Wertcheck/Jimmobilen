// ---------- Theme toggle (dark/light, persisted) ----------
const themeToggle = document.getElementById('themeToggle');
const rootEl = document.documentElement;

const setTheme = (theme) => {
  if (theme === 'light') {
    rootEl.setAttribute('data-theme', 'light');
  } else {
    rootEl.removeAttribute('data-theme');
  }
  themeToggle?.setAttribute('aria-pressed', String(theme === 'light'));
  try { localStorage.setItem('jim-theme', theme); } catch (e) { /* blocked on some file:// contexts — safe to ignore */ }
};

themeToggle?.addEventListener('click', () => {
  const isLight = rootEl.getAttribute('data-theme') === 'light';
  setTheme(isLight ? 'dark' : 'light');
});

// Reflect the theme applied by the inline head script (avoids mismatch)
if (rootEl.getAttribute('data-theme') === 'light') {
  themeToggle?.setAttribute('aria-pressed', 'true');
}

// ---------- Service detail modal ----------
(function initServiceModal() {
  const modal = document.getElementById('serviceModal');
  const body = document.getElementById('serviceModalBody');
  const dataEl = document.getElementById('serviceDetailsData');
  if (!modal || !body || !dataEl) return;

  let details = {};
  try { details = JSON.parse(dataEl.textContent); } catch (e) { console.error('Service details JSON invalid', e); }

  let lastFocused = null;

  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const render = (key) => {
    const d = details[key];
    if (!d) return;
    const steps = (d.steps || []).map((s, i) => `
      <div class="modal-step">
        <span class="modal-step-num">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <h4>${escapeHtml(s.title)}</h4>
          <p>${escapeHtml(s.text)}</p>
        </div>
      </div>`).join('');

    const maklerHint = d.maklerHint ? `
      <div class="modal-makler-hint">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V9l8-5 8 5v12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 21v-7h6v7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
        <div>
          <p class="modal-makler-hint-title">Warum das ein Makler übernimmt</p>
          <p>${escapeHtml(d.maklerHint)}</p>
        </div>
      </div>` : '';

    const disclaimer = d.disclaimer ? `<p class="modal-disclaimer">${escapeHtml(d.disclaimer)}</p>` : '';

    body.innerHTML = `
      <p class="modal-eyebrow">${escapeHtml(d.eyebrow || '')}</p>
      <h3 class="modal-title">${escapeHtml(d.title || '')}</h3>
      <p class="modal-intro">${escapeHtml(d.intro || '')}</p>
      <div class="modal-steps">${steps}</div>
      ${maklerHint}
      ${disclaimer}
      ${d.cta ? `<a href="${d.cta.href}" class="btn btn-gold">${escapeHtml(d.cta.text)}</a>` : ''}
    `;
  };

  const openModal = (key) => {
    render(key);
    lastFocused = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.service-modal-close')?.focus();
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  };

  document.querySelectorAll('.service-more').forEach((btn) => {
    btn.addEventListener('click', () => openModal(btn.dataset.service));
  });

  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  // Allow the CTA links inside the modal (e.g. "#kontakt") to close it on click
  body.addEventListener('click', (e) => {
    if (e.target.closest('a[href^="#"]')) closeModal();
  });
})();

// ---------- Nav dropdown menu toggle ----------
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');

const closeNav = () => {
  mainNav?.classList.remove('open');
  navToggle?.setAttribute('aria-expanded', 'false');
};
const openNav = () => {
  mainNav?.classList.add('open');
  navToggle?.setAttribute('aria-expanded', 'true');
};

navToggle?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = mainNav.classList.contains('open');
  isOpen ? closeNav() : openNav();
});

mainNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeNav);
});

// Close when clicking outside, or pressing Escape
document.addEventListener('click', (e) => {
  if (mainNav?.classList.contains('open') && !mainNav.contains(e.target) && e.target !== navToggle) {
    closeNav();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeNav();
});

// ---------- Header elevation on scroll ----------
const header = document.getElementById('siteHeader');
const onScroll = () => { header?.classList.toggle('is-scrolled', window.scrollY > 8); };
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Active nav link (scrollspy, subtle) ----------
const navLinks = Array.from(mainNav?.querySelectorAll('a[href^="#"]') || []);
const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

if (sections.length) {
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = navLinks.find(a => a.getAttribute('href') === `#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(s => spy.observe(s));
}

// ---------- Scroll progress bar ----------
const scrollProgress = document.getElementById('scrollProgress');
const updateScrollProgress = () => {
  if (!scrollProgress) return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? window.scrollY / docHeight : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
};
updateScrollProgress();
window.addEventListener('scroll', updateScrollProgress, { passive: true });

// ---------- Cursor spotlight on cards ----------
document.querySelectorAll('.service-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  });
});

// ---------- Scroll reveal — one restrained pattern, staggered ----------
const revealTargets = document.querySelectorAll(
  '.about-photo, .about-copy, .service-card, .roadmap-step, .card, .location-copy, .location-stats, .faq-item, .contact-copy, .contact-panel'
);
revealTargets.forEach((el, i) => {
  el.setAttribute('data-reveal', '');
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
});

// Elements that are clipped away until revealed (clip-path wipe) are invisible to IntersectionObserver,
// so their reveal is triggered by a neighbour that is always laid out: the surrounding grid.
const triggerFor = (el) => (el.classList.contains('reveal-wipe') ? (el.closest('.about-grid') || el.parentElement) : el);
const revealMap = new Map();                       // trigger element -> elements to reveal
revealTargets.forEach((el) => {
  const t = triggerFor(el);
  if (!revealMap.has(t)) revealMap.set(t, []);
  revealMap.get(t).push(el);
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    io.unobserve(entry.target);
    (revealMap.get(entry.target) || []).forEach((el) => {
      el.classList.add('is-visible');
      // the stagger delay is only for the entrance — clear it so hover transitions stay snappy
      setTimeout(() => { el.style.transitionDelay = ''; }, 1000);
    });
  });
}, { threshold: 0.08, rootMargin: '0px 0px 6% 0px' });

revealMap.forEach((_, t) => io.observe(t));
window.__jimMotion = true;   // tells the inline fail-safe in index.html that the motion script is running

// ---------- Roadmap: scroll-linked progress line ----------
(function initRoadmapProgressLine() {
  const rail = document.getElementById('roadmapRail');
  const line = document.getElementById('roadmapProgressLine');
  if (!rail || !line) return;

  let ticking = false;
  const update = () => {
    const rect = rail.getBoundingClientRect();
    const viewportH = window.innerHeight;
    // Progress from 0 (rail top at viewport bottom) to 1 (rail bottom at viewport top)
    const total = rect.height + viewportH;
    const traveled = viewportH - rect.top;
    const progress = Math.min(1, Math.max(0, traveled / total));
    line.style.height = `${progress * rect.height}px`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

// ---------- Hero entrance (on load, sequential) ----------
const heroEntrance = document.querySelectorAll('.hero [data-hero-in]');
requestAnimationFrame(() => {
  heroEntrance.forEach((el, i) => {
    setTimeout(() => el.classList.add('is-visible'), 80 + i * 110);
  });
});

// ---------- Subtle parallax on hero photo ----------
const heroPhoto = document.querySelector('.hero-photo');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroPhoto && !prefersReducedMotion) {
  let ticking = false;
  const applyParallax = () => {
    const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
    const y = window.scrollY;
    if (y < heroHeight) {
      heroPhoto.style.transform = `translateY(${y * 0.12}px)`;
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }, { passive: true });
}

// ---------- Hero rotating word ----------
(function rotateHeroWord() {
  const el = document.getElementById('rotateWord');
  if (!el) return;
  const words = ['Struktur', 'Klarheit', 'Vertrauen', 'Sicherheit'];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  setInterval(() => {
    el.classList.add('is-swapping');
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.classList.remove('is-swapping');
    }, 300);
  }, 2600);
})();

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Evernest redirect notice ----------
// Every a.evernest-link opens the modal; the target is the clicked link's own href.
// The progress bar is real UI state, not a fixed-length fake: it eases to ~60 % quickly,
// slows towards ~85 %, then the redirect happens and the bar completes. "Jetzt weiter"
// finishes the bar immediately, and it never sits at 100 % — it opens the target at once.
(function initRedirectModal() {
  const modal = document.getElementById('redirectModal');
  const panel = modal?.querySelector('.rm-panel');
  const bar = document.getElementById('redirectModalBar');
  const progress = document.getElementById('redirectModalProgress');
  const status = document.getElementById('redirectModalStatus');
  const continueLink = document.getElementById('redirectModalContinue');
  const cancelBtn = modal?.querySelector('.rm-cancel');
  if (!modal || !panel || !bar || !continueLink || !cancelBtn) return;

  const dot = document.getElementById('rmDot');
  const arc = document.getElementById('rmArcPath');
  const arcLen = arc ? arc.getTotalLength() : 0;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const FAST_MS = 1400;       // 0 → 60 %
  const SLOW_MS = 3000;       // 60 → 85 %  (redirect happens at FAST_MS + SLOW_MS ≈ 4.4 s, +0.3 s to complete)
  const FINISH_MS = 280;      // → 100 % right before opening
  const DOT_START = 900, DOT_MS = 1150;
  const STATUS_DEFAULT = 'Weiterleitung läuft …';
  const STATUS_BLOCKED = 'Ihr Browser hat das neue Fenster blockiert – bitte auf „Jetzt weiter“ tippen.';

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const clamp01 = (t) => Math.min(1, Math.max(0, t));

  const inertTargets = Array.from(document.querySelectorAll('.site-header, main, .site-footer'));
  let rafId = 0, startTs = 0, mode = 'idle', current = 0, finishFrom = 0, finishTs = 0, finishMs = FINISH_MS, shown = 0;
  let targetUrl = '', lastTrigger = null, blocked = false;

  const setBar = (v) => {
    current = v;
    bar.style.transform = `scaleX(${(v / 100).toFixed(4)})`;
    const rounded = Math.round(v / 5) * 5;                 // coarse updates keep screen readers calm
    if (rounded !== shown) { shown = rounded; progress.setAttribute('aria-valuenow', String(rounded)); }
  };

  const moveDot = (ts) => {
    if (!dot || !arcLen || reduceMotion.matches) return;
    const t = clamp01((ts - startTs - DOT_START) / DOT_MS);
    if (t <= 0 || t >= 1) { dot.setAttribute('opacity', '0'); return; }
    const p = arc.getPointAtLength(arcLen * easeInOut(t));
    dot.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
    dot.setAttribute('opacity', String(Math.min(1, t / 0.15, (1 - t) / 0.2).toFixed(2)));
  };

  const stop = () => { cancelAnimationFrame(rafId); rafId = 0; mode = 'idle'; };

  const closeModal = () => {
    stop();
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    inertTargets.forEach((el) => el.removeAttribute('inert'));
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
    lastTrigger = null;
  };

  const go = () => {
    stop();
    setBar(100);
    status.textContent = STATUS_DEFAULT;
    const win = window.open(targetUrl, '_blank');
    if (win) { win.opener = null; closeModal(); return; }
    // Popup blocked (no user gesture left): keep the modal and let the visitor tap "Jetzt weiter"
    blocked = true;
    status.textContent = STATUS_BLOCKED;
  };

  const beginFinish = (ts, ms) => { mode = 'finish'; finishFrom = current; finishTs = ts; finishMs = ms; };

  const tick = (ts) => {
    if (!startTs) startTs = ts;
    const el = ts - startTs;
    moveDot(ts);

    if (mode === 'auto') {
      if (el < FAST_MS) setBar(60 * easeOut(el / FAST_MS));
      else if (el < FAST_MS + SLOW_MS) setBar(60 + 25 * easeOut((el - FAST_MS) / SLOW_MS));
      else beginFinish(ts, FINISH_MS);
    }
    if (mode === 'finish') {
      const t = finishMs ? clamp01((ts - finishTs) / finishMs) : 1;
      setBar(finishFrom + (100 - finishFrom) * easeInOut(t));
      if (t >= 1) { go(); return; }
    }
    rafId = requestAnimationFrame(tick);
  };

  // House photo: loaded on demand (and once when the browser is idle) — only the variant of the active theme
  const loadHouse = () => {
    modal.querySelectorAll('.rm-house img[data-src]').forEach((img) => {
      if (getComputedStyle(img).display === 'none') return;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  };
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 2500));
  window.addEventListener('load', () => idle(loadHouse));

  const openModal = (url, trigger) => {
    loadHouse();
    targetUrl = url; lastTrigger = trigger || null; blocked = false;
    continueLink.href = url;
    status.textContent = STATUS_DEFAULT;
    shown = -1; setBar(0);
    if (dot) dot.setAttribute('opacity', '0');

    const gutter = window.innerWidth - document.documentElement.clientWidth;   // avoid a layout jump when the scrollbar disappears
    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;
    inertTargets.forEach((el) => el.setAttribute('inert', ''));

    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    panel.focus({ preventScroll: true });

    stop(); startTs = 0; mode = 'auto';
    rafId = requestAnimationFrame(tick);
  };

  // Open on every Evernest link (keeps Cmd/Ctrl/Shift/middle-click native: those open a new tab directly)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a.evernest-link');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openModal(link.href, link);
  });

  modal.querySelectorAll('[data-redirect-cancel]').forEach((el) => el.addEventListener('click', closeModal));

  continueLink.addEventListener('click', (e) => {
    if (blocked) { closeModal(); return; }              // user gesture: let the browser open the link natively
    e.preventDefault();
    if (mode === 'finish') return;
    const now = performance.now();
    beginFinish(now, reduceMotion.matches ? 0 : 320);   // speed the bar up, then open
    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  modal.addEventListener('keydown', (e) => {            // focus trap: only two controls live inside
    if (e.key !== 'Tab') return;
    const order = [continueLink, cancelBtn];
    const i = order.indexOf(document.activeElement);
    e.preventDefault();
    order[i === -1 ? 0 : (i + (e.shiftKey ? order.length - 1 : 1)) % order.length].focus();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
})();

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');

    // Close any other open item (single-open accordion)
    document.querySelectorAll('.faq-item.is-open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('is-open');
        openItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        const openAnswer = openItem.querySelector('.faq-answer');
        if (openAnswer) openAnswer.style.maxHeight = null;
      }
    });

    if (isOpen) {
      item.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
});

// ---------- Contact form (demo — no backend wired up yet) ----------
const form = document.getElementById('contactForm');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = 'Danke — Nachricht erhalten!';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
    form.reset();
  }, 2600);
});

// ---------- Mobile hero: fit the intro text to the free space ----------
// The hero fills the visible screen (see style.css). Grow the intro text to the
// largest size that still fits, so no empty gap is left beneath it.
(function fitHeroLede() {
  const hero = document.querySelector('.hero');
  const lede = document.querySelector('.hero-lede');
  if (!hero || !lede) return;
  const mq = window.matchMedia('(max-width: 980px)');

  const fit = () => {
    lede.style.fontSize = '';
    if (!mq.matches) return;
    const minH = parseFloat(getComputedStyle(hero).minHeight) || 0;
    let lo = 12, hi = 18;
    for (let i = 0; i < 8; i++) {
      const mid = (lo + hi) / 2;
      lede.style.fontSize = mid + 'px';
      if (hero.offsetHeight <= minH + 0.5) lo = mid; else hi = mid;
    }
    lede.style.fontSize = lo + 'px';
  };

  let timer = null;
  const refit = () => { clearTimeout(timer); timer = setTimeout(fit, 120); };
  fit();
  window.addEventListener('load', fit);
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

// ---------- Contact: tabs ----------
(function initContactTabs() {
  const tabs = Array.from(document.querySelectorAll('.contact-tab'));
  if (!tabs.length) return;

  const activate = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      activate(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
})();

// ---------- Contact: booking calendar ----------
// Own calendar: the visitor picks a day and a time, then a prepared e-mail request opens.
// To use a real booking tool instead (Cal.com, Calendly, …) set data-booking-url on #booking.
(function initBooking() {
  const root = document.getElementById('booking');
  if (!root) return;

  const embedUrl = (root.dataset.bookingUrl || '').trim();
  if (/^https:\/\//i.test(embedUrl)) {
    const frame = document.createElement('iframe');
    frame.className = 'booking-embed';
    frame.src = embedUrl;
    frame.title = 'Terminbuchung';
    frame.loading = 'lazy';
    root.replaceChildren(frame);
    return;
  }

  // ---- Availability — adjust here ----
  const CFG = {
    weekdays: [1, 2, 3, 4, 5],                                                   // 0 = Sunday … 6 = Saturday
    slots: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
    leadDays: 1,                                                                  // earliest bookable day = today + n
    monthsAhead: 3,                                                               // how far ahead visitors can book

    // Occupancy. Real appointments / blocked times go in `blocked` ('YYYY-MM-DD': ['09:00', …] or 'all').
    // While there are no real bookings yet, `simulateBusy` fills a fixed, repeatable pattern so the
    // calendar does not look empty. Set it to false as soon as real availability is maintained.
    simulateBusy: true,
    busyShare: 0.42,                                                              // share of slots shown as taken
    fullDayShare: 0.14,                                                           // share of days shown as fully booked
    minFreeSlots: 2,                                                              // a day that is not fully booked keeps at least this many
    blocked: {},
  };
  const email = root.dataset.email || '';
  const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const longDate = (d) => d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minDate = new Date(today); minDate.setDate(minDate.getDate() + CFG.leadDays);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() + CFG.monthsAhead, 1);
  const maxDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
  // Stable 0..1 hash per string, so the simulated pattern is identical for every visitor and reload
  const hash01 = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  const takenSlots = (d) => {
    const key = keyOf(d);
    const real = CFG.blocked[key];
    if (real === 'all') return new Set(CFG.slots);
    const taken = new Set(Array.isArray(real) ? real : []);
    if (CFG.simulateBusy) {
      if (hash01('day|' + key) < CFG.fullDayShare) return new Set(CFG.slots);
      const daysAhead = Math.round((d - today) / 86400000);
      const share = Math.min(0.85, CFG.busyShare + (daysAhead <= 14 ? 0.25 : 0));   // the coming two weeks look busier
      CFG.slots.forEach((s) => { if (hash01(key + '|' + s) < share) taken.add(s); });
      const free = CFG.slots.filter((s) => !taken.has(s)).sort((a, b) => hash01(key + '|' + b) - hash01(key + '|' + a));
      for (let i = 0; free.length + i < CFG.minFreeSlots && i < taken.size; i++) {
        const back = [...taken].sort((a, b) => hash01(key + '|' + b) - hash01(key + '|' + a))[0];
        taken.delete(back);
      }
    }
    return taken;
  };
  const freeSlots = (d) => { const t = takenSlots(d); return CFG.slots.filter((s) => !t.has(s)); };

  const isAvailable = (d) => d >= minDate && d <= maxDate && CFG.weekdays.includes(d.getDay()) && freeSlots(d).length > 0;

  let firstOpen = new Date(minDate);
  while (!isAvailable(firstOpen) && firstOpen <= maxDate) firstOpen.setDate(firstOpen.getDate() + 1);

  const state = { view: new Date(firstOpen.getFullYear(), firstOpen.getMonth(), 1), date: null, slot: null, step: 'pick', mailto: '' };

  const renderPick = () => {
    const y = state.view.getFullYear();
    const m = state.view.getMonth();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;            // week starts on Monday
    const count = new Date(y, m + 1, 0).getDate();
    const canPrev = new Date(y, m - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);
    const canNext = new Date(y, m + 1, 1) <= lastMonth;

    let days = '<span></span>'.repeat(offset);
    for (let n = 1; n <= count; n++) {
      const d = new Date(y, m, n);
      const selected = state.date && keyOf(d) === keyOf(state.date);
      days += `<button type="button" class="booking-day${selected ? ' is-selected' : ''}${keyOf(d) === keyOf(today) ? ' is-today' : ''}"`
        + ` data-day="${keyOf(d)}" aria-label="${longDate(d)}" aria-pressed="${selected ? 'true' : 'false'}"${isAvailable(d) ? '' : ' disabled'}>${n}</button>`;
    }

    const taken = state.date ? takenSlots(state.date) : new Set();
    const slots = state.date
      ? `<p class="booking-slots-title">${longDate(state.date)}</p><div class="booking-slot-list">`
        + CFG.slots.map((s) => taken.has(s)
          ? `<button type="button" class="booking-slot is-taken" disabled aria-label="${s} Uhr, belegt">${s} Uhr</button>`
          : `<button type="button" class="booking-slot" data-slot="${s}">${s} Uhr</button>`).join('') + '</div>'
      : '<p class="booking-hint">Wählen Sie links einen Tag – danach erscheinen die freien Uhrzeiten.</p>';

    return `
      <p class="booking-intro">Wählen Sie Ihren Wunschtermin</p>
      <p class="booking-sub">Kostenlos &amp; unverbindlich – ich bestätige Ihnen den Termin persönlich.</p>
      <div class="booking-pick">
        <div class="booking-cal">
          <div class="booking-month">
            <button type="button" class="booking-nav" data-nav="-1" aria-label="Vorheriger Monat"${canPrev ? '' : ' disabled'}>&#8249;</button>
            <h3 class="booking-title" aria-live="polite">${MONTHS[m]} ${y}</h3>
            <button type="button" class="booking-nav" data-nav="1" aria-label="Nächster Monat"${canNext ? '' : ' disabled'}>&#8250;</button>
          </div>
          <div class="booking-weekdays" aria-hidden="true">${WEEKDAYS.map((w) => `<span>${w}</span>`).join('')}</div>
          <div class="booking-days">${days}</div>
        </div>
        <div class="booking-slots" id="bookingSlots">${slots}</div>
      </div>`;
  };

  const renderDetails = () => `
    <div class="booking-summary">
      <div><span class="booking-summary-label">Wunschtermin</span><strong>${longDate(state.date)} · ${state.slot} Uhr</strong></div>
      <button type="button" class="booking-change" data-back>Ändern</button>
    </div>
    <form class="booking-form" id="bookingForm">
      <div class="form-row">
        <div class="form-field"><label for="b-name">Name</label><input type="text" id="b-name" name="name" required autocomplete="name"></div>
        <div class="form-field"><label for="b-phone">Telefon <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label><input type="tel" id="b-phone" name="phone" autocomplete="tel"></div>
      </div>
      <div class="form-field"><label for="b-email">E-Mail</label><input type="email" id="b-email" name="email" required autocomplete="email"></div>
      <div class="form-field">
        <label for="b-interest">Interessiert an</label>
        <select id="b-interest" name="interest"><option>Verkaufen</option><option>Kaufen</option><option>Bewertung</option><option>Sonstiges</option></select>
      </div>
      <div class="form-field"><label for="b-note">Nachricht <span style="font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label><textarea id="b-note" name="note" rows="3"></textarea></div>
      <button type="submit" class="btn btn-gold btn-lg btn-block">Termin anfragen</button>
      <p class="form-note">Mit dem Absenden stimmen Sie der Kontaktaufnahme durch Jim-Rico Krüger zu.</p>
    </form>`;

  const renderDone = () => `
    <div class="booking-done">
      <div class="booking-done-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <h3>Ihre Terminanfrage ist vorbereitet</h3>
      <p>Ihr E-Mail-Programm hat sich mit allen Angaben geöffnet. Senden Sie die E-Mail ab – ich bestätige Ihren Wunschtermin <strong>${longDate(state.date)}, ${state.slot} Uhr</strong> persönlich.</p>
      <a class="btn btn-gold" id="bookingMailAgain" href="#">E-Mail erneut öffnen</a>
      <button type="button" class="booking-change" data-reset>Anderen Termin wählen</button>
    </div>`;

  const render = (focus) => {
    root.innerHTML = state.step === 'pick' ? renderPick() : state.step === 'details' ? renderDetails() : renderDone();
    const again = root.querySelector('#bookingMailAgain');
    if (again) again.href = state.mailto;
    if (focus) { root.tabIndex = -1; root.focus({ preventScroll: true }); }
  };

  root.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    const day = e.target.closest('[data-day]');
    const slot = e.target.closest('[data-slot]');
    if (nav && !nav.disabled) {
      state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(nav.dataset.nav), 1);
      render();
    } else if (day && !day.disabled) {
      state.date = fromKey(day.dataset.day);
      state.slot = null;
      render();
      if (window.matchMedia('(max-width: 999px)').matches) {
        root.querySelector('#bookingSlots')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (slot) {
      state.slot = slot.dataset.slot;
      state.step = 'details';
      render(true);
    } else if (e.target.closest('[data-back]')) {
      state.step = 'pick';
      render(true);
    } else if (e.target.closest('[data-reset]')) {
      state.date = null; state.slot = null; state.step = 'pick';
      render(true);
    }
  });

  root.addEventListener('submit', (e) => {
    const form = e.target.closest('#bookingForm');
    if (!form) return;
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const f = new FormData(form);
    const when = `${longDate(state.date)}, ${state.slot} Uhr`;
    const body = [
      `Terminanfrage über die Website`, ``,
      `Wunschtermin: ${when}`, `Name: ${f.get('name')}`, `E-Mail: ${f.get('email')}`,
      `Telefon: ${f.get('phone') || '–'}`, `Interessiert an: ${f.get('interest')}`, ``,
      `Nachricht:`, `${f.get('note') || '–'}`,
    ].join('\n');
    state.mailto = `mailto:${email}?subject=${encodeURIComponent('Terminanfrage: ' + when)}&body=${encodeURIComponent(body)}`;
    state.step = 'done';
    render(true);
    window.location.href = state.mailto;
  });

  render();
})();

// ---------- Social links (footer + contact) ----------
// Addresses are entered once, in the footer (data-url in index.html); the contact block reuses them.
// A link / row is shown only when an https:// address exists.
(function initSocial() {
  const urls = {};
  document.querySelectorAll('.social-link[data-url]').forEach((a) => {
    const url = (a.dataset.url || '').trim();
    if (/^https:\/\//i.test(url)) urls[a.dataset.social] = url;
  });
  document.querySelectorAll('.social-link').forEach((a) => {
    const url = urls[a.dataset.social];
    if (!url) return;
    a.href = url;
    a.setAttribute('aria-label', `${a.dataset.social} (öffnet in neuem Tab)`);
    a.hidden = false;
  });
  document.querySelectorAll('.footer-social, .contact-social-item').forEach((el) => {
    el.hidden = !el.querySelector('.social-link:not([hidden])');
  });
})();

// ==========================================================
// Scroll motion (phones / small tablets) — "motion that whispers"
//   · section heads: eyebrow tightens, headline rises out of a mask, lede follows
//   · photos drift slightly inside their frames while you scroll (parallax)
//   · the card nearest the middle of the screen gets a gold focus ring (replaces :hover on touch)
//   · roadmap steps light up as you reach them
//   · header tucks away while reading downwards, returns on the first scroll up
// Everything is gated by CSS (max-width + prefers-reduced-motion) and by the checks below.
// ==========================================================
(function initScrollMotion() {
  const mobile = window.matchMedia('(max-width: 900px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = () => mobile.matches && !reduce.matches;

  // ---- section heads: reveal once when they enter ----
  const heads = document.querySelectorAll('[data-mx]');
  const headIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('mx-in'); headIO.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px 4% 0px' });
  heads.forEach((el) => headIO.observe(el));

  // ---- scroll-linked effects share one rAF-throttled loop ----
  const par = Array.from(document.querySelectorAll('[data-parallax]'));
  const focusables = Array.from(document.querySelectorAll('.card, .service-card'));
  const steps = Array.from(document.querySelectorAll('.roadmap-step'));
  const header = document.getElementById('siteHeader');
  const navEl = document.getElementById('mainNav');

  const visible = new Set();
  const visIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    schedule();
  }, { rootMargin: '15% 0px 15% 0px' });
  par.forEach((el) => visIO.observe(el));

  let ticking = false, lastY = window.scrollY, focused = null;
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    if (!active()) {                                            // desktop / reduced motion: leave everything static
      par.forEach((el) => el.style.removeProperty('--py'));
      focused?.classList.remove('is-focus'); focused = null;
      steps.forEach((s) => s.classList.add('is-reached'));
      header?.classList.remove('is-tucked');
      lastY = y;
      return;
    }

    // parallax: --py goes from -1 (element entering at the bottom) to 1 (leaving at the top)
    visible.forEach((el) => {
      const r = el.getBoundingClientRect();
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      el.style.setProperty('--py', Math.max(-1, Math.min(1, p)).toFixed(3));
    });

    // focus ring: the card closest to the middle of the screen (inside a central band)
    let best = null, bestD = vh * 0.3;
    focusables.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
      if (d < bestD) { best = el; bestD = d; }
    });
    if (best !== focused) { focused?.classList.remove('is-focus'); best?.classList.add('is-focus'); focused = best; }

    // roadmap: a step counts as reached once its node passes ~62 % of the screen height
    steps.forEach((s) => {
      const n = s.querySelector('.roadmap-node');
      if (n && n.getBoundingClientRect().top < vh * 0.62) s.classList.add('is-reached');
      else s.classList.remove('is-reached');
    });

    // header: tuck away while reading down, back on the first move up (never while the menu is open)
    if (header) {
      const dy = y - lastY;
      const menuOpen = navEl?.classList.contains('open');
      if (menuOpen || y < 140 || dy < -4) header.classList.remove('is-tucked');
      else if (dy > 6 && y > 260) header.classList.add('is-tucked');
    }
    lastY = y;
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  mobile.addEventListener?.('change', schedule);
  reduce.addEventListener?.('change', schedule);
  header?.addEventListener('focusin', () => header.classList.remove('is-tucked'));   // keyboard users never lose the header
  schedule();
})();

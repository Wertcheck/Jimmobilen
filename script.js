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
  '.about-photo, .about-copy, .service-card, .roadmap-step, .category-card, .location-copy, .location-stats, .valuation-option, .faq-item, .contact-copy, .contact-form'
);
revealTargets.forEach((el, i) => {
  el.setAttribute('data-reveal', '');
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(el => io.observe(el));

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
(function initRedirectModal() {
  const modal = document.getElementById('redirectModal');
  const bar = document.getElementById('redirectModalBar');
  const continueLink = document.getElementById('redirectModalContinue');
  if (!modal || !bar || !continueLink) return;

  let redirectTimer = null;
  let targetUrl = null;

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearTimeout(redirectTimer);
    bar.style.transition = 'none';
    bar.style.width = '0%';
  };

  const openModal = (url) => {
    targetUrl = url;
    continueLink.href = url;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    bar.style.transition = 'none';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.transition = 'width 2.2s linear';
        bar.style.width = '100%';
      });
    });

    redirectTimer = setTimeout(() => {
      window.open(url, '_blank', 'noopener');
      closeModal();
    }, 2200);
  };

  document.querySelectorAll('a.evernest-link').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(link.href);
    });
  });

  modal.querySelectorAll('[data-redirect-cancel]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  continueLink.addEventListener('click', () => {
    clearTimeout(redirectTimer);
    closeModal();
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

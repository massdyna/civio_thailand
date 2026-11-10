/* CiViO effects layer — additions only. Safe to remove: the site works without it. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 1. Loader: hide once the page is ready ---------- */
  const startedAt = performance.now();
  const finishLoad = () => {
    const wait = Math.max(0, 650 - (performance.now() - startedAt));
    setTimeout(() => { root.classList.remove('fx-loader'); root.classList.add('fx-ready'); }, reduce ? 0 : wait);
  };
  if (document.readyState === 'complete') finishLoad(); else window.addEventListener('load', finishLoad, { once: true });
  setTimeout(() => { root.classList.remove('fx-loader'); root.classList.add('fx-ready'); }, 3500); // failsafe

  /* ---------- 2. Page transitions between pages ---------- */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || /^(mailto:|tel:|javascript:)/i.test(href)) return;
    let url; try { url = new URL(a.href, location.href); } catch (_) { return; }
    if (url.origin !== location.origin && location.protocol !== 'file:') return;
    if (location.protocol === 'file:' && url.protocol !== 'file:') return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    if (reduce) return;
    e.preventDefault();
    root.classList.add('fx-leaving');
    setTimeout(() => { location.href = a.href; }, 330);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted) { root.classList.remove('fx-leaving', 'fx-loader'); root.classList.add('fx-ready'); } });

  /* ---------- 3. Scroll progress, back-to-top, parallax ---------- */
  const bar = document.createElement('div'); bar.className = 'fx-progress'; document.body.appendChild(bar);
  const topBtn = document.createElement('button'); topBtn.className = 'fx-top'; topBtn.type = 'button'; topBtn.setAttribute('aria-label', 'กลับขึ้นด้านบน'); topBtn.innerHTML = '<span>↑</span>';
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })); document.body.appendChild(topBtn);
  const heroBg = $('.nx-hero-bg');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
      topBtn.classList.toggle('is-on', y > 700);
      if (heroBg && !reduce && y < 1200) heroBg.style.transform = `translate3d(0,${(y * 0.22).toFixed(1)}px,0)`;
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- 4. Staggered reveal for news / article / detail pages ---------- */
  const targets = $$('.nx-body h2, .nx-body p, .nx-highlights li, .nx-highlights b, .nx-shot, .nx-gallery-head, .nx-card, .nx-source, .nx-back, .farm-origin-copy > *, .detail-step, .flow-node');
  targets.forEach((el, i) => { el.classList.add('fx-reveal'); el.style.setProperty('--fx-d', ((i % 4) * 0.08).toFixed(2) + 's'); });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  } else targets.forEach((el) => el.classList.add('is-in'));

  /* ---------- 5. Tilt, magnetic buttons, cursor glow (mouse only) ---------- */
  if (finePointer && !reduce) {
    $$('.proof-card, .article-card, .nx-card, .nx-shot, .detail-stat-card, .flow-node, .knowledge-card, .detail-step, .use-case, .story-aside-card, .vegetable-choice-card, .course-value-card, .faq-item, .thanks-band .thanks-inner').forEach((el) => {
      el.classList.add('fx-tilt');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('is-tilting');
        el.style.setProperty('--tx', (-px * 14).toFixed(1) + 'px'); el.style.setProperty('--ty', (-py * 10).toFixed(1) + 'px');
        el.style.transform = `perspective(900px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px) scale(1.02)`;
      });
      el.addEventListener('pointerleave', () => { el.classList.remove('is-tilting'); el.style.transform = ''; });
    });
    $$('.btn').forEach((el) => {
      el.classList.add('fx-mag');
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.2).toFixed(1)}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    const glow = document.createElement('div'); glow.className = 'fx-glow'; document.body.appendChild(glow);
    window.addEventListener('pointermove', (e) => { glow.classList.add('is-on'); glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('is-on'));
  }

  /* ---------- 6. Home news cards: use local photo first, upgrade to the original when it loads ---------- */
  $$('img[data-remote]').forEach((img) => {
    const probe = new Image();
    probe.onload = () => { img.src = img.dataset.remote; };
    probe.src = img.dataset.remote;
  });

  /* ---------- 7. Lightbox for news / article photos ---------- */
  const shots = $$('.nx-figure img, .nx-gallery img');
  if (shots.length) {
    const lb = document.createElement('div'); lb.className = 'fx-lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<button class="fx-lb-close" type="button" aria-label="ปิด">✕</button><button class="fx-lb-prev" type="button" aria-label="ก่อนหน้า">←</button><figure><img alt=""><figcaption></figcaption></figure><button class="fx-lb-next" type="button" aria-label="ถัดไป">→</button>';
    document.body.appendChild(lb);
    const lbImg = $('img', lb), lbCap = $('figcaption', lb); let idx = 0;
    const show = (i) => { idx = (i + shots.length) % shots.length; const s = shots[idx]; lbImg.src = s.currentSrc || s.src; lbImg.alt = s.alt || ''; const cap = s.closest('figure')?.querySelector('figcaption'); lbCap.textContent = cap ? cap.textContent : (s.alt || ''); };
    const open = (i) => { show(i); lb.classList.add('is-on'); };
    const close = () => lb.classList.remove('is-on');
    shots.forEach((s, i) => { (s.closest('figure') || s).addEventListener('click', () => open(i)); });
    $('.fx-lb-close', lb).addEventListener('click', close);
    $('.fx-lb-prev', lb).addEventListener('click', (e) => { e.stopPropagation(); show(idx - 1); });
    $('.fx-lb-next', lb).addEventListener('click', (e) => { e.stopPropagation(); show(idx + 1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => { if (!lb.classList.contains('is-on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  }

  /* ---------- 8. Copy-link button on news / article pages ---------- */
  const meta = $('.nx-meta');
  if (meta) {
    const toast = document.createElement('div'); toast.className = 'fx-toast'; toast.textContent = 'คัดลอกลิงก์แล้ว'; document.body.appendChild(toast);
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'nx-share'; btn.innerHTML = '🔗 คัดลอกลิงก์';
    btn.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href.split('#')[0]); } catch (_) { const t = document.createElement('textarea'); t.value = location.href; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (__) {} t.remove(); }
      toast.classList.add('is-on'); setTimeout(() => toast.classList.remove('is-on'), 1800);
    });
    meta.appendChild(btn);
  }

  /* ---------- 9. Ripple on menu / button clicks ---------- */
  const RIP = '.main-nav a, .nav-dropdown-toggle, .nav-dropdown-menu a, .menu-toggle, .btn, .nav-contact, .product-selector-button, .thanks-link, .product-detail-link, .footer-col a, .fx-top';
  document.addEventListener('pointerdown', (e) => {
    if (reduce) return;
    const host = e.target.closest(RIP); if (!host) return;
    if (getComputedStyle(host).position === 'static') host.classList.add('fx-rip-host');
    let wrap = host.querySelector(':scope > .fx-rip-wrap');
    if (!wrap) { wrap = document.createElement('span'); wrap.className = 'fx-rip-wrap'; host.appendChild(wrap); }
    const r = host.getBoundingClientRect(); const size = Math.max(r.width, r.height) * 2.2;
    const dot = document.createElement('span'); dot.className = 'fx-ripple';
    dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    wrap.appendChild(dot); setTimeout(() => dot.remove(), 750);
  }, { passive: true });
})();

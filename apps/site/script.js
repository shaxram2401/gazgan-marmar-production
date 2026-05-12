/* ============================================================
   GAZGAN MARMO — production frontend logic
   Sections:
   1. UI scroll/nav/menu
   2. Reveal + counter animations
   3. Lazy load enforcement
   4. Legal modals
   5. Lead capture (WhatsApp + Email + Firebase-ready)
   6. Catalog download tracking
   7. Analytics event helper
============================================================ */

(function(){
  'use strict';
  const CFG = window.GAZGAN_CONFIG;

  /* -------- 1. UI : scroll progress + nav -------- */
  const progress = document.getElementById('scrollProgress');
  const nav = document.getElementById('nav');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const h = document.documentElement;
        progress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
        nav.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* -------- Language switcher -------- */
  document.querySelectorAll('.lang button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.lang button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      track('language_switch', { lang: b.dataset.l });
    });
  });

  /* -------- Mobile menu -------- */
  const menuBtn = document.getElementById('menuBtn');
  const navLinks = document.querySelector('.nav-links');
  menuBtn.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
      navLinks.style.display = '';
    } else {
      Object.assign(navLinks.style, {
        display: 'flex', position: 'absolute', top: '100%', left: '0', right: '0',
        background: '#fff', flexDirection: 'column', padding: '30px', gap: '20px',
        borderBottom: '1px solid var(--line)'
      });
      navLinks.querySelectorAll('a').forEach(a => a.style.color = 'var(--ink)');
    }
  });
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 1024) navLinks.style.display = '';
    });
  });

  /* -------- 2. Reveal animations -------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* -------- Counter animation -------- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = +el.dataset.count;
        const suffix = el.querySelector('.plus').outerHTML;
        const start = performance.now();
        (function tick(now) {
          const p = Math.min((now - start) / 1800, 1);
          el.innerHTML = Math.floor(target * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(performance.now());
        cio.unobserve(el);
      }
    });
  }, { threshold: .5 });
  document.querySelectorAll('.stat-num').forEach(c => cio.observe(c));

  /* -------- 3. Lazy load enforcement -------- */
  document.querySelectorAll('img').forEach((img, i) => {
    if (i > 0) { img.loading = 'lazy'; img.decoding = 'async'; }
  });

  /* -------- 4. Legal modals -------- */
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalEyebrow = document.getElementById('modalEyebrow');
  const modalContent = document.getElementById('modalContent');
  const modalClose = document.getElementById('modalClose');
  const modalMap = {
    privacy: { t: 'Privacy Policy', e: 'Legal · Privacy' },
    terms:   { t: 'Terms of Service', e: 'Legal · Terms' },
    license: { t: 'Business License & Certifications', e: 'Legal · Compliance' },
    company: { t: 'Legal Information', e: 'Corporate · Identity' }
  };
  document.querySelectorAll('[data-modal]').forEach(a => {
    a.addEventListener('click', ev => {
      ev.preventDefault();
      const k = a.dataset.modal;
      const tpl = document.getElementById('tpl-' + k);
      if (!tpl) return;
      modalTitle.textContent = modalMap[k].t;
      modalEyebrow.textContent = modalMap[k].e;
      modalContent.innerHTML = tpl.innerHTML;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* -------- 5. Lead capture — WhatsApp + Email + DB-ready -------- */
  const form = document.getElementById('exportInquiry');
  const status = document.getElementById('formStatus');

  function fmtMessage(d) {
    return [
      '🪨 *NEW EXPORT INQUIRY — Gazgan Marmo*',
      '',
      `👤 *Name:* ${d.name}`,
      `🏢 *Company:* ${d.company}`,
      `🌍 *Country:* ${d.country}`,
      `📞 *WhatsApp:* ${d.whatsapp}`,
      `📧 *Email:* ${d.email}`,
      `🎯 *Profile:* ${d.leadType}`,
      '',
      `🪨 *Product:* ${d.product}`,
      `📦 *Quantity:* ${d.quantity}`,
      `🚢 *Incoterm:* ${d.incoterm}`,
      '',
      `📝 *Details:*`,
      d.message || '—',
      '',
      `— Sent from gazganmarmo.uz`
    ].join('\n');
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // Required validation
    const required = ['name','country','company','whatsapp','email','leadType','product','quantity'];
    for (const k of required) {
      if (!data[k] || !String(data[k]).trim()) {
        showStatus(`Please fill the required field: ${k}`, 'err');
        form.querySelector(`[name="${k}"]`)?.focus();
        return;
      }
    }

    // Enrich payload
    const payload = {
      ...data,
      source: 'website',
      page: location.pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      language: navigator.language,
      submittedAt: new Date().toISOString(),
      status: 'new',
      assignedTo: CFG.leadRouting[data.leadType] || CFG.email
    };

    setBtn('Sending...', true);

    // 1) Save to backend (Firebase / API) — falls back gracefully
    try {
      await saveLead(payload);
    } catch (err) {
      console.warn('Lead save failed, continuing with WhatsApp/email:', err);
    }

    // 2) Analytics event
    track('lead_submit', { leadType: data.leadType, product: data.product });

    // 3) Open WhatsApp Business with formatted message
    const waMsg = encodeURIComponent(fmtMessage(data));
    const waUrl = `https://wa.me/${CFG.whatsappNumber}?text=${waMsg}`;

    // 4) Email fallback (mailto)
    const subject = encodeURIComponent(`Export Inquiry — ${data.company} (${data.country})`);
    const body = encodeURIComponent(fmtMessage(data).replace(/\*/g, ''));
    const mailUrl = `mailto:${payload.assignedTo}?subject=${subject}&body=${body}`;

    showStatus('✓ Inquiry received. Opening WhatsApp...', 'ok');
    setBtn('✓ Submitted', true);

    // Open WhatsApp; offer email link as fallback
    window.open(waUrl, '_blank', 'noopener');
    status.innerHTML += ` &nbsp; <a href="${mailUrl}" style="color:var(--gold);text-decoration:underline">or send via email</a>`;
  });

  function setBtn(text, disabled) {
    const btn = form.querySelector('.form-btn');
    btn.textContent = text;
    btn.disabled = !!disabled;
  }
  function showStatus(msg, type) {
    status.style.display = 'block';
    status.style.color = type === 'err' ? '#b00' : '#0a7';
    status.textContent = msg;
  }

  /* Save lead — Firebase first, REST fallback, console as last resort */
  async function saveLead(payload) {
    // Firebase path (uncomment Firebase block above)
    if (window.GAZGAN_DB) {
      const { db, collection, addDoc, serverTimestamp } = window.GAZGAN_DB;
      return await addDoc(collection(db, 'inquiries'), {
        ...payload,
        createdAt: serverTimestamp()
      });
    }
    // REST endpoint path
    if (CFG.endpoints?.inquiries && CFG.endpoints.inquiries.startsWith('http')) {
      const r = await fetch(CFG.endpoints.inquiries, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error('API ' + r.status);
      return await r.json();
    }
    // Dev fallback
    console.info('[lead]', payload);
    return { ok: true, dev: true };
  }

  /* -------- 6. Catalog download tracking -------- */
  const catalogBtn = document.getElementById('catalogDownload');
  if (catalogBtn) {
    catalogBtn.href = CFG.catalogUrl;
    catalogBtn.setAttribute('download', '');
    catalogBtn.addEventListener('click', () => {
      track('catalog_download', { version: CFG.catalogVersion });
    });
  }

  /* -------- WhatsApp float / mobile CTA tracking -------- */
  document.querySelectorAll('.wa-float, .mobile-cta a[href^="https://wa.me"]').forEach(a => {
    a.addEventListener('click', () => track('whatsapp_click', { location: 'float' }));
  });
  document.querySelectorAll('.mobile-cta a[href^="tel:"]').forEach(a => {
    a.addEventListener('click', () => track('phone_call_click', {}));
  });

  /* -------- 7. Analytics helper — unified gtag / fbq / Firebase -------- */
  function track(eventName, params) {
    try {
      if (typeof gtag === 'function') gtag('event', eventName, params || {});
      if (typeof fbq === 'function')  fbq('trackCustom', eventName, params || {});
      if (window.GAZGAN_ANALYTICS)    window.GAZGAN_ANALYTICS.logEvent(eventName, params || {});
    } catch (_) {}
  }
  window.GAZGAN_TRACK = track;
})();

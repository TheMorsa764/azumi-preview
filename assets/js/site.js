/* Azumi Uchitani — site behaviour (static, no framework). */
(function () {
  'use strict';

  /* ---- Configuration: replace the placeholders before launch ---- */
  var CONFIG = {
    formEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',
    newsletterEndpoint: 'https://assets.mailerlite.com/jsonp/YOUR_ACCOUNT_ID/webforms/YOUR_FORM_ID/subscribe',
    email: 'office@azumiuchitani.com'
  };

  var doc = document, root = doc.documentElement;
  var sysReduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reduce = sysReduce || root.classList.contains('az-reduce-motion');
  var live = doc.createElement('div'); live.className = 'sr-only'; live.setAttribute('aria-live', 'polite'); live.setAttribute('role', 'status');
  doc.addEventListener('DOMContentLoaded', function () { doc.body.appendChild(live); });
  if (doc.body) doc.body.appendChild(live);
  function announce(msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 60); }
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var EASE_INK = 'cubic-bezier(.65,0,.35,1)', EASE_PAPER = 'cubic-bezier(.22,.61,.36,1)';

  /* ---- Local viewing: hosts without directory index (file://, previews) need explicit index.html ---- */
  if (location.protocol === 'file:' || /\/index\.html$|\/404\.html$/.test(location.pathname)) {
    $$('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (/^(https?:|mailto:|tel:|#|\/\/)/.test(h)) return;
      var m = h.match(/^([^?#]*)(.*)$/), p = m[1], rest = m[2];
      if (p === '' || p.slice(-1) === '/' || p === '.' || p === '..') a.setAttribute('href', (p === '' ? './' : p.replace(/\/?$/, '/')) + 'index.html' + rest);
    });
  }

  /* ---- Ink wipe between pages ---- */
  var wipe = $('#az-wipe');
  function wipeOut() {
    if (!wipe) return;
    if (!root.classList.contains('az-wiping') || reduce || !wipe.animate) { root.classList.remove('az-wiping'); return; }
    var a = wipe.animate([{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(100% 0 0 0)' }], { duration: 400, easing: EASE_INK, fill: 'forwards' });
    a.onfinish = function () { root.classList.remove('az-wiping'); a.cancel(); };
  }
  try { sessionStorage.removeItem('az-wipe'); } catch (e) {}
  wipeOut();
  window.addEventListener('pageshow', function (e) { if (e.persisted) { root.classList.remove('az-wiping'); if (wipe) { wipe.getAnimations && wipe.getAnimations().forEach(function (a) { a.cancel(); }); } } });

  var leaving = false;
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) {
      if (url.hash) { onSamePageHash(url.hash, e); }
      return;
    }
    if (reduce || !wipe || !wipe.animate || leaving) return;
    e.preventDefault(); leaving = true; closeMenu();
    try { sessionStorage.setItem('az-wipe', '1'); } catch (err) {}
    root.classList.add('az-wiping');
    var go = function () { location.href = url.href; };
    var anim = wipe.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 300, easing: EASE_INK, fill: 'forwards' });
    anim.onfinish = go;
    setTimeout(go, 600); // never leave the visitor waiting on a stalled animation
  });

  function onSamePageHash(hash, e) {
    if (hash === '#collection') resetArtFilter();
    var t = doc.getElementById(hash.slice(1));
    if (t) { e.preventDefault(); closeMenu(); window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', hash); }
  }

  /* ---- Navigation: adapts to Paper / Ink below it ---- */
  var header = $('header.az-header');
  function updateNav() {
    if (!header) return;
    var env = 'paper';
    $$('[data-env]').forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= 44 && r.bottom > 44) env = s.getAttribute('data-env'); });
    header.classList.toggle('az-ink', env === 'ink');
    header.classList.toggle('az-paper', env !== 'ink');
    header.classList.toggle('is-scrolled', scrollY > 40);
  }

  /* ---- Ghost calligraphy parallax (≤ 60px) ---- */
  var pEls = $$('[data-parallax]');
  function parallax() {
    if (reduce) return;
    var vh = innerHeight;
    pEls.forEach(function (el) {
      var r = (el.parentElement || el).getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var y = Math.max(-60, Math.min(60, -(r.top + r.height / 2 - vh / 2) * (+el.getAttribute('data-parallax') || 0.1)));
      el.style.translate = '0 ' + y.toFixed(1) + 'px';
    });
  }
  var raf = 0;
  window.addEventListener('scroll', function () { updateNav(); if (!raf) raf = requestAnimationFrame(function () { raf = 0; parallax(); }); }, { passive: true });
  window.addEventListener('resize', updateNav);
  updateNav(); parallax();

  /* ---- Scroll reveals: rise, mask, brush ---- */
  function show(el) { el.classList.add('is-in'); }
  function reveal(el) {
    if (el.classList.contains('is-in')) return;
    var kind = el.getAttribute('data-reveal'), delay = +(el.getAttribute('data-delay') || 0);
    show(el);
    if (reduce || !el.animate) return;
    var kf = kind === 'mask' ? [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }]
      : kind === 'brush' ? [{ clipPath: 'inset(0 0 100% 0)', filter: 'blur(2px)' }, { offset: .6, filter: 'blur(0)' }, { clipPath: 'inset(0 0 0 0)', filter: 'blur(0)' }]
      : [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }];
    el.animate(kf, { duration: kind === 'mask' ? 1600 : kind === 'brush' ? 2200 : 1100, delay: delay, easing: kind === 'rise' ? EASE_PAPER : EASE_INK, fill: 'backwards' });
  }
  var revealEls = $$('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) revealEls.forEach(show);
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); reveal(en.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Mobile menu (full-screen Ink overlay) ---- */
  var mnav = $('#az-mnav'), lastFocus = null;
  var menuBtns = $$('.az-nav__menu', header || doc);
  menuBtns.forEach(function (b) { b.setAttribute('aria-controls', 'az-mnav'); b.setAttribute('aria-expanded', 'false'); });
  function setInert(on) { ['main', 'header.az-header', 'footer.az-footer'].forEach(function (s) { var el = $(s); if (el) { if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); } }); }
  function openMenu() {
    if (!mnav) return;
    lastFocus = doc.activeElement; mnav.hidden = false; doc.body.style.overflow = 'hidden';
    menuBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'true'); }); setInert(true);
    var f = $('a, button', mnav); f && f.focus();
  }
  function closeMenu() {
    if (!mnav || mnav.hidden) return;
    mnav.hidden = true; doc.body.style.overflow = '';
    menuBtns.forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); setInert(false);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  menuBtns.forEach(function (b) { b.addEventListener('click', openMenu); });
  if (mnav) {
    $('button', mnav).addEventListener('click', closeMenu);
    mnav.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button', mnav), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---- Module lists (accordion) ---- */
  $$('.az-module').forEach(function (li) {
    var btn = $('button', li), body = li.querySelector(':scope > :not(button)');
    if (!btn || !body) return;
    // wrap the body so height can transition both ways (grid 0fr ↔ 1fr)
    var wrap = doc.createElement('div'), clip = doc.createElement('div');
    wrap.className = 'az-acc'; clip.className = 'az-acc__clip';
    body.parentNode.insertBefore(wrap, body); clip.appendChild(body); wrap.appendChild(clip);
    body.hidden = false;
    var set = function (open) {
      li.setAttribute('data-open', open ? 'true' : 'false');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) wrap.removeAttribute('inert'); else wrap.setAttribute('inert', '');
    };
    set(li.getAttribute('data-open') === 'true');
    btn.addEventListener('click', function () { set(li.getAttribute('data-open') !== 'true'); });
  });

  /* ---- Art: category filter ---- */
  var gallery = $('.az-gallery[data-art-root]'), holder = doc.createElement('div'), emptyNote = $('[data-art-empty]');
  holder.hidden = true;
  var items = gallery ? $$('.az-gallery__item', gallery) : [];
  function setArtFilter(cat, say) {
    if (!gallery) return;
    $$('[data-art-filter] button').forEach(function (b) { b.setAttribute('aria-pressed', b.textContent.trim() === cat ? 'true' : 'false'); });
    var shown = 0;
    items.forEach(function (it) {
      var ok = cat === 'All' || it.getAttribute('data-cat') === cat;
      (ok ? gallery : holder).appendChild(it); if (ok) shown++;
    });
    if (emptyNote) emptyNote.hidden = shown > 0;
    if (say) announce(cat === 'All' ? 'Showing all ' + shown + ' works' : 'Showing ' + shown + (shown === 1 ? ' work' : ' works') + ' in ' + cat);
    try { sessionStorage.setItem('az-art-cat', cat); } catch (e) {}
  }
  function resetArtFilter() { setArtFilter('All', true); }
  if (gallery) {
    gallery.parentNode.appendChild(holder);
    $$('[data-art-filter] button').forEach(function (b) { b.addEventListener('click', function () { setArtFilter(b.textContent.trim(), true); }); });
    var saved = null; try { saved = sessionStorage.getItem('az-art-cat'); } catch (e) {}
    setArtFilter(saved || 'All');
  }

  /* ---- Journal: month selector swaps the issue ---- */
  var issue = $('[data-issue-slot]');
  if (issue) {
    $$('.az-months button').forEach(function (b) {
      b.addEventListener('click', function () {
        var tpl = $('template[data-issue="' + b.textContent.trim() + '"]');
        if (!tpl) return;
        issue.innerHTML = tpl.innerHTML;
        $$('.az-months button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-reveal]', issue).forEach(show);
        var h = $('h2', issue); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); announce(h.textContent.replace(/\s*Issue\s*$/i, '').trim() + ' issue loaded'); }
      });
    });
  }

  /* ---- Forms ---- */
  function fieldOf(input) { return input.closest('.az-field') || input.closest('label') || input.parentNode; }
  function setError(input, msg) {
    var f = fieldOf(input), err = f.querySelector('.az-field__error');
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (f.classList.contains('az-field')) f.setAttribute('data-invalid', msg ? 'true' : 'false');
    if (msg) {
      if (!err) { err = doc.createElement('p'); err.className = 'az-field__error'; err.id = (input.id || input.name) + '-err'; f.appendChild(err); }
      err.textContent = msg;
      var ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      if (ids.indexOf(err.id) < 0) ids.push(err.id); input.setAttribute('aria-describedby', ids.join(' '));
    } else if (err) {
      var rest = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== err.id; });
      err.remove(); if (rest.length) input.setAttribute('aria-describedby', rest.join(' ')); else input.removeAttribute('aria-describedby');
    }
  }
  function validate(form) {
    var first = null;
    $$('input[required], textarea[required]', form).forEach(function (i) {
      if (i.offsetParent === null && i.type !== 'checkbox') return;
      var bad = i.type === 'checkbox' ? !i.checked : !i.value.trim() || (i.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value));
      var msg = !bad ? '' : i.type === 'checkbox' ? 'Please confirm to continue.' : i.type === 'email' && i.value.trim() ? 'Please enter a valid email address.' : 'This field is required.';
      setError(i, msg); if (bad && !first) first = i;
    });
    if (first) first.focus();
    return !first;
  }
  function note(container, kind, html) {
    var n = container.querySelector('.az-form-note');
    if (!n) { n = doc.createElement('div'); n.className = 'az-form-note'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite'); container.appendChild(n); }
    n.setAttribute('data-kind', kind); n.innerHTML = html;
  }
  var placeholder = function (u) { return /YOUR_/.test(u); };

  // Contact
  var contact = $('form[data-az-form="contact"]');
  if (contact) {
    var TYPES = { lecture: 'Lecture', workshop: 'Workshop', coaching: 'Coaching', art: 'Commission Art', speaking: 'Speaking Engagement', media: 'Book / Media', general: 'General Inquiry' };
    var ORG = ['Lecture', 'Workshop', 'Speaking Engagement', 'Book / Media'];
    var step2 = $('[data-contact-step2]', contact), org = $('input[name="org"]', contact);
    var radioErr = $('#inquiry-err', contact), wasHidden = true;
    var sync = function (user) {
      var c = $('input[name="inquiry"]:checked', contact);
      if (c && radioErr) radioErr.hidden = true;
      if (step2) { step2.hidden = !c; if (user && c && wasHidden) announce('Now tell Azumi about you'); wasHidden = !c; }
      if (org) fieldOf(org).hidden = !(c && ORG.indexOf(c.value) >= 0);
    };
    $$('input[name="inquiry"]', contact).forEach(function (r) { r.checked = false; r.addEventListener('change', function () { sync(true); }); });
    var t = TYPES[new URLSearchParams(location.search).get('type') || ''];
    if (t) { var r = $('input[name="inquiry"][value="' + t + '"]', contact); if (r) r.checked = true; }
    sync();
    contact.setAttribute('action', CONFIG.formEndpoint);
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!$('input[name="inquiry"]:checked', contact)) { if (radioErr) radioErr.hidden = false; var r0 = $('input[name="inquiry"]', contact); r0 && r0.focus(); return; }
      if (!validate(contact)) return;
      var btn = $('button[type="submit"], .az-btn', contact); btn && (btn.disabled = true);
      var fail = function () {
        btn && (btn.disabled = false);
        note(contact, 'error', 'Your message could not be sent just now. Please try again, or write to <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>.');
      };
      if (placeholder(CONFIG.formEndpoint)) { fail(); return; }
      fetch(CONFIG.formEndpoint, { method: 'POST', body: new FormData(contact), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error();
          var box = contact.parentNode;
          box.innerHTML = '<div class="az-form-done" role="status" tabindex="-1"><p class="t-h1">Thank you.</p><p class="t-body-lg">Your message has reached Azumi. You will receive a personal reply by email, usually within a few days.</p><a class="az-link" href="/journal/">Meanwhile, read the Journal</a></div>';
          box.firstChild.focus();
        }).catch(fail);
    });
  }

  // Newsletter
  $$('.az-newsletter__form').forEach(function (form) {
    var input = $('input[type="email"]', form); if (input) input.name = 'fields[email]';
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var box = form.parentNode;
      var fail = function () { note(box, 'error', 'The subscription could not be completed just now. Please try again later, or write to <a href="mailto:' + CONFIG.email + '">' + CONFIG.email + '</a>.'); };
      if (placeholder(CONFIG.newsletterEndpoint)) { fail(); return; }
      var body = new FormData(); body.append('fields[email]', input.value); body.append('ml-submit', '1'); body.append('anticsrf', 'true');
      fetch(CONFIG.newsletterEndpoint, { method: 'POST', body: body })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (r) {
          var txt = JSON.stringify(r.j || {});
          if (/already/i.test(txt)) { note(box, 'info', 'You are already subscribed. The next letter will find you.'); return; }
          if (!r.ok || r.j.success === false) throw new Error();
          form.hidden = true;
          note(box, 'done', 'Thank you. Please confirm your subscription through the email that is on its way to you.');
        }).catch(fail);
    });
  });

  /* ---- Display settings ---- */
  var dlg = $('#az-display'), dsTrigger = null, KEYS = ['az-reduce-motion', 'az-contrast', 'az-underline', 'az-readable'];
  function loadDS() { try { return JSON.parse(localStorage.getItem('az-display') || '{}'); } catch (e) { return {}; } }
  function applyDS(s) {
    root.classList.remove('az-text-large', 'az-text-larger');
    if (s.size && s.size !== 'standard') root.classList.add('az-text-' + s.size);
    KEYS.forEach(function (k) { root.classList.toggle(k, !!s[k]); });
    reduce = sysReduce || !!s['az-reduce-motion'];
    if (reduce) { revealEls.forEach(show); pEls.forEach(function (el) { el.style.translate = ''; }); }
    updateNav();
  }
  function saveDS(s) { try { localStorage.setItem('az-display', JSON.stringify(s)); } catch (e) {} }
  function readForm() { var s = { size: ($('input[name="az-size"]:checked', dlg) || {}).value || 'standard' }; KEYS.forEach(function (k) { s[k] = $('input[name="' + k + '"]', dlg).checked; }); return s; }
  function fillForm(s) { $$('input[name="az-size"]', dlg).forEach(function (r) { r.checked = r.value === (s.size || 'standard'); }); KEYS.forEach(function (k) { var i = $('input[name="' + k + '"]', dlg); i.checked = k === 'az-reduce-motion' ? (s[k] === undefined ? sysReduce : !!s[k]) : !!s[k]; }); }
  if (dlg) {
    fillForm(loadDS());
    dlg.addEventListener('change', function () { var s = readForm(); saveDS(s); applyDS(s); });
    $('[data-display-reset]', dlg).addEventListener('click', function () { try { localStorage.removeItem('az-display'); } catch (e) {} fillForm({}); applyDS({}); announce('Display settings reset'); });
    dlg.addEventListener('close', function () { if (dsTrigger && dsTrigger.focus) dsTrigger.focus(); });
    // click on the backdrop (outside the panel) closes the dialog
    dlg.addEventListener('click', function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
    });
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-display-settings]');
      if (!b) return;
      e.preventDefault(); closeMenu(); dsTrigger = b.closest('#az-mnav') ? (menuBtns[0] || b) : b;
      if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
      var first = $('input:checked', dlg) || $('input', dlg); first && first.focus();
    });
  }

  // Safety net: never leave content invisible if something above failed.
  setTimeout(function () { revealEls.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) show(el); }); }, 2500);
})();

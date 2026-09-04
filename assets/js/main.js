/* AuroraOSP — site behaviour: theme, nav, reveal, scrollspy, downloads. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- theme */
  var STORE_KEY = 'aurora-theme';
  var root = document.documentElement;

  /* Scroll-reveal styles only apply when scripting is available, so a
     no-JS visitor gets the full page instead of blank sections. */
  root.classList.add('js');

  function readStored() {
    try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function writeStored(v) {
    try { localStorage.setItem(STORE_KEY, v); } catch (e) { /* private mode */ }
  }

  var stored = readStored();
  if (stored === 'light' || stored === 'dark') root.setAttribute('data-theme', stored);

  function currentTheme() {
    var explicit = root.getAttribute('data-theme');
    if (explicit) return explicit;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* SVGElement does not implement the `hidden` IDL property, so el.hidden = x
     silently does nothing on an <svg>. Toggle the content attribute instead. */
  function setHidden(el, hide) {
    if (!el) return;
    if (hide) el.setAttribute('hidden', '');
    else el.removeAttribute('hidden');
  }

  function syncThemeButton(btn) {
    if (!btn) return;
    var dark = currentTheme() === 'dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    setHidden(btn.querySelector('[data-icon="sun"]'), !dark);
    setHidden(btn.querySelector('[data-icon="moon"]'), dark);
  }

  var themeBtn = document.querySelector('[data-theme-toggle]');
  syncThemeButton(themeBtn);
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      writeStored(next);
      syncThemeButton(themeBtn);
    });
  }

  /* ------------------------------------------------------------ app bar */
  var appbar = document.querySelector('.appbar');
  if (appbar) {
    var onScroll = function () {
      appbar.setAttribute('data-scrolled', window.scrollY > 8 ? 'true' : 'false');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* --------------------------------------------------------- mobile nav */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('primary-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      navToggle.setAttribute('aria-expanded', String(!open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.setAttribute('data-open', 'false');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ------------------------------------------------------ scroll reveal */
  var revealables = document.querySelectorAll('[data-reveal]');
  if (revealables.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var delay = entry.target.getAttribute('data-reveal-delay') || 0;
          entry.target.style.transitionDelay = delay + 'ms';
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
      revealables.forEach(function (el) { io.observe(el); });
    } else {
      revealables.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------------------------------------------------------- scrollspy */
  var subnavLinks = document.querySelectorAll('.subnav a[href^="#"]');
  if (subnavLinks.length && 'IntersectionObserver' in window) {
    var sections = [];
    subnavLinks.forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) sections.push({ link: link, target: target });
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sections.forEach(function (s) {
          s.link.classList.toggle('is-active', s.target === entry.target);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(function (s) { spy.observe(s.target); });
  }

  /* -------------------------------------------------- phone mock pulse */
  var pulse = document.querySelector('.phone__pulse');
  if (pulse) {
    for (var i = 0; i < 18; i++) {
      var bar = document.createElement('span');
      bar.style.animationDelay = (i * 65 % 700) + 'ms';
      bar.style.animationDuration = (900 + (i % 5) * 130) + 'ms';
      pulse.appendChild(bar);
    }
  }

  /* ------------------------------------------------------ current year */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* -------------------------------------------------------- downloads */
  var dlGrid = document.getElementById('device-grid');
  if (!dlGrid) return;

  var state = { query: '', filter: 'all', data: [] };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(iso) {
    if (!iso) return 'Not yet built';
    var d = new Date(iso + 'T00:00:00Z');
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  var STATUS = {
    official: { label: 'Official', cls: 'chip--accent' },
    beta: { label: 'Beta', cls: 'chip--tertiary' },
    community: { label: 'Community', cls: 'chip--secondary' },
    pending: { label: 'Pending', cls: '' }
  };

  function deviceCard(d) {
    var badge = STATUS[d.status] || STATUS.community;
    var variants = (d.variants || []).map(function (v) {
      var pending = !v.url || v.url === '#';
      var style = pending ? 'btn--outlined is-pending' : (v.type === 'GMS' ? 'btn--filled' : 'btn--tonal');
      var trail = pending ? 'Soon' : esc(v.size);
      return '<a class="btn btn--sm ' + style + '"' +
        ' href="' + esc(v.url || '#') + '"' +
        (pending ? ' aria-disabled="true" title="Build not published yet"' : ' rel="noopener"') +
        '>' + esc(v.type) + '<span class="visually-hidden"> build for ' + esc(d.name) + '</span>' +
        ' <span style="opacity:.65;font-weight:500">' + trail + '</span></a>';
    }).join('');

    return '' +
      '<article class="card card--interactive device-card" data-reveal>' +
        '<div class="device-card__top">' +
          '<div class="device-card__glyph" aria-hidden="true"></div>' +
          '<div style="flex:1">' +
            '<h3 class="title-lg">' + esc(d.name) + '</h3>' +
            '<div class="codename">' + esc(d.oem) + ' &middot; ' + esc(d.codename) + '</div>' +
          '</div>' +
          '<span class="chip ' + badge.cls + '">' + badge.label + '</span>' +
        '</div>' +
        '<dl class="device-card__rows">' +
          '<div><dt>Version</dt><dd>' + esc(d.version) + '</dd></div>' +
          '<div><dt>Build</dt><dd>' + fmtDate(d.date) + '</dd></div>' +
          (d.patch ? '<div><dt>Security patch</dt><dd>' + fmtDate(d.patch) + '</dd></div>' : '') +
          '<div><dt>Maintainer</dt><dd>' + esc(d.maintainer) + '</dd></div>' +
        '</dl>' +
        (d.notes ? '<p class="body-sm" style="margin-bottom:1.25rem">' + esc(d.notes) + '</p>' : '') +
        '<div class="device-card__actions">' + variants + '</div>' +
      '</article>';
  }

  function render() {
    var q = state.query.trim().toLowerCase();
    var list = state.data.filter(function (d) {
      var matchesFilter = state.filter === 'all' || d.status === state.filter;
      var haystack = (d.name + ' ' + d.codename + ' ' + d.oem).toLowerCase();
      return matchesFilter && (!q || haystack.indexOf(q) !== -1);
    });

    if (!list.length) {
      dlGrid.innerHTML = '<div class="dl-empty" style="grid-column:1/-1">' +
        '<p class="title-md">No devices match that search.</p>' +
        '<p class="body-md" style="margin-top:.5rem">Try a codename like <code>caiman</code>, or clear the filters.</p></div>';
    } else {
      dlGrid.innerHTML = list.map(deviceCard).join('');
    }

    var counter = document.getElementById('device-count');
    if (counter) {
      counter.textContent = list.length + ' of ' + state.data.length + ' device' + (state.data.length === 1 ? '' : 's');
    }
    dlGrid.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
  }

  var searchInput = document.getElementById('device-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () { state.query = this.value; render(); });
  }
  document.querySelectorAll('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.filter = btn.getAttribute('data-filter');
      document.querySelectorAll('[data-filter]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render();
    });
  });

  fetch('data/devices.json')
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (json) {
      state.data = json.devices || [];
      render();
    })
    .catch(function () {
      dlGrid.innerHTML = '<div class="dl-empty" style="grid-column:1/-1">' +
        '<p class="title-md">Couldn\'t load the device list.</p>' +
        '<p class="body-md" style="margin-top:.5rem">If you opened this page from the filesystem, serve it over HTTP instead ' +
        '(<code>python3 -m http.server</code>) &mdash; browsers block <code>fetch</code> on <code>file://</code>.</p></div>';
    });
})();

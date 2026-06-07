/* PEIC — Shared interactions (design mockup) */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCounters();
  initDownloadSpecs();
  initResourceFilter();
});

function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 2000;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.3 });

  counters.forEach((c) => observer.observe(c));
}

function initDownloadSpecs() {
  document.querySelectorAll('.download-specs').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      btn.textContent = 'Specs — Coming Soon';
      btn.style.opacity = '0.7';
      btn.style.pointerEvents = 'none';
      setTimeout(() => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download Technical Specifications`;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }, 2000);
    });
  });

  document.querySelectorAll('.btn-download-doc').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const original = btn.innerHTML;
      btn.textContent = 'Coming Soon';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = original;
        btn.disabled = false;
      }, 2000);
    });
  });
}

function initResourceFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.doc-card');
  const searchInput = document.querySelector('#resource-search');
  if (!tabs.length || !cards.length) return;

  let activeFilter = 'all';

  function filterDocs() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    cards.forEach((card) => {
      const category = card.dataset.category;
      const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
      const matchFilter = activeFilter === 'all' || category === activeFilter;
      const matchSearch = !query || title.includes(query);
      card.classList.toggle('hidden', !(matchFilter && matchSearch));
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.filter;
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      filterDocs();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterDocs);
  }
}

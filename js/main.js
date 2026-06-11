/* PEIC — Shared interactions */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCounters();
  initDownloadSpecs();
  initResourceFilter();
  initContactForm();
  initQueryDefaults();
  initPartnerCards();
  initCertificationLinks();
});

function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  nav.querySelector('.active')?.setAttribute('aria-current', 'page');

  const drawer = document.createElement('nav');
  drawer.id = 'navigation-drawer';
  drawer.className = 'nav-drawer';
  drawer.setAttribute('aria-label', 'Menu navigation');

  nav.querySelectorAll('a:not(.header-hotline-mobile)').forEach((link) => {
    drawer.appendChild(link.cloneNode(true));
  });

  const mobileHotline = nav.querySelector('.header-hotline-mobile');
  if (mobileHotline) drawer.insertBefore(mobileHotline.cloneNode(true), drawer.lastElementChild);

  document.querySelector('.site-header')?.appendChild(drawer);
  toggle.setAttribute('aria-controls', drawer.id);

  function setOpen(isOpen) {
    drawer.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  }

  setOpen(false);

  toggle.addEventListener('click', () => {
    setOpen(!drawer.classList.contains('open'));
  });

  drawer.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!drawer.classList.contains('open')) return;
    if (!drawer.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1000) setOpen(false);
  });
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
      showToast('Technical specifications are being prepared. Contact sales@peic.in for immediate access.');
    });
  });

  document.querySelectorAll('.btn-download-doc').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('This document is not online yet. Contact sales@peic.in and we will send it directly.');
    });
  });

  document.querySelectorAll('a[href="#"][data-pending-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showToast(link.dataset.pendingMessage || 'This link will be added shortly. Please contact us for access.');
    });
  });
}

function initResourceFilter() {
  const tabs = document.querySelectorAll('.filter-tab');
  const cards = document.querySelectorAll('.doc-card');
  const searchInput = document.querySelector('#resource-search');
  if (!tabs.length || !cards.length) return;

  let activeFilter = 'all';
  const grid = document.querySelector('.doc-grid');
  const emptyState = document.createElement('p');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = 'No documents match your search. <a href="contact.html">Contact us</a> for the document you need.';
  grid?.after(emptyState);

  tabs.forEach((tab) => {
    const filter = tab.dataset.filter;
    const count = filter === 'all'
      ? cards.length
      : document.querySelectorAll(`.doc-card[data-category="${filter}"]`).length;
    const countEl = tab.querySelector('.tab-count');
    if (countEl) countEl.textContent = `(${count})`;
  });

  function filterDocs() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;
    cards.forEach((card) => {
      const category = card.dataset.category;
      const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
      const matchFilter = activeFilter === 'all' || category === activeFilter;
      const matchSearch = !query || title.includes(query);
      const visible = matchFilter && matchSearch;
      card.classList.toggle('hidden', !visible);
      if (visible) visibleCount += 1;
    });
    emptyState.classList.toggle('visible', visibleCount === 0);
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

function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    if (submit) {
      submit.textContent = 'Sending enquiry...';
      submit.disabled = true;
    }

    if (status) {
      status.textContent = 'Sending your enquiry securely...';
      status.className = 'form-status visible';
    }

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Submission failed');
      }

      if (status) {
        status.textContent = 'Thank you. Your enquiry has been sent successfully. Our team will respond shortly.';
        status.className = 'form-status success visible';
      }
      form.reset();
    } catch (error) {
      if (status) {
        status.innerHTML = 'We could not send the enquiry. Please try again or email <a href="mailto:sital.shah@peic.in">sital.shah@peic.in</a>.';
        status.className = 'form-status error visible';
      }
    } finally {
      if (submit) {
        submit.textContent = 'Submit Enquiry';
        submit.disabled = false;
      }
    }
  });
}

function initQueryDefaults() {
  const inquiryType = document.querySelector('#inquiry-type');
  if (!inquiryType) return;
  const requestedType = new URLSearchParams(window.location.search).get('type');
  if (requestedType && [...inquiryType.options].some((option) => option.value === requestedType)) {
    inquiryType.value = requestedType;
  }
}

function initPartnerCards() {
  const partnerUrls = {
    'AngioDynamics': 'https://www.angiodynamics.com/',
    'Steris Corporation': 'https://www.steris.com/',
    'Dentsply Sirona': 'https://www.dentsplysirona.com/',
    'Samsung Electronics': 'https://www.samsunghealthcare.com/',
    'Richard Wolf GmbH': 'https://www.richard-wolf.com/',
    'Pentax Corporation': 'https://www.pentaxmedical.com/',
    'BOWA Medical': 'https://www.bowa-medical.com/',
    'ATMOS MedizinTechnik': 'https://www.atmos.de/',
    'INTRASENSE': 'https://www.intrasense.fr/',
    'Designs for Vision': 'https://www.designsforvision.com/',
    'Confident Dental Equipment': 'https://www.confidentdental.com/',
    'Neuro Equilibrium Diagnostics': 'https://neuroequilibrium.in/'
  };

  document.querySelectorAll('a.partner-card').forEach((original) => {
    const card = document.createElement('article');
    card.className = original.className;
    card.dataset.solutionsUrl = original.getAttribute('href');
    card.innerHTML = original.innerHTML;

    const content = card.querySelector('.partner-flag')?.nextElementSibling;
    if (content) content.classList.add('partner-card-content');

    const logoSlot = document.createElement('div');
    logoSlot.className = 'partner-logo-slot';
    logoSlot.textContent = 'Logo';
    logoSlot.setAttribute('aria-hidden', 'true');
    card.appendChild(logoSlot);

    const name = card.querySelector('h4')?.textContent.trim();
    const oldLink = card.querySelector('.ext-link');
    const websiteUrl = partnerUrls[name];
    if (oldLink) {
      const link = document.createElement('a');
      link.className = 'ext-link';
      link.textContent = websiteUrl ? 'Visit partner website ↗' : 'Website link pending';
      link.href = websiteUrl || '#';
      link.target = websiteUrl ? '_blank' : '';
      link.rel = websiteUrl ? 'noopener noreferrer' : '';
      if (!websiteUrl) {
        link.dataset.pendingLink = '';
        link.dataset.pendingMessage = `The website link for ${name} still needs confirmation.`;
        link.addEventListener('click', (event) => {
          event.preventDefault();
          showToast(link.dataset.pendingMessage);
        });
      }
      oldLink.replaceWith(link);
    }

    original.replaceWith(card);
  });
}

function initCertificationLinks() {
  document.querySelectorAll('.cert-badge').forEach((badge) => {
    if (badge.closest('a')) return;
    const name = badge.querySelector('h4')?.textContent.trim() || 'certificate';
    const link = document.createElement('a');
    link.className = 'cert-link';
    link.href = '#';
    link.target = '_blank';
    link.rel = 'noopener';
    link.dataset.cert = name;
    link.dataset.pendingLink = '';
    link.setAttribute('aria-label', `${name}: certificate link pending`);
    badge.parentNode.insertBefore(link, badge);
    link.appendChild(badge);

    const indicator = document.createElement('span');
    indicator.className = 'cert-download-indicator';
    indicator.textContent = '↓';
    indicator.setAttribute('aria-hidden', 'true');
    link.appendChild(indicator);
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showToast(`The file for ${name} still needs to be uploaded.`);
    });
  });
}

function showToast(message) {
  let toast = document.querySelector('.site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('visible'), 4500);
}

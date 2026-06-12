/* PEIC — Shared interactions */

document.addEventListener('DOMContentLoaded', async () => {
  initMobileNav();
  initCounters();
  await initCMSContent();
  initDownloadSpecs();
  initResourceFilter();
  initContactForm();
  initQueryDefaults();
  initPartnerCards();
  initCertificationLinks();
});

async function initCMSContent() {
  try {
    const page = document.body;
    const requests = [fetchCMSData('site')];
    const route = getCurrentRoute();
    const pageFiles = {
      home: 'home',
      products: 'products-page',
      solutions: 'solutions-page',
      about: 'about',
      service: 'service-page',
      resources: 'resources-page',
      careers: 'careers-page',
      contact: 'contact-page'
    };
    if (pageFiles[route]) requests.push(fetchCMSData(pageFiles[route]));

    if (page.querySelector('.product-grid')) requests.push(fetchCMSData('products'));
    if (page.querySelector('#partners')) requests.push(fetchCMSData('partners'));
    if (page.querySelector('.doc-grid')) requests.push(fetchCMSData('resources'));
    if (page.querySelector('.job-list-placeholder')) requests.push(fetchCMSData('jobs'));
    if (route !== 'about' && page.querySelector('.logo-grid')) {
      requests.push(fetchCMSData('about'));
    }

    const results = await Promise.all(requests);
    const data = Object.assign({}, ...results);

    if (data.site) renderSiteContent(data.site);
    renderCurrentPage(route, data[pageFiles[route]]);
    if (data.products) renderProducts(data.products);
    if (data.partners) renderPartners(data.partners);
    if (data.resources) renderResources(data.resources);
    if (data.jobs) renderJobs(data.jobs);
    if (data.about) renderTrustContent(data.about);
  } catch (error) {
    console.warn('CMS content could not be loaded; using built-in page content.', error);
  }
}

function getCurrentRoute() {
  const filename = window.location.pathname.split('/').pop() || 'index.html';
  return filename === 'index.html' ? 'home' : filename.replace(/\.html$/, '');
}

async function fetchCMSData(name) {
  const response = await fetch(`content/${name}.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${name} content`);
  return { [name]: await response.json() };
}

function renderSiteContent(site) {
  document.querySelectorAll('.logo-name').forEach((el) => {
    el.textContent = site.company_name;
  });
  document.querySelectorAll('.logo-tagline').forEach((el) => {
    el.textContent = site.tagline;
  });
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.href = `tel:${site.phone_link}`;
    const number = link.querySelector('.hotline-number');
    if (number) number.textContent = site.phone_display;
    if (!number && link.textContent.trim().startsWith('Phone:')) {
      link.textContent = `Phone: ${site.phone_display}`;
    } else if (!number && /^\+[\d\s]+$/.test(link.textContent.trim())) {
      link.textContent = site.phone_display;
    }
  });

  const emailMap = {
    'sales@peic.in': site.sales_email,
    'support@peic.in': site.service_email,
    'careers@peic.in': site.careers_email,
    'contact@peic.in': site.general_email
  };
  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
    const current = link.href.replace('mailto:', '').split('?')[0];
    if (!emailMap[current]) return;
    const query = link.href.includes('?') ? `?${link.href.split('?')[1]}` : '';
    link.href = `mailto:${emailMap[current]}${query}`;
    if (link.textContent.trim() === current) link.textContent = emailMap[current];
  });

  const address = document.querySelector('.office-item p');
  if (address && Array.isArray(site.address_lines)) {
    address.innerHTML = `${escapeHTML(site.company_name)} Pvt. Ltd.<br>${site.address_lines.map(escapeHTML).join('<br>')}`;
  }
  document.querySelectorAll('.footer-brand > p').forEach((el) => {
    if (site.footer_description) el.textContent = site.footer_description;
  });
}

function renderCurrentPage(route, content) {
  if (!content) return;
  const renderers = {
    home: renderHomePage,
    products: renderProductsPage,
    solutions: renderSolutionsPage,
    about: renderAboutPage,
    service: renderServicePage,
    resources: renderResourcesPage,
    careers: renderCareersPage,
    contact: renderContactPage
  };
  if (renderers[route]) renderers[route](content);
}

function renderHomePage(home) {
  setText('.hero-eyebrow', home.hero?.eyebrow);
  setText('.hero h1', home.hero?.title);
  setText('.hero-desc', home.hero?.description);
  setBackgroundImage('.hero-bg', home.hero?.image);
  setLink('.hero-actions .btn-primary', home.hero?.primary_button_label, home.hero?.primary_button_link);
  setLink('.hero-actions .btn-outline', home.hero?.secondary_button_label, home.hero?.secondary_button_link);

  const banner = document.querySelector('.trust-banner-inner');
  if (banner && Array.isArray(home.trust_banner)) {
    banner.innerHTML = home.trust_banner
      .map((item, index) => `${index ? '<span class="sep">|</span>' : ''}<span>${escapeHTML(item)}</span>`)
      .join('');
  }

  setHeadingBlock('.dual-cards', home.capabilities);
  const cards = document.querySelector('.dual-cards');
  if (cards && Array.isArray(home.capabilities?.cards)) {
    cards.innerHTML = home.capabilities.cards.map((card) => `<a href="${escapeAttribute(card.link || '#')}" class="cap-card-link">
      <div class="cap-card">
        <div class="cap-card-img"${card.image ? ` style="background-image:url('${escapeAttribute(card.image)}')"` : ''}></div>
        <div class="cap-card-body">
          <h3>${escapeHTML(card.title)}</h3>
          <p>${escapeHTML(card.description || '')}</p>
          <ul class="cap-advantages">${(card.advantages || []).map((item) => `<li><span class="tick">✓</span> <strong>${escapeHTML(item)}</strong></li>`).join('')}</ul>
          <div class="cap-card-footer"><span>${escapeHTML(card.button_label || 'Learn more')}</span> <span class="arrow">→</span></div>
        </div>
      </div>
    </a>`).join('');
  }

  const sections = document.querySelectorAll('body > section');
  const advantageSection = [...sections].find((section) => section.querySelector('.stats-row'));
  setHeading(advantageSection, home.advantage);
  const clientsSection = [...sections].find((section) => section.querySelector('.logo-grid'));
  setHeading(clientsSection, home.clients);
  const ctaSection = [...sections].find((section) => section.classList.contains('bg-dark') && section.querySelector('.container > .btn'));
  setCallout(ctaSection?.querySelector('.container'), home.cta);
}

function renderProductsPage(page) {
  setText('.page-hero h1', page.hero?.title);
  setText('.page-hero p', page.hero?.description);
  renderHeroImage(page.hero?.image, 'Product catalog');
  renderTier('#manufacturing', page.manufacturing);
  renderTier('#partners', page.partners);
  setText('#partners .container > h3', page.partners?.global_title);
  const partnerHeadings = document.querySelectorAll('#partners .container > h3');
  if (partnerHeadings[1] && page.partners?.domestic_title) partnerHeadings[1].textContent = page.partners.domestic_title;
}

function renderTier(selector, tier) {
  const section = document.querySelector(selector);
  if (!section || !tier) return;
  setTextWithin(section, '.tier-header .section-title', tier.title);
  setTextWithin(section, '.tier-header .tier-intro', tier.description);
  const bar = section.querySelector('.advantage-bar');
  if (!bar) return;
  setTextWithin(bar, 'h3', tier.advantages_title);
  setTextWithin(bar, '.bar-subtitle', tier.advantages_subtitle);
  const items = bar.querySelectorAll('.advantage-item');
  (tier.advantages || []).forEach((item, index) => {
    if (!items[index]) return;
    setTextWithin(items[index], 'h4', item.title);
    setTextWithin(items[index], 'p', item.description);
  });
}

function renderSolutionsPage(page) {
  setPageHero(page.hero);
  setHeading(document.querySelector('.specialty-section'), page.specialties_heading);
  setHeading(document.querySelector('.audience-section'), page.industries_heading);
  renderPageSections({ solutions: page });
  setCallout(document.querySelector('main.solutions-content + section .container'), page.cta);
}

function renderAboutPage(about) {
  const page = about.page;
  if (!page) return;
  setText('.page-hero h1', page.hero?.title);
  setText('.page-hero p', page.hero?.description);
  renderHeroImage(page.hero?.image, 'Facility or team');
  setHeading(document.querySelector('.legacy-section'), page.legacy);
  const legacyCopy = document.querySelector('.legacy-section .two-col-split > div');
  if (legacyCopy && Array.isArray(page.legacy?.paragraphs)) {
    legacyCopy.querySelectorAll('p').forEach((paragraph) => paragraph.remove());
    legacyCopy.insertAdjacentHTML('beforeend', page.legacy.paragraphs.map((text) => `<p style="color:var(--slate-light);margin-bottom:1rem">${escapeHTML(text)}</p>`).join(''));
  }
  setHeading(document.querySelector('.metrics-section'), page.metrics_heading);
  setHeading(document.querySelector('.facilities-section'), page.facilities_heading);
  setHeading(document.querySelector('.clients-section'), page.clients_heading);
  setHeading(document.querySelector('.testimonials-section'), page.testimonials_heading);
  setHeading(document.querySelector('.certifications-section'), page.certifications_heading);
}

function renderServicePage(page) {
  setPageHero(page.hero);
  setHeading(document.querySelector('.response-grid')?.closest('section'), page.process_heading);
  renderPageSections({ service: page });
  setCallout(document.querySelector('.custom-solution-box'), page.custom_cta);
  setCallout(document.querySelector('.urgent-service-banner'), page.urgent_cta);
}

function renderResourcesPage(page) {
  setPageHero(page.hero);
  setCallout(document.querySelector('.missing-doc-cta'), page.help_cta);
}

function renderCareersPage(page) {
  setPageHero(page.hero);
  renderPageSections({ careers: {
    benefits: page.benefits,
    culture_title: page.culture?.title,
    culture_subtitle: page.culture?.subtitle,
    culture_values: page.culture?.values
  } });
  const jobsSection = document.querySelector('.job-list-placeholder')?.closest('section');
  const heading = jobsSection?.querySelector('.job-list-placeholder')?.previousElementSibling;
  if (heading) {
    setTextWithin(heading, '.section-label', page.jobs_heading?.label);
    setTextWithin(heading, '.section-title', page.jobs_heading?.title);
  }
  setCallout(document.querySelector('.general-app-cta'), page.open_application);
}

function renderContactPage(page) {
  setText('.contact-info-block > h3', page.teams_title);
  setText('.office-list > h3', page.office_title);
  setText('.contact-form > h3', page.form_title);
  setText('.contact-form .form-desc', page.form_description);
}

function setPageHero(hero) {
  setText('.page-hero-sm h1', hero?.title);
  setText('.page-hero-sm p', hero?.description);
}

function setHeading(section, heading) {
  if (!section || !heading) return;
  setTextWithin(section, '.section-label', heading.label);
  setTextWithin(section, '.section-title', heading.title);
  setTextWithin(section, '.section-subtitle', heading.description);
}

function setHeadingBlock(contentSelector, heading) {
  const content = document.querySelector(contentSelector);
  setHeading(content?.closest('section'), heading);
}

function setCallout(container, callout) {
  if (!container || !callout) return;
  setTextWithin(container, 'h2, h3', callout.title);
  setTextWithin(container, 'p', callout.description);
  const button = container.querySelector('.btn');
  if (button) {
    if (callout.button_label) button.textContent = callout.button_label;
    if (callout.button_link) button.href = callout.button_link;
  }
}

function setLink(selector, label, href) {
  const link = document.querySelector(selector);
  if (!link) return;
  if (label) link.textContent = label;
  if (href) link.href = href;
}

function setTextWithin(container, selector, value) {
  const element = container?.querySelector(selector);
  if (element && value !== undefined && value !== null) element.textContent = value;
}

function renderHeroImage(image, alt) {
  if (!image) return;
  const placeholder = document.querySelector('.hero-image-placeholder');
  if (!placeholder) return;
  placeholder.classList.add('has-image');
  placeholder.innerHTML = `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(alt)}">`;
}

function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid || !Array.isArray(products)) return;

  grid.innerHTML = products.map((product) => {
    const media = product.image
      ? `<div class="product-image-slot has-image"><img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}"></div>`
      : '<div class="product-image-slot" role="img" aria-label="Product image placeholder">Product image</div>';
    const accessMode = ['enquiry_only', 'gated_download', 'public_download'].includes(product.access_mode)
      ? product.access_mode
      : 'enquiry_only';
    const hasFile = Boolean(product.specification_file);
    const effectiveMode = hasFile ? accessMode : 'enquiry_only';
    const defaultLabel = effectiveMode === 'enquiry_only'
      ? 'Request Specifications'
      : effectiveMode === 'gated_download'
        ? 'Get Technical Specifications'
        : 'Download Technical Specifications';
    const actionLabel = product.action_label || defaultLabel;
    const specs = effectiveMode === 'public_download'
      ? `<a class="download-specs" href="${escapeAttribute(product.specification_file)}" target="_blank" rel="noopener">↓ ${escapeHTML(actionLabel)}</a>`
      : `<button class="download-specs" type="button"
          data-product-action="${escapeAttribute(effectiveMode)}"
          data-product-name="${escapeAttribute(product.name)}"
          data-product-file="${escapeAttribute(product.specification_file || '')}">→ ${escapeHTML(actionLabel)}</button>`;
    const enquiryUrl = `contact.html?type=equipment&product=${encodeURIComponent(product.name)}`;
    const secondaryAction = effectiveMode === 'enquiry_only'
      ? ''
      : `<a href="${escapeAttribute(enquiryUrl)}" class="btn-enquire">Enquire</a>`;

    return `<article class="product-card featured">
      ${media}
      <h4>${escapeHTML(product.name)}</h4>
      <p class="cert">${escapeHTML(product.certification || '')}</p>
      <p>${escapeHTML(product.description || '')}</p>
      <div class="product-actions">
        ${specs}
        ${secondaryAction}
      </div>
    </article>`;
  }).join('');
}

function renderPartners(partners) {
  const grids = document.querySelectorAll('#partners .partner-grid');
  if (grids.length < 2 || !Array.isArray(partners)) return;

  grids[0].innerHTML = partners.filter((partner) => partner.group === 'global').map(partnerCardHTML).join('');
  grids[1].innerHTML = partners.filter((partner) => partner.group === 'domestic').map(partnerCardHTML).join('');
}

function partnerCardHTML(partner) {
  const tags = (partner.categories || [])
    .map((category) => `<span class="partner-cat-tag">${escapeHTML(category)}</span>`)
    .join('');
  const logo = partner.logo
    ? `<div class="partner-logo-slot has-image"><img src="${escapeAttribute(partner.logo)}" alt="${escapeAttribute(partner.name)} logo"></div>`
    : '<div class="partner-logo-slot" aria-hidden="true">Logo</div>';
  const website = partner.website_url
    ? `<a class="ext-link" href="${escapeAttribute(partner.website_url)}" target="_blank" rel="noopener noreferrer">Visit partner website ↗</a>`
    : `<a class="ext-link" href="#" data-pending-link data-pending-message="The website link for ${escapeAttribute(partner.name)} still needs confirmation.">Website link pending</a>`;

  return `<article class="partner-card" data-solutions-url="${escapeAttribute(partner.solutions_url || '')}">
    <span class="partner-flag">${escapeHTML(partner.flag || '')}</span>
    <div class="partner-card-content">
      <div class="origin">${escapeHTML(partner.country || '')}</div>
      <h4>${escapeHTML(partner.name)}</h4>
      <p>${escapeHTML(partner.description || '')}</p>
      <div class="partner-categories">${tags}</div>
      ${website}
    </div>
    ${logo}
  </article>`;
}

function renderResources(resources) {
  const grid = document.querySelector('.doc-grid');
  if (!grid || !Array.isArray(resources)) return;

  grid.innerHTML = resources.map((resource) => {
    const action = resource.file
      ? `<a class="btn-download-doc" href="${escapeAttribute(resource.file)}" target="_blank" rel="noopener">↓ Download</a>`
      : '<button class="btn-download-doc" type="button">↓ Request</button>';
    return `<article class="doc-card" data-category="${escapeAttribute(resource.category)}">
      <span class="doc-card-type">${escapeHTML(resource.type_label)}</span>
      <h4>${escapeHTML(resource.title)}</h4>
      <div class="doc-card-meta">
        <span>${escapeHTML(resource.file_meta || 'File available on request')}</span>
        ${action}
      </div>
    </article>`;
  }).join('');
}

function renderJobs(jobs) {
  const list = document.querySelector('.job-list-placeholder');
  if (!list || !Array.isArray(jobs)) return;

  const openJobs = jobs.filter((job) => job.open);
  const categories = [...new Set(openJobs.map((job) => job.category))];
  list.innerHTML = categories.map((category) => {
    const categoryJobs = openJobs.filter((job) => job.category === category);
    return `<div class="job-category">
      ${escapeHTML(category)}
      <span class="open-count">${categoryJobs.length} open</span>
    </div>
    ${categoryJobs.map((job) => `<div class="job-item">
      <div>
        <h4>${escapeHTML(job.title)}</h4>
        <span>${escapeHTML(job.location)} · ${escapeHTML(job.employment_type || 'Full-time')}</span>
      </div>
      <a href="mailto:careers@peic.in?subject=${encodeURIComponent(`Application: ${job.title}`)}" class="btn-apply">Apply →</a>
    </div>`).join('')}`;
  }).join('');
}

function renderPageSections(pages) {
  const specialties = document.querySelector('.specialty-grid');
  if (specialties && pages.solutions?.specialties) {
    specialties.innerHTML = pages.solutions.specialties.map((item) => `<article class="visual-card" id="${escapeAttribute(item.id)}">
      <div class="visual-card-img" style="background-image:url('${escapeAttribute(item.image || '')}')"></div>
      <div class="visual-card-body">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description || '')}</p>
        <a href="${escapeAttribute(item.link || 'contact.html')}" class="explore-portfolio">Explore portfolio →</a>
      </div>
    </article>`).join('');
  }

  const industries = document.querySelector('.industry-grid');
  if (industries && pages.solutions?.industries) {
    industries.innerHTML = pages.solutions.industries.map((item) => `<div class="industry-card ${item.featured ? 'featured' : ''}">
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description || '')}</p>
      <div class="industry-depts">${(item.tags || []).map((tag) => `<span class="industry-dept-tag">${escapeHTML(tag)}</span>`).join('')}</div>
    </div>`).join('');
  }

  const responseGrid = document.querySelector('.response-grid');
  if (responseGrid && pages.service?.process) {
    responseGrid.innerHTML = pages.service.process.map((item, index) => `<div class="placeholder-card response-step">
      <div class="placeholder-icon">${index + 1}</div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description || '')}</p>
    </div>`).join('');
  }

  const serviceGrid = document.querySelector('.service-grid');
  if (serviceGrid && pages.service?.offerings) {
    serviceGrid.innerHTML = pages.service.offerings.map((item) => `<div class="placeholder-card">
      <div class="placeholder-icon">${escapeHTML(item.icon || '')}</div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description || '')}</p>
    </div>`).join('');
  }

  const benefits = document.querySelector('.benefits-grid');
  if (benefits && pages.careers?.benefits) {
    benefits.innerHTML = pages.careers.benefits.map((item) => `<div class="benefit-card">
      <div class="benefit-card-icon">${escapeHTML(item.icon || '')}</div>
      <h4>${escapeHTML(item.title)}</h4>
      <p>${escapeHTML(item.description || '')}</p>
    </div>`).join('');
    setText('.culture-callout h3', pages.careers.culture_title);
    setText('.culture-callout p', pages.careers.culture_subtitle);
    setText('.culture-values', pages.careers.culture_values);
  }
}

function renderTrustContent(about) {
  if (Array.isArray(about.metrics)) {
    document.querySelectorAll('.stats-row').forEach((grid) => {
      grid.innerHTML = about.metrics.map((metric) => `<div class="stat-item">
        <div class="stat-number cms-stat-number">${escapeHTML(metric.prefix || '')}${Number(metric.value).toLocaleString()}${escapeHTML(metric.suffix || '')}</div>
        <div class="stat-tagline">${escapeHTML(metric.tagline || '')}</div>
        <div class="stat-label">${escapeHTML(metric.label)}</div>
      </div>`).join('');
    });
  }

  const masonry = document.querySelector('.masonry-grid');
  if (masonry && Array.isArray(about.facilities)) {
    masonry.innerHTML = about.facilities.map((facility, index) => `<div class="masonry-item ${index === 0 ? 'large' : ''}">
      <img src="${escapeAttribute(facility.image)}" alt="${escapeAttribute(facility.title)}" loading="lazy">
      <div class="masonry-overlay"><span>${escapeHTML(facility.title)}</span></div>
    </div>`).join('');
  }

  if (Array.isArray(about.clients)) {
    const clientHTML = about.clients.map((client) => {
      const logo = client.logo
        ? `<img src="${escapeAttribute(client.logo)}" alt="${escapeAttribute(client.name)} logo">`
        : escapeHTML(client.short_name);
      return `<div class="client-card">
        <div class="client-logo ${client.logo ? 'has-image' : ''}">${logo}</div>
        <div class="client-name">${escapeHTML(client.name)}</div>
        <div class="client-tagline">${escapeHTML(client.tagline || '')}</div>
      </div>`;
    }).join('');
    document.querySelectorAll('.logo-grid').forEach((grid) => {
      grid.innerHTML = clientHTML;
    });
  }

  const testimonials = (about.testimonials || []).filter((item) => item.published);
  const testimonialHTML = testimonials.map(testimonialCardHTML).join('');
  const staticRow = document.querySelector('.testimonial-static-row');
  if (staticRow && testimonialHTML) staticRow.innerHTML = testimonialHTML;
  const marquee = document.querySelector('.testimonial-marquee-track');
  if (marquee && testimonialHTML) marquee.innerHTML = testimonialHTML + testimonialHTML;

  const badgeGrid = document.querySelector('.badge-grid');
  if (badgeGrid && Array.isArray(about.certifications)) {
    badgeGrid.innerHTML = about.certifications.map((cert) => {
      const badge = `<div class="cert-badge">
        <div class="cert-icon">${escapeHTML(cert.icon)}</div>
        <div><h4>${escapeHTML(cert.name)}</h4><p class="cert-num">${escapeHTML(cert.details || '')}</p></div>
      </div>`;
      return cert.file
        ? `<a class="cert-link" href="${escapeAttribute(cert.file)}" target="_blank" rel="noopener">${badge}<span class="cert-download-indicator">↓</span></a>`
        : badge;
    }).join('');
  }
}

function testimonialCardHTML(testimonial) {
  return `<div class="testimonial-card">
    <p class="testimonial-quote">${escapeHTML(testimonial.quote)}</p>
    <div class="testimonial-author">${escapeHTML(testimonial.author)}</div>
    <div class="testimonial-role">${escapeHTML(testimonial.role || '')}</div>
  </div>`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function setBackgroundImage(selector, image) {
  const element = document.querySelector(selector);
  if (element && image) {
    element.style.backgroundImage = `linear-gradient(105deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.55) 55%, rgba(15, 23, 42, 0.3) 100%), url("${image.replace(/"/g, '%22')}")`;
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

function escapeAttribute(value) {
  return escapeHTML(value);
}

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
  document.querySelectorAll('[data-product-action]').forEach((button) => {
    button.addEventListener('click', () => {
      openProductLeadModal({
        mode: button.dataset.productAction,
        product: button.dataset.productName,
        file: button.dataset.productFile
      });
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

function openProductLeadModal({ mode, product, file }) {
  const modal = getProductLeadModal();
  const form = modal.querySelector('.product-lead-form');
  const title = modal.querySelector('#product-lead-title');
  const intro = modal.querySelector('.product-lead-intro');
  const submit = form.querySelector('[type="submit"]');

  form.reset();
  form.dataset.mode = mode;
  form.dataset.file = file || '';
  form.querySelector('[name="product"]').value = product;
  form.querySelector('[name="subject"]').value = mode === 'gated_download'
    ? `PEIC specification download: ${product}`
    : `PEIC product enquiry: ${product}`;
  title.textContent = mode === 'gated_download' ? 'Get Technical Specifications' : 'Request Product Information';
  intro.textContent = mode === 'gated_download'
    ? `Tell us where to send follow-up information for ${product}. Your document will open after submission.`
    : `Tell us about your interest in ${product}. PEIC will contact you with the appropriate specifications and configuration options.`;
  submit.textContent = mode === 'gated_download' ? 'Submit & Download' : 'Send Request';
  resetFormStatus(form);

  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.querySelector('[name="name"]').focus();
}

function getProductLeadModal() {
  let modal = document.querySelector('.product-lead-modal');
  if (modal) return modal;

  modal = document.createElement('div');
  modal.className = 'product-lead-modal';
  modal.hidden = true;
  modal.innerHTML = `<div class="product-lead-backdrop" data-close-product-modal></div>
    <section class="product-lead-dialog" role="dialog" aria-modal="true" aria-labelledby="product-lead-title">
      <button class="product-lead-close" type="button" aria-label="Close" data-close-product-modal>×</button>
      <h2 id="product-lead-title">Request Product Information</h2>
      <p class="product-lead-intro"></p>
      <form class="product-lead-form">
        <input type="hidden" name="access_key" value="e36c05ee-2b9e-4cb0-b517-f79441d69cb5">
        <input type="hidden" name="subject" value="PEIC product enquiry">
        <input type="hidden" name="from_name" value="PEIC Product Catalogue">
        <input type="hidden" name="product" value="">
        <input type="hidden" name="enquiry_type" value="Product information / specifications">
        <input type="checkbox" name="botcheck" class="form-honeypot" tabindex="-1" autocomplete="off">
        <div class="form-status" role="status" aria-live="polite"></div>
        <div class="form-row">
          <div class="form-group">
            <label for="product-lead-name">Full Name *</label>
            <input id="product-lead-name" type="text" name="name" autocomplete="name" required>
          </div>
          <div class="form-group">
            <label for="product-lead-company">Company / Institution *</label>
            <input id="product-lead-company" type="text" name="company" autocomplete="organization" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="product-lead-email">Work Email *</label>
            <input id="product-lead-email" type="email" name="email" autocomplete="email" required>
          </div>
          <div class="form-group">
            <label for="product-lead-phone">Phone Number *</label>
            <input id="product-lead-phone" type="tel" name="phone" autocomplete="tel" required>
          </div>
        </div>
        <label class="form-consent">
          <input type="checkbox" name="privacy-consent" value="accepted" required>
          <span>I agree that PEIC may use these details to respond to my request, as described in the <a href="privacy.html">Privacy Policy</a>.</span>
        </label>
        <button type="submit" class="btn btn-primary product-lead-submit">Send Request</button>
      </form>
    </section>`;
  document.body.appendChild(modal);

  modal.querySelectorAll('[data-close-product-modal]').forEach((button) => {
    button.addEventListener('click', closeProductLeadModal);
  });
  modal.querySelector('.product-lead-form').addEventListener('submit', submitProductLead);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeProductLeadModal();
  });
  return modal;
}

function closeProductLeadModal() {
  const modal = document.querySelector('.product-lead-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

async function submitProductLead(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  const submit = form.querySelector('[type="submit"]');
  const defaultLabel = form.dataset.mode === 'gated_download' ? 'Submit & Download' : 'Send Request';

  submit.disabled = true;
  submit.textContent = 'Sending...';
  status.textContent = 'Sending your request securely...';
  status.className = 'form-status visible';

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
    if (!response.ok || !result.success) throw new Error(result.message || 'Submission failed');

    if (form.dataset.mode === 'gated_download' && form.dataset.file) {
      status.textContent = 'Thank you. Your request was sent and the document is opening now.';
      status.className = 'form-status success visible';
      window.setTimeout(() => {
        window.location.assign(form.dataset.file);
      }, 500);
    } else {
      status.textContent = 'Thank you. Your request has been sent. PEIC will contact you shortly.';
      status.className = 'form-status success visible';
      form.reset();
    }
  } catch (error) {
    status.innerHTML = 'We could not send the request. Please try again or email <a href="mailto:sales@peic.in">sales@peic.in</a>.';
    status.className = 'form-status error visible';
  } finally {
    submit.disabled = false;
    submit.textContent = defaultLabel;
  }
}

function resetFormStatus(form) {
  const status = form.querySelector('.form-status');
  if (!status) return;
  status.textContent = '';
  status.className = 'form-status';
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
  const params = new URLSearchParams(window.location.search);
  const requestedType = params.get('type');
  if (requestedType && [...inquiryType.options].some((option) => option.value === requestedType)) {
    inquiryType.value = requestedType;
  }
  const product = params.get('product');
  const message = document.querySelector('#message');
  if (product && message && !message.value) {
    message.value = `I am interested in: ${product}`;
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

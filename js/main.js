/* PEIC — Shared interactions */

const peicState = {
  site: {}
};
const CMS_CACHE_PREFIX = 'peic-cms-cache:';

document.addEventListener('DOMContentLoaded', async () => {
  setCMSLoadingState(true);
  initHeaderState();
  await initCMSContent();
  initMobileNav();
  initFloatingCTAVisibility();
  initCounters();
  initRevealAnimations();
  initDownloadSpecs();
  initResourceFilter();
  initContactForm();
  initQueryDefaults();
  initPartnerCards();
});

async function initCMSContent() {
  const page = document.body;
  const route = getCurrentRoute();
  const pageFiles = {
    home: 'home',
    products: 'products-page',
    solutions: 'solutions-page',
    about: 'about',
    service: 'service-page',
    resources: 'resources-page',
    careers: 'careers-page',
    contact: 'contact-page',
    privacy: 'privacy-page',
    '404': 'not-found-page'
  };
  const isProductDetailPage = page.classList.contains('product-detail-page');
  const requestedFiles = ['site'];
  if (pageFiles[route]) requestedFiles.push(pageFiles[route]);
  if (isProductDetailPage && !requestedFiles.includes('products-page')) requestedFiles.push('products-page');
  if (route !== 'about' && page.querySelector('.logo-grid')) requestedFiles.push('about');

  const cachedResults = requestedFiles
    .map((name) => {
      const cached = readCachedCMSData(name);
      return cached ? { [name]: cached } : null;
    })
    .filter(Boolean);

  if (cachedResults.length) {
    applyCMSData(Object.assign({}, ...cachedResults), route, pageFiles, isProductDetailPage);
    setCMSLoadingState(false);
  }

  try {
    const requests = requestedFiles.map((name) => fetchCMSData(name));
    const results = await Promise.all(requests);
    applyCMSData(Object.assign({}, ...results), route, pageFiles, isProductDetailPage);
  } catch (error) {
    console.warn('CMS content could not be loaded; using built-in page content.', error);
  } finally {
    setCMSLoadingState(false);
  }
}

function applyCMSData(data, route, pageFiles, isProductDetailPage) {
  if (data.site) {
    peicState.site = data.site;
    renderSiteContent(data.site, isProductDetailPage ? 'products' : route);
  }
  if (isProductDetailPage) {
    renderProductDetailPage(data['products-page']);
  } else {
    renderCurrentPage(route, data[pageFiles[route]]);
  }
  if (data.about) renderTrustContent(data.about);
}

function getCurrentRoute() {
  const filename = window.location.pathname.split('/').pop() || 'index.html';
  return filename === 'index.html' ? 'home' : filename.replace(/\.html$/, '');
}

async function fetchCMSData(name) {
  const response = await fetch(`content/${name}.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Unable to load ${name} content`);
  const data = await response.json();
  writeCachedCMSData(name, data);
  return { [name]: data };
}

function renderSiteContent(site, route = getCurrentRoute()) {
  renderSEOContent(site.seo?.[route], route);
  renderOrganizationSchema(site);
  renderNavigation(site.navigation, route);
  document.querySelectorAll('.logo-name').forEach((el) => {
    el.textContent = site.company_name;
  });
  document.querySelectorAll('.logo-tagline').forEach((el) => {
    el.textContent = site.tagline;
  });
  document.querySelectorAll('.logo-mark').forEach((el) => {
    if (site.short_name) el.textContent = site.short_name;
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
  document.querySelectorAll('.hotline-label').forEach((el) => {
    if (site.hotline_label) el.textContent = site.hotline_label;
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

  renderFooter(site);
  renderFloatingCTA(site.floating_cta);
  renderStandaloneHeaderCTA(site.navigation?.cta);
}

function renderSEOContent(seo, route) {
  const siteURL = (peicState.site.site_url || 'https://peic.in').replace(/\/+$/, '');
  if (!seo) return;
  const seoImage = seo.image ? absoluteSiteURL(normalizeAssetURL(seo.image), siteURL) : '';
  if (seo.title) document.title = seo.title;
  setMetaContent('meta[name="description"]', seo.description);
  setMetaContent('meta[property="og:title"]', seo.title);
  setMetaContent('meta[property="og:description"]', seo.description);
  setMetaContent('meta[property="og:image"]', seoImage);
  setMetaContent('meta[property="og:url"]', `${siteURL}/${route === 'home' ? '' : `${route}.html`}`);
  setAttribute('link[rel="canonical"]', 'href', `${siteURL}/${route === 'home' ? '' : `${route}.html`}`);
}

function setMetaContent(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.setAttribute('content', value);
}

function renderNavigation(navigation, route) {
  const nav = document.querySelector('.main-nav');
  if (!nav || !navigation) return;

  const items = Array.isArray(navigation.items) ? navigation.items : [];
  const cta = navigation.cta;
  const mobileHotline = `<a href="tel:${escapeAttribute(peicState.site.phone_link || '+919820033597')}" class="header-hotline header-hotline-mobile">
    <span class="hotline-label">${escapeHTML(peicState.site.hotline_label || 'Technical Support')}</span>
    <span class="hotline-number">${escapeHTML(peicState.site.phone_display || '+91 98200 33597')}</span>
  </a>`;
  nav.innerHTML = `${items.map((item) => navigationLinkHTML(item, route)).join('')}
    ${mobileHotline}
    ${cta ? navigationLinkHTML({ ...cta, cta: true }, route) : ''}`;

  const toggle = document.querySelector('.mobile-toggle');
  if (toggle && navigation.mobile_label) toggle.setAttribute('aria-label', navigation.mobile_label);
}

function navigationLinkHTML(item, route) {
  const isActive = item.route === route || (!item.route && getRouteFromHref(item.href) === route);
  const classes = [item.cta ? 'nav-cta' : '', isActive ? 'active' : ''].filter(Boolean).join(' ');
  const classAttr = classes ? ` class="${escapeAttribute(classes)}"` : '';
  const ariaCurrent = isActive ? ' aria-current="page"' : '';
  return `<a href="${escapeAttribute(item.href || '#')}"${classAttr}${ariaCurrent}>${escapeHTML(item.label || '')}</a>`;
}

function getRouteFromHref(href = '') {
  const filename = href.split('?')[0].split('#')[0].split('/').pop() || 'index.html';
  return filename === 'index.html' ? 'home' : filename.replace(/\.html$/, '');
}

function renderFooter(site) {
  const footer = document.querySelector('.site-footer');
  const footerGrid = footer?.querySelector('.footer-grid');
  const footerBottom = footer?.querySelector('.footer-bottom');
  if (!footer || !footerGrid || !site.footer) return;

  const columns = Array.isArray(site.footer.columns) ? site.footer.columns : [];
  footerGrid.innerHTML = `<div class="footer-brand">
      <a href="index.html" class="logo">
        <div class="logo-mark">${escapeHTML(site.short_name || 'PEIC')}</div>
        <div class="logo-text">
          <span class="logo-name" style="color: white;">${escapeHTML(site.company_name || '')}</span>
          <span class="logo-tagline">${escapeHTML(site.tagline || '')}</span>
        </div>
      </a>
      <p>${escapeHTML(site.footer.description || site.footer_description || '')}</p>
      ${site.footer.address ? `<p class="footer-address">${escapeHTML(site.footer.address)}</p>` : ''}
      <div class="footer-hotline">
        <a href="tel:${escapeAttribute(site.phone_link || '')}">${escapeHTML(site.footer.hotline_label || 'Phone:')} ${escapeHTML(site.phone_display || '')}</a>
      </div>
    </div>
    ${columns.map((column) => `<div class="footer-col">
      <h4>${escapeHTML(column.title || '')}</h4>
      ${(column.links || []).map((link) => `<a href="${escapeAttribute(link.href || '#')}">${escapeHTML(link.label || '')}</a>`).join('')}
    </div>`).join('')}`;

  if (footerBottom) {
    footerBottom.innerHTML = `<span>${escapeHTML(site.footer.copyright || '')}</span>
      <span>${escapeHTML(site.footer.certification_strip || '')}</span>`;
  }
}

function renderFloatingCTA(cta) {
  const element = document.querySelector('.floating-cta');
  if (!element || !cta) return;
  element.href = cta.href || element.href;
  element.setAttribute('aria-label', cta.aria_label || cta.label || 'Make an enquiry');
  const svg = element.querySelector('svg')?.outerHTML || '';
  element.innerHTML = `${svg}${escapeHTML(cta.label || 'Make an Enquiry')}`;
}

function renderStandaloneHeaderCTA(cta) {
  const link = document.querySelector('.site-header .btn[href="contact.html"]');
  if (!link || !cta) return;
  link.textContent = cta.label || link.textContent;
  link.href = cta.href || link.href;
}

function renderOrganizationSchema(site) {
  const script = document.querySelector('#organization-schema');
  if (!script || !site) return;
  const schema = site.organization_schema || {};
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: schema.name || site.company_name,
    url: schema.url || site.site_url,
    telephone: schema.telephone || site.phone_link,
    email: schema.email || site.general_email,
    foundingDate: schema.founding_date || '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: schema.street_address || '',
      addressLocality: schema.address_locality || '',
      postalCode: schema.postal_code || '',
      addressRegion: schema.address_region || '',
      addressCountry: schema.address_country || ''
    }
  }, null, 2);
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
    contact: renderContactPage,
    privacy: renderPrivacyPage,
    '404': renderNotFoundPage
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
  renderHeroPanel(home.hero_panel);

  const banner = document.querySelector('.trust-banner-inner');
  if (banner && Array.isArray(home.trust_banner)) {
    banner.innerHTML = home.trust_banner
      .map((item, index) => `${index ? '<span class="sep">|</span>' : ''}<span>${escapeHTML(item)}</span>`)
      .join('');
  }

  setHeadingBlock('.dual-cards', home.capabilities);
  const cards = document.querySelector('.dual-cards');
  if (cards && Array.isArray(home.capabilities?.cards)) {
    cards.innerHTML = home.capabilities.cards.map((card, index) => `<a href="${escapeAttribute(card.link || '#')}" class="cap-card-link">
      <div class="cap-card cap-card-image"${card.image ? ` style="--card-image:url('${escapeAttribute(normalizeAssetURL(card.image))}')"` : ''}>
        <div class="cap-card-body">
          <span class="cap-index">${String(index + 1).padStart(2, '0')}</span>
          <h3>${escapeHTML(card.title)}</h3>
          <p>${escapeHTML(card.description || '')}</p>
          <ul class="cap-advantages">${(card.advantages || []).map((item) => `<li><span class="tick">✓</span> <strong>${escapeHTML(item)}</strong></li>`).join('')}</ul>
          <div class="cap-card-footer"><span>${escapeHTML(card.button_label || 'Learn more')}</span> <span class="arrow">→</span></div>
        </div>
      </div>
    </a>`).join('');
  }

  renderHomeWorkflow(home.workflow);

  const sections = document.querySelectorAll('section');
  const advantageSection = [...sections].find((section) => section.querySelector('.stats-row'));
  setHeading(advantageSection, home.advantage);
  const clientsSection = [...sections].find((section) => section.querySelector('.logo-grid'));
  setHeading(clientsSection, home.clients);
  const ctaSection = document.querySelector('.home-cta .home-cta-inner')
    || [...sections].find((section) => section.classList.contains('bg-dark') && section.querySelector('.container .btn'))?.querySelector('.container');
  setCallout(ctaSection, home.cta);
}

function renderHomeWorkflow(workflow) {
  const section = document.querySelector('.engineering-chain');
  if (!section || !workflow) return;
  setTextWithin(section, '.section-label', workflow.label);
  setTextWithin(section, '.section-title', workflow.title);
  setTextWithin(section, '.section-subtitle', workflow.description);
  const steps = section.querySelector('.chain-steps');
  if (!steps || !Array.isArray(workflow.steps)) return;
  steps.innerHTML = workflow.steps.map((step, index) => `<div class="chain-step">
    <span>${String(index + 1).padStart(2, '0')}</span>
    <strong>${escapeHTML(step.title || '')}</strong>
    <p>${escapeHTML(step.description || '')}</p>
  </div>`).join('');
}

function renderHeroPanel(panel) {
  const element = document.querySelector('.precision-panel');
  if (!element || !panel) return;
  const specs = Array.isArray(panel.specs) ? panel.specs : [];
  element.innerHTML = `<div class="panel-kicker">${escapeHTML(panel.kicker || '')}</div>
    <div class="panel-gauge">
      <span>${escapeHTML(panel.metric || '')}</span>
      <strong>${escapeHTML(panel.title || '')}</strong>
      ${panel.description ? `<p>${escapeHTML(panel.description)}</p>` : ''}
    </div>
    <div class="panel-spec-grid">
      ${specs.map((item) => `<div><span>${escapeHTML(item.label || '')}</span><strong>${escapeHTML(item.value || '')}</strong></div>`).join('')}
    </div>`;
}

function renderProductsPage(page) {
  setPageHero(page.hero);
  renderTier('#manufacturing', page.manufacturing);
  renderTier('#partners', page.partners);
  setText('#partners .container > h3', page.partners?.global_title);
  const partnerHeadings = document.querySelectorAll('#partners .container > h3');
  if (partnerHeadings[1] && page.partners?.domestic_title) partnerHeadings[1].textContent = page.partners.domestic_title;
  renderProducts(page.manufactured_products);
  renderManufacturedRange(page.manufactured_range);
  renderHospitalScope(page.hospital_scope);
  renderPartners(page.partner_companies);
  setCallout(document.querySelector('.products-cta .home-cta-inner'), page.cta);
}

function renderTier(selector, tier) {
  const section = document.querySelector(selector);
  if (!section || !tier) return;
  setTextWithin(section, '.tier-header .tier-badge', tier.badge);
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
  setPageHero(page.hero);
  setHeading(document.querySelector('.legacy-section'), page.legacy);
  const legacyCopy = document.querySelector('.legacy-section .two-col-split > div');
  if (legacyCopy && Array.isArray(page.legacy?.paragraphs)) {
    legacyCopy.querySelectorAll('p').forEach((paragraph) => paragraph.remove());
    legacyCopy.insertAdjacentHTML('beforeend', page.legacy.paragraphs.map((text) => `<p style="color:var(--slate-light);margin-bottom:1rem">${escapeHTML(text)}</p>`).join(''));
  }
  const legacyImage = document.querySelector('.legacy-image');
  if (legacyImage && page.legacy?.image) {
    legacyImage.src = normalizeAssetURL(page.legacy.image);
    legacyImage.alt = page.legacy.image_alt || legacyImage.alt;
  }
  setHeading(document.querySelector('.metrics-section'), page.metrics_heading);
  setHeading(document.querySelector('.facilities-section'), page.facilities_heading);
  setHeading(document.querySelector('.clients-section'), page.clients_heading);
  setHeading(document.querySelector('.testimonials-section'), page.testimonials_heading);
  setHeading(document.querySelector('.certifications-section'), page.certifications_heading);
  setCallout(document.querySelector('.about-cta .home-cta-inner'), page.cta);
}

function renderServicePage(page) {
  setPageHero(page.hero);
  setHeading(document.querySelector('.response-grid')?.closest('section'), page.process_heading);
  setHeading(document.querySelector('.service-grid')?.closest('section'), page.offerings_heading);
  renderPageSections({ service: page });
  setCallout(document.querySelector('.custom-solution-box'), page.custom_cta);
  setCallout(document.querySelector('.urgent-service-banner'), page.urgent_cta);
}

function renderResourcesPage(page) {
  setPageHero(page.hero);
  setAttribute('#resource-search', 'placeholder', page.search_placeholder);
  renderResourceFilters(page.filters);
  const grid = document.querySelector('.doc-grid');
  if (grid && page.empty_state) {
    grid.dataset.emptyText = page.empty_state.text || '';
    grid.dataset.emptyLinkLabel = page.empty_state.link_label || '';
    grid.dataset.emptyLink = page.empty_state.link || '';
  }
  renderResources(page.resources);
  setCallout(document.querySelector('.missing-doc-cta'), page.help_cta);
}

function renderResourceFilters(filters) {
  const container = document.querySelector('.filter-tabs');
  if (!container || !Array.isArray(filters)) return;
  container.innerHTML = filters.map((filter, index) => `<button class="filter-tab ${index === 0 ? 'active' : ''}" data-filter="${escapeAttribute(filter.value || 'all')}">
    ${escapeHTML(filter.label || '')} <span class="tab-count">(0)</span>
  </button>`).join('');
}

function renderCareersPage(page) {
  peicState.careers = page;
  setPageHero(page.hero);
  renderPageSections({ careers: {
    benefits: page.benefits,
    culture_title: page.culture?.title,
    culture_subtitle: page.culture?.subtitle,
      culture_values: page.culture?.values
  } });
  const jobsSection = document.querySelector('.job-list')?.closest('section');
  const heading = jobsSection?.querySelector('.job-list')?.previousElementSibling;
  if (heading) {
    setTextWithin(heading, '.section-label', page.jobs_heading?.label);
    setTextWithin(heading, '.section-title', page.jobs_heading?.title);
  }
  renderJobs(page.jobs);
  setCallout(document.querySelector('.general-app-cta'), page.open_application);
  const followup = document.querySelector('.general-app-cta .general-application-note');
  if (followup) {
    const note = page.general_email_note || '';
    const emailLabel = page.general_email_label || peicState.site.careers_email || '';
    const emailHref = page.general_email_link || (peicState.site.careers_email ? `mailto:${peicState.site.careers_email}` : '');
    followup.hidden = !note;
    if (note) {
      followup.innerHTML = `${escapeHTML(note).replace(
        escapeHTML(emailLabel),
        emailHref ? `<a href="${escapeAttribute(emailHref)}" style="color: var(--green); font-weight: 600;">${escapeHTML(emailLabel)}</a>` : escapeHTML(emailLabel)
      )}`;
    }
  }
}

function renderContactPage(page) {
  setText('.contact-page-heading .section-label', page.hero?.label);
  setText('.contact-page-heading h1', page.hero?.title);
  setText('.contact-page-heading p', page.hero?.description);
  renderContactInfo(page);
  setText('.contact-form > h3', page.form_title);
  setText('.contact-form .form-desc', page.form_description);
  renderContactFormCopy(page);
}

function renderContactInfo(page) {
  const block = document.querySelector('.contact-info-block');
  if (!block || !page) return;
  const channels = (page.contact_channels || []).map((channel) => `<div class="contact-detail">
    <div class="contact-detail-icon">${escapeHTML(channel.icon || '')}</div>
    <div>
      <strong>${escapeHTML(channel.title || '')}</strong>
      <span><a href="${escapeAttribute(channel.href || '#')}">${escapeHTML(channel.label || '')}</a></span>
    </div>
  </div>`).join('');
  const offices = (page.offices || []).map((office) => `<div class="office-item">
    ${office.label ? `<span class="office-label">${escapeHTML(office.label)}</span>` : ''}
    <h4>${escapeHTML(office.title || '')}</h4>
    <p>${(office.address_lines || []).map(escapeHTML).join('<br>')}</p>
  </div>`).join('');

  block.innerHTML = `<h3>${escapeHTML(page.teams_title || '')}</h3>
    ${channels}
    <div class="office-list">
      <h3 style="color: white; font-size: 1.1rem; margin-bottom: 1.25rem;">${escapeHTML(page.office_title || '')}</h3>
      ${offices}
    </div>`;
}

function renderContactFormCopy(page) {
  const form = document.querySelector('.contact-form');
  if (!form || !page) return;
  const fields = page.fields || {};
  const formService = peicState.site.form_service || {};
  form.dataset.submitLabel = page.submit_label || 'Submit Enquiry';
  form.dataset.sendingLabel = page.sending_label || 'Sending...';
  form.dataset.sendingStatus = page.sending_status || '';
  form.dataset.successMessage = page.success_message || '';
  form.dataset.errorMessage = page.error_message || '';
  form.action = formService.endpoint || 'https://api.web3forms.com/submit';
  setFormHiddenValue(form, 'access_key', formService.access_key || '');
  setFormHiddenValue(form, 'subject', formService.contact_subject || 'New PEIC website enquiry');
  setFormHiddenValue(form, 'from_name', formService.contact_from_name || 'PEIC Website');
  setFormHiddenValue(form, 'destination_email', formService.destination_email || peicState.site.enquiry_email || '');

  setFormLabel('name', fields.name_label);
  setAttribute('#name', 'placeholder', fields.name_placeholder);
  setFormLabel('email', fields.email_label);
  setAttribute('#email', 'placeholder', fields.email_placeholder);
  setFormLabel('phone', fields.phone_label);
  setAttribute('#phone', 'placeholder', fields.phone_placeholder);
  setFormLabel('organization', fields.organization_label, fields.organization_optional);
  setAttribute('#organization', 'placeholder', fields.organization_placeholder);
  setFormLabel('designation', fields.designation_label, fields.designation_optional);
  setAttribute('#designation', 'placeholder', fields.designation_placeholder);
  setFormLabel('department', fields.department_label, fields.department_optional);
  setAttribute('#department', 'placeholder', fields.department_placeholder);
  setFormLabel('city-region', fields.city_label);
  setAttribute('#city-region', 'placeholder', fields.city_placeholder);
  setFormLabel('buying-timeline', fields.timeline_label);
  setFormLabel('inquiry-type', fields.inquiry_type_label);
  setFormLabel('quantity-scope', fields.quantity_label, fields.quantity_optional);
  setAttribute('#quantity-scope', 'placeholder', fields.quantity_placeholder);
  setFormLabel('tender-status', fields.tender_label, fields.tender_optional);
  setFormLabel('message', fields.message_label);
  setAttribute('#message', 'placeholder', fields.message_placeholder);

  renderSelectOptions('#buying-timeline', page.timeline_options);
  renderSelectOptions('#inquiry-type', page.inquiry_type_options);
  renderSelectOptions('#tender-status', page.tender_options);

  const consent = form.querySelector('.form-consent span');
  if (consent && fields.consent_text) {
    consent.innerHTML = `${escapeHTML(fields.consent_text).replace(
      escapeHTML(fields.privacy_label || 'Privacy Policy'),
      `<a href="${escapeAttribute(fields.privacy_link || 'privacy.html')}">${escapeHTML(fields.privacy_label || 'Privacy Policy')}</a>`
    )}`;
  }
  const submit = form.querySelector('[type="submit"]');
  if (submit && page.submit_label) submit.textContent = page.submit_label;
}

function setFormLabel(forId, label, optional) {
  const element = document.querySelector(`label[for="${forId}"]`);
  if (!element || !label) return;
  element.innerHTML = `${escapeHTML(label)}${optional ? ` <span class="optional-label">${escapeHTML(optional)}</span>` : ''}`;
}

function setFormHiddenValue(form, name, value) {
  const field = form?.querySelector(`[name="${name}"]`);
  if (field) field.value = value || '';
}

function renderSelectOptions(selector, options) {
  const select = document.querySelector(selector);
  if (!select || !Array.isArray(options)) return;
  select.innerHTML = options.map((option) => `<option value="${escapeAttribute(option.value || '')}">${escapeHTML(option.label || '')}</option>`).join('');
}

function renderPrivacyPage(page) {
  const content = document.querySelector('.legal-content');
  if (!content || !page) return;
  content.innerHTML = `<h1>${escapeHTML(page.title || '')}</h1>
    ${page.last_updated ? `<p>${escapeHTML(page.last_updated)}</p>` : ''}
    ${page.intro ? `<p>${escapeHTML(page.intro)}</p>` : ''}
    ${page.business_context ? `<p>${escapeHTML(page.business_context)}</p>` : ''}
    ${(page.sections || []).map((section) => `<h2>${escapeHTML(section.title || '')}</h2>
      <p>${linkifyEmailMessage(section.body || '')}</p>`).join('')}
    <a href="${escapeAttribute(page.button_link || 'index.html')}" class="btn btn-primary">${escapeHTML(page.button_label || 'Back to Homepage')}</a>`;
}

function renderNotFoundPage(page) {
  const content = document.querySelector('.legal-content');
  if (!content || !page) return;
  content.innerHTML = `<div class="logo-mark" style="margin: 0 auto 2rem;">${escapeHTML(peicState.site.short_name || 'PEIC')}</div>
    <p class="section-label">${escapeHTML(page.label || 'Error 404')}</p>
    <h1>${escapeHTML(page.title || 'Page not found')}</h1>
    <p>${escapeHTML(page.description || '')}</p>
    <a href="${escapeAttribute(page.button_link || 'index.html')}" class="btn btn-primary">${escapeHTML(page.button_label || 'Back to Homepage')}</a>`;
}

function setPageHero(hero) {
  const heroSection = document.querySelector('.page-hero-sm');
  if (heroSection) {
    if (hero?.image) {
      heroSection.style.setProperty('--page-hero-image', `url("${normalizeAssetURL(hero.image).replace(/"/g, '%22')}")`);
    } else {
      heroSection.style.removeProperty('--page-hero-image');
    }
  }
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
  setTextWithin(container, '.section-label', callout.label);
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

function renderProducts(products) {
  const grid = document.querySelector('.product-grid');
  if (!grid || !Array.isArray(products)) return;

  grid.innerHTML = products.map((product) => {
    const detailURL = product.detail_url || product.url || `product-detail.html?product=${encodeURIComponent(product.slug || product.name || '')}`;
    const detailLabel = product.detail_label || 'See details';
    const enquiryLabel = product.enquiry_label || product.action_label || 'Submit enquiry';

    return `<article class="product-card featured"${product.image ? ` style="--card-image:url('${escapeAttribute(normalizeAssetURL(product.image))}')"` : ''}>
      <a class="product-card-link-overlay" href="${escapeAttribute(detailURL)}" aria-label="${escapeAttribute(`See details for ${product.name}`)}"></a>
      <div class="product-card-content">
        <h4>${escapeHTML(product.name)}</h4>
        ${product.certification ? `<div class="cert">${escapeHTML(product.certification)}</div>` : ''}
        <p>${escapeHTML(product.description || '')}</p>
        <div class="product-actions">
          <a class="download-specs product-detail-link" href="${escapeAttribute(detailURL)}">${escapeHTML(detailLabel)} →</a>
          <button class="download-specs product-enquiry-button" type="button"
            data-product-action="enquiry_only"
            data-product-name="${escapeAttribute(product.name)}"
            data-product-file="">${escapeHTML(enquiryLabel)} →</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function renderManufacturedRange(range) {
  const card = document.querySelector('.manufactured-range-card');
  if (!card || !range) return;

  setTextWithin(card, '.section-label', range.label);
  setTextWithin(card, 'h3', range.title);
  setTextWithin(card, 'p', range.description);

  const list = card.querySelector('.manufactured-range-list');
  if (list && Array.isArray(range.items)) {
    list.innerHTML = range.items.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
  }
}

function renderHospitalScope(scope) {
  const panel = document.querySelector('.hospital-scope-panel');
  if (!panel || !scope) return;

  setTextWithin(panel, '.section-label', scope.label);
  setTextWithin(panel, 'h3', scope.title);
  setTextWithin(panel, 'p', scope.description);

  const grid = panel.querySelector('.hospital-scope-grid');
  if (grid && Array.isArray(scope.items)) {
    grid.innerHTML = scope.items.map((item) => `<span>${escapeHTML(item)}</span>`).join('');
  }
}

function renderProductDetailPage(page) {
  const main = document.querySelector('.product-detail-main');
  if (!main || !page) return;

  const products = Array.isArray(page.manufactured_products) ? page.manufactured_products : [];
  const slug = getProductDetailSlug();
  const product = products.find((item) => item.slug === slug)
    || products.find((item) => item.detail_url && getRouteFromHref(item.detail_url) === slug);

  if (!product) {
    renderMissingProductDetail(main);
    return;
  }

  renderProductDetailSEO(product);
  const detail = product.detail || {};
  const image = normalizeAssetURL(product.image || page.hero?.image || '');
  const enquiryLabel = product.enquiry_label || product.action_label || 'Submit enquiry';

  main.innerHTML = `<section class="product-detail-hero">
      <div class="container product-detail-hero-inner">
        <div class="product-detail-copy">
          <nav class="product-breadcrumb" aria-label="Breadcrumb">
            <a href="products.html#manufacturing">Products</a>
            <span>${escapeHTML(product.name)}</span>
          </nav>
          <span class="section-label">${escapeHTML(detail.eyebrow || product.certification || 'PEIC manufactured')}</span>
          <h1>${escapeHTML(detail.title || product.name)}</h1>
          <p>${escapeHTML(detail.summary || product.description || '')}</p>
          ${quickFactsHTML(detail.quick_facts)}
          <div class="product-detail-actions">
            <button class="btn btn-primary product-detail-enquire" type="button"
              data-product-action="enquiry_only"
              data-product-name="${escapeAttribute(product.name)}"
              data-product-file="">${escapeHTML(enquiryLabel)}</button>
            <a class="btn btn-outline-green" href="products.html#manufacturing">All manufactured products</a>
          </div>
        </div>
        <figure class="product-detail-media">
          ${image ? `<img src="${escapeAttribute(image)}" alt="${escapeAttribute(product.name)}">` : ''}
        </figure>
      </div>
    </section>

    <section class="product-detail-section">
      <div class="container product-detail-layout">
        <article class="product-detail-panel product-detail-brief">
          <span class="section-label">Overview</span>
          <h2>${escapeHTML(detail.brief_title || 'What this product is suited for')}</h2>
          <p>${escapeHTML(detail.brief || product.description || '')}</p>
        </article>
        <aside class="product-detail-side">
          <h3>${escapeHTML(detail.customization_title || 'Configuration can be discussed around')}</h3>
          <ul class="product-detail-list">
            ${detailListHTML(detail.customization)}
          </ul>
        </aside>
      </div>
    </section>

    ${productOptionsSectionHTML(detail)}

    <section class="product-detail-section product-detail-highlights-section">
      <div class="container">
        <div class="section-header">
          <span class="section-label">${escapeHTML(detail.highlights_label || 'Public product guide')}</span>
          <h2 class="section-title">${escapeHTML(detail.highlights_title || 'Understand the fit before requesting specifications.')}</h2>
        </div>
        <div class="product-detail-card-grid">
          ${detailCardsHTML(detail.highlights)}
        </div>
      </div>
    </section>

    <section class="product-detail-section product-detail-fit-section">
      <div class="container product-detail-fit">
        <div>
          <span class="section-label">Common use cases</span>
          <h2>${escapeHTML(product.name)}</h2>
        </div>
        <ul class="product-application-list">
          ${detailListHTML(detail.applications)}
        </ul>
      </div>
    </section>

    ${buyerQuestionsSectionHTML(detail)}

    <section class="home-cta product-detail-cta">
      <div class="container">
        <div class="home-cta-inner">
          <span class="section-label">Product enquiry</span>
          <h2>${escapeHTML(detail.cta_title || 'Request product guidance')}</h2>
          <p>${escapeHTML(detail.cta_description || 'Share your requirement and PEIC will respond with suitable configuration guidance.')}</p>
          <button class="btn btn-primary product-detail-enquire" type="button"
            data-product-action="enquiry_only"
            data-product-name="${escapeAttribute(product.name)}"
            data-product-file="">${escapeHTML(enquiryLabel)}</button>
        </div>
      </div>
    </section>`;
}

function getProductDetailSlug() {
  const params = new URLSearchParams(window.location.search);
  return document.body.dataset.productSlug
    || params.get('product')
    || getCurrentRoute();
}

function renderMissingProductDetail(main) {
  document.title = 'Product Not Found - PEIC';
  main.innerHTML = `<section class="product-detail-hero product-detail-missing">
    <div class="container product-detail-hero-inner">
      <div class="product-detail-copy">
        <nav class="product-breadcrumb" aria-label="Breadcrumb">
          <a href="products.html#manufacturing">Products</a>
          <span>Product not found</span>
        </nav>
        <span class="section-label">PEIC products</span>
        <h1>We could not find this product page.</h1>
        <p>Please return to the products page or send an enquiry and PEIC will help you find the right sterilizer category.</p>
        <div class="product-detail-actions">
          <a class="btn btn-primary" href="products.html#manufacturing">View products</a>
          <a class="btn btn-outline-green" href="contact.html?type=equipment">Submit enquiry</a>
        </div>
      </div>
    </div>
  </section>`;
}

function renderProductDetailSEO(product) {
  const detail = product.detail || {};
  const siteURL = (peicState.site.site_url || 'https://peic.in').replace(/\/+$/, '');
  const canonicalPath = product.detail_url || window.location.pathname.split('/').pop() || '';
  const canonicalURL = absoluteSiteURL(canonicalPath, siteURL);
  const image = product.image ? absoluteSiteURL(normalizeAssetURL(product.image), siteURL) : '';

  document.title = detail.seo_title || `${product.name} | PEIC`;
  setMetaContent('meta[name="description"]', detail.seo_description || product.description);
  setMetaContent('meta[property="og:title"]', detail.seo_title || `${product.name} | PEIC`);
  setMetaContent('meta[property="og:description"]', detail.seo_description || product.description);
  setMetaContent('meta[property="og:image"]', image);
  setMetaContent('meta[property="og:url"]', canonicalURL);
  setAttribute('link[rel="canonical"]', 'href', canonicalURL);
}

function absoluteSiteURL(path, siteURL) {
  if (!path) return siteURL;
  try {
    return new URL(path, `${siteURL}/`).href;
  } catch (error) {
    return `${siteURL}/${String(path).replace(/^\/+/, '')}`;
  }
}

function detailCardsHTML(cards) {
  if (!Array.isArray(cards) || !cards.length) return '';
  return cards.map((card) => `<article class="product-detail-card">
    <h3>${escapeHTML(card.title || '')}</h3>
    <p>${escapeHTML(card.description || '')}</p>
  </article>`).join('');
}

function quickFactsHTML(facts) {
  if (!Array.isArray(facts) || !facts.length) return '';
  return `<dl class="product-quick-facts">
    ${facts.map((fact) => `<div>
      <dt>${escapeHTML(fact.label || '')}</dt>
      <dd>${escapeHTML(fact.value || '')}</dd>
    </div>`).join('')}
  </dl>`;
}

function productOptionsSectionHTML(detail) {
  const options = Array.isArray(detail.options) ? detail.options : [];
  if (!options.length) return '';
  return `<section class="product-detail-section product-options-section">
    <div class="container">
      <div class="section-header">
        <span class="section-label">${escapeHTML(detail.options_label || 'Main options')}</span>
        <h2 class="section-title">${escapeHTML(detail.options_title || 'Configuration choices buyers usually compare.')}</h2>
        ${detail.options_intro ? `<p class="section-subtitle">${escapeHTML(detail.options_intro)}</p>` : ''}
      </div>
      <div class="product-options-table" role="table" aria-label="${escapeAttribute(detail.options_title || 'Product options')}">
        <div class="product-options-row product-options-head" role="row">
          <span role="columnheader">Buyer decision</span>
          <span role="columnheader">PEIC can discuss</span>
          <span role="columnheader">Why it matters</span>
        </div>
        ${options.map((option) => `<div class="product-options-row" role="row">
          <span role="cell">${escapeHTML(option.label || '')}</span>
          <span role="cell">${escapeHTML(option.choices || '')}</span>
          <span role="cell">${escapeHTML(option.note || '')}</span>
        </div>`).join('')}
      </div>
      ${detail.spec_note ? `<p class="product-spec-note">${escapeHTML(detail.spec_note)}</p>` : ''}
    </div>
  </section>`;
}

function buyerQuestionsSectionHTML(detail) {
  const questions = Array.isArray(detail.buyer_questions) ? detail.buyer_questions : [];
  if (!questions.length) return '';
  return `<section class="product-detail-section product-buyer-section">
    <div class="container product-buyer-panel">
      <div>
        <span class="section-label">${escapeHTML(detail.buyer_questions_label || 'Before PEIC shares specifications')}</span>
        <h2>${escapeHTML(detail.buyer_questions_title || 'A few details help us recommend the right configuration.')}</h2>
      </div>
      <ul class="product-buyer-list">
        ${detailListHTML(questions)}
      </ul>
    </div>
  </section>`;
}

function detailListHTML(items) {
  if (!Array.isArray(items) || !items.length) return '';
  return items.map((item) => `<li>${escapeHTML(item)}</li>`).join('');
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
  const partnerLogo = normalizeAssetURL(partner.logo || '');
  const logo = partner.logo
    ? `<div class="partner-logo-slot has-image"><img src="${escapeAttribute(partnerLogo)}" alt="${escapeAttribute(partner.name)} logo"></div>`
    : '';
  const href = partner.website_url || partner.solutions_url || '#';
  const target = partner.website_url ? ' target="_blank" rel="noopener noreferrer"' : '';

  return `<a class="partner-card" href="${escapeAttribute(href)}"${target} data-solutions-url="${escapeAttribute(partner.solutions_url || '')}">
    <span class="partner-flag">${escapeHTML(partner.flag || '')}</span>
    <div class="partner-card-content">
      <div class="origin">${escapeHTML(partner.country || '')}</div>
      <h4>${escapeHTML(partner.name)}</h4>
      <p>${escapeHTML(partner.description || '')}</p>
      <div class="partner-categories">${tags}</div>
    </div>
    ${logo}
  </a>`;
}

function renderResources(resources) {
  const grid = document.querySelector('.doc-grid');
  if (!grid || !Array.isArray(resources)) return;

  grid.innerHTML = resources.map((resource) => {
    const file = normalizeAssetURL(resource.file || '');
    const actionLabel = resource.action_label || (file ? 'Download' : 'Request Document');
    const content = `<span class="doc-card-type">${escapeHTML(resource.type_label)}</span>
      <h4>${escapeHTML(resource.title)}</h4>
      <span class="btn-download-doc">${escapeHTML(actionLabel)}</span>`;

    if (file) {
      return `<a class="doc-card doc-card-action" data-category="${escapeAttribute(resource.category)}" href="${escapeAttribute(file)}" target="_blank" rel="noopener">
        ${content}
      </a>`;
    }

    return `<button class="doc-card doc-card-action" type="button" data-category="${escapeAttribute(resource.category)}"
      data-resource-action="request"
      data-resource-title="${escapeAttribute(resource.title)}"
      data-resource-type="${escapeAttribute(resource.type_label || 'Document')}">
      ${content}
    </button>`;
  }).join('');
}

function legacyResourceCardHTML(resource) {
  return `<article class="doc-card" data-category="${escapeAttribute(resource.category)}">
      <span class="doc-card-type">${escapeHTML(resource.type_label)}</span>
      <h4>${escapeHTML(resource.title)}</h4>
      <div class="doc-card-meta">
        <button class="btn-download-doc" type="button">${escapeHTML(resource.action_label || 'Request Document')}</button>
      </div>
    </article>`;
}

function renderJobs(jobs) {
  const list = document.querySelector('.job-list');
  if (!list || !Array.isArray(jobs)) return;

  const openJobs = jobs.filter((job) => job.open);
  const categories = [...new Set(openJobs.map((job) => job.category))];
  const applyLabel = peicState.careers?.apply_label || 'Apply';
  const careersEmail = peicState.site.careers_email || 'careers@peic.in';
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
      <a href="mailto:${escapeAttribute(careersEmail)}?subject=${encodeURIComponent(`Application: ${job.title}`)}" class="btn-apply">${escapeHTML(applyLabel)} →</a>
    </div>`).join('')}`;
  }).join('');
}

function renderPageSections(pages) {
  const specialties = document.querySelector('.specialty-grid');
  if (specialties && pages.solutions?.specialties) {
    specialties.innerHTML = pages.solutions.specialties.map((item) => `<a class="visual-card visual-card-link" id="${escapeAttribute(item.id)}" href="${escapeAttribute(item.link || 'contact.html')}"${item.image ? ` style="--card-image:url('${escapeAttribute(normalizeAssetURL(item.image))}')"` : ''}>
      <div class="visual-card-body">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.description || '')}</p>
        <span class="explore-portfolio">${escapeHTML(item.button_label || 'Explore portfolio')} →</span>
      </div>
    </a>`).join('');
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
    responseGrid.innerHTML = pages.service.process.map((item, index) => `<div class="info-card response-step">
      <div class="info-card-icon">${index + 1}</div>
      <span class="response-step-arrow" aria-hidden="true">→</span>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.description || '')}</p>
    </div>`).join('');
  }

  const serviceGrid = document.querySelector('.service-grid');
  if (serviceGrid && pages.service?.offerings) {
    serviceGrid.innerHTML = pages.service.offerings.map((item) => `<div class="info-card">
      <div class="info-card-icon">${escapeHTML(item.icon || '')}</div>
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
        <div class="stat-number cms-stat-number">${metric.display_value ? escapeHTML(metric.display_value) : `${escapeHTML(metric.prefix || '')}${Number(metric.value).toLocaleString()}${escapeHTML(metric.suffix || '')}`}</div>
        <div class="stat-tagline">${escapeHTML(metric.tagline || '')}</div>
        <div class="stat-label">${escapeHTML(metric.label)}</div>
      </div>`).join('');
    });
  }

  renderFacilityBlocks(about.facilities);

  if (Array.isArray(about.clients)) {
    const clientHTML = about.clients.map((client) => {
      const clientLogo = normalizeAssetURL(client.logo || '');
      const logo = clientLogo
        ? `<img src="${escapeAttribute(clientLogo)}" alt="${escapeAttribute(client.name)} logo">`
        : escapeHTML(client.short_name);
      return `<div class="client-card">
        <div class="client-logo ${clientLogo ? 'has-image' : ''}">${logo}</div>
        <div class="client-name">${escapeHTML(client.name)}</div>
        <div class="client-tagline">${escapeHTML(client.tagline || '')}</div>
      </div>`;
    }).join('');
    document.querySelectorAll('.logo-grid').forEach((grid) => {
      grid.innerHTML = clientHTML;
    });
  }

  const testimonials = (about.testimonials || []).filter((item) => (
    item.published && item.quote && item.author
  ));
  const testimonialHTML = testimonials.map(testimonialCardHTML).join('');
  const testimonialsSection = document.querySelector('.testimonials-section');
  if (testimonialsSection) testimonialsSection.hidden = !testimonialHTML;
  const staticRow = document.querySelector('.testimonial-static-row');
  if (staticRow && testimonialHTML) staticRow.innerHTML = testimonialHTML;
  const marquee = document.querySelector('.testimonial-marquee-track');
  if (marquee && testimonialHTML) marquee.innerHTML = testimonialHTML + testimonialHTML;

  const badgeGrid = document.querySelector('.badge-grid');
  if (badgeGrid && Array.isArray(about.certifications)) {
    badgeGrid.innerHTML = about.certifications.map((cert) => {
      const certificateFile = normalizeAssetURL(cert.file || '');
      const badge = `<div class="cert-badge">
        <div class="cert-icon">${escapeHTML(cert.icon)}</div>
        <div><h4>${escapeHTML(cert.name)}</h4><p class="cert-num">${escapeHTML(cert.details || '')}</p></div>
      </div>`;
      return certificateFile
        ? `<a class="cert-link" href="${escapeAttribute(certificateFile)}" target="_blank" rel="noopener">${badge}<span class="cert-download-indicator">↓</span></a>`
        : badge;
    }).join('');
  }
}

function renderFacilityBlocks(facilities) {
  const grid = document.querySelector('.facility-block-grid');
  if (!grid || !facilities) return;

  const blocks = [];
  if (facilities.research) blocks.push({ type: 'research', icon: flaskIcon(), ...facilities.research });
  if (Array.isArray(facilities.manufacturing)) {
    blocks.push(...facilities.manufacturing.slice(0, 3).map((item) => ({ type: 'manufacturing', icon: factoryIcon(), ...item })));
  }
  if (Array.isArray(facilities.offices)) {
    blocks.push(...facilities.offices.slice(0, 2).map((item) => ({ type: 'office', icon: buildingIcon(), ...item })));
  }

  grid.innerHTML = blocks.map((block) => `<article class="facility-block facility-${escapeAttribute(block.type || 'office')}">
    <div class="facility-icon" aria-hidden="true">${block.icon || buildingIcon()}</div>
    <div class="facility-copy">
      <span class="facility-type">${escapeHTML(block.type_label || '')}</span>
      <h3>${escapeHTML(block.title || '')}</h3>
      <p>${escapeHTML(block.description || '')}</p>
      <address>${(block.address_lines || []).map(escapeHTML).join('<br>')}</address>
    </div>
  </article>`).join('');
}

function testimonialCardHTML(testimonial) {
  return `<div class="testimonial-card">
    <p class="testimonial-quote">${escapeHTML(testimonial.quote)}</p>
    <div class="testimonial-author">${escapeHTML(testimonial.author)}</div>
    <div class="testimonial-role">${escapeHTML(testimonial.role || '')}</div>
  </div>`;
}

function flaskIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6"/><path d="M10 3v6.4L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.4V3"/><path d="M8 16h8"/></svg>`;
}

function factoryIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M4 21V10l6 4V10l6 4V8h4v13"/><path d="M7 18h1"/><path d="M11 18h1"/><path d="M15 18h1"/></svg>`;
}

function buildingIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M17 9h1a2 2 0 0 1 2 2v10"/><path d="M8 7h5"/><path d="M8 11h5"/><path d="M8 15h5"/><path d="M9 21v-3h3v3"/></svg>`;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) element.textContent = value;
}

function setAttribute(selector, attribute, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined && value !== null) element.setAttribute(attribute, value);
}

function linkifyEmailMessage(message) {
  return escapeHTML(message).replace(
    /([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g,
    '<a href="mailto:$1">$1</a>'
  );
}

function getProductAccessMode(product) {
  const file = normalizeAssetURL(product?.specification_file || '');
  const mode = product?.access_mode || 'enquiry_only';

  if ((mode === 'gated_download' || mode === 'public_download') && !file) {
    return 'enquiry_only';
  }

  return mode;
}

function getProductActionLabel(product, mode) {
  if (product?.action_label) return product.action_label;
  if (mode === 'gated_download') return 'Submit & Download';
  if (mode === 'public_download') return 'Download PDF';
  return 'Request Specifications';
}

function setCMSLoadingState(isLoading) {
  document.documentElement.classList.toggle('is-cms-loading', isLoading);
  document.documentElement.classList.toggle('is-cms-ready', !isLoading);
  document.body.classList.toggle('is-cms-loading', isLoading);
  document.body.classList.toggle('is-cms-ready', !isLoading);
}

function setBackgroundImage(selector, image) {
  const element = document.querySelector(selector);
  const assetURL = normalizeAssetURL(image);
  if (element && assetURL) {
    element.style.setProperty('--hero-bg-image', `url("${assetURL.replace(/"/g, '%22')}")`);
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

function normalizeAssetURL(url) {
  if (!url) return '';
  if (/^(https?:|data:|\/|#)/i.test(url)) return url;
  return `/${url.replace(/^\.?\//, '')}`;
}

function readCachedCMSData(name) {
  if (!name) return null;

  if (window.__PEIC_CMS_CACHE__ && Object.prototype.hasOwnProperty.call(window.__PEIC_CMS_CACHE__, name)) {
    return window.__PEIC_CMS_CACHE__[name];
  }

  try {
    const raw = window.localStorage.getItem(`${CMS_CACHE_PREFIX}${name}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function writeCachedCMSData(name, data) {
  if (!name || !data) return;

  try {
    if (!window.__PEIC_CMS_CACHE__) window.__PEIC_CMS_CACHE__ = {};
    window.__PEIC_CMS_CACHE__[name] = data;
    window.localStorage.setItem(`${CMS_CACHE_PREFIX}${name}`, JSON.stringify(data));
  } catch (error) {
    // Ignore storage errors so live CMS rendering still works.
  }
}

function initMobileNav() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');
  if (!toggle || !nav) return;

  nav.querySelector('.active')?.setAttribute('aria-current', 'page');

  const drawer = document.createElement('nav');
  drawer.id = 'navigation-drawer';
  drawer.className = 'nav-drawer';
  drawer.setAttribute('aria-label', peicState.site.navigation?.drawer_label || 'Menu navigation');

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
    toggle.setAttribute('aria-label', isOpen
      ? (peicState.site.navigation?.mobile_close_label || 'Close menu')
      : (peicState.site.navigation?.mobile_open_label || 'Open menu'));
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
    if (window.innerWidth > 1100) setOpen(false);
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

function initHeaderState() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  function updateHeader() {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
}

function initFloatingCTAVisibility() {
  const cta = document.querySelector('.floating-cta');
  if (!cta) return;
  const suppressOnPage = document.querySelector('.contact-page-main, .product-detail-main');
  const hero = document.querySelector('.hero, .page-hero-sm, .contact-page-heading, .product-detail-hero');

  function updateFloatingCTA() {
    if (suppressOnPage) {
      cta.classList.add('is-hidden');
      return;
    }
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    const shouldHide = heroBottom > 120;
    cta.classList.toggle('is-hidden', shouldHide);
  }

  updateFloatingCTA();
  window.addEventListener('scroll', updateFloatingCTA, { passive: true });
  window.addEventListener('resize', updateFloatingCTA);
}

function initRevealAnimations() {
  const targets = document.querySelectorAll([
    '.section-header',
    '.cap-card',
    '.stat-item',
    '.client-card',
    '.product-card',
    '.partner-card',
    '.advantage-item',
    '.info-card',
    '.visual-card',
    '.industry-card',
    '.benefit-card',
    '.doc-card',
    '.cert-badge',
    '.testimonial-card',
    '.masonry-item',
    '.contact-info-block',
    '.contact-form',
    '.legacy-container',
    '.custom-solution-box',
    '.urgent-service-banner',
    '.missing-doc-cta',
    '.product-detail-panel',
    '.product-detail-card',
    '.product-detail-media',
    '.product-detail-fit'
  ].join(','));

  if (!targets.length) return;

  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  targets.forEach((target, index) => {
    target.classList.add('reveal-on-scroll');
    target.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 55}ms`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  targets.forEach((target) => observer.observe(target));
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

  document.querySelectorAll('button.download-specs:not([data-product-action])').forEach((button) => {
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      const card = button.closest('.product-card');
      openProductLeadModal({
        mode: 'enquiry_only',
        product: card?.querySelector('h4')?.textContent.trim() || 'Product specifications',
        file: ''
      });
    });
  });

  document.querySelectorAll('[data-resource-action="request"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openResourceLeadModal({
        title: btn.dataset.resourceTitle,
        type: btn.dataset.resourceType
      });
    });
  });

  document.querySelectorAll('button.btn-download-doc:not([data-resource-action])').forEach((btn) => {
    btn.setAttribute('type', 'button');
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.doc-card');
      const title = card?.querySelector('h4')?.textContent.trim() || 'Document';
      const type = card?.querySelector('.doc-card-type')?.textContent.trim() || 'Document';
      if (card?.dataset.category === 'certificate') {
        window.location.assign('about.html#certifications');
        return;
      }
      openResourceLeadModal({ title, type });
    });
  });
}

function openProductLeadModal({ mode, product, file }) {
  const modal = getProductLeadModal();
  const form = modal.querySelector('.product-lead-form');
  const title = modal.querySelector('#product-lead-title');
  const intro = modal.querySelector('.product-lead-intro');
  const submit = form.querySelector('[type="submit"]');
  const copy = peicState.site.lead_modal || {};
  const formService = peicState.site.form_service || {};

  form.reset();
  form.dataset.mode = mode;
  form.dataset.file = file || '';
  form.querySelector('[name="product"]').value = product;
  setLeadContextFields(form, {
    lead_source: 'product_modal',
    page_context: getCurrentRoute(),
    product_name: product
  });
  form.querySelector('[name="from_name"]').value = formService.product_from_name || 'PEIC Product Catalogue';
  form.querySelector('[name="subject"]').value = mode === 'gated_download'
    ? `${formService.download_subject_prefix || 'PEIC specification download'}: ${product}`
    : `${formService.product_subject_prefix || 'PEIC product enquiry'}: ${product}`;
  title.textContent = mode === 'gated_download'
    ? (copy.gated_title || 'Get Technical Specifications')
    : (copy.product_title || 'Request Product Information');
  intro.textContent = mode === 'gated_download'
    ? `${copy.gated_intro || 'Share your details and the requested document will open after submission.'} ${product ? `${copy.document_context_label || 'Document'}: ${product}.` : ''}`
    : `${copy.product_intro || 'Share your requirement and PEIC will respond with the appropriate specifications and configuration guidance.'} ${product ? `${copy.product_context_label || 'Product'}: ${product}.` : ''}`;
  submit.textContent = mode === 'gated_download'
    ? (copy.gated_submit_label || 'Submit & Download')
    : (copy.product_submit_label || 'Send Request');
  resetFormStatus(form);

  modal.hidden = false;
  document.body.classList.add('modal-open');
  form.querySelector('[name="name"]').focus();
}

function openResourceLeadModal({ title: resourceTitle, type }) {
  const modal = getProductLeadModal();
  const form = modal.querySelector('.product-lead-form');
  const title = modal.querySelector('#product-lead-title');
  const intro = modal.querySelector('.product-lead-intro');
  const submit = form.querySelector('[type="submit"]');
  const copy = peicState.site.lead_modal || {};
  const formService = peicState.site.form_service || {};

  form.reset();
  form.dataset.mode = 'resource_request';
  form.dataset.file = '';
  form.querySelector('[name="product"]').value = resourceTitle || '';
  form.querySelector('[name="document"]').value = resourceTitle || '';
  setLeadContextFields(form, {
    lead_source: 'resource_modal',
    page_context: getCurrentRoute(),
    product_name: resourceTitle || ''
  });
  form.querySelector('[name="subject"]').value = `${formService.resource_subject_prefix || 'PEIC document request'}: ${resourceTitle || 'Resource'}`;
  form.querySelector('[name="from_name"]').value = formService.resource_from_name || 'PEIC Documentation Request';
  form.querySelector('[name="enquiry_type"]').value = `${type || 'Document'} request`;
  title.textContent = copy.resource_title || 'Request Documentation';
  intro.textContent = `${copy.resource_intro || 'Share your details and the PEIC team will respond with the requested documentation.'} ${resourceTitle ? `${copy.document_context_label || 'Document'}: ${resourceTitle}.` : ''}`;
  submit.textContent = copy.resource_submit_label || 'Submit Request';
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
      <button class="product-lead-close" type="button" aria-label="${escapeAttribute(peicState.site.lead_modal?.close_label || 'Close')}" data-close-product-modal>×</button>
      <h2 id="product-lead-title">Request Product Information</h2>
      <p class="product-lead-intro"></p>
      <form class="product-lead-form">
        <input type="hidden" name="access_key" value="">
        <input type="hidden" name="subject" value="">
        <input type="hidden" name="from_name" value="">
        <input type="hidden" name="lead_source" value="">
        <input type="hidden" name="page_context" value="">
        <input type="hidden" name="page_url" value="">
        <input type="hidden" name="referrer" value="">
        <input type="hidden" name="product_name" value="">
        <input type="hidden" name="product" value="">
        <input type="hidden" name="document" value="">
        <input type="hidden" name="enquiry_type" value="Product information / specifications">
        <input type="hidden" name="destination_email" value="">
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
        <div class="form-row">
          <div class="form-group">
            <label for="product-lead-city">City / Region *</label>
            <input id="product-lead-city" type="text" name="city_region" autocomplete="address-level2" required>
          </div>
          <div class="form-group">
            <label for="product-lead-timeline">Buying Timeline *</label>
            <select id="product-lead-timeline" name="buying_timeline" required>
              <option value="">Select timeline...</option>
              <option value="Active tender / current purchase">Active tender / current purchase</option>
              <option value="Within 30 days">Within 30 days</option>
              <option value="1-3 months">1-3 months</option>
              <option value="Planning / budgeting">Planning / budgeting</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="product-lead-quantity">Quantity / Scope</label>
            <input id="product-lead-quantity" type="text" name="quantity_scope" placeholder="e.g. 2 units, CSSD upgrade, multi-site">
          </div>
          <div class="form-group">
            <label for="product-lead-tender">Tender Status</label>
            <select id="product-lead-tender" name="tender_status">
              <option value="">Select if applicable...</option>
              <option value="Tender not applicable">Tender not applicable</option>
              <option value="Tender under preparation">Tender under preparation</option>
              <option value="Tender live">Tender live</option>
              <option value="Specification comparison">Specification comparison</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="product-lead-notes">Additional Context</label>
          <textarea id="product-lead-notes" name="message" rows="3" placeholder="Department, model preference, site constraints, service expectations, or tender reference"></textarea>
        </div>
        <label class="form-consent">
          <input type="checkbox" name="privacy-consent" value="accepted" required>
          <span>I agree that PEIC may use these details to respond to my request, as described in the <a href="privacy.html">Privacy Policy</a>.</span>
        </label>
        <button type="submit" class="btn btn-primary product-lead-submit">Send Request</button>
      </form>
    </section>`;
  document.body.appendChild(modal);
  renderLeadModalStaticCopy(modal);

  modal.querySelectorAll('[data-close-product-modal]').forEach((button) => {
    button.addEventListener('click', closeProductLeadModal);
  });
  modal.querySelector('.product-lead-form').addEventListener('submit', submitProductLead);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeProductLeadModal();
  });
  return modal;
}

function renderLeadModalStaticCopy(modal) {
  const copy = peicState.site.lead_modal || {};
  const formService = peicState.site.form_service || {};
  const fields = copy.fields || {};
  const form = modal.querySelector('.product-lead-form');
  if (form) {
    setFormHiddenValue(form, 'access_key', formService.access_key || '');
    setFormHiddenValue(form, 'from_name', formService.product_from_name || 'PEIC Product Catalogue');
    setFormHiddenValue(form, 'subject', formService.product_subject_prefix || 'PEIC product enquiry');
    setFormHiddenValue(form, 'destination_email', formService.destination_email || peicState.site.enquiry_email || '');
  }
  setText('label[for="product-lead-name"]', fields.name_label);
  setText('label[for="product-lead-company"]', fields.company_label);
  setText('label[for="product-lead-email"]', fields.email_label);
  setText('label[for="product-lead-phone"]', fields.phone_label);
  setText('label[for="product-lead-city"]', fields.city_label);
  setText('label[for="product-lead-timeline"]', fields.timeline_label);
  setText('label[for="product-lead-quantity"]', fields.quantity_label);
  setAttribute('#product-lead-quantity', 'placeholder', fields.quantity_placeholder);
  setText('label[for="product-lead-tender"]', fields.tender_label);
  setText('label[for="product-lead-notes"]', fields.notes_label);
  setAttribute('#product-lead-notes', 'placeholder', fields.notes_placeholder);
  renderSelectOptions('#product-lead-timeline', copy.timeline_options);
  renderSelectOptions('#product-lead-tender', copy.tender_options);

  const consent = modal.querySelector('.form-consent span');
  if (consent && fields.consent_text) {
    consent.innerHTML = `${escapeHTML(fields.consent_text).replace(
      escapeHTML(fields.privacy_label || 'Privacy Policy'),
      `<a href="${escapeAttribute(fields.privacy_link || 'privacy.html')}">${escapeHTML(fields.privacy_label || 'Privacy Policy')}</a>`
    )}`;
  }
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
  const copy = peicState.site.lead_modal || {};
  const defaultLabel = form.dataset.mode === 'gated_download'
    ? (copy.gated_submit_label || 'Submit & Download')
    : form.dataset.mode === 'resource_request'
      ? (copy.resource_submit_label || 'Submit Request')
      : (copy.product_submit_label || 'Send Request');

  submit.disabled = true;
  submit.textContent = copy.sending_label || 'Sending...';
  status.textContent = copy.sending_status || 'Sending your request securely...';
  status.className = 'form-status visible';

  try {
    const response = await fetch(peicState.site.form_service?.endpoint || 'https://api.web3forms.com/submit', {
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
      status.textContent = copy.download_success || 'Thank you. Your request was sent and the document is opening now.';
      status.className = 'form-status success visible';
      window.setTimeout(() => {
        window.location.assign(form.dataset.file);
      }, 500);
    } else {
      status.textContent = form.dataset.mode === 'resource_request'
        ? (copy.resource_success || 'Thank you. Your request has been sent. Our team will get back to you with the requested documentation.')
        : (copy.product_success || 'Thank you. Your request has been sent. PEIC will contact you shortly.');
      status.className = 'form-status success visible';
      form.reset();
    }
  } catch (error) {
    status.innerHTML = linkifyEmailMessage(copy.error_message || 'We could not send the request. Please try again or email sital.shah@peic.in.');
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
  const emptyText = grid?.dataset.emptyText || 'No documents match your search.';
  const emptyLink = grid?.dataset.emptyLink || 'contact.html';
  const emptyLinkLabel = grid?.dataset.emptyLinkLabel || 'Contact us for the document you need.';
  emptyState.innerHTML = `${escapeHTML(emptyText)} ${emptyLinkLabel ? `<a href="${escapeAttribute(emptyLink)}">${escapeHTML(emptyLinkLabel)}</a>` : ''}`;
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

  setLeadContextFields(form, {
    lead_source: 'contact_page',
    page_context: getCurrentRoute()
  });

  const status = form.querySelector('.form-status');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const defaultLabel = form.dataset.submitLabel || submit?.textContent || 'Submit Enquiry';
    if (submit) {
      submit.textContent = form.dataset.sendingLabel || 'Sending...';
      submit.disabled = true;
    }

    if (status) {
      status.textContent = form.dataset.sendingStatus || 'Sending your enquiry securely...';
      status.className = 'form-status visible';
    }

    try {
      const response = await fetch(form.action || peicState.site.form_service?.endpoint || 'https://api.web3forms.com/submit', {
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
        status.textContent = form.dataset.successMessage || 'Thank you. Your enquiry has been sent. PEIC will respond shortly.';
        status.className = 'form-status success visible';
      }
      form.reset();
    } catch (error) {
      if (status) {
        status.innerHTML = linkifyEmailMessage(form.dataset.errorMessage || 'We could not send the enquiry. Please try again or email sital.shah@peic.in.');
        status.className = 'form-status error visible';
      }
    } finally {
      if (submit) {
        submit.textContent = defaultLabel;
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
  const source = params.get('source');
  if (source) {
    const sourceInput = document.querySelector('[name="lead_source"]');
    if (sourceInput) sourceInput.value = source;
  }
}

function setLeadContextFields(form, values = {}) {
  if (!form) return;
  const defaults = {
    page_url: window.location.href,
    referrer: document.referrer || 'Direct / unknown'
  };
  Object.entries({ ...defaults, ...values }).forEach(([name, value]) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = value || '';
  });
  const productName = form.querySelector('[name="product_name"]');
  const product = form.querySelector('[name="product"]');
  if (productName && product && !productName.value) productName.value = product.value;
}

function initPartnerCards() {
  document.querySelectorAll('.partner-card').forEach((card) => {
    const content = card.querySelector('.partner-flag')?.nextElementSibling;
    if (content) content.classList.add('partner-card-content');
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

(() => {
  document.documentElement.classList.add('is-cms-loading');

  const criticalCMSStyle = document.createElement('style');
  criticalCMSStyle.setAttribute('data-peic-cms-critical', 'true');
  criticalCMSStyle.textContent = `
    html.is-cms-loading body {
      visibility: hidden;
    }

    html.is-cms-ready body {
      visibility: visible;
    }
  `;
  document.head.appendChild(criticalCMSStyle);

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

  const getCurrentRoute = () => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return filename === 'index.html' ? 'home' : filename.replace(/\.html$/, '');
  };

  const fetchCMSFile = (name) => fetch(`content/${name}.json?ts=${Date.now()}`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${name} content`);
      return response.json();
    })
    .then((data) => ({ [name]: data }));

  const normalizeAssetURL = (url) => {
    if (!url) return '';
    if (/^(https?:|data:|\/|#)/i.test(url)) return url;
    return `/${url.replace(/^\.?\//, '')}`;
  };

  const getFaviconType = (url) => {
    const cleanURL = String(url || '').split('?')[0].split('#')[0].toLowerCase();
    if (cleanURL.endsWith('.png')) return 'image/png';
    if (cleanURL.endsWith('.ico')) return 'image/x-icon';
    if (cleanURL.endsWith('.jpg') || cleanURL.endsWith('.jpeg')) return 'image/jpeg';
    if (cleanURL.endsWith('.webp')) return 'image/webp';
    return 'image/svg+xml';
  };

  const applyGlobalBranding = (site) => {
    if (!site) return;

    if (site.browser_tab_title) {
      document.title = site.browser_tab_title;
    }

    const faviconURL = normalizeAssetURL(site.favicon);
    if (!faviconURL) return;
    const faviconType = getFaviconType(faviconURL);

    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach((rel) => {
      let favicon = document.querySelector(`link[rel="${rel}"]`);
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', rel);
        document.head.appendChild(favicon);
      }

      favicon.setAttribute('href', faviconURL);
      if (rel !== 'apple-touch-icon') {
        favicon.setAttribute('type', faviconType);
      }
    });
  };

  const route = getCurrentRoute();
  const requestedFiles = ['site'];
  if (pageFiles[route]) requestedFiles.push(pageFiles[route]);

  const preloadPromise = Promise.all(requestedFiles.map(fetchCMSFile))
    .then((entries) => Object.assign({}, ...entries));

  window.__PEIC_PRELOADED_CMS_PROMISE__ = preloadPromise;

  preloadPromise
    .then((data) => {
      window.__PEIC_PRELOADED_CMS__ = data;
      applyGlobalBranding(data.site);
    })
    .catch(() => {
      // Keep the static head tags as the fallback when CMS settings are unavailable.
    });

  // Failsafe timeout: reveal content after 3.5s if main.js fails to initialize or network is slow
  window.__PEIC_FAILSAFE_TIMEOUT__ = setTimeout(() => {
    document.documentElement.classList.remove('is-cms-loading');
    document.documentElement.classList.add('is-cms-ready');
    if (document.body) {
      document.body.classList.remove('is-cms-loading');
      document.body.classList.add('is-cms-ready');
    }
    console.warn('CMS content preload took too long; activating failsafe content reveal.');
  }, 3500);
})();

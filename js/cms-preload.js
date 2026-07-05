(() => {
  document.documentElement.classList.add('is-cms-loading');

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

  fetch(`content/site.json?ts=${Date.now()}`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load site settings');
      return response.json();
    })
    .then((site) => applyGlobalBranding(site))
    .catch(() => {
      // Keep the static head tags as the fallback when CMS settings are unavailable.
    });
})();

(() => {
  const CACHE_PREFIX = 'peic-cms-cache:';
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

  const route = (() => {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    return filename === 'index.html' ? 'home' : filename.replace(/\.html$/, '');
  })();
  const productDetailRoutes = new Set([
    'horizontal-rectangular-sterilizer',
    'horizontal-cylindrical-sterilizer',
    'high-speed-steam-sterilizer',
    'vertical-autoclave',
    'bowl-utensil-sterilizer',
    'hot-cold-water-pressure-sterilizer'
  ]);

  const normalizeAssetURL = (url) => {
    if (!url) return '';
    if (/^(https?:|data:|\/|#)/i.test(url)) return url;
    return `/${String(url).replace(/^\.?\//, '')}`;
  };

  const readCache = (name) => {
    if (!name) return null;

    try {
      const raw = window.localStorage.getItem(`${CACHE_PREFIX}${name}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  };

  const bootCache = {};
  const fileName = pageFiles[route];
  const shouldReadProductsPage = !fileName || productDetailRoutes.has(route);

  document.documentElement.classList.add('is-cms-loading');

  ['site', fileName, shouldReadProductsPage ? 'products-page' : null, route !== 'about' ? 'about' : null].forEach((name) => {
    const cached = readCache(name);
    if (cached) bootCache[name] = cached;
  });

  if (Object.keys(bootCache).length) {
    window.__PEIC_CMS_CACHE__ = bootCache;
  }

  const heroImage = normalizeAssetURL(getHeroImageForRoute(route, bootCache) || '');
  const heroSelector = route === 'home' ? '.home-precision-hero .hero-bg' : '.page-hero-sm';
  const heroVariable = route === 'home' ? '--hero-bg-image' : '--page-hero-image';

  if (heroImage) {
    const style = document.createElement('style');
    style.setAttribute('data-peic-cms-preload', route);
    style.textContent = `${heroSelector}{${heroVariable}:url("${heroImage.replace(/"/g, '%22')}") !important;}`;
    document.head.appendChild(style);
  }

  function getHeroImageForRoute(currentRoute, cache) {
    if (currentRoute === 'home') return cache.home?.hero?.image;
    if (currentRoute === 'about') return cache.about?.page?.hero?.image;

    if (pageFiles[currentRoute]) {
      const pageData = cache[pageFiles[currentRoute]];
      return pageData?.hero?.image || pageData?.page?.hero?.image || '';
    }

    const productsPage = cache['products-page'];
    const product = (productsPage?.manufactured_products || []).find((item) => {
      if (item.slug === currentRoute) return true;
      const detailRoute = (item.detail_url || '').split('?')[0].split('#')[0].replace(/^\//, '').replace(/\.html$/, '');
      return detailRoute === currentRoute;
    });

    return product?.image || productsPage?.hero?.image || '';
  }
})();

/* PEIC — Shared interactions (design mockup) */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initCounters();
  initTestimonialSlider();
  initDownloadSpecs();
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

function initTestimonialSlider() {
  const track = document.querySelector('.testimonial-slides');
  const dots = document.querySelectorAll('.testimonial-dot');
  if (!track || !dots.length) return;

  let current = 0;
  const total = dots.length;

  function goTo(index) {
    current = index;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  setInterval(() => goTo((current + 1) % total), 6000);
}

function initDownloadSpecs() {
  document.querySelectorAll('.download-specs').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const name = btn.closest('.product-card')?.querySelector('h4')?.textContent || 'Product';
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
}

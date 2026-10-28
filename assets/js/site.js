/* No dependencies, telemetry, storage, or network calls. Native scroll only. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const shortViewport = window.matchMedia('(max-height: 650px)');
  const hero = document.querySelector('.hero');
  const heroCopy = document.querySelector('.hero-copy');
  const sections = [...document.querySelectorAll('[data-progress]')];
  const visible = new Set(sections);
  const menu = document.querySelector('.menu-button');
  const links = document.querySelector('#nav-links');
  const focusDemo = document.querySelector('.home-feature');
  const picks = document.querySelector('.picks-feature');
  const channels = document.querySelector('.channels-feature');
  const dots = [...document.querySelectorAll('.carousel-dots i')];
  let frame = 0;
  let currentSlide = -1;

  root.classList.add('js');

  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    links.classList.remove('open');
  }

  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
  });
  links.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menu.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) closeMenu();
    if (event.target.closest('[aria-disabled="true"]')) event.preventDefault();
  });

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const smooth = (value) => value * value * (3 - 2 * value);

  function render() {
    frame = 0;
    if (reducedMotion.matches) return;
    const viewport = window.innerHeight;
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - viewport));
    // Compose → separate → hold → recompose. Scroll always stays in control.
    const copyExit = shortViewport.matches ? 0 : smooth(clamp(progress / .12));
    const explosion = smooth(clamp((progress - .16) / .3)) *
      (1 - smooth(clamp((progress - .72) / .28)));
    hero.style.setProperty('--copy-exit', copyExit.toFixed(4));
    heroCopy.inert = !shortViewport.matches && progress >= .12;
    hero.style.setProperty('--explode', explosion.toFixed(4));
    hero.style.setProperty('--label-opacity', clamp((explosion - .5) * 2).toFixed(4));

    // Read geometry first; write transforms only after every measurement.
    const measurements = [...visible].map((section) => {
      const box = section.getBoundingClientRect();
      return [section, clamp((viewport - box.top) / (viewport + box.height))];
    });
    for (const [section, value] of measurements) {
      section.style.setProperty('--progress', value.toFixed(4));
      const active = smooth(clamp((value - .18) / .6));
      if (section === focusDemo) {
        // Continuous focus movement mirrors a deliberate D-pad journey.
        section.style.setProperty('--focus-index', (active * 2).toFixed(4));
      }
      if (section === channels) {
        const reorder = smooth(clamp((value - .3) / .24));
        section.style.setProperty('--reorder', reorder.toFixed(4));
        section.style.setProperty('--lift', Math.sin(reorder * Math.PI).toFixed(4));
        section.style.setProperty('--hide', smooth(clamp((value - .5) / .2)).toFixed(4));
      }
      if (section === picks) {
        // Short transitions, generous resting points: titles stay readable.
        const slide = smooth(clamp((value - .34) / .08)) +
          smooth(clamp((value - .63) / .08));
        section.style.setProperty('--slide', slide.toFixed(4));
        const selected = Math.round(slide);
        if (selected !== currentSlide) {
          dots.forEach((dot, index) => dot.classList.toggle('active', index === selected));
          currentSlide = selected;
        }
      }
    }
  }

  function schedule() {
    if (!frame && !reducedMotion.matches) frame = requestAnimationFrame(render);
  }

  function setMotion() {
    root.classList.toggle('motion', !reducedMotion.matches);
    if (reducedMotion.matches) heroCopy.inert = false;
    if (reducedMotion.matches && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    schedule();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      schedule();
    }, { rootMargin: '120px 0px' });
    sections.forEach((section) => observer.observe(section));
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  reducedMotion.addEventListener('change', setMotion);
  setMotion();
})();

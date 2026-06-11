// gsap-animations.js
// Requires: gsap-loader.js, theme-animations-config.liquid

import './gsap-loader.js';

(function () {
  if (!window.gsap || !window.themeAnimations) return;
  const gsap = window.gsap;
  const ScrollTrigger = window.gsap.ScrollTrigger;
  const config = window.themeAnimations;

  if (!config.enabled) return;
  if (config.respectReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Animation style map
  const animationVariants = {
    'fade-in': { opacity: 0, y: 0 },
    'fade-up': { opacity: 0, y: 40 },
    'slide-in-left': { opacity: 0, x: -40 },
    'slide-in-right': { opacity: 0, x: 40 },
    'zoom-in': { opacity: 0, scale: 0.8 },
    'none': {}
  };

  // Helper to get trigger position
  function getStart(trigger) {
    switch (config.scrollTrigger) {
      case 'center': return 'top center';
      case 'visible': return 'top bottom';
      default: return 'top 80%';
    }
  }

  // Animate all elements with [data-animate]
  document.querySelectorAll('[data-animate]').forEach((el, i) => {
    const style = el.dataset.animate || config.defaultStyle;
    const duration = parseFloat(el.dataset.animateDuration) || config.defaultDuration;
    const delay = parseFloat(el.dataset.animateDelay) || config.defaultDelay;
    const stagger = parseFloat(el.dataset.animateStagger) || config.defaultStagger;
    const ease = el.dataset.animateEase || config.defaultEase;
    const once = (el.dataset.animateRepeat || config.repeat) === 'once';
    const vars = animationVariants[style] || animationVariants[config.defaultStyle];

    gsap.from(el, {
      ...vars,
      opacity: vars.opacity !== undefined ? vars.opacity : 0,
      duration,
      delay,
      ease,
      stagger,
      scrollTrigger: {
        trigger: el,
        start: getStart(config.scrollTrigger),
        toggleActions: once ? 'play none none none' : 'play none none reset',
        once: once
      }
    });
  });
})();

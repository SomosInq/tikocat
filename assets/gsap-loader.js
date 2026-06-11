// GSAP core CDN (can be replaced with npm build if needed)
// Place this in your theme.liquid or main layout file for production use
// For now, this is a local asset for development
import 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js';
import 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js';

// Export GSAP for use in other scripts
export const { gsap } = window;
export const { ScrollTrigger } = window.gsap || {};

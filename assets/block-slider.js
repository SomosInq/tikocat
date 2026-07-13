class BlockSlider extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      pagination: this.parentElement.nextElementSibling.querySelector('.slider-pagination'),
      nextButton: this.parentElement.nextElementSibling.querySelector('.block-slider-arrow--next'),
      prevButton: this.parentElement.nextElementSibling.querySelector('.block-slider-arrow--prev')
    };
    
    this.settings = {
      slidesPerView: parseInt(this.dataset.slidesPerView) || 1,
      slidesPerViewMobile: parseInt(this.dataset.slidesPerViewMobile) || 1,
      spaceBetween: parseInt(this.dataset.spaceBetween) || 0,
      loop: this.parseBoolean(this.dataset.loopSlide, true),
      initialSlide: parseInt(this.dataset.initialSlide) || 0,
      centeredSlides: this.parseBoolean(this.dataset.centeredSlide, false),
      autoplay: this.parseBoolean(this.dataset.autoplay, false),
      autoplayDelay: (parseInt(this.dataset.autoplayDelay) * 1000) || 3000,
      pauseOnHover: this.parseBoolean(this.dataset.pauseOnHover, true),
      showArrows: this.parseBoolean(this.dataset.showArrows, true),
      speed: parseInt(this.dataset.speed) || 300,
      effect: this.dataset.effect || 'slide'
    };
    
    this.swiper = null;
    this.init();
  }
  
  init() {
    this.initSwiper();
    this.setupEditorListeners();
    this.setupHoverListeners();
  }
  
  initSwiper() {
    const swiperOptions = {
      slidesPerView: this.settings.slidesPerViewMobile,
      spaceBetween: this.settings.spaceBetween,
      loop: this.settings.loop,
      initialSlide: this.settings.initialSlide,
      centeredSlides: this.settings.centeredSlides,
      speed: this.settings.speed,
      effect: this.settings.effect,
      grabCursor: true,
      watchOverflow: true,
      resizeObserver: true,
      breakpoints: {
        750: {
          slidesPerView: this.settings.slidesPerView
        }
      }
    };
    
    // Add pagination if enabled
    if (this.elements.pagination) {
      swiperOptions.pagination = {
        el: this.elements.pagination,
        clickable: true,
        dynamicBullets: true,
        dynamicMainBullets: 3
      };
    }
    
    // Add navigation if enabled
    if (this.settings.showArrows && this.elements.nextButton && this.elements.prevButton) {
      swiperOptions.navigation = {
        nextEl: this.elements.nextButton,
        prevEl: this.elements.prevButton,
        disabledClass: 'swiper-button-disabled',
        hiddenClass: 'swiper-button-hidden'
      };
    }
    
    // Add autoplay if enabled
    if (this.settings.autoplay) {
      swiperOptions.autoplay = {
        delay: this.settings.autoplayDelay,
        disableOnInteraction: false,
        pauseOnMouseEnter: this.settings.pauseOnHover
      };
    }
    
    // Add effect-specific options
    if (this.settings.effect === 'fade') {
      swiperOptions.fadeEffect = {
        crossFade: true
      };
    } else if (this.settings.effect === 'coverflow') {
      swiperOptions.coverflowEffect = {
        rotate: 50,
        stretch: 0,
        depth: 100,
        modifier: 1,
        slideShadows: true
      };
    }
    
    this.swiper = new Swiper(this, swiperOptions);
    
    // Prevent click issues with centered slides
    if (this.settings.centeredSlides && this.settings.loop) {
      this.handleCenteredLoopClicks();
    }
  }
  
  handleCenteredLoopClicks() {
    this.addEventListener('click', (e) => {
      // Prevent double-click issues with centered + loop configuration
      const slide = e.target.closest('.swiper-slide');
      if (slide && slide.classList.contains('swiper-slide-duplicate')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
  
  setupHoverListeners() {
    if (!this.settings.autoplay || !this.settings.pauseOnHover) return;
    
    this.addEventListener('mouseenter', () => {
      if (this.swiper?.autoplay) {
        this.swiper.autoplay.stop();
      }
    });
    
    this.addEventListener('mouseleave', () => {
      if (this.swiper?.autoplay) {
        this.swiper.autoplay.start();
      }
    });
    
    // Handle touch devices
    this.addEventListener('touchstart', () => {
      if (this.swiper?.autoplay) {
        this.swiper.autoplay.stop();
      }
    }, { passive: true });
    
    this.addEventListener('touchend', () => {
      if (this.swiper?.autoplay) {
        // Small delay before restarting autoplay
        setTimeout(() => {
          this.swiper?.autoplay?.start();
        }, 1000);
      }
    });
  }
  
  setupEditorListeners() {
    if (!Shopify?.designMode) return;
    
    const handleBlockSelect = this.handleBlockSelect.bind(this);
    const handleBlockDeselect = this.handleBlockDeselect.bind(this);
    
    document.addEventListener('shopify:block:select', handleBlockSelect);
    document.addEventListener('shopify:block:deselect', handleBlockDeselect);
    
    // Cleanup listeners when element is disconnected
    this.cleanupListeners = () => {
      document.removeEventListener('shopify:block:select', handleBlockSelect);
      document.removeEventListener('shopify:block:deselect', handleBlockDeselect);
    };
  }
  
  handleBlockSelect(event) {
    const selectedBlock = event.target;
    if (!this.contains(selectedBlock)) return;
    
    const slideIndex = this.findSlideIndex(selectedBlock);
    
    if (slideIndex !== -1 && this.swiper) {
      this.swiper.slideTo(slideIndex, this.settings.speed);
      
      // Pause autoplay while editing
      if (this.swiper.autoplay) {
        this.swiper.autoplay.stop();
      }
    }
  }
  
  handleBlockDeselect(event) {
    const deselectedBlock = event.target;
    if (!this.contains(deselectedBlock)) return;
    
    // Resume autoplay after editing
    if (this.swiper?.autoplay && this.settings.autoplay) {
      setTimeout(() => {
        this.swiper.autoplay.start();
      }, 2000);
    }
  }
  
  findSlideIndex(block) {
    const slides = this.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
    
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].contains(block)) {
        return i;
      }
    }
    
    return -1;
  }
  
  parseBoolean(value, defaultValue = false) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return defaultValue;
  }
  
  disconnectedCallback() {
    // Clean up Swiper instance
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
    
    // Clean up event listeners
    if (this.cleanupListeners) {
      this.cleanupListeners();
    }
  }
}

if (!window.customElements.get('block-slider')) {
  window.customElements.define('block-slider', BlockSlider);
}
class InstagramSlider extends HTMLElement {
  constructor() {
    super();
    this.nextButton = document.querySelector('.ig-slide-next');
    this.prevButton = document.querySelector('.ig-slide-prev');
    this.pagination = document.querySelector('.ig-slider-progress');
    this.swiper = null;
    this.swiperInit();
  }

  swiperInit() {
    this.swiper = new Swiper(this, {
      slidesPerView: 2,
      spaceBetween: 28,
      grabCursor: true,
      navigation: {
        nextEl: this.nextButton,
        prevEl: this.prevButton,
      },
      pagination: {
        el: this.pagination,
        type: 'progressbar',
      },
      breakpoints: {
        750: {
          slidesPerView: 4,
        }
      }
    });
  }
}

if (!window.customElements.get('instagram-slider')) {
  window.customElements.define('instagram-slider', InstagramSlider);
}
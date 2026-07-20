import { morph } from '@theme/morph';
import { Component } from '@theme/component';
import { ThemeEvents } from '@theme/events';
import { DialogComponent } from '@theme/dialog';
import { fetchHTML } from '@theme/utilities';

export class QuickViewComponent extends Component {
  /** @type {AbortController | null} */
  #abortController = null;
  /** @type {Map<string, Element>} */
  #cachedContent = new Map();

  get productPageUrl() {
    const productCard = /** @type {import('./product-card').ProductCard | null} */ (this.closest('product-card'));
    const productLink = productCard?.getProductCardLink();

    return productLink?.href || '';
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController?.abort();
  }

  /**
   * Handles quick view button click
   * @param {Event} event - The click event
   */
  handleClick = async (event) => {
    event.preventDefault();

    // Open immediately so the popup feels instant; content streams in once fetched.
    this.#openQuickViewModal();

    const currentUrl = this.productPageUrl;

    // Check if we have cached content for this URL
    let productGrid = this.#cachedContent.get(currentUrl);

    if (!productGrid) {
      // Fetch and cache the content
      const html = await this.fetchProductPage(currentUrl);
      if (html) {
        const gridElement = html.querySelector('[data-product-grid-content]');
        if (gridElement) {
          // Cache the cloned element to avoid modifying the original
          productGrid = /** @type {Element} */ (gridElement.cloneNode(true));
          this.#cachedContent.set(currentUrl, productGrid);
        }
      }
    }

    if (productGrid) {
      // Use a fresh clone from the cache
      const freshContent = /** @type {Element} */ (productGrid.cloneNode(true));
      await this.updateQuickViewModal(freshContent);
    }
  };

  #openQuickViewModal = () => {
    const dialogComponent = document.getElementById('quick-view-dialog');
    if (!(dialogComponent instanceof QuickViewDialog)) return;

    dialogComponent.showDialog();
  };

  /**
   * Fetches the product page content
   * @param {string} productPageUrl - The URL of the product page to fetch
   * @returns {Promise<Document | null>}
   */
  async fetchProductPage(productPageUrl) {
    if (!productPageUrl) return null;

    // We use this to abort the previous fetch request if it's still pending.
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    try {
      return await fetchHTML(productPageUrl, { signal: this.#abortController.signal });
    } finally {
      this.#abortController = null;
    }
  }

  /**
   * Morphs the fetched product content into the Quick View modal.
   * @param {Element} productGrid - The product grid element
   */
  async updateQuickViewModal(productGrid) {
    const modalContent = document.getElementById('quick-view-modal-content');

    if (!productGrid || !modalContent) return;

    morph(modalContent, productGrid);
  }
}

if (!customElements.get('quick-view-component')) {
  customElements.define('quick-view-component', QuickViewComponent);
}

class QuickViewDialog extends DialogComponent {
  #abortController = new AbortController();

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener(ThemeEvents.cartUpdate, this.handleCartUpdate, { signal: this.#abortController.signal });
    this.addEventListener(ThemeEvents.variantUpdate, this.#updateProductTitleLink, {
      signal: this.#abortController.signal,
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#abortController.abort();
  }

  /**
   * Closes the dialog on a successful cart update, mirroring Quick Add's behavior.
   * @param {CustomEvent} event - The cart update event
   */
  handleCartUpdate = (event) => {
    if (event.detail.data.didError) return;
    this.closeDialog();
  };

  #updateProductTitleLink = (/** @type {CustomEvent} */ event) => {
    const anchorElement = /** @type {HTMLAnchorElement} */ (
      event.detail.data.html?.querySelector('.view-product-title a')
    );
    const titleLink = /** @type {HTMLAnchorElement} */ (this.querySelector('.view-product-title a'));
    const viewMoreDetailsLink = /** @type {HTMLAnchorElement} */ (this.querySelector('.view-more-details a'));

    if (!anchorElement) return;

    if (titleLink) titleLink.href = anchorElement.href;
    if (viewMoreDetailsLink) viewMoreDetailsLink.href = anchorElement.href;
  };
}

if (!customElements.get('quick-view-dialog')) {
  customElements.define('quick-view-dialog', QuickViewDialog);
}

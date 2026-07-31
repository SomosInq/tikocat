import { Component } from '@theme/component';

/**
 * @typedef {Object} ProductCompareSpec
 * @property {string} label
 * @property {string} value
 *
 * @typedef {Object} ProductCompareProduct
 * @property {string} id
 * @property {string} title
 * @property {string} url
 * @property {string} image
 * @property {string} price
 * @property {ProductCompareSpec[]} specs
 *
 * @typedef {Object} ProductCompareCategory
 * @property {string} id
 * @property {string} title
 * @property {ProductCompareProduct[]} products
 */

/**
 * Lets a shopper choose a category, then two products within that category,
 * and renders a side-by-side spec comparison table.
 * @extends {Component<{categorySelect: HTMLSelectElement, productSelectA: HTMLSelectElement, productSelectB: HTMLSelectElement, table: HTMLElement, categoriesData: HTMLScriptElement}>}
 */
class ProductCompareComponent extends Component {
  requiredRefs = ['categorySelect', 'productSelectA', 'productSelectB', 'table', 'categoriesData'];

  /** @type {Map<string, ProductCompareCategory>} */
  #categories = new Map();

  /** @type {string} */
  #emptyStateHtml = '';

  connectedCallback() {
    super.connectedCallback();
    this.#categories = this.#readCategories();
    this.#emptyStateHtml = this.refs.table.innerHTML;

    // The category/product selects may already have a default selection
    // rendered server-side (see sections/product-compare.liquid), so render
    // the matching table immediately instead of showing the empty state.
    if (this.refs.categorySelect.value && this.refs.productSelectA.value && this.refs.productSelectB.value) {
      this.onProductChange();
    }
  }

  /**
   * @returns {Map<string, ProductCompareCategory>}
   */
  #readCategories() {
    /** @type {Map<string, ProductCompareCategory>} */
    const categories = new Map();
    const text = this.refs.categoriesData.textContent;

    if (!text) return categories;

    try {
      /** @type {ProductCompareCategory[]} */
      const parsedCategories = JSON.parse(text);

      for (const category of parsedCategories) {
        categories.set(String(category.id), category);
      }
    } catch {
      // Ignore a malformed payload rather than breaking the whole component.
    }

    return categories;
  }

  /**
   * @param {string} emptyLabel
   * @returns {HTMLOptionElement}
   */
  #createPlaceholderOption(emptyLabel) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = emptyLabel;
    return option;
  }

  /**
   * @param {HTMLSelectElement} select
   * @param {ProductCompareProduct[]} products
   * @param {string} excludeProductId
   */
  #populateProductSelect(select, products, excludeProductId) {
    const currentValue = select.value;
    const emptyOption = select.querySelector('option[value=""]');
    const emptyLabel = emptyOption ? emptyOption.textContent ?? '' : '';

    select.innerHTML = '';
    select.append(this.#createPlaceholderOption(emptyLabel));

    for (const product of products) {
      if (String(product.id) === excludeProductId) continue;

      const option = document.createElement('option');
      option.value = String(product.id);
      option.textContent = product.title;
      select.append(option);
    }

    if ([...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  onCategoryChange() {
    const category = this.#categories.get(this.refs.categorySelect.value);

    this.refs.productSelectA.disabled = !category;
    this.refs.productSelectB.disabled = !category;

    this.#populateProductSelect(this.refs.productSelectA, category?.products ?? [], '');
    this.#populateProductSelect(this.refs.productSelectB, category?.products ?? [], '');

    this.#renderTable(undefined, undefined);
  }

  onProductChange() {
    const category = this.#categories.get(this.refs.categorySelect.value);
    if (!category) return;

    this.#populateProductSelect(this.refs.productSelectA, category.products, this.refs.productSelectB.value);
    this.#populateProductSelect(this.refs.productSelectB, category.products, this.refs.productSelectA.value);

    const productA = category.products.find((product) => String(product.id) === this.refs.productSelectA.value);
    const productB = category.products.find((product) => String(product.id) === this.refs.productSelectB.value);

    this.#renderTable(productA, productB);
  }

  /**
   * @param {ProductCompareProduct} [productA]
   * @param {ProductCompareProduct} [productB]
   */
  #renderTable(productA, productB) {
    if (!productA || !productB) {
      this.refs.table.innerHTML = this.#emptyStateHtml;
      return;
    }

    const rows = this.#getSpecRows(productA, productB);

    const productBoxHtml = (/** @type {ProductCompareProduct} */ product) => `
      <a class="compare-product-box" href="${this.#escapeAttribute(product.url)}">
        <div class="compare-product-image">
          <img src="${this.#escapeAttribute(product.image)}" alt="" width="96" height="96" loading="lazy">
        </div>
        <div class="compare-product-info">
          <div class="compare-product-name">${this.#escapeHtml(product.title)}</div>
          <div class="compare-product-price">${this.#escapeHtml(product.price)}</div>
        </div>
      </a>
    `;

    const rowHtml = (/** @type {{label: string, valueA: string, valueB: string}} */ row) => `
      <div class="comparison-row">
        <div class="comparison-criteria-label">${this.#escapeHtml(row.label)}</div>
        <div class="comparison-row-feature">
          <div class="compare-product-feature">
            <span class="compare-product-feature-value">${this.#escapeHtml(row.valueA)}</span>
          </div>
          <div class="compare-product-feature">
            <span class="compare-product-feature-value">${this.#escapeHtml(row.valueB)}</span>
          </div>
        </div>
      </div>
    `;

    this.refs.table.innerHTML = `
      <div class="compare-products-table">
        <div class="compare-products-row">
          ${productBoxHtml(productA)}
          ${productBoxHtml(productB)}
        </div>
        ${rows.map(rowHtml).join('')}
      </div>
    `;
  }

  /**
   * Builds the union of spec rows across both products, matching by a
   * normalized label so minor casing/whitespace differences still line up.
   * @param {ProductCompareProduct} productA
   * @param {ProductCompareProduct} productB
   */
  #getSpecRows(productA, productB) {
    /** @type {Map<string, {label: string, valueA: string, valueB: string}>} */
    const rows = new Map();

    for (const spec of productA.specs) {
      const key = this.#normalizeLabel(spec.label);
      rows.set(key, { label: spec.label, valueA: spec.value, valueB: '—' });
    }

    for (const spec of productB.specs) {
      const key = this.#normalizeLabel(spec.label);
      const row = rows.get(key);

      if (row) {
        row.valueB = spec.value;
      } else {
        rows.set(key, { label: spec.label, valueA: '—', valueB: spec.value });
      }
    }

    return [...rows.values()];
  }

  /**
   * @param {string} label
   */
  #normalizeLabel(label) {
    return label.trim().toLowerCase();
  }

  /**
   * @param {string} value
   */
  #escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  /**
   * Escapes a value for safe use inside a double-quoted HTML attribute.
   * @param {string} value
   */
  #escapeAttribute(value) {
    return this.#escapeHtml(value).replaceAll('"', '&quot;');
  }
}

if (!customElements.get('product-compare-component')) {
  customElements.define('product-compare-component', ProductCompareComponent);
}

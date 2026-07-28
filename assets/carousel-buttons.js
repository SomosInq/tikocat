import { Component } from '@theme/component';
import { requestIdleCallback } from '@theme/utilities';
import { SlideshowSelectEvent } from '@theme/events';

/**
 * Syncs a pair of externally-placed prev/next buttons with a `slideshow-component`
 * elsewhere in the document (targeted by id), disabling them at the start/end of a
 * non-infinite slideshow. Clicking is handled declaratively via `on:click="#id/method"`
 * (see @theme/component) - this component only manages the `disabled` state, since the
 * buttons live outside the target's own DOM subtree and can't rely on its internal refs.
 *
 * @typedef {Object} Refs
 * @property {HTMLButtonElement} [previous]
 * @property {HTMLButtonElement} [next]
 *
 * @extends {Component<Refs>}
 */
export class CarouselButtons extends Component {
  /** @type {(Element & { infinite: boolean, atStart: boolean, atEnd: boolean }) | null} */
  #target = null;

  connectedCallback() {
    super.connectedCallback();

    requestIdleCallback(() => this.#connectTarget());
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    this.#target?.removeEventListener(SlideshowSelectEvent.eventName, this.#handleSelect);
  }

  #connectTarget() {
    const targetId = this.getAttribute('target');
    const target = targetId ? document.getElementById(targetId) : null;

    if (!target) return;

    this.#target = /** @type {any} */ (target);
    this.#target.addEventListener(SlideshowSelectEvent.eventName, this.#handleSelect);
    this.#updateDisabledState();
  }

  #handleSelect = () => {
    this.#updateDisabledState();
  };

  #updateDisabledState() {
    const target = this.#target;
    if (!target) return;

    const { previous, next } = this.refs;

    if (previous) previous.disabled = !target.infinite && target.atStart;
    if (next) next.disabled = !target.infinite && target.atEnd;
  }
}

customElements.define('carousel-buttons', CarouselButtons);

import { LitElement, css, html } from "lit";

/** A slot-based application bar. Routing and mobile menu state stay with the consumer. */
export class SandustryTopBar extends LitElement {
  static override properties = {
    sticky: { type: Boolean, reflect: true },
    hasLeading: { type: Boolean, attribute: "has-leading", reflect: true },
    hasCenter: { type: Boolean, attribute: "has-center", reflect: true },
    hasTrailing: { type: Boolean, attribute: "has-trailing", reflect: true },
    hasMobileMenu: { type: Boolean, attribute: "has-mobile-menu", reflect: true },
  };

  static override styles = css`
    :host {
      position: relative;
      display: block;
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([sticky]) {
      position: sticky;
      top: var(--sd-topbar-sticky-offset, 0px);
      z-index: var(--sd-topbar-z-index, 30);
    }

    .bar {
      display: flex;
      min-width: 0;
      min-height: var(--sd-topbar-height, 48px);
      align-items: center;
      gap: var(--sd-topbar-gap, 0.75rem);
      box-sizing: border-box;
    }

    .leading,
    .center,
    .trailing,
    .mobile-menu {
      min-width: 0;
      align-items: center;
    }

    .leading,
    .trailing,
    .mobile-menu {
      display: flex;
      flex: 0 1 auto;
    }

    .center {
      display: flex;
      flex: 1 1 auto;
      justify-content: center;
      text-align: center;
    }

    .mobile-menu {
      display: none;
      order: -1;
    }

    :host(:not([has-leading])) .leading,
    :host(:not([has-center])) .center,
    :host(:not([has-trailing])) .trailing,
    :host(:not([has-mobile-menu])) .mobile-menu {
      display: none;
    }

    ::slotted(*) {
      min-width: 0;
    }

    @media (max-width: 760px) {
      .mobile-menu {
        display: flex;
      }
    }
  `;

  declare sticky: boolean;
  declare hasLeading: boolean;
  declare hasCenter: boolean;
  declare hasTrailing: boolean;
  declare hasMobileMenu: boolean;

  constructor() {
    super();
    this.sticky = false;
    this.hasLeading = false;
    this.hasCenter = false;
    this.hasTrailing = false;
    this.hasMobileMenu = false;
  }

  override firstUpdated() {
    this.updateSlotPresence();
  }

  private updateSlotPresence() {
    for (const slot of this.renderRoot.querySelectorAll<HTMLSlotElement>("slot")) {
      const present = slot.assignedElements({ flatten: true }).length > 0;
      if (slot.name === "leading") this.hasLeading = present;
      if (slot.name === "center") this.hasCenter = present;
      if (slot.name === "trailing") this.hasTrailing = present;
      if (slot.name === "mobile-menu") this.hasMobileMenu = present;
    }
  }

  private handleSlotChange() {
    this.updateSlotPresence();
  }

  override render() {
    return html`
      <header class="bar" part="bar">
        <div class="mobile-menu" part="mobile-menu">
          <slot name="mobile-menu" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="leading" part="leading">
          <slot name="leading" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="center" part="center">
          <slot name="center" @slotchange=${this.handleSlotChange}></slot>
        </div>
        <div class="trailing" part="trailing">
          <slot name="trailing" @slotchange=${this.handleSlotChange}></slot>
        </div>
      </header>
    `;
  }
}

if (!customElements.get("sandustry-top-bar")) {
  customElements.define("sandustry-top-bar", SandustryTopBar);
}

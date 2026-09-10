import { LitElement, html, css } from "lit";

export type ButtonVariant = "default" | "accent" | "solid" | "quiet" | "danger";
export type ButtonSize = "small" | "default" | "large";

export class SandustryButton extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    noShift: { type: Boolean, attribute: "no-shift", reflect: true },
    disabled: { type: Boolean, reflect: true },
    type: { type: String },
    href: { type: String },
    target: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      position: relative;
      left: 0;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-top-right-radius: var(--sd-button-radius, 0.5rem);
      border-bottom-left-radius: var(--sd-button-radius, 0.5rem);
      border-width: 1px;
      border-style: solid;
      font-family: var(--sd-font-family, inherit);
      font-weight: 500;
      box-sizing: border-box;
      user-select: none;
      transition:
        border-color 1s ease-in-out,
        left 1s ease-in-out;
    }

    :host(:hover:not([no-shift]):not([disabled])) {
      left: 0.25rem;
    }

    :host([size="small"]) {
      height: var(--sd-form-control-small-height, 1.75rem);
      padding: 0.125rem 0.5rem;
      font-size: 10px;
      line-height: 1.25;
    }

    :host([size="default"]),
    :host(:not([size])) {
      min-height: 2.25rem;
      height: var(--sd-form-control-height, 2.25rem);
      padding: 0.5rem 0.875rem;
      font-size: 0.75rem;
    }

    :host([size="large"]) {
      height: var(--sd-form-control-large-height, 2.75rem);
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    :host([variant="default"]),
    :host(:not([variant])) {
      border-color: #e2e8f0;
      background-color: #000000;
      color: #ffffff;
    }

    :host([variant="accent"]) {
      border-color: rgba(253, 224, 71, 0.5);
      background-color: rgba(253, 224, 71, 0.1);
      color: #fde047;
    }

    :host([variant="solid"]) {
      border-color: #ffe700;
      background-color: #ffe700;
      color: #000000;
      font-weight: 700;
    }

    :host([variant="quiet"]) {
      border-color: transparent;
      background-color: transparent;
      color: #94a3b8;
    }

    :host([variant="danger"]) {
      border-color: #f87171;
      background-color: #000000;
      color: #ffffff;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
      text-decoration: none;
    }
  `;

  declare variant: ButtonVariant;
  declare size: ButtonSize;
  declare noShift: boolean;
  declare disabled: boolean;
  declare type: string;
  declare href?: string;
  declare target?: string;

  constructor() {
    super();
    this.variant = "default";
    this.size = "default";
    this.noShift = false;
    this.disabled = false;
    this.type = "button";
  }

  override render() {
    if (this.href) {
      return html`<a
        part="base"
        class="base"
        href="${this.href}"
        target="${this.target || ""}"
        tabindex="${this.disabled ? "-1" : "0"}"
        ><slot></slot
      ></a>`;
    }
    return html`<button
      part="base"
      class="base"
      type="${this.type || "button"}"
      ?disabled="${this.disabled}"
    >
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get("sandustry-button")) {
  customElements.define("sandustry-button", SandustryButton);
}

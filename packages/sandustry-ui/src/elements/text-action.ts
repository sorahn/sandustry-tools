import { LitElement, html, css } from "lit";

export class SandustryTextAction extends LitElement {
  static override properties = {
    href: { type: String },
    disabled: { type: Boolean, reflect: true },
    type: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: rgba(255, 255, 255, 0.85);
      font-family: var(--sd-font-family, inherit);
      box-sizing: border-box;
      cursor: pointer;
      transition: color 150ms ease-in-out;
    }

    :host(:hover:not([disabled])) {
      color: #ffe700;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.4;
    }

    .base {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      color: inherit;
      font: inherit;
      cursor: inherit;
      text-decoration: none;
    }

    .base:focus-visible {
      outline: 2px solid #ffe700;
      outline-offset: 2px;
    }
  `;

  declare href?: string;
  declare disabled: boolean;
  declare type: string;

  constructor() {
    super();
    this.disabled = false;
    this.type = "button";
  }

  override render() {
    if (this.href) {
      return html`<a
        part="base"
        class="base"
        href="${this.href}"
        tabindex="${this.disabled ? "-1" : "0"}"
      >
        <slot name="icon"></slot>
        <slot></slot>
      </a>`;
    }
    return html`<button
      part="base"
      class="base"
      type="${this.type || "button"}"
      ?disabled="${this.disabled}"
    >
      <slot name="icon"></slot>
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get("sandustry-text-action")) {
  customElements.define("sandustry-text-action", SandustryTextAction);
}

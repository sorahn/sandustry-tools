import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustryIconButton extends LitElement {
  static override properties = {
    label: { type: String },
    size: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    title: { type: String },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      border-radius: 0.25rem;
      color: #94a3b8;
      box-sizing: border-box;
      transition: color 150ms ease-in-out;
      cursor: pointer;
    }

    :host(:hover:not([disabled])) {
      color: #ffffff;
    }

    :host([size="small"]) {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.75rem;
    }

    :host([size="default"]),
    :host(:not([size])) {
      width: 2rem;
      height: 2rem;
      font-size: 0.875rem;
    }

    :host([size="large"]) {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 1.125rem;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.4;
      color: #94a3b8;
    }

    button {
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
    }

    button:focus-visible {
      outline: 2px solid #fde047;
      outline-offset: 2px;
    }
  `;

  declare label: string;
  declare size: ControlSize;
  declare disabled: boolean;
  declare title: string;

  constructor() {
    super();
    this.label = "";
    this.size = "default";
    this.disabled = false;
    this.title = "";
  }

  override render() {
    return html`<button
      part="base"
      type="button"
      aria-label="${this.label}"
      title="${this.title || this.label}"
      ?disabled="${this.disabled}"
    >
      <slot></slot>
    </button>`;
  }
}

if (!customElements.get("sandustry-icon-button")) {
  customElements.define("sandustry-icon-button", SandustryIconButton);
}

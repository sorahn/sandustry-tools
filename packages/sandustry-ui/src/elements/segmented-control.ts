import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export class SandustrySegmentedControl extends LitElement {
  static override properties = {
    size: { type: String, reflect: true },
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    options: { type: Array },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-top-right-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      border-width: 1px;
      border-style: solid;
      border-color: rgba(226, 232, 240, 0.25);
      background-color: #000000;
      color: #ffffff;
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      cursor: pointer;
      box-sizing: border-box;
      transition:
        color 150ms ease-in-out,
        border-color 150ms ease-in-out;
    }

    button:hover:not(:disabled) {
      border-color: transparent;
      color: #ffe700;
    }

    button[aria-pressed="true"] {
      border-color: rgba(255, 231, 0, 0.5);
      background-color: rgba(255, 231, 0, 0.1);
      color: #ffe700;
    }

    :host([size="small"]) button {
      height: var(--sd-form-control-small-height, 1.75rem);
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
      font-size: 11px;
    }

    :host([size="default"]) button,
    :host(:not([size])) button {
      height: var(--sd-form-control-height, 2.25rem);
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
      font-size: 0.75rem;
    }

    :host([size="large"]) button {
      height: var(--sd-form-control-large-height, 2.75rem);
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    button:disabled {
      cursor: not-allowed;
      border-color: rgba(226, 232, 240, 0.1);
      background-color: #000000;
      color: #475569;
    }
  `;

  declare size: ControlSize;
  declare value: string;
  declare disabled: boolean;
  declare options: SegmentOption[];

  constructor() {
    super();
    this.size = "default";
    this.value = "";
    this.disabled = false;
    this.options = [];
  }

  private _select(val: string) {
    this.value = val;
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: val },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    if (this.options && this.options.length > 0) {
      return html`
        ${this.options.map((option) => {
          const isSelected = option.value === this.value;
          return html`
            <button
              part="button"
              type="button"
              ?disabled="${this.disabled || option.disabled}"
              aria-pressed="${isSelected ? "true" : "false"}"
              @click="${() => this._select(option.value)}"
            >
              ${option.label}
            </button>
          `;
        })}
      `;
    }
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-segmented-control")) {
  customElements.define("sandustry-segmented-control", SandustrySegmentedControl);
}

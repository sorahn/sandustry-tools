import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustrySlider extends LitElement {
  static override properties = {
    label: { type: String },
    showValue: { type: Boolean, attribute: "show-value", reflect: true },
    size: { type: String, reflect: true },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    value: { type: Number },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([size="small"]) {
      gap: 0.25rem;
    }

    :host([size="default"]),
    :host(:not([size])) {
      gap: 0.375rem;
    }

    :host([size="large"]) {
      gap: 0.5rem;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #cbd5e1;
    }

    :host([size="small"]) .header {
      font-size: 11px;
    }

    :host([size="default"]) .header,
    :host(:not([size])) .header {
      font-size: 0.75rem;
    }

    :host([size="large"]) .header {
      font-size: 0.875rem;
    }

    .value {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-variant-numeric: tabular-nums;
      color: #94a3b8;
    }

    :host([size="small"]) .value {
      font-size: 10px;
    }

    :host([size="default"]) .value,
    :host(:not([size])) .value {
      font-size: 11px;
    }

    :host([size="large"]) .value {
      font-size: 0.75rem;
    }

    input[type="range"] {
      width: 100%;
      accent-color: #ffe700;
    }

    :host([disabled]) {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare label: string;
  declare showValue: boolean;
  declare size: ControlSize;
  declare min: number;
  declare max: number;
  declare step: number;
  declare value: number;
  declare disabled: boolean;

  constructor() {
    super();
    this.label = "";
    this.showValue = false;
    this.size = "default";
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.value = 0;
    this.disabled = false;
  }

  private _handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = Number(target.value);
  }

  override render() {
    return html`
      <slot name="header">
        ${
          this.label || this.showValue
            ? html`<div class="header" part="header">
                <span>${this.label}</span>
                ${this.showValue ? html`<span class="value" part="value">${this.value}</span>` : ""}
              </div>`
            : ""
        }
      </slot>
      <slot>
        <input
          part="range"
          type="range"
          min="${this.min}"
          max="${this.max}"
          step="${this.step}"
          .value="${String(this.value)}"
          data-size="${this.size}"
          class="sd-slider"
          ?disabled="${this.disabled}"
          @input="${this._handleInput}"
        />
      </slot>
    `;
  }
}

if (!customElements.get("sandustry-slider")) {
  customElements.define("sandustry-slider", SandustrySlider);
}

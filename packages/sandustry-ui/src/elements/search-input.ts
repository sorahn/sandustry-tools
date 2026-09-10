import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustrySearchInput extends LitElement {
  static override properties = {
    scale: { type: String, reflect: true },
    placeholder: { type: String },
    value: { type: String },
    disabled: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
      box-sizing: border-box;
    }

    .input {
      display: flex;
      width: 100%;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      border-color: #334155;
      background-color: rgba(0, 0, 0, 0.6);
      color: #ffffff;
      box-sizing: border-box;
      outline: none;
      transition: border-color 150ms ease-in-out;
      font-family: var(--sd-font-family, inherit);
    }

    .input::placeholder {
      color: #475569;
    }

    .input:focus {
      border-color: #64748b;
    }

    :host([scale="small"]) .input {
      height: var(--sd-form-control-small-height, 1.75rem);
      padding-left: 0.625rem;
      padding-right: 0.625rem;
      font-size: 11px;
    }

    :host([scale="default"]) .input,
    :host(:not([scale])) .input {
      height: var(--sd-form-control-height, 2.25rem);
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      font-size: 0.75rem;
    }

    :host([scale="large"]) .input {
      height: var(--sd-form-control-large-height, 2.75rem);
      padding-left: 0.875rem;
      padding-right: 0.875rem;
      font-size: 0.875rem;
    }

    :host([disabled]) .input {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare scale: ControlSize;
  declare placeholder: string;
  declare value: string;
  declare disabled: boolean;

  constructor() {
    super();
    this.scale = "default";
    this.placeholder = "";
    this.value = "";
    this.disabled = false;
  }

  private _handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.value = target.value;
  }

  override render() {
    return html`<slot>
      <input
        part="input"
        class="input"
        type="search"
        placeholder="${this.placeholder}"
        .value="${this.value}"
        ?disabled="${this.disabled}"
        @input="${this._handleInput}"
      />
    </slot>`;
  }
}

if (!customElements.get("sandustry-search-input")) {
  customElements.define("sandustry-search-input", SandustrySearchInput);
}

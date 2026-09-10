import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustryTextInput extends LitElement {
  static override properties = {
    tone: { type: String, reflect: true },
    monospace: { type: Boolean, reflect: true },
    scale: { type: String, reflect: true },
    placeholder: { type: String },
    value: { type: String },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      width: 100%;
      box-sizing: border-box;
    }

    .input {
      display: flex;
      flex: 1 1 0%;
      min-width: 0;
      border-radius: 0.125rem;
      border-width: 1px;
      border-style: solid;
      border-color: #475569;
      background-color: rgba(0, 0, 0, 0.6);
      letter-spacing: 0.025em;
      color: #ffffff;
      outline: none;
      box-sizing: border-box;
      transition: border-color 150ms ease-in-out;
      font-family: var(--sd-font-family, inherit);
    }

    .input:focus {
      border-color: #ffe700;
    }

    :host([scale="small"]) .input {
      height: var(--sd-form-control-small-height, 1.75rem);
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      font-size: 0.75rem;
    }

    :host([scale="default"]) .input,
    :host(:not([scale])) .input {
      height: var(--sd-form-control-height, 2.25rem);
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      font-size: 0.875rem;
    }

    :host([scale="large"]) .input {
      height: var(--sd-form-control-large-height, 2.75rem);
      padding-left: 1rem;
      padding-right: 1rem;
      font-size: 1rem;
    }

    :host([tone="accent"]) .input {
      color: #f5a623;
    }

    :host([monospace]) .input {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    :host([disabled]) .input {
      cursor: not-allowed;
      opacity: 0.5;
    }
  `;

  declare tone: "default" | "accent";
  declare monospace: boolean;
  declare scale: ControlSize;
  declare placeholder: string;
  declare value: string;
  declare disabled: boolean;
  declare readonly: boolean;

  constructor() {
    super();
    this.tone = "default";
    this.monospace = false;
    this.scale = "default";
    this.placeholder = "";
    this.value = "";
    this.disabled = false;
    this.readonly = false;
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
        type="text"
        placeholder="${this.placeholder}"
        .value="${this.value}"
        ?disabled="${this.disabled}"
        ?readonly="${this.readonly}"
        @input="${this._handleInput}"
      />
    </slot>`;
  }
}

if (!customElements.get("sandustry-text-input")) {
  customElements.define("sandustry-text-input", SandustryTextInput);
}

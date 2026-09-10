import { LitElement, html, css } from "lit";

export class SandustryFormField extends LitElement {
  static override properties = {
    label: { type: String },
    hint: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare label: string;
  declare hint: string;
  declare error: string;
  declare required: boolean;

  constructor() {
    super();
    this.label = "";
    this.hint = "";
    this.error = "";
    this.required = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-form-field")) {
  customElements.define("sandustry-form-field", SandustryFormField);
}

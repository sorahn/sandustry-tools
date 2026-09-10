import { LitElement, html, css } from "lit";

export class SandustryElementPicker extends LitElement {
  static override properties = {
    value: { type: String, reflect: true },
    query: { type: String },
    matter: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare value: string;
  declare query: string;
  declare matter: string;

  constructor() {
    super();
    this.value = "";
    this.query = "";
    this.matter = "all";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-element-picker")) {
  customElements.define("sandustry-element-picker", SandustryElementPicker);
}

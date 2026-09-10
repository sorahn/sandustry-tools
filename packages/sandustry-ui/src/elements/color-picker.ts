import { LitElement, html, css } from "lit";

export class SandustryColorPicker extends LitElement {
  static override properties = {
    value: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare value: string;

  constructor() {
    super();
    this.value = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-color-picker")) {
  customElements.define("sandustry-color-picker", SandustryColorPicker);
}

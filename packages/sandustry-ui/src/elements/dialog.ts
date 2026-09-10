import { LitElement, html, css } from "lit";

export class SandustryDialog extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare open: boolean;
  declare title: string;

  constructor() {
    super();
    this.open = false;
    this.title = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-dialog")) {
  customElements.define("sandustry-dialog", SandustryDialog);
}

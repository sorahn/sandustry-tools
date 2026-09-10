import { LitElement, html, css } from "lit";

export class SandustryCollapsible extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    collapsible: { type: Boolean, reflect: true },
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
  declare collapsible: boolean;
  declare title: string;

  constructor() {
    super();
    this.open = true;
    this.collapsible = true;
    this.title = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-collapsible")) {
  customElements.define("sandustry-collapsible", SandustryCollapsible);
}

import { LitElement, html, css } from "lit";

export class SandustryFieldset extends LitElement {
  static override properties = {
    legend: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
      border-top-right-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      border-width: 1px;
      border-style: dashed;
      border-color: #475569;
      padding: 1rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare legend: string;

  constructor() {
    super();
    this.legend = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-fieldset")) {
  customElements.define("sandustry-fieldset", SandustryFieldset);
}

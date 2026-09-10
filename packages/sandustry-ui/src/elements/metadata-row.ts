import { LitElement, html, css } from "lit";

export class SandustryMetadataRow extends LitElement {
  static override properties = {
    wrap: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      column-gap: 1rem;
      row-gap: 0.25rem;
      font-size: 11px;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([wrap]) {
      flex-wrap: wrap;
    }
  `;

  declare wrap: boolean;

  constructor() {
    super();
    this.wrap = true;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-metadata-row")) {
  customElements.define("sandustry-metadata-row", SandustryMetadataRow);
}

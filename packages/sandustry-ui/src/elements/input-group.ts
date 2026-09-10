import { LitElement, html, css } from "lit";

export class SandustryInputGroup extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-input-group")) {
  customElements.define("sandustry-input-group", SandustryInputGroup);
}

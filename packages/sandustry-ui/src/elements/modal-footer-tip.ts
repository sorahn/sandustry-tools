import { LitElement, html, css } from "lit";

export class SandustryModalFooterTip extends LitElement {
  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-modal-footer-tip")) {
  customElements.define("sandustry-modal-footer-tip", SandustryModalFooterTip);
}

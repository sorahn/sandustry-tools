import { LitElement, html, css } from "lit";

export class SandustryLoadingOverlay extends LitElement {
  static override properties = {
    busy: { type: Boolean, reflect: true },
    visible: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare busy: boolean;
  declare visible: boolean;

  constructor() {
    super();
    this.busy = false;
    this.visible = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-loading-overlay")) {
  customElements.define("sandustry-loading-overlay", SandustryLoadingOverlay);
}

import { LitElement, html, css } from "lit";

export type FilterOverlayDirection = "up" | "down" | "left" | "right";
export type FilterOverlayTone = "pass" | "block";

export class SandustryFilterOverlay extends LitElement {
  static override properties = {
    status: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare status: FilterOverlayTone;

  constructor() {
    super();
    this.status = "pass";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-filter-overlay")) {
  customElements.define("sandustry-filter-overlay", SandustryFilterOverlay);
}

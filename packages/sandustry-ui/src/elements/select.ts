import { LitElement, html, css } from "lit";
import type { ControlSize } from "../types";

export class SandustrySelect extends LitElement {
  static override properties = {
    scale: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare scale: ControlSize;

  constructor() {
    super();
    this.scale = "default";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-select")) {
  customElements.define("sandustry-select", SandustrySelect);
}

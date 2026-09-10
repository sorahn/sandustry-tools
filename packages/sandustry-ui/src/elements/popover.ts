import { LitElement, html, css } from "lit";

export type PopoverSide = "top" | "bottom" | "left" | "right";

export class SandustryPopover extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    side: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare open: boolean;
  declare side: PopoverSide;

  constructor() {
    super();
    this.open = false;
    this.side = "bottom";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-popover")) {
  customElements.define("sandustry-popover", SandustryPopover);
}

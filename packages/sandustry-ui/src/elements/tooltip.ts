import { LitElement, html, css } from "lit";

export type TooltipSide = "top" | "bottom";

export class SandustryTooltip extends LitElement {
  static override properties = {
    side: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare side: TooltipSide;

  constructor() {
    super();
    this.side = "top";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryTooltipSurface extends LitElement {
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

if (!customElements.get("sandustry-tooltip")) {
  customElements.define("sandustry-tooltip", SandustryTooltip);
}

if (!customElements.get("sandustry-tooltip-surface")) {
  customElements.define("sandustry-tooltip-surface", SandustryTooltipSurface);
}

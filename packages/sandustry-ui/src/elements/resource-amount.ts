import { LitElement, html, css } from "lit";

export type ResourceType = "credits" | "fluxite" | "artifact" | "custom";

export class SandustryResourceAmount extends LitElement {
  static override properties = {
    type: { type: String, reflect: true },
    amount: { type: String, reflect: true },
    size: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare type: ResourceType;
  declare amount: string;
  declare size: "sm" | "md";

  constructor() {
    super();
    this.type = "credits";
    this.amount = "";
    this.size = "sm";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryCurrencyRow extends LitElement {
  static override properties = {
    size: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare size: "sm" | "md";

  constructor() {
    super();
    this.size = "sm";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-resource-amount")) {
  customElements.define("sandustry-resource-amount", SandustryResourceAmount);
}

if (!customElements.get("sandustry-currency-row")) {
  customElements.define("sandustry-currency-row", SandustryCurrencyRow);
}

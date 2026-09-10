import { LitElement, html, css } from "lit";

export class SandustryHotbar extends LitElement {
  static override properties = {
    selectedId: { type: String, attribute: "selected-id", reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      gap: 0.5rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare selectedId: string;

  constructor() {
    super();
    this.selectedId = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryHotbarStepper extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-hotbar")) {
  customElements.define("sandustry-hotbar", SandustryHotbar);
}

if (!customElements.get("sandustry-hotbar-stepper")) {
  customElements.define("sandustry-hotbar-stepper", SandustryHotbarStepper);
}

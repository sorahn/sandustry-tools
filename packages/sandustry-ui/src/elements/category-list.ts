import { LitElement, html, css } from "lit";

export class SandustryCategoryList extends LitElement {
  static override properties = {
    bordered: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
      padding-right: 0.5rem;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([bordered]) {
      border-right: 1px solid var(--sd-color-border-subtle, #1e293b);
    }
  `;

  declare bordered: boolean;

  constructor() {
    super();
    this.bordered = true;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryCategoryButton extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    label: { type: String },
  };

  static override styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }
  `;

  declare selected: boolean;
  declare disabled: boolean;
  declare label: string;

  constructor() {
    super();
    this.selected = false;
    this.disabled = false;
    this.label = "";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-category-list")) {
  customElements.define("sandustry-category-list", SandustryCategoryList);
}

if (!customElements.get("sandustry-category-button")) {
  customElements.define("sandustry-category-button", SandustryCategoryButton);
}

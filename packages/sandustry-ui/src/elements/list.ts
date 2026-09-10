import { LitElement, html, css } from "lit";

export type ListVariant = "default" | "panel" | "flush";
export type ListItemVariant = "default" | "compact" | "subtle";

export class SandustryList extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      font-family: var(--sd-font-family, inherit);
    }

    :host([variant="default"]),
    :host(:not([variant])) {
      gap: 0.25rem;
    }

    :host([variant="panel"]) {
      gap: 0.25rem;
      border-radius: 0.25rem;
      border-width: 1px;
      border-style: solid;
      border-color: var(--sd-color-border, #334155);
      background-color: var(--sd-color-surface, rgba(0, 0, 0, 0.3));
      padding: 0.5rem;
    }
  `;

  declare variant: ListVariant;

  constructor() {
    super();
    this.variant = "default";
  }

  override render() {
    return html`<slot></slot>`;
  }
}

export class SandustryListItem extends LitElement {
  static override properties = {
    selected: { type: Boolean, reflect: true },
    variant: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
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
  declare variant: ListItemVariant;
  declare disabled: boolean;

  constructor() {
    super();
    this.selected = false;
    this.variant = "default";
    this.disabled = false;
  }

  override render() {
    return html`<slot></slot>`;
  }
}

if (!customElements.get("sandustry-list")) {
  customElements.define("sandustry-list", SandustryList);
}

if (!customElements.get("sandustry-list-item")) {
  customElements.define("sandustry-list-item", SandustryListItem);
}
